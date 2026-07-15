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
-- 2) FIX — diagnostica del 14/07: la policy corretta ESISTE GIÀ
--    ("Utenti loggati possono caricare", INSERT con auth.role()='authenticated').
--    Il buco era una policy permissiva parallela che va solo ELIMINATA.
-- ─────────────────────────────────────────────────────────────────────────

-- IL BUCO: INSERT per {public} con check solo su bucket_id (nessun controllo
-- auth) → consentiva l'upload anonimo. Eliminala.
drop policy if exists "Permetti upload a tutti 1tsy3yu_0" on storage.objects;

-- SELECT pubblica ridondante (duplica "Foto pubbliche") → rimozione di pulizia.
drop policy if exists "Permetti upload a tutti 1tsy3yu_1" on storage.objects;

-- Dopo il drop: per l'INSERT resta solo "Utenti loggati possono caricare"
-- (richiede authenticated) → anonimo bloccato. La lettura pubblica continua
-- grazie a "Foto pubbliche". Cancellazione/aggiornamento: nessuna policy →
-- negati al client; la pulizia foto in eliminazione account la fa la Edge
-- Function delete-account con la service_role (bypassa la RLS).


-- ─────────────────────────────────────────────────────────────────────────
-- 3) VERIFICA
-- ─────────────────────────────────────────────────────────────────────────
-- Dopo il fix, rilancia il pentest: node scripts/security_pentest.mjs
-- Atteso: "upload storage da anonimo bloccato" → PASS.
--
-- ⚠️ Il fix è efficace SOLO se hai eliminato l'eventuale policy permissiva
--    trovata al punto 1: le policy PERMISSIVE si sommano in OR, quindi una
--    "insert per tutti" residua vanificherebbe la nuova restrizione.
