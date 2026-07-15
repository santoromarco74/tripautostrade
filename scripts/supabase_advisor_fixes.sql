-- ============================================================================
-- FIX warning dell'Advisor Supabase (tutti WARN, non bloccanti, non distruttivi)
-- Eseguire in Supabase → SQL Editor. Idempotente.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1) function_search_path_mutable — update_user_points
-- ─────────────────────────────────────────────────────────────────────────
-- Una funzione SECURITY DEFINER senza search_path fisso eredita quello del
-- chiamante → un attaccante potrebbe "dirottare" a quali oggetti si riferisce.
-- Fissiamo il search_path a `public` (dove vivono le tabelle usate): risolve
-- il warning senza toccare il corpo della funzione.
alter function public.update_user_points() set search_path = public;
-- (Alternativa più rigida, se un giorno editi il corpo qualificando ogni
--  oggetto con lo schema: `set search_path = ''`.)


-- ─────────────────────────────────────────────────────────────────────────
-- 2) anon/authenticated_security_definer_function_executable
--    handle_new_user() e update_user_points() erano chiamabili via RPC
--    (/rest/v1/rpc/...) da anon/authenticated. Sono funzioni-TRIGGER: non
--    devono essere invocabili direttamente. Revochiamo EXECUTE.
--    I trigger continuano a funzionare: l'esecuzione via trigger NON richiede
--    il privilegio EXECUTE.
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.handle_new_user()    from public, anon, authenticated;
revoke execute on function public.update_user_points()  from public, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 3) public_bucket_allows_listing — bucket review-photos
-- ─────────────────────────────────────────────────────────────────────────
-- La policy SELECT "Foto pubbliche" su storage.objects permette ai client di
-- ELENCARE tutti i file del bucket. Un bucket pubblico NON ne ha bisogno: le
-- foto si vedono comunque tramite l'URL pubblico (getPublicUrl → endpoint
-- /object/public/..., che bypassa la RLS). Rimuovendo la policy si toglie
-- l'enumerazione senza rompere la visualizzazione.
drop policy if exists "Foto pubbliche" on storage.objects;


-- ─────────────────────────────────────────────────────────────────────────
-- 4) VERIFICHE
-- ─────────────────────────────────────────────────────────────────────────
-- search_path fissato (atteso: config con search_path=public)
select proname, proconfig
from pg_proc
where proname in ('update_user_points','handle_new_user');

-- EXECUTE non più concesso a anon/authenticated/public (atteso: 0 righe)
select p.proname, r.rolname
from pg_proc p
cross join lateral aclexplode(p.proacl) a
join pg_roles r on r.oid = a.grantee
where p.proname in ('handle_new_user','update_user_points')
  and a.privilege_type = 'EXECUTE'
  and r.rolname in ('public','anon','authenticated');

-- ⚠️ NB: dopo aver eseguito lo script, RILANCIA l'Advisor: i risultati sono
--    memorizzati in cache e potrebbero mostrare ancora i vecchi warning finché
--    non viene rieseguito.
