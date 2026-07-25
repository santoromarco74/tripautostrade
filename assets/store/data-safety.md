# Google Play — Modulo "Sicurezza dei dati" (Data Safety)

Risposte da ricopiare nella Play Console → **Criteri → Contenuti dell'app → Sicurezza dei dati**.

> Compilato il 25 luglio 2026 da un audit del codice, non a memoria. Ogni voce cita il file
> che la giustifica, così alla prossima modifica si sa cosa ri-verificare.
>
> ⚠️ **Regola Play da tenere a mente:** un dato è "raccolto" solo se **esce dal dispositivo**.
> Un dato letto e usato solo on-device **non** va dichiarato come raccolto. È la ragione per cui
> la posizione qui sotto risulta *non raccolta* pur essendo un permesso richiesto.

---

## Panoramica (le 3 domande iniziali)

| Domanda | Risposta |
|---|---|
| L'app raccoglie o condivide uno dei tipi di dati utente richiesti? | **Sì** |
| Tutti i dati utente raccolti sono criptati in transito? | **Sì** |
| Fornisci un modo agli utenti per richiedere l'eliminazione dei dati? | **Sì** |

**Criptato in transito:** tutte le chiamate di rete sono HTTPS/TLS — Supabase (`lib/supabase.ts`),
Expo Push (`exp.host`), Sentry (`lib/sentry.ts`). Nessun endpoint in chiaro nel codice.

**Eliminazione dati:** doppio canale, entrambi richiesti da Play per le app con registrazione.
- **In-app:** ProfileScreen → "Elimina account" con doppia conferma → Edge Function `delete-account`
  (`screens/ProfileScreen.tsx:82-130`, `supabase/functions/delete-account`). Cancella foto storage,
  segnalazioni, like, recensioni, preferiti, profilo e utente auth.
- **URL da inserire nel campo "Data deletion URL"**: `https://tripautostrade.it/elimina-account.html`

---

## Tipi di dati da dichiarare

Legenda: **Raccolto** = esce dal dispositivo · **Condiviso** = trasferito a terzi secondo la
definizione Play (un fornitore che elabora per conto nostro — Supabase, Sentry, Expo — **non**
conta come condivisione).

### 1. Informazioni personali → Nome

| Campo | Valore |
|---|---|
| Raccolto | Sì |
| Condiviso | No |
| Elaborato in modo effimero | No |
| Obbligatorio o facoltativo | **Obbligatorio** (richiesto in registrazione) |
| Finalità | Funzionalità dell'app · Gestione dell'account |

Il nome è raccolto in registrazione (`screens/RegisterScreen.tsx`), passa nei metadata di signup,
un trigger su `auth.users` lo copia in `profiles.full_name` (il client non può scrivere quella
colonna — `scripts/security_rls.sql`) e **viene mostrato pubblicamente** accanto alle recensioni e
nella classifica (`screens/ActivityScreen.tsx:54-56`). Da segnalare nella privacy policy come
informazione visibile agli altri utenti — non è un dato privato.

> Il campo nome è stato aggiunto in questa sessione: prima la registrazione inviava solo email e
> password, il trigger scriveva `null` e **tutti** gli utenti comparivano come "Utente Autostradale".
> Gli account creati prima del fix restano senza nome (vedi nota in `play-checklist.md`).

### 2. Informazioni personali → Indirizzo email

| Campo | Valore |
|---|---|
| Raccolto | Sì |
| Condiviso | No |
| Elaborato in modo effimero | No |
| Obbligatorio o facoltativo | **Obbligatorio** |
| Finalità | Gestione dell'account (autenticazione, reset password) |

Gestito da Supabase Auth. **Non** è mostrata agli altri utenti.

### 3. Foto e video → Foto

| Campo | Valore |
|---|---|
| Raccolto | Sì |
| Condiviso | No |
| Elaborato in modo effimero | No |
| Obbligatorio o facoltativo | **Facoltativo** |
| Finalità | Funzionalità dell'app |

Foto allegate alle recensioni, compresse on-device (`utils/imageCompression.ts`) e caricate nel
bucket `review-photos`. ⚠️ Il bucket è a **lettura pubblica** (URL pubblico salvato in
`reviews.image_url`, `context/ReviewsContext.tsx:285-292`): le foto sono contenuti pubblici, e la
privacy policy deve dirlo chiaramente.

### 4. Messaggi / Contenuti generati dagli utenti → Altri UGC

