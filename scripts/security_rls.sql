-- ============================================================================
-- HARDENING SICUREZZA DATABASE — da eseguire in Supabase → SQL Editor
-- ============================================================================
-- Il client usa la chiave Supabase publishable (pubblica, estraibile dall'APK):
-- tutta la sicurezza dei dati dipende quindi dalle policy RLS e dai privilegi.
-- Questo script è idempotente: si può rilanciare senza errori.
--
--   Sezione 1 — RLS su `reviews`      (CRITICO)
--   Sezione 2 — protezione punti        (integrità classifica)
--   Sezione 3 — verifiche finali
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- SEZIONE 1 — Row Level Security sulla tabella `reviews`  [CRITICO]
-- ─────────────────────────────────────────────────────────────────────────
-- Problema: `reviews` aveva RLS DISATTIVATO. Senza RLS chiunque, con la sola
-- chiave pubblica, poteva inserire recensioni a nome di altri utenti e
-- modificare/cancellare qualsiasi recensione.
--
-- Modello: SELECT pubblico; INSERT/UPDATE/DELETE solo sulle proprie righe.
-- delete-account (service_role) e il trigger punti (SECURITY DEFINER)
-- bypassano la RLS e non sono influenzati.

alter table public.reviews enable row level security;

drop policy if exists "Recensioni visibili a tutti" on public.reviews;
create policy "Recensioni visibili a tutti"
  on public.reviews for select
  using (true);

drop policy if exists "Utenti creano proprie recensioni" on public.reviews;
create policy "Utenti creano proprie recensioni"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "Utenti modificano proprie recensioni" on public.reviews;
create policy "Utenti modificano proprie recensioni"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Utenti cancellano proprie recensioni" on public.reviews;
create policy "Utenti cancellano proprie recensioni"
  on public.reviews for delete
  using (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────
-- SEZIONE 2 — Protezione del campo `profiles.points`  [integrità classifica]
-- ─────────────────────────────────────────────────────────────────────────
-- Problema: la policy UPDATE su `profiles` consente all'utente di aggiornare
-- QUALSIASI colonna della propria riga, punti compresi. Un utente potrebbe
-- gonfiarsi i punti (update profiles set points=99999 where id=auth.uid())
-- scavalcando il trigger e falsando la classifica.
--
-- Fix: privilegio a livello di colonna — si revoca l'UPDATE su `points` ai
-- ruoli del client. Le altre colonne (full_name, avatar_url, push_token)
-- restano aggiornabili.
--
-- Perché è sicuro per il trigger: prima garantiamo che update_user_points sia
-- SECURITY DEFINER (gira come proprietario della funzione, che mantiene i
-- privilegi anche dopo la revoke) → continua a scrivere i punti senza errori.
-- Il blocco trova la funzione a prescindere dalla firma esatta.

do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'update_user_points'
  loop
    execute format('alter function %s security definer', fn.sig);
  end loop;
end $$;

revoke update (points) on public.profiles from authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────
-- SEZIONE 3 — Verifiche finali
-- ─────────────────────────────────────────────────────────────────────────

-- RLS attivo su tutte le tabelle applicative (atteso: tutte true)
select relname as tabella, relrowsecurity as rls_attivo
from pg_class
where relname in ('profiles','reviews','review_likes',
                  'favorites','review_reports','service_areas')
order by relname;

-- update_user_points deve risultare SECURITY DEFINER (prosecdef = true)
select p.proname, p.prosecdef as security_definer
from pg_proc p
where p.proname = 'update_user_points';

-- Privilegi colonna su profiles: NON deve comparire UPDATE su `points`
-- per i ruoli authenticated/anon
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_name = 'profiles'
  and column_name = 'points'
  and grantee in ('authenticated','anon');
