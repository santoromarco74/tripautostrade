-- backfill_full_name.sql
--
-- Assegna un nome visualizzato agli account creati PRIMA dell'aggiunta del campo
-- Nome in registrazione (25/07/2026). Quegli account hanno profiles.full_name a
-- NULL, quindi in recensioni e classifica compaiono tutti come
-- "Utente Autostradale" (fallback in ReviewsContext e ActivityScreen).
--
-- Da eseguire UNA VOLTA nel SQL Editor di Supabase. Idempotente: agisce solo
-- sulle righe ancora prive di nome, quindi puo' essere rieseguito senza danni.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- PERCHE' NON USIAMO IL PREFISSO DELL'EMAIL
-- ─────────────────────────────────────────────────────────────────────────────
-- La tentazione e' derivare il nome dall'email (mario.rossi@... -> "Mario
-- Rossi"), come fa ProfileScreen come fallback locale. NON va fatto qui:
-- full_name e' PUBBLICO (appare accanto a ogni recensione e nella classifica),
-- mentre la privacy policy dichiara che l'email non e' mostrata agli altri
-- utenti. Scriverne il prefisso in un campo pubblico contraddirebbe
-- l'informativa e diffonderebbe frammenti di indirizzi email.
--
-- Usiamo quindi uno pseudonimo neutro e stabile, derivato dall'id del profilo.

-- 1) Quanti profili sono senza nome, prima di toccare niente
select count(*) as profili_senza_nome
from public.profiles
where full_name is null or btrim(full_name) = '';

-- 2) Anteprima di cosa verrebbe scritto (esegui e controlla PRIMA dell'update)
select
  id,
  full_name as nome_attuale,
  'Viaggiatore ' || upper(substr(md5(id::text), 1, 4)) as nome_nuovo
from public.profiles
where full_name is null or btrim(full_name) = ''
limit 20;

-- 3) L'update
update public.profiles
set full_name = 'Viaggiatore ' || upper(substr(md5(id::text), 1, 4))
where full_name is null or btrim(full_name) = '';

-- 4) Verifica: deve restituire 0
select count(*) as ancora_senza_nome
from public.profiles
where full_name is null or btrim(full_name) = '';


-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE
-- ─────────────────────────────────────────────────────────────────────────────
--
-- • Il suffisso viene dall'md5 dell'id: e' stabile (rieseguire lo script non
--   cambia i nomi gia' assegnati) e non rivela nulla dell'utente.
--
-- • Sugli SCREENSHOT dello store: dopo questo backfill la classifica mostra
--   nomi distinti, ma tutti inizianti per "Viaggiatore", quindi l'iniziale
--   nell'avatar e' "V" per tutti. E' molto meglio di venti righe identiche, ma
--   se la resa non ti soddisfa usa uno degli scatti di riserva indicati in
--   assets/store/screenshot-guide.md (filtri, preferiti) al posto della
--   classifica. Non inventare nomi di fantasia per utenti reali.
--
-- • Il tuo profilo e quelli dei tester che vuoi in foto conviene nominarli a
--   mano, con il loro consenso:
--
--     update public.profiles set full_name = 'Marco S.' where id = '<uuid>';
--
-- • I NUOVI account non hanno bisogno di questo script: il nome arriva dai
--   metadata di signup (RegisterScreen -> trigger su auth.users).
--
-- • ⚠️ LIMITE ANCORA APERTO: non esiste un modo per l'utente di cambiare il
--   proprio nome dall'app. Il client non puo' scrivere profiles.full_name (la
--   colonna e' esclusa dai grant in security_rls.sql, per impedire di falsare
--   la classifica) e il trigger copia i metadata solo all'INSERT. Per dare agli
--   utenti una schermata "modifica nome" servono due cose:
--     1. estendere il trigger a UPDATE di auth.users, cosi' che
--        supabase.auth.updateUser({ data: { full_name } }) si propaghi a profiles;
--     2. oppure una Edge Function che scriva con service role dopo aver
--        validato il nome (lunghezza, no impersonificazione, no volgarita').
--   La seconda e' preferibile se in futuro si vuole moderare i nomi.