| Campo | Valore |
|---|---|
| Raccolto | Sì |
| Condiviso | No |
| Elaborato in modo effimero | No |
| Obbligatorio o facoltativo | **Facoltativo** |
| Finalità | Funzionalità dell'app |

Testo delle recensioni, voto in stelle, pagelle (`constants/pagelle.ts`), like e segnalazioni.
Tutti pubblici per definizione della feature.

### 5. ID dispositivo o altri ID

| Campo | Valore |
|---|---|
| Raccolto | Sì |
| Condiviso | No |
| Elaborato in modo effimero | No |
| Obbligatorio o facoltativo | **Facoltativo** (solo se l'utente concede il permesso notifiche) |
| Finalità | Funzionalità dell'app (notifiche push) |

Token Expo Push salvato in `profiles.push_token` (`lib/pushNotifications.ts:47-52`), rimosso al
logout. Non leggibile dal client per policy RLS (verificato dal pentest). Dichiarato qui perché è
un identificatore legato all'installazione.

### 6. Info e prestazioni app → Log di arresto anomalo + Diagnostica

| Campo | Valore |
|---|---|
| Raccolto | Sì |
| Condiviso | No |
| Elaborato in modo effimero | No |
| Obbligatorio o facoltativo | **Obbligatorio** |
| Finalità | Analisi · Funzionalità dell'app (diagnostica dei crash) |

Sentry con `sendDefaultPii: false` e `tracesSampleRate: 0.2` (`lib/sentry.ts`). Due voci separate
nel modulo: *Log di arresto anomalo* e *Diagnostica* (le performance trace ricadono nella seconda).

---

## Tipi di dati da NON dichiarare (e perché)

### Posizione — NON raccolta

Questa è la voce che si sbaglia più facilmente. L'app **chiede** `ACCESS_FINE_LOCATION`
(`app.json:44-46`) e legge il GPS, ma la coordinata **non lascia mai il dispositivo**:

- `screens/HomeScreen.tsx:133-137` — legge la posizione, la tiene in state React
- `screens/HomeScreen.tsx:200-201`, `552-553` e `screens/ActivityScreen.tsx:125-126` — la passa a
  `haversineDistance` (`utils/distance.ts`), calcolo puramente locale
- `showsUserLocation` / `initialRegion` della mappa — resta nel componente nativo

Nessuna `insert`/`update` verso Supabase include coordinate utente, e le recensioni **non**
salvano la posizione di chi scrive (payload completo in `context/ReviewsContext.tsx:285-297`).
Quindi: **Posizione → non raccolta, non condivisa.**

> Se in futuro si aggiunge il route planner ("Dove mi fermo?") con un provider di routing remoto,
> **questa risposta cambia**: partenza e destinazione verrebbero inviate a un server terzo (OSRM o
> Google) e andrebbe dichiarata *Posizione approssimativa → raccolta, condivisa, effimera*.
> Rileggere questo file prima di pubblicare quella feature.

### Altre voci: No

Informazioni finanziarie (il tip jar Ko-fi è un **link esterno**, nessun pagamento è gestito
dall'app — `constants/support.ts`), salute, contatti, calendario, SMS, file e documenti,
cronologia ricerche web, installed apps.

---

## Sezione "Pratiche di sicurezza"

| Domanda | Risposta | Nota |
|---|---|---|
| I dati sono criptati in transito | **Sì** | HTTPS/TLS su tutti gli endpoint |
| Gli utenti possono richiedere l'eliminazione dei dati | **Sì** | in-app + URL pubblico |
| L'app è stata sottoposta a una verifica di sicurezza indipendente | **No** | il pentest interno (`scripts/security_pentest.mjs`, 11/11) **non** conta come verifica indipendente: quella richiede una terza parte |

---

## Da ri-verificare prima di ogni invio

1. **Avatar utente**: `profiles.avatar_url` esiste già nello schema ma l'upload non è implementato.
   Quando lo sarà, la voce "Foto" resta valida ma diventa anche *Gestione dell'account*.
2. **Route planner**: vedi l'avviso sulla posizione sopra — è il cambiamento più probabile.
3. **AdMob / analytics**: se si aggiungono, compaiono *Pubblicità* e quasi certamente
   *Condiviso = Sì* con finalità *Pubblicità o marketing*. Oggi il listing promette
   "senza pubblicità": le due cose vanno cambiate insieme.
