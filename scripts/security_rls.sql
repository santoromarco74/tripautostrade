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
-- Fix: NON basta una revoke a livello di colonna. Supabase concede UPDATE a
-- livello di TABELLA ai ruoli authenticated/anon, e una revoke sulla singola
-- colonna non annulla un grant di tabella (la colonna resta aggiornabile).
-- Serve quindi revocare l'UPDATE di tabella e ri-concederlo SOLO sulle colonne
-- che il client aggiorna davvero. Dal codice, l'unica è `push_token`
-- (lib/pushNotifications.ts). `full_name` arriva dai metadata di signup via
-- trigger, non dal client.
--   ⚠️ Se in futuro si aggiunge l'upload avatar dal profilo, aggiungere
--      `avatar_url` alle colonne concesse qui sotto.
--
-- Perché è sicuro per il trigger punti: prima garantiamo che update_user_points
-- sia SECURITY DEFINER (gira come proprietario della funzione, che mantiene i
-- privilegi a prescindere da questi grant) → continua a scrivere `points`.
-- Il blocco trova la funzione qualunque sia la firma.

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

-- Revoca l'UPDATE sull'intera tabella e riconcede solo push_token (autenticati)
revoke update on public.profiles from authenticated, anon;
grant update (push_token) on public.profiles to authenticated;


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

-- Privilegi colonna su profiles per authenticated/anon.
-- Atteso dopo lo script: UPDATE presente SOLO su push_token (authenticated);
-- su `points` NON deve più comparire UPDATE (resta SELECT/INSERT/REFERENCES).
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_name = 'profiles'
  and column_name in ('points','push_token')
  and grantee in ('authenticated','anon')
  and privilege_type = 'UPDATE'
order by column_name, grantee;
