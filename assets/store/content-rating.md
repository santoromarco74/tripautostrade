# Google Play — Questionario per la classificazione dei contenuti (IARC)

Risposte da ricopiare nella Play Console → **Criteri → Contenuti dell'app → Classificazione dei contenuti**.

> Il questionario è gestito da IARC e produce in automatico i rating per PEGI, ESRB, USK,
> ClassInd e altri. Le domande sono a risposta chiusa: qui c'è la risposta giusta per
> TripAutostrade con la motivazione, così non si improvvisa in console.
>
> ⚠️ Il questionario va **riaperto e aggiornato** se si aggiungono pubblicità, acquisti in-app
> o chat tra utenti. Un rating non aggiornato è una violazione a sé.

---

## Dati iniziali

| Campo | Valore |
|---|---|
| Indirizzo email | `santoromarco@gmail.com` (riceve le notifiche IARC) |
| Categoria dell'app | **Utilità, produttività, comunicazione o altro** |

**Perché questa categoria e non "Social":** la categoria IARC "Social networking" è pensata per app
il cui scopo primario è la connessione tra persone (profili, follower, messaggi diretti).
TripAutostrade è un'app di informazione locale con recensioni: le persone non si collegano tra loro,
non si seguono e non si scrivono. La presenza di UGC si dichiara nella sezione dedicata più sotto,
che è il posto corretto — non cambiando categoria.

> Nota: la *categoria IARC* non è la *categoria dello Store* (quella resta
> **Viaggi e informazioni locali**, vedi `listing.md`). Sono due campi indipendenti.

---

## Sezione contenuti — tutte NO

| Domanda | Risposta | Motivazione |
|---|---|---|
| Violenza (realistica o fantastica) | **No** | — |
| Sangue o contenuti raccapriccianti | **No** | — |
| Contenuti sessuali o nudità | **No** | — |
| Linguaggio volgare o scurrile | **No** | L'app non contiene volgarità *proprie*. Il rischio è nell'UGC, coperto dalla sezione UGC |
| Riferimenti a droghe, alcol o tabacco | **No** | Le aree di servizio hanno bar che vendono alcol, ma l'app non descrive né promuove il consumo. Non elenchiamo prodotti alcolici |
| Simulazione di gioco d'azzardo | **No** | — |
| Gioco d'azzardo con denaro reale | **No** | — |
| Contenuti che incitano all'odio o discriminatori | **No** | — |
| Contenuti spaventosi o horror | **No** | — |
| Attività criminali glorificate | **No** | — |

### Sui punti e la classifica — non è gioco d'azzardo

La gamification (punti, livelli, classifica top 20) **non** è "simulazione di gioco d'azzardo":
non c'è puntata, non c'è esito casuale, non c'è vincita. I punti si ottengono deterministicamente
scrivendo recensioni e ricevendo like (trigger SQL `update_user_points`), non sono acquistabili né
convertibili. Rispondere **No** a entrambe le domande sul gambling.

---

## Sezione "Interazione tra utenti e contenuti generati dagli utenti" — qui si dichiara tutto

Questa è la sezione che conta per TripAutostrade. Non sottodichiararla: è la causa più comune di
rimozione per le app con recensioni.

| Domanda | Risposta | Dettaglio |
|---|---|---|
| Gli utenti possono interagire o scambiare contenuti? | **Sì** | Recensioni, foto e like sono pubblici e visibili a tutti |
| L'app consente la condivisione di contenuti generati dagli utenti? | **Sì** | Testo recensione, voto, pagelle, foto |
| Gli utenti possono condividere foto o video? | **Sì** | Una foto opzionale per recensione, bucket `review-photos` a lettura pubblica |
| L'app consente la comunicazione diretta tra utenti (chat, messaggi)? | **No** | Nessuna messaggistica, nessun commento sulle recensioni, nessun follow |
| L'app condivide la posizione dell'utente con altri utenti? | **No** | La posizione resta sul dispositivo (vedi `data-safety.md`) |
| L'app consente l'acquisto di beni digitali? | **No** | Il tip jar è una donazione esterna, nessun bene digitale |
| L'app contiene pubblicità? | **No** | Oggi nessun SDK pubblicitario. **Da cambiare se si integra AdMob** |

### Strumenti di moderazione da citare se la console lo chiede

Play e IARC premiano una dichiarazione UGC accompagnata da moderazione reale. TripAutostrade ne ha,
e va detto:

- **Segnalazione contenuti** in-app su ogni recensione (`components/ReportModal.tsx`,
  `components/ModerationSheet.tsx`)
- **Auto-nascondimento** della recensione al raggiungimento di 3 segnalatori distinti
  (`scripts/review_moderation.sql`)
- **Notifica all'amministratore** per ogni segnalazione (Edge Function `notify-report`)
- **Blocco utenti**: l'utente può nascondere tutti i contenuti di un altro account
  (`components/BlockedUsersModal.tsx`, `scripts/blocked_users.sql`)
- **Eliminazione account e dati** in-app (`delete-account`)

---

## Rating attesi

Con queste risposte l'esito tipico è il più permissivo, con la nota sull'interazione tra utenti:

| Ente | Rating atteso |
|---|---|
| PEGI (Europa/Italia) | **3** |
| ESRB (USA) | **Everyone** |
| USK (Germania) | **0** |
| ClassInd (Brasile) | **L** (livre) |
| Google Play (globale) | **Per tutti** |

A questi si aggiunge l'etichetta informativa **"Interazione tra utenti"** / *Users Interact*,
conseguenza corretta e attesa della sezione UGC. Non è un problema: è la dichiarazione onesta di
un'app con recensioni.

---

## Dopo l'invio

1. IARC invia il certificato via email all'indirizzo indicato: conservarlo.
2. Il rating compare sulla scheda Store solo dopo la pubblicazione della release.
3. **Ogni volta** che si aggiunge pubblicità, acquisti in-app o chat: riaprire il questionario
   *prima* di pubblicare la release che introduce la feature.
