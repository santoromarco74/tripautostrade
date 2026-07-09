-- Colonna per il token Expo Push (registrato dall'app al login).
-- Eseguire una volta nel SQL Editor di Supabase.

alter table public.profiles
  add column if not exists push_token text;
