# STATUS.md — Stato del progetto e ripartenza

> Documento di handoff per la prossima sessione di sviluppo.
> Ultimo aggiornamento: 20 luglio 2026. Leggere insieme a `CLAUDE.md` (regole tecniche).

---

## 0. Ripartenza rapida (agg. 20 luglio 2026)

### 🔴 PR IN CORSO da mergiare (contiene questo report + refresh UI)
La PR aperta in questa sessione contiene: **refresh grafico** (tab bar Material 3 con pillola, SegmentedControl migliorato, **ModerationSheet** = bottom sheet custom per Segnala/Blocca al posto degli Alert), **firma "by Marco Santoro"** (Profilo + landing), e questo STATUS aggiornato. `tsc` pulito.
> ⚠️ Nota storica: questo commit UI era rimasto fuori dal merge di #43 (mergiata su un commit precedente) ed è stato recuperato. Alla prossima, **verificare che la PR sia stata mergiata** e che main contenga `components/ModerationSheet.tsx` e il pill in `navigation/TabNavigator.tsx`.

### ✅ TUTTO IL CODICE È IN MAIN (via PR #35, #40, #41, #42, #43 + la PR UI in corso)
- **Google Play passi 1-2-5**: privacy (`docs/privacy.html`), eliminazione account (`delete-account`), store listing (`assets/store/`), materiali tester (`assets/store/invito-tester.md`) + sezione "Diventa tester" sulla landing
- **Bug risolti**: like, notifiche push (FCM V1), scelta navigatore Maps/Waze
- **Sicurezza — pentest 11/11** (`scripts/security_pentest.mjs`): RLS ovunque, `points` non scrivibile, `push_token` non leggibile, storage upload solo autenticati; `notify-like` protetto con secret
- **Moderazione UGC completa**: segnalazioni + auto-nascondi a 3 segnalatori + notifica admin (`notify-report`) + **blocco/sblocco utenti** (Play E App Store ok)
- **Pagelle aree** (🚻☕💶🧼🍽️, `constants/pagelle.ts`), **Area della settimana** (`scripts/editorial.sql` + banner Home), **Tip jar Ko-fi** attivo
- **Deduplica aree**: 3024 → ~2809 (1° passaggio); 2° passaggio "Area di" in `service_areas_dedup.sql` (regex estesa, soglia 1 km)
- **Dominio**: `docs/CNAME` = tripautostrade.it; link in-app aggiornati

### ⚠️ DA ESEGUIRE / VERIFICARE (dashboard, DNS — fuori dal repo)
Gli script SQL sono nel repo ma vanno **eseguiti in Supabase SQL Editor** se non già fatto. Stato noto:
- ✅ eseguiti e verificati: `review_moderation.sql`, `blocked_users.sql`, dedup 1° passaggio
- ❓ **da confermare/eseguire**: `supabase_advisor_fixes.sql`, `review_pagelle.sql`, `editorial.sql`, `service_areas_dedup.sql` (2° passaggio "Area di"), `security_rls.sql`/`storage_security.sql` (dovrebbero essere già fatti dai test sicurezza)
- **`notify-report`**: deploy Edge Function + secrets `ADMIN_USER_ID` (id profilo Marco) + `NOTIFY_REPORT_SECRET` + webhook su `review_reports` con header `x-webhook-secret`
- **Dominio tripautostrade.it** — 3 passi manuali: (1) DNS 4 record A apex → 185.199.108/109/110/111.153; (2) GitHub → Settings → Pages → custom domain + Enforce HTTPS; (3) **Supabase → Auth → Redirect URLs**: aggiungi `https://tripautostrade.it/reset-password.html` (senza questo il reset password si rompe)
- **`eas update --channel preview --platform android`** per distribuire tutto il JS (UI, pagelle, moderazione, blocco, area settimana, link dominio) agli utenti
- Impostare la prima "Area della settimana" (istruzioni in `scripts/editorial.sql`)

### 🧱 Limiti noti
- **"Leaked password protection"**: richiede piano Supabase **Pro** (warning Advisor accettato su free)
- **Su Play**: aggiungere il SHA-1 di **Play App Signing** alle restrizioni chiave Maps (Google ri-firma l'AAB)
- **~1900 aree** con nome generico "Area di servizio" (limite OSM)
- **Supabase free**: va in pausa dopo ~1 settimana di inattività → riattivare da dashboard

### 🎯 Prossimi passi
1. **Google Play passo 3**: account sviluppatore (25$) + **12 tester** (materiali in `assets/store/invito-tester.md`) → closed testing 14 giorni → build AAB (`eas build --profile production -p android`) → data safety + content rating
2. **Differenziazione**: ✅ pagelle + area della settimana fatte; da fare: **"Dove mi fermo?"** (soste migliori lungo una tratta — decidere routing Google Directions vs OSRM + free/premium); crowdsourcing moderato nomi/servizi
3. **Monetizzazione**: tip jar Ko-fi attivo. A scala: ads (AdMob), premium "Plus" (route planner + no-ads via Play Billing/RevenueCat), partnership brand/EV, dati B2B
4. **iOS** (fattibile, rimandato): `app.json` ha già il blocco iOS; serve profilo iOS in `eas.json`, Apple Maps vs Google, APNs, account Apple 99$/anno, TestFlight. Il "blocca utente" (requisito Apple 1.2) è già fatto

---

## 1. Dove siamo: v1.1.0 beta pubblica, live e funzionante

L'app è **distribuita e operativa** su dispositivi reali. Tutta la filiera è verificata end-to-end:

- **Landing page**: https://tripautostrade.it/ (GitHub Pages da `main /docs`)
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

1. ✅ **Privacy policy** — fatta: `docs/privacy.html` collegata dal footer della landing e da ProfileScreen. URL per la console Play: https://tripautostrade.it/privacy.html (live dopo il merge su main)
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
