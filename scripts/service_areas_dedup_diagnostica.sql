-- ============================================================================
-- DIAGNOSTICA duplicati aree di servizio (SOLO LETTURA — non modifica nulla)
-- ============================================================================
-- Eseguire in Supabase → SQL Editor e incollare gli output.
-- Serve a capire la forma reale dei dati prima di scrivere la deduplica.
-- ============================================================================

-- Q1 — Schema della tabella (tutte le colonne, per la logica di merge)
select column_name, data_type
from information_schema.columns
where table_name = 'service_areas'
order by ordinal_position;

-- Q2 — Conteggi generali e per tipo di nome
select
  count(*)                                                             as totale,
  count(*) filter (where name ilike 'area di servizio%')              as con_prefisso_ads,
  count(*) filter (where lower(btrim(name)) in
                        ('area di servizio','area servizio'))          as solo_generico,
  count(distinct brand)                                                as brand_distinti
from service_areas;

-- Q3 — Gruppi di duplicati per NOME NORMALIZZATO
-- (togliamo il prefisso "Area di servizio"/"ADS" e confrontiamo).
-- Est/Ovest e Nord/Sud restano chiavi diverse: NON vengono uniti.
with norm as (
  select id, name, brand, latitude, longitude,
         btrim(regexp_replace(
           lower(name),
           '^(area di servizio|area servizio|a\.?d\.?s\.?)[\s\-]*', '')) as key
  from service_areas
)
select key,
       count(*)                                                        as n_duplicati,
       string_agg(name || ' (#' || id || ')', '  |  ' order by name)   as varianti
from norm
where key <> ''
group by key
having count(*) > 1
order by n_duplicati desc, key
limit 100;

-- Q4 — Quanti gruppi duplicati esistono in totale (dimensione del problema)
with norm as (
  select btrim(regexp_replace(
           lower(name),
           '^(area di servizio|area servizio|a\.?d\.?s\.?)[\s\-]*', '')) as key
  from service_areas
)
select count(*) as gruppi_con_duplicati,
       sum(n - 1) as righe_da_rimuovere_stimate
from (
  select key, count(*) as n
  from norm where key <> ''
  group by key having count(*) > 1
) t;

-- Q5 — Impatto su recensioni/preferiti (quante aree hanno FK collegate)
select
  (select count(distinct service_area_id) from reviews)   as aree_con_recensioni,
  (select count(*) from reviews)                          as recensioni_totali,
  (select count(distinct service_area_id) from favorites) as aree_nei_preferiti;
