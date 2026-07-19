# STATUS.md — Stato del progetto e ripartenza

> Documento di handoff per la prossima sessione di sviluppo.
> Ultimo aggiornamento: 14 luglio 2026. Leggere insieme a `CLAUDE.md` (regole tecniche).

---

## 0. Ripartenza rapida (agg. 14 luglio 2026)

### 🔴 PRIMA COSA: la PR #35 "Pre-lancio" è APERTA, da mergiare e attivare
Contiene 3 blocchi indipendenti (`tsc` pulito):
- **A) Fix Advisor Supabase** — `scripts/supabase_advisor_fixes.sql` (search_path su `update_user_points`; `revoke execute` sulle funzioni-trigger; drop policy SELECT "Foto pubbliche" che permetteva l'enumerazione del bucket)
- **B) Moderazione segnalazioni + blocco utenti** — `scripts/review_moderation.sql` (colonna `reviews.hidden` + trigger auto-nascondi a **3 segnalatori distinti** + RLS), Edge Function `notify-report` (push all'admin), e **blocco utenti** `scripts/blocked_users.sql` (tabella + RLS; le recensioni di chi blocchi spariscono; blocca da flag su recensione, gestione/sblocco in Profilo → "Utenti bloccati"). Chiude il requisito UGC di **Google Play E App Store** (segnala + modera + rimuovi + blocca)
- **C) Pagelle aree** (differenziazione) — `scripts/review_pagelle.sql` + UI. Voti 1-5 per categoria 🚻 Bagni · ☕ Caffè · 💶 Prezzi · 🧼 Pulizia · 🍽️ Cibo; ogni area mostra le medie. Categorie in `constants/pagelle.ts` (fonte unica)
- **D) Tip jar** (monetizzazione leggera) — pulsante "Sostieni il progetto" in Profilo (`constants/support.ts` → `SUPPORT_URL`) e nel footer della landing (`docs/index.html`, var `SUPPORT_URL`). Donazione **pura** via link esterno: consentita fuori dalla fatturazione store finché non dà vantaggi in-app. ✅ **ATTIVATO** su `https://ko-fi.com/tripautostrade`. ⚠️ tenerlo donazione pura (nessun vantaggio in-app, altrimenti scatta Play Billing/IAP)

**Checklist attivazione dopo il merge:**
1. **SQL Editor**: esegui `supabase_advisor_fixes.sql`, `review_moderation.sql`, `review_pagelle.sql`, `blocked_users.sql` → poi **rilancia l'Advisor**
2. **Edge Functions**: deploy `notify-report`; secrets `ADMIN_USER_ID` (id profilo Marco) + `NOTIFY_REPORT_SECRET`; Database Webhook su INSERT `review_reports` con header `x-webhook-secret`
3. `eas update --channel preview --platform android` per distribuire pagelle + moderazione + blocco (parte JS)
4. Tip jar: ✅ già attivato (Ko-fi link impostato in `constants/support.ts` e `docs/index.html`)
5. **Verifica in app** (già testato ✅ moderazione+blocco): foto recensioni visibili; like assegna punti; la pagella compare; 3 segnalazioni da account diversi nascondono la recensione; blocco utente funziona (serve tabella `blocked_users` creata al punto 1)

### ✅ Già fatto e LIVE (mergiato in main, config applicata)
- **Google Play passi 1-2-5**: privacy (`docs/privacy.html`), eliminazione account (`delete-account` deployata), store listing (`assets/store/listing.md` + `feature-graphic.png`), materiali tester (`assets/store/invito-tester.md`) + sezione "Diventa tester" sulla landing
- **Bug risolti**: like (INSERT/DELETE invertite in ReviewsContext), notifiche push (credenziali FCM V1 su EAS), scelta navigatore Maps/Waze
- **Sicurezza database COMPLETA — pentest 11/11** (`scripts/security_pentest.mjs`): RLS su reviews/likes/favorites/reports, `points` non scrivibile, `push_token` non leggibile, storage upload solo autenticati. Script eseguiti: `security_rls.sql`, `storage_security.sql`. Trovate+chiuse 2 vuln reali (push_token esposto, upload anonimo storage)
- **`notify-like`** protetto con secret condiviso (attivato) — endpoint pubblico non più spammabile
- **Deduplica aree**: 3024 → **2809**, 0 duplicati (`service_areas_dedup.sql`), seed reso idempotente, backup rimosso
- **Chiave Google Maps ristretta** (package + SHA-1 + solo Maps SDK Android)

### ⚠️ Note e limiti
- **"Leaked password protection"**: richiede piano Supabase **Pro** → non attivabile su free (warning Advisor accettato)
- **Quando pubblichi su Play**: aggiungi il SHA-1 di **Play App Signing** alle restrizioni della chiave Maps (Google ri-firma l'AAB con chiave diversa)
- **~1900 aree** hanno nome generico "Area di servizio" (OSM non ne ha di migliori) — vedi §4

### 🎯 Prossimi passi
1. **Google Play passo 3**: account sviluppatore (25$) + reclutare **12 tester** (materiali pronti in `assets/store/invito-tester.md`) → closed testing 14 giorni. Poi passo 4 (build AAB: `eas build --profile production -p android`) e passo 6 (data safety form + content rating)
2. **Differenziazione** (roadmap discussa): (a) voce editoriale "area della settimana"/badge ironici con agente `social-content`; (b) feature-wedge post-lancio **"Dove mi fermo?"** — soste migliori lungo una tratta A→B per distanza + qualità community; (c) crowdsourcing moderato di nomi/servizi (tabella proposte + approvazione)
3. **Monetizzazione** (discussa): ora tip jar Ko-fi (donazione pura, copre i costi). Dopo, a scala: ads discrete (AdMob), premium "Plus" (route planner + no-ads, via Play Billing/RevenueCat), partnership brand/EV, dati B2B aggregati. Patreon valutato e scartato per ora (abbonamenti+perk, commissioni alte, sovradimensionato)
4. **iOS** (fattibile, rimandato): `app.json` ha già il blocco iOS; serve profilo iOS in `eas.json`, decidere Apple Maps vs Google, credenziali APNs, account Apple 99$/anno, distribuzione via TestFlight. Il "blocca utente" (requisito Apple 1.2) è già fatto

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
