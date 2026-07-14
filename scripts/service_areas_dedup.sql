-- ============================================================================
-- DEDUPLICA aree di servizio — unisce i doppioni mantenendo il nome migliore
-- ============================================================================
-- Problema: il seed deduplicava solo per NOME esatto, quindi "Adige Est",
-- "Area di servizio Adige Est" e "Area di Servizio Adige Est" (stesso posto,
-- coordinate identiche a meno della 4a-5a cifra) sono finite come 3 righe.
--
-- Strategia SICURA (due criteri insieme):
--   1) stesso NOME NORMALIZZATO (tolto il prefisso "Area di servizio"/"ADS")
--   2) entro ~300 m di distanza
-- Solo se ENTRAMBI veri due righe sono considerate lo stesso posto.
-- Così Est/Ovest (chiavi diverse) NON si fondono, e i 25 "Eni" sparsi per
-- l'Italia (stesso nome ma lontani km) NON si fondono: restano distinti.
--
-- Del gruppo si TIENE la riga col nome migliore (nome proprio > generico,
-- poi il più corto), e vi si RI-AGGANCIANO recensioni e preferiti prima di
-- cancellare le altre. Niente dati persi.
--
-- ESECUZIONE in Supabase → SQL Editor:
--   • Esegui fino a "-- >>> STOP" e controlla l'ANTEPRIMA
--   • Se ti convince, esegui il blocco BEGIN…COMMIT finale
-- ============================================================================


-- 0) Backup completo (assicurazione — droppabile dopo la verifica)
create table if not exists service_areas_backup_dedup as
  select * from service_areas;


-- 1) Mappa dei duplicati: per ogni riga da eliminare, la riga da tenere.
--    Il "peer" migliore di ciascuna riga (incluso sé stessa) diventa il keeper;
--    se il keeper è un'altra riga, questa riga è un duplicato da rimuovere.
drop table if exists _dedup_map;
create temp table _dedup_map as
with n as (
  select id, name, latitude, longitude,
         btrim(regexp_replace(
           lower(name),
           '^(area di servizio|area servizio|a\.?d\.?s\.?)[\s\-]*', '')) as key
  from service_areas
),
peer as (
  -- accoppia righe con stessa chiave entro ~300 m (self-join, include sé stessa)
  select a.id, b.id as peer_id, b.name as peer_name
  from n a
  join n b
    on a.key = b.key
   and a.key <> ''
   and sqrt(
         ( (a.longitude - b.longitude) * 111320
             * cos(radians((a.latitude + b.latitude) / 2)) )^2
       + ( (a.latitude  - b.latitude ) * 110540 )^2
       ) < 300
),
ranked as (
  select id, peer_id,
         row_number() over (
           partition by id
           order by
             -- 1) preferisci un nome proprio (non "Area di servizio…")
             (peer_name !~* '^(area di servizio|area servizio)') desc,
             -- 2) a parità, il nome più corto/pulito
             length(peer_name) asc,
             -- 3) tie-break deterministico
             peer_id::text asc
         ) as rn
  from peer
)
-- NB: service_areas.id è UUID, ma reviews/favorites.service_area_id sono TEXT.
-- Per allineare i tipi la mappa memorizza gli id come TEXT e ogni confronto usa
-- ::text, così i join text=text funzionano su tutte le tabelle.
select id::text as dup_id, peer_id::text as keeper_id
from ranked
where rn = 1
  and peer_id <> id;   -- solo le righe che verranno rimosse


-- 2) >>> ANTEPRIMA — controlla qui prima di procedere >>> STOP
select count(*) as righe_da_eliminare from _dedup_map;

select d.dup_id,
       sd.name as nome_eliminato,
       k.name  as nome_tenuto
from _dedup_map d
join service_areas sd on sd.id::text = d.dup_id
join service_areas k  on k.id::text  = d.keeper_id
order by k.name
limit 60;


-- 3) >>> ESECUZIONE — lancia questo blocco solo dopo aver visto l'anteprima
begin;

  -- recensioni → riagganciate al keeper (service_area_id è TEXT)
  update reviews r
     set service_area_id = m.keeper_id
    from _dedup_map m
   where r.service_area_id = m.dup_id;

  -- preferiti: prima elimina quelli che creerebbero un duplicato (stesso utente
  -- già iscritto al keeper), poi riaggancia i restanti
  delete from favorites f
   using _dedup_map m
   where f.service_area_id::text = m.dup_id
     and exists (
       select 1 from favorites f2
       where f2.user_id = f.user_id
         and f2.service_area_id::text = m.keeper_id
     );

  -- favorites.service_area_id è UUID (diverso da reviews che è TEXT): cast keeper a uuid
  update favorites f
     set service_area_id = m.keeper_id::uuid
    from _dedup_map m
   where f.service_area_id::text = m.dup_id;

  -- infine cancella le righe duplicate
  delete from service_areas s
   using _dedup_map m
   where s.id::text = m.dup_id;

commit;


-- 4) Verifica finale (atteso: totale ridotto di ~righe_da_eliminare)
-- select count(*) as totale_aree from service_areas;
-- Dopo aver verificato che tutto è ok:  drop table service_areas_backup_dedup;
