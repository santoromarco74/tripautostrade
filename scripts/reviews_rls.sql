-- ============================================================================
-- FIX SICUREZZA — Row Level Security sulla tabella `reviews`
-- ============================================================================
-- Problema: `reviews` aveva RLS DISATTIVATO. Poiché il client usa la chiave
-- Supabase publishable (pubblica, estraibile dall'APK), senza RLS chiunque
-- poteva inserire recensioni a nome di altri utenti e modificare/cancellare
-- qualsiasi recensione.
--
-- Questo script attiva la RLS e definisce le policy corrette. È idempotente:
-- si può rilanciare senza errori. Eseguire in Supabase → SQL Editor.
--
-- Modello di accesso:
--   • SELECT  → pubblico (le recensioni sono visibili a tutti nell'app)
--   • INSERT  → solo come sé stessi (user_id = utente loggato)
--   • UPDATE  → solo le proprie recensioni
--   • DELETE  → solo le proprie recensioni
-- La Edge Function delete-account usa la service_role e bypassa la RLS,
-- quindi continua a poter cancellare le recensioni in fase di eliminazione
-- account. Anche il trigger update_user_points (SECURITY DEFINER) non è
-- influenzato.
-- ============================================================================

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

-- Verifica finale: rls_attivo deve risultare true
select relname as tabella, relrowsecurity as rls_attivo
from pg_class where relname = 'reviews';
