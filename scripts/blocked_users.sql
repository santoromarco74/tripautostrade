-- ============================================================================
-- BLOCCO UTENTI — requisito UGC (Google Play 1.2 e App Store 1.2)
-- Eseguire in Supabase → SQL Editor. Idempotente.
-- ============================================================================
-- Ogni utente può bloccare altri utenti: le recensioni di chi è bloccato non
-- gli vengono più mostrate (filtro lato app in ReviewsContext). La tabella è
-- privata: ognuno vede/gestisce solo i propri blocchi.
-- ============================================================================

create table if not exists public.blocked_users (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocked_users enable row level security;

-- Ognuno vede solo i blocchi che ha creato
drop policy if exists "Vedi i propri blocchi" on public.blocked_users;
create policy "Vedi i propri blocchi"
  on public.blocked_users for select
  using (auth.uid() = blocker_id);

-- Ognuno crea solo blocchi a proprio nome, e non può bloccare sé stesso
drop policy if exists "Crea i propri blocchi" on public.blocked_users;
create policy "Crea i propri blocchi"
  on public.blocked_users for insert
  with check (auth.uid() = blocker_id and blocker_id <> blocked_id);

-- Ognuno rimuove solo i propri blocchi (sblocco)
drop policy if exists "Rimuovi i propri blocchi" on public.blocked_users;
create policy "Rimuovi i propri blocchi"
  on public.blocked_users for delete
  using (auth.uid() = blocker_id);
