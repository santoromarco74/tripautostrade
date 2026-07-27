# Google Play — Checklist operativa (passo 3 → produzione)

Sequenza completa da seguire in Play Console, con i punti che fanno respingere le app messi in
evidenza. I contenuti da incollare sono negli altri file di questa cartella.

| Serve | File |
|---|---|
| Titolo, descrizioni, categoria | `listing.md` |
| Modulo Sicurezza dei dati | `data-safety.md` |
| Questionario classificazione IARC | `content-rating.md` |
| Screenshot | `screenshot-guide.md` |
| Reclutamento tester | `invito-tester.md` |

---

## 🔴 I tre errori che bloccano la pubblicazione

Leggere prima di tutto il resto.

### 1. Credenziali di test obbligatorie — l'app è interamente dietro login

`App.tsx:56-64`: senza sessione l'unica schermata raggiungibile è il Login. Il revisore Google
**non può vedere nulla** dell'app senza un account. Se lasci vuota la sezione *Accesso all'app*, la
release viene respinta con "we were unable to access the app".

#### Come creare l'account del revisore

⚠️ **Non usare un indirizzo `@tripautostrade.it`**: il dominio punta a GitHub Pages e **non ha
hosting email**, quindi non riceverebbe la mail di conferma. E senza conferma il login non funziona —
`RegisterScreen` dopo il signup rimanda a "Controlla la tua email per confermare l'account".

**Opzione A — registrazione dall'app con alias Gmail (consigliata).** Registrati normalmente
dall'app con `santoromarco+playreview@gmail.com`: Gmail consegna gli indirizzi con `+` nella casella
normale, quindi la mail di conferma arriva e il link si può cliccare. L'account nasce dal percorso
di signup reale, quindi il trigger imposta `full_name` correttamente. Il `+` non crea problemi né a
Supabase né ai revisori, che fanno copia-incolla.

