-- ============================================================================
-- AREA DELLA SETTIMANA — voce editoriale curata dall'admin
-- Eseguire in Supabase → SQL Editor. Idempotente.
-- ============================================================================
-- Tabella con la selezione editoriale mostrata come banner in Home.
-- Lettura pubblica (solo righe attive); scrittura riservata all'admin dal
-- dashboard (nessuna policy di insert/update per il client).
-- ============================================================================

create table if not exists public.editorial (
  id              bigint generated always as identity primary key,
  service_area_id uuid not null references public.service_areas(id) on delete cascade,
  titolo          text not null,
  testo           text not null,
  attivo          boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.editorial enable row level security;

drop policy if exists "Editoriale visibile a tutti" on public.editorial;
create policy "Editoriale visibile a tutti"
  on public.editorial for select
  using (attivo = true);
-- Nessuna policy di scrittura: si gestisce da dashboard (service_role bypassa la RLS).

-- ─────────────────────────────────────────────────────────────────────────
-- Come impostare l'area della settimana (dashboard → SQL Editor):
--   1) trova l'uuid dell'area:
--      select id, name from service_areas where name ilike '%ceriale sud%';
--   2) disattiva la selezione precedente:
--      update public.editorial set attivo = false where attivo = true;
--   3) inserisci la nuova (l'app mostra la più recente tra le attive):
--      insert into public.editorial (service_area_id, titolo, testo) values
--        ('<uuid-area>',
--         'Ceriale Sud: la sosta con vista',
--         'Caffè decente, bagni curati e due passi al mare. La nostra preferita della Riviera di Ponente.');
-- ─────────────────────────────────────────────────────────────────────────
