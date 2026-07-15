-- ============================================================================
-- PAGELLE — valutazioni strutturate per categoria sulle recensioni
-- Eseguire in Supabase → SQL Editor. Idempotente, non distruttivo.
-- ============================================================================
-- Aggiunge alle recensioni voti opzionali (1-5) su ciò che conta in un'area
-- di servizio. Sono NULLABLE: chi recensisce compila solo le categorie che
-- vuole. La stella complessiva (`rating`) resta invariata e obbligatoria.
-- Le colonne devono corrispondere a constants/pagelle.ts (dbColumn).
-- ============================================================================

alter table public.reviews
  add column if not exists rating_bathrooms   smallint,
  add column if not exists rating_coffee      smallint,
  add column if not exists rating_price       smallint,
  add column if not exists rating_cleanliness smallint,
  add column if not exists rating_food        smallint;

-- Vincoli di range 1-5 (idempotenti: si aggiungono solo se non esistono)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reviews_pagelle_range') then
    alter table public.reviews add constraint reviews_pagelle_range check (
      (rating_bathrooms   is null or rating_bathrooms   between 1 and 5) and
      (rating_coffee      is null or rating_coffee      between 1 and 5) and
      (rating_price       is null or rating_price       between 1 and 5) and
      (rating_cleanliness is null or rating_cleanliness between 1 and 5) and
      (rating_food        is null or rating_food        between 1 and 5)
    );
  end if;
end $$;
