-- ============================================================================
-- SICUREZZA STORAGE — bucket `review-photos`
-- ============================================================================
-- Finding dal pentest: l'upload da ANONIMO riesce. Va chiuso: l'upload deve
-- essere consentito solo agli utenti autenticati; la lettura resta pubblica
-- (le foto delle recensioni sono pubbliche via getPublicUrl).
--
-- Le policy dello storage vivono sulla tabella `storage.objects`.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1) DIAGNOSTICA — quali policy esistono ora (esegui e incolla l'output)
-- ─────────────────────────────────────────────────────────────────────────
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd, policyname;

-- ⚠️ Se qui compare una policy di INSERT con roles che includono `anon` o
--    `public` (es. "Enable insert for all users", "Allow all", ecc.), È QUELLA
--    che permette l'upload anonimo: va eliminata.
--    Rimuovila per nome (sostituisci <NOME>):
-- drop policy "<NOME>" on storage.objects;


-- ─────────────────────────────────────────────────────────────────────────
-- 2) FIX — policy corrette per review-photos (idempotenti sui nostri nomi)
-- ─────────────────────────────────────────────────────────────────────────
-- RLS su storage.objects è attiva di default su Supabase; la riattiviamo per
-- sicurezza (no-op se già attiva).
alter table storage.objects enable row level security;

-- Upload: SOLO utenti autenticati, SOLO nel bucket review-photos
drop policy if exists "review-photos upload autenticati" on storage.objects;
create policy "review-photos upload autenticati"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'review-photos');

-- Lettura: pubblica (le foto sono pubbliche)
drop policy if exists "review-photos lettura pubblica" on storage.objects;
create policy "review-photos lettura pubblica"
  on storage.objects for select
  using (bucket_id = 'review-photos');

-- (Opzionale) Cancellazione/aggiornamento: nessuna policy → di default negati
-- al client. La pulizia foto in fase di eliminazione account la fa la Edge
-- Function delete-account con la service_role, che bypassa la RLS.


-- ─────────────────────────────────────────────────────────────────────────
-- 3) VERIFICA
-- ─────────────────────────────────────────────────────────────────────────
-- Dopo il fix, rilancia il pentest: node scripts/security_pentest.mjs
-- Atteso: "upload storage da anonimo bloccato" → PASS.
--
-- ⚠️ Il fix è efficace SOLO se hai eliminato l'eventuale policy permissiva
--    trovata al punto 1: le policy PERMISSIVE si sommano in OR, quindi una
--    "insert per tutti" residua vanificherebbe la nuova restrizione.
