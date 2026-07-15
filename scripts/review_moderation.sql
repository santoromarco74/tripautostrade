-- ============================================================================
-- MODERAZIONE RECENSIONI — auto-nascondi a soglia di segnalazioni
-- Eseguire in Supabase → SQL Editor. Idempotente.
-- ============================================================================
-- Chiude il cerchio della moderazione: quando una recensione raccoglie
-- abbastanza segnalazioni da utenti DIVERSI, viene nascosta automaticamente
-- (anche se l'admin è offline). L'admin la rivede con calma dal Table Editor.
-- ============================================================================

-- Soglia: numero di segnalatori distinti oltre il quale la recensione sparisce
--   (modifica il 3 qui sotto se vuoi una soglia diversa)

-- 1) Colonna di stato sulle recensioni
alter table public.reviews
  add column if not exists hidden boolean not null default false;

-- 2) Trigger: conta i segnalatori distinti e nasconde oltre soglia
create or replace function public.hide_reported_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n_segnalatori int;
begin
  select count(distinct reporter_id) into n_segnalatori
  from public.review_reports
  where review_id = NEW.review_id;

  if n_segnalatori >= 3 then
    update public.reviews set hidden = true where id = NEW.review_id;
  end if;
  return NEW;
end;
$$;

-- funzione-trigger: non chiamabile via RPC (coerente coi fix Advisor)
revoke execute on function public.hide_reported_review() from public, anon, authenticated;

drop trigger if exists trg_hide_reported_review on public.review_reports;
create trigger trg_hide_reported_review
  after insert on public.review_reports
  for each row execute function public.hide_reported_review();

-- 3) RLS: le recensioni nascoste NON sono più servite agli altri utenti
--    (l'autore continua a vedere la propria; la service_role bypassa la RLS).
--    Enforcement lato DB: non basta filtrare nell'app, altrimenti un client
--    potrebbe leggere comunque le righe nascoste via API.
drop policy if exists "Recensioni visibili a tutti" on public.reviews;
create policy "Recensioni visibili a tutti"
  on public.reviews for select
  using (hidden = false or auth.uid() = user_id);

-- 4) VERIFICA
-- select id, hidden, comment from public.reviews where hidden = true;
-- Per ri-mostrare a mano una recensione nascosta ingiustamente:
--   update public.reviews set hidden = false where id = <id>;
-- Per rimuoverla davvero:
--   delete from public.reviews where id = <id>;