**Opzione B — creazione da dashboard.** Supabase → **Authentication → Users → Add user**, con
**Auto Confirm User** spuntato (salta la conferma, quindi l'indirizzo può anche non esistere).
Il nome però va messo a mano, perché il trigger copia i metadata solo al signup:

```sql
update public.profiles set full_name = 'Revisore Play' where id = '<uuid utente>';
```

→ Poi Play Console → **Criteri → Contenuti dell'app → Accesso all'app** → *"Alcune o tutte le
funzionalità sono limitate"* → aggiungi un'istruzione:

```
Nome: Accesso completo
Nome utente: santoromarco+playreview@gmail.com
Password: <password dedicata, non riusata altrove>
Istruzioni: Inserire email e password nella schermata di login iniziale.
            Nessun altro passaggio richiesto. Tutte le funzioni sono
            disponibili subito dopo l'accesso.
```

⚠️ Account **dedicato**, non il tuo. **Non eliminarlo** finché l'app resta pubblicata: Google lo
riusa a ogni aggiornamento. Non serve che scriva recensioni — vede già quelle degli altri utenti, e
quelle scritte dall'account di revisione sarebbero contenuto pubblico reale.

#### 🔴 Supabase free non deve essere in pausa durante la revisione

Il piano free mette il progetto in pausa dopo **~1 settimana di inattività** (`STATUS.md` §2). Se
il progetto è in pausa quando Google apre l'app, il revisore vede `Network request failed` su
schermata vuota e la release viene **respinta** — per una ragione che non c'entra col codice. Lo
stesso vale nei 14 giorni di closed testing, dove i tester troverebbero l'app rotta.

→ Durante revisione e testing tieni il progetto sveglio: basta aprire l'app o la dashboard ogni
pochi giorni. È il singolo modo più stupido di perdere un giro di revisione.

### 2. SHA-1 di Play App Signing sulla chiave Google Maps

Google **ri-firma** l'AAB con il proprio certificato. Se la chiave Maps in `app.json` è limitata
al SHA-1 del tuo keystore, in produzione **la mappa resta grigia per tutti** — e la mappa è l'app.

→ Play Console → **Release → Configurazione → Integrità dell'app** → copia il
*SHA-1 del certificato di firma dell'app* → Google Cloud Console → credenziali della chiave
`AIza…` → **aggiungilo** alle restrizioni Android (accanto a quello del keystore Expo, non al suo
posto, altrimenti si rompono le build preview).

Nella stessa occasione, se non è già fatto (`STATUS.md` §3): restrizione applicazione → Android con
package `com.santoromarco74.tripautostrade`, e restrizione API → solo *Maps SDK for Android*.

### 3. L'etichetta dell'app richiede una build nuova

`app.json` → `name` è passato da `tripautostrade` a `TripAutostrade`: è il nome sotto l'icona nel
launcher. È una proprietà **nativa**, quindi **non** si distribuisce via `eas update` — serve una
build. Va comunque bene, perché per Play serve l'AAB.

---

## Fase A — Account sviluppatore

- [ ] Registrazione su [play.google.com/console](https://play.google.com/console) — **25 $ una volta**
- [ ] **Verifica dell'identità** con documento: può richiedere **da 2 a 7 giorni**. Va fatta subito,
      è il collo di bottiglia di tutto il percorso
- [ ] Scegli il tipo di account: **personale** (più semplice) oppure organizzazione (richiede
      D-U-N-S, settimane)
- [ ] Compila l'indirizzo pubblico dello sviluppatore e l'email di contatto

> ⚠️ **La regola dei 12 tester**: gli account **personali** creati dopo novembre 2023 devono
> completare un **closed testing con almeno 12 tester attivi per 14 giorni consecutivi** prima di
> poter chiedere l'accesso alla produzione. Non è aggirabile. I 12 devono **restare iscritti** e
> aver installato l'app: se scendono sotto la soglia il contatore si azzera. Recluta 15-18 persone
> per avere margine (materiali in `invito-tester.md`).

## Fase B — Creazione dell'app in console

- [ ] **Crea app**: nome `TripAutostrade`, italiano come lingua predefinita, tipo *App*, **gratuita**
- [ ] Dichiarazioni iniziali: linee guida per gli sviluppatori + leggi sull'esportazione USA

> ⚠️ Da gratuita a pagamento non si torna indietro. Resta gratuita — il modello è tip jar + eventuale
> premium futuro via acquisti in-app, entrambi compatibili con un'app gratuita.

## Fase C — Contenuti dell'app (la parte lunga)

- [ ] **Privacy policy**: `https://tripautostrade.it/privacy.html`
- [ ] **Accesso all'app**: credenziali di test → vedi errore 🔴 1
- [ ] **Annunci**: *No, l'app non contiene annunci*
- [ ] **Classificazione dei contenuti**: questionario → `content-rating.md`
- [ ] **Pubblico di destinazione**: fascia **18+** oppure 16-17 e 18+. Evita di includere fasce
      **sotto i 13 anni**: attiverebbe le regole *Families* e *Designed for Families*, con obblighi
      aggiuntivi che non vogliamo su un'app con UGC. La privacy dichiara già "non rivolta a minori
      di 14 anni" — mantieni le due cose coerenti
- [ ] **App di notizie**: No
- [ ] **App COVID-19 / tracciamento**: No
- [ ] **Sicurezza dei dati**: → `data-safety.md`, incluso il campo
      **URL per l'eliminazione dei dati**: `https://tripautostrade.it/elimina-account.html`
- [ ] **App finanziarie / sanitarie / governative**: No a tutte
- [ ] **Contenuti generati dagli utenti**: dichiara sì e cita gli strumenti di moderazione
      (segnalazione, auto-nascondimento a 3 segnalatori, blocco utenti) — elenco pronto in
      `content-rating.md`

### Permessi: niente moduli extra da compilare

L'unico permesso sensibile è `ACCESS_FINE_LOCATION` (`app.json:44-46`), usato **solo in foreground**
con richiesta a runtime. Non c'è `ACCESS_BACKGROUND_LOCATION`, quindi **non** serve il
*Permissions Declaration Form* per la posizione in background — quello che richiede video
dimostrativo e allunga la revisione di settimane. Non aggiungere il permesso background senza una
ragione forte.

## Fase D — Scheda dello Store

- [ ] Titolo, descrizione breve e lunga → `listing.md` (conteggi già verificati)
- [ ] Icona 512 (da `assets/icon.png`) e immagine in evidenza 1024×500
      (`assets/store/feature-graphic.png`)
- [ ] **6 screenshot** → `screenshot-guide.md`
- [ ] Categoria **Viaggi e informazioni locali**, tag, email di contatto
- [ ] ⚠️ Verifica il numero di aree dichiarato nella descrizione con
      `select count(*) from service_areas;` — vedi nota in `listing.md`

## Fase E — Build e closed testing

- [ ] `eas build --profile production --platform android` → produce l'**AAB** (`autoIncrement` attivo)
- [ ] Crea la traccia **Test chiuso** → carica l'AAB
- [ ] Note di rilascio in italiano
- [ ] Crea la lista tester (email Google dei partecipanti) e invia il link di opt-in
- [ ] Fai il giro dei SHA-1 → errore 🔴 2, **prima** che i tester provino la mappa
- [ ] Attendi **14 giorni** con **12+ tester attivi**, poi in console appare *Richiedi l'accesso alla
      produzione*
- [ ] Durante l'attesa: raccogli feedback, tieni d'occhio Sentry e le recensioni interne

## Fase F — Produzione

- [ ] Richiedi l'accesso alla produzione (Google fa una revisione del percorso di test)
- [ ] Crea la release di produzione con lo stesso AAB (o uno più recente)
- [ ] Rollout graduale al **20%**, poi 50%, poi 100% — con Sentry sotto controllo
- [ ] Aggiorna la landing: il badge "Disponibile su Google Play" al posto del download APK diretto

---

## Punti di compliance da non rompere in futuro

### Il tip jar deve restare una donazione pura

Le donazioni volontarie sono fuori dall'obbligo di Google Play Billing **solo se chi dona non
riceve nulla in cambio**. Oggi è così: `constants/support.ts` apre un link Ko-fi esterno e non
sblocca alcuna funzione.

⚠️ Nel momento in cui una donazione dà un vantaggio in-app — badge, no-ads, funzioni premium,
punti — diventa a tutti gli effetti l'acquisto di un bene digitale e **deve** passare da Play
Billing, pena la rimozione dell'app. Se si vuole il piano "Plus", va costruito con Play Billing
(o RevenueCat) come prodotto separato, **lasciando il tip jar com'è**.

> Non ho una certezza al 100% su come Google applichi la regola caso per caso: se hai dubbi,
> conviene una domanda al supporto Play prima della pubblicazione. La configurazione attuale
> (donazione senza contropartita) è quella che la policy descrive come esente.

### Se si aggiunge AdMob

Tre cose cambiano insieme, e devono cambiare **nello stesso rilascio**: dichiarazione *Annunci = Sì*
in console, `data-safety.md` (compare *Condiviso = Sì* con finalità pubblicitaria), e il claim
"✅ Gratis, senza pubblicità" nella descrizione lunga di `listing.md`, che diventerebbe falso.

### Se si aggiunge il route planner "Dove mi fermo?"

Partenza e destinazione uscirebbero dal dispositivo verso un provider di routing: la risposta
"Posizione → non raccolta" del modulo Sicurezza dei dati **non sarebbe più vera**. Vedi l'avviso
in `data-safety.md`.

### Account senza nome creati prima del fix

Il campo Nome in registrazione è stato aggiunto il 25/07/2026. Gli account creati prima hanno
`profiles.full_name` a `null` e compaiono come "Utente Autostradale" in recensioni e classifica.

→ Esegui **`scripts/backfill_full_name.sql`** nel SQL Editor di Supabase: assegna uno pseudonimo
neutro e stabile (`Viaggiatore A3F9`) a chi non ha nome. Lo script è idempotente e spiega perché
**non** deriva il nome dal prefisso dell'email (`full_name` è pubblico, l'email no: lo farebbe
contraddire la privacy policy).

⚠️ Da fare **prima degli screenshot** della classifica. Il file segnala anche un limite ancora
aperto: l'utente non ha modo di cambiare il proprio nome dall'app.
