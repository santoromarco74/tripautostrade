# STATUS.md — Stato del progetto e ripartenza

> Documento di handoff per la prossima sessione di sviluppo.
> Ultimo aggiornamento: 11 luglio 2026. Leggere insieme a `CLAUDE.md` (regole tecniche).

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
- **Database**: ~637 aree di servizio (seed OpenStreetMap, `scripts/seed_service_areas.sql`, rilanciabile idempotente)

### Feature dell'app oggi
Mappa con pin e cluster **come immagini PNG native** (mai view custom nei Marker — vedi CLAUDE.md §4, bug snapshot Android), filtri brand/servizi, ricerca con autocomplete, "Vicino a te" (FAB + bottom sheet per distanza), recensioni con foto compresse, like con optimistic update (React Query), preferiti, segnalazioni, gamification punti/livelli via trigger SQL, **classifica top 20** (tab in Attività), modalità offline (banner globale + cache), onboarding.

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

1. **Privacy policy** — pagina `docs/privacy.html` collegata dal footer della landing (obbligatoria). Contenuti: dati raccolti (email, nome, recensioni, foto, push token, crash Sentry; la posizione è usata solo on-device, non salvata), fornitori (Supabase, Google Maps, Expo, Sentry), diritti GDPR, contatto santoromarco@gmail.com
2. **Eliminazione account** (requisito Play per app con registrazione) — bottone in ProfileScreen con doppia conferma + Edge Function `delete-account` (service role: elimina foto storage, like dati/ricevuti, recensioni, profilo, utente auth; poi signOut locale)
3. **Account sviluppatore Play** (25 $, verifica identità) — ⚠️ account personali: serve **closed testing con 12+ tester per 14 giorni** prima della produzione; reclutare dai beta tester della landing
4. **Build AAB**: `eas build --profile production --platform android` (profilo già pronto, autoIncrement attivo)
5. **Store listing**: testi con l'agente `marketing` (titolo 30c, breve 80c, lunga 4000c), screenshot dal telefono, feature graphic 1024×500 (generabile con Pillow come i pin), icona 512×512 (c'è)
6. Data safety form + content rating in console; eventuale `eas submit -p android` con service account Play

## 4. Rifiniture note (non bloccanti)

- **Zoom iniziale mappa**: a livello nazione i pin appaiono solo zoomando (clustering). Tuning possibile: `minPoints` sul MapView, o cluster più aggressivi solo sopra certe soglie. L'utente lo considera un dettaglio
- Stack trace Sentry non simbolizzati (servono org/project slug + SENTRY_AUTH_TOKEN come secret EAS, poi togliere `SENTRY_DISABLE_AUTO_UPLOAD`)
- Filtro per autostrada: richiede prima la colonna `highway` popolata in `service_areas` (il seed OSM non la include)
- Avatar utente (upload foto profilo), post social "giorno 2" (l'agente `social-content` ha già consegnato il post di lancio)

## 5. Workflow con l'utente (Marco) — promemoria operativi

- Claude lavora su branch `claude/*` e apre PR; Marco mergia e lancia build/update dal suo Mac (Claude non ha credenziali Expo/Play; per farle lanciare a Claude servirebbe `EXPO_TOKEN` come env dell'ambiente)
- **Dopo ogni `git pull`, se `package.json` è cambiato: `npm install`** (due incidenti già causati da questo)
- Mergiare le PR **prima** di buildare, così main e branch restano allineati
- Le PR mergiate non si riaprono: lavoro successivo = branch riallineato da main + PR nuova
- Verificare sempre con `npx tsc --noEmit` (e idealmente `npx expo-doctor`) prima di committare
