# STATUS.md — Stato del progetto e ripartenza

> Documento di handoff per la prossima sessione di sviluppo.
> Ultimo aggiornamento: 14 luglio 2026. Leggere insieme a `CLAUDE.md` (regole tecniche).

---

## 0. Ultima sessione (14 luglio 2026)

Lavoro principale **MERGIATO** (era PR #26) e distribuito via `eas update`. Config lato Supabase/Google **applicata**. Ultimo giro di hardening da Advisor in **PR #35** (`scripts/supabase_advisor_fixes.sql`, da eseguire in SQL Editor).

- **Google Play passi 1-2 e 5**: privacy policy (`docs/privacy.html`), eliminazione account (Edge Function `delete-account` **deployata**), store listing completo (`assets/store/listing.md` + feature graphic `assets/store/feature-graphic.png`, generata da `scripts/gen_feature_graphic.py`)
- **Fix like** (`context/ReviewsContext.tsx`): il like si annullava da solo — `onMutate` girava prima di `mutationFn` che rileggeva la cache già invertita → eseguiva INSERT/DELETE al contrario. Ora `mutationFn` interroga il DB per lo stato reale. Sbloccava anche la notifica push (l'INSERT non avveniva mai)
- **Notifiche push**: risolto `InvalidCredentials` caricando le credenziali **FCM V1** (service account Firebase) su EAS
- **Scelta navigatore** (`screens/HomeScreen.tsx`): al tocco di "Naviga" un alert fa scegliere Google Maps o Waze e avvisa che si apre un'app esterna
- **Sicurezza — `scripts/security_rls.sql` ESEGUITO**: attivata RLS su `reviews` (era disattivata!); `points` non più scrivibile dal client (revoke UPDATE tabella `profiles`, grant solo `push_token`; `update_user_points` reso SECURITY DEFINER). **Sez.3 aggiunta e da rieseguire**: `push_token` non più leggibile dal client (era esposto a chiunque → raccolta token Expo + spam push); ora SELECT su `profiles` solo per id/full_name/avatar_url/points
- **Pentest automatico** (`scripts/security_pentest.mjs`, ESEGUITO): **11/11 verdi**. Ha trovato e CHIUSO 2 vulnerabilità reali: (1) `push_token` esposto → security_rls sez.3; (2) upload anonimo sul bucket `review-photos` → eliminata la policy permissiva "Permetti upload a tutti 1tsy3yu_0" (`scripts/storage_security.sql`, ESEGUITO). Rilanciabile per re-verificare in futuro
- **`notify-like` hardening**: endpoint pubblico → aggiunto controllo header `x-webhook-secret` vs `NOTIFY_LIKE_SECRET` (retrocompatibile finché il secret non è impostato). **Da attivare**: `supabase secrets set NOTIFY_LIKE_SECRET=...` + stesso header nel Database Webhook, poi redeploy `notify-like`
- **Deduplica aree di servizio** (`scripts/service_areas_dedup.sql` ESEGUITO): 3024 → **2809 aree**, 0 duplicati. Per nome normalizzato + prossimità <300m (Est/Ovest e marchi omonimi preservati). Seed aggiornato per non ricrearli. Backup `service_areas_backup_dedup` **rimosso**
- **Fix Advisor Supabase** (PR #35, `scripts/supabase_advisor_fixes.sql`): `search_path` fissato su `update_user_points`; `revoke execute` su `handle_new_user`/`update_user_points` (funzioni-trigger non più chiamabili via RPC); drop policy SELECT "Foto pubbliche" (impediva l'enumerazione del bucket, foto sempre visibili via URL pubblico)
- ✅ **Config esterna applicata**: secret `notify-like` attivato (+ header webhook + redeploy); chiave Google Maps ristretta (package + SHA-1 + solo Maps SDK for Android — API prima non abilitata)
- ⚠️ **"Leaked password protection"**: richiede piano Supabase **Pro** → non attivabile su free, warning Advisor accettato
- ⚠️ **Quando su Play**: aggiungere il SHA-1 di **Play App Signing** alle restrizioni della chiave Maps (Google ri-firma l'AAB con chiave diversa)
- ✅ **Sicurezza database COMPLETA**: RLS su reviews/likes/favorites/reports, points non scrivibile, push_token non leggibile, storage upload solo autenticati — verificato dal pentest 11/11

---

## 1. Dove siamo: v1.1.0 beta pubblica, live e funzionante

L'app è **distribuita e operativa** su dispositivi reali. Tutta la filiera è verificata end-to-end:

- **Landing page**: https://santoromarco74.github.io/tripautostrade/ (GitHub Pages da `main /docs`)
- **Download**: bottone e QR puntano a `releases/latest/download/tripautostrade.apk` — le release future con quel nome file aggiornano la landing da sole
- **Release corrente**: `v1.1.0` su GitHub Releases (APK preview EAS)
- **Aggiornamenti OTA**: EAS Update attivo, canale `preview` — i fix JS/asset si distribuiscono con `eas update --channel preview --platform android --message "..."` (gli utenti li ricevono al secondo riavvio). Build nuova solo per moduli nativi
- **Notifiche push**: funzionanti (like → push all'autore). Catena: `lib/pushNotifications.ts` → `profiles.push_token` → Database Webhook su `review_likes` → Edge Function `notify-like` → Expo Push/FCM
- **Crash reporting**: Sentry attivo (DSN in `lib/sentry.ts`); upload sourcemap disattivato via `SENTRY_DISABLE_AUTO_UPLOAD` in `eas.json` (stack trace non simbolizzati — accettato per ora)
- **Reset password**: link in LoginScreen → email Supabase → `docs/reset-password.html` (redirect URL configurato in Supabase Auth)
- **Database**: **2809 aree di servizio** (deduplicate il 14/07, da 3024; seed OpenStreetMap `scripts/seed_service_areas.sql`, idempotente anche per prossimità). ~1900 hanno ancora nome generico "Area di servizio" (OSM non ne ha uno migliore — vedi §4)

### Feature dell'app oggi
Mappa con pin e cluster **come immagini PNG native** (mai view custom nei Marker — vedi CLAUDE.md §4, bug snapshot Android), filtri brand/servizi, ricerca con autocomplete, "Vicino a te" (FAB + bottom sheet per distanza), recensioni con foto compresse, like con optimistic update (React Query), preferiti, segnalazioni, gamification punti/livelli via trigger SQL, **classifica top 20** (tab in Attività), modalità offline (banner globale + cache), onboarding, **scelta navigatore (Google Maps / Waze) al tocco di "Naviga"**.

## 2. Infrastruttura e credenziali (già configurate)

| Servizio | Stato |
|---|---|
| Supabase | progetto `gkyahazhuvtiqersqlmh` — ⚠️ piano free: va in pausa dopo ~1 settimana di inattività (→ `Network request failed`); riattivare dal dashboard |
| EAS | projectId in `app.json`, profili dev/preview/production con canali OTA; keystore Android custodita da Expo |
| Google Maps | API key Android in `app.json` (`android.config.googleMaps.apiKey`) |
| Firebase/FCM | `google-services.json` nel repo + service account key caricata su EAS (per le push) |
| Sentry | progetto attivo, DSN nel codice |
| CI | GitHub Actions: typecheck su push/PR (`npm ci` + `tsc --noEmit`) |
| Agenti Claude | `.claude/agents/`: `marketing`, `web-dev`, `social-content` (contesto progetto incorporato) |

## 3. Prossimo obiettivo: Google Play (piano già discusso)

Percorso concordato, in ordine:

1. ✅ **Privacy policy** — fatta: `docs/privacy.html` collegata dal footer della landing e da ProfileScreen. URL per la console Play: https://santoromarco74.github.io/tripautostrade/privacy.html (live dopo il merge su main)
2. ✅ **Eliminazione account** — bottone in ProfileScreen con doppia conferma + Edge Function `delete-account` (verifica JWT, poi con service role elimina foto storage, segnalazioni fatte/ricevute, like dati/ricevuti, recensioni, preferiti, profilo, utente auth; poi signOut locale). **Deployata** su Supabase e verificata.
3. **Account sviluppatore Play** (25 $, verifica identità) — ⚠️ account personali: serve **closed testing con 12+ tester per 14 giorni** prima della produzione; reclutare dai beta tester della landing
4. **Build AAB**: `eas build --profile production --platform android` (profilo già pronto, autoIncrement attivo)
5. ✅ **Store listing** — testi pronti in `assets/store/listing.md` (titolo 29/30, breve 72/80, lunga 2271/4000, keyword, categoria Travel & Local); feature graphic 1024×500 in `assets/store/feature-graphic.png` (rigenerabile con `scripts/gen_feature_graphic.py`); icona 512 da `assets/icon.png`. **Mancano solo gli screenshot dal telefono** (min 2, meglio 4-8)
6. Data safety form + content rating in console; eventuale `eas submit -p android` con service account Play

### Checklist sicurezza pre-Play
- ✅ **`scripts/security_rls.sql` ESEGUITO** (14/07): RLS attivata su `reviews` (era disattivata — chiunque poteva forgiare/modificare recensioni); `points` non più scrivibile dal client (`update_user_points` SECURITY DEFINER, revoke UPDATE su `profiles`, grant solo `push_token`). Verificato.
- ⚠️ **Ristringere la chiave Google Maps** (`AIza…` in `app.json`) su Google Cloud Console: Application restrictions → Android (package `com.santoromarco74.tripautostrade` + SHA-1 keystore) + API restrictions → solo "Maps SDK for Android" — **ancora da fare**
- ⚠️ Verificare policy Storage bucket `review-photos`: upload solo autenticati, lettura pubblica ok
- ⚠️ Supabase Auth: attivare "Leaked password protection" + lunghezza minima password ≥8
- ✅ già ok: nessun segreto nel repo, `service_role` solo lato Edge Functions, `delete-account` verifica JWT, Sentry `sendDefaultPii:false`, posizione solo on-device
- Design (non bug): `service_areas` è modificabile da qualsiasi autenticato (crowdsourcing servizi via ServiceAreaScreen) — nessuna moderazione. Se si apre l'editing di nome/posizione/nuove aree agli utenti, farlo **solo con moderazione** (tabella proposte + approvazione), altrimenti si ricreano duplicati/vandalismo

## 4. Rifiniture note (non bloccanti)

- **Zoom iniziale mappa**: a livello nazione i pin appaiono solo zoomando (clustering). Tuning possibile: `minPoints` sul MapView, o cluster più aggressivi solo sopra certe soglie. L'utente lo considera un dettaglio
- Stack trace Sentry non simbolizzati (servono org/project slug + SENTRY_AUTH_TOKEN come secret EAS, poi togliere `SENTRY_DISABLE_AUTO_UPLOAD`)
- Filtro per autostrada: richiede prima la colonna `highway` popolata in `service_areas` (il seed OSM non la include)
- Avatar utente (upload foto profilo), post social "giorno 2" (l'agente `social-content` ha già consegnato il post di lancio)
- **Nomi generici aree (~1900)**: sono generici perché OSM (la fonte del seed) non ha un nome migliore — quella fonte è esaurita. Vie realistiche: crowdsourcing con editing moderato (feature post-lancio), una lista ufficiale ADS se reperibile, oppure lasciarli. Non bloccante

## 5. Workflow con l'utente (Marco) — promemoria operativi

- Claude lavora su branch `claude/*` e apre PR; Marco mergia e lancia build/update dal suo Mac (Claude non ha credenziali Expo/Play; per farle lanciare a Claude servirebbe `EXPO_TOKEN` come env dell'ambiente)
- **Dopo ogni `git pull`, se `package.json` è cambiato: `npm install`** (due incidenti già causati da questo)
- Mergiare le PR **prima** di buildare, così main e branch restano allineati
- Le PR mergiate non si riaprono: lavoro successivo = branch riallineato da main + PR nuova
- Verificare sempre con `npx tsc --noEmit` (e idealmente `npx expo-doctor`) prima di committare
