# 🚗 TripAutostrade

**TripAutostrade** è un'applicazione mobile community-driven progettata per aiutare i viaggiatori a scoprire, valutare e recensire le aree di servizio lungo le autostrade. 

L'obiettivo dell'app è creare un database affidabile generato dagli utenti per sapere sempre dove conviene fermarsi per un buon caffè, bagni puliti o carburante a buon prezzo.

---

## ✨ Funzionalità Principali

* **🗺️ Mappa Interattiva:** Visualizzazione di tutte le aree di servizio tramite pin geolocalizzati.
* **✍️ Sistema di Recensioni:** Gli utenti possono lasciare una recensione testuale e un voto (da 1 a 5 stelle) per ogni area di servizio.
* **👍 Interazioni Social (Mi Piace):** Sistema di upvote ("Utile") per le recensioni degli altri viaggiatori, per far emergere i feedback più affidabili.
* **🔐 Autenticazione Sicura:** Registrazione, Login e recupero password gestiti in sicurezza.
* **👤 Profili Utente Relazionali:** Ogni utente ha un profilo pubblico generato automaticamente alla registrazione, visibile accanto alle proprie recensioni.

---

## 🛠️ Stack Tecnologico

L'app è costruita con tecnologie moderne e pensate per la scalabilità:

* **Frontend:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (Scritto in TypeScript per la massima affidabilità del codice).
* **Navigazione:** [React Navigation](https://reactnavigation.org/) (Stack & Bottom Tabs).
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL aperto e serverless).
* **Autenticazione:** Supabase Auth (Email & Password).
* **Mappe:** `react-native-maps`.

---

## 🗄️ Struttura del Database (Supabase)

Il backend si basa su un database PostgreSQL relazionale con le seguenti tabelle principali:

* `service_areas`: Contiene i dati statici delle aree di servizio (nome, coordinate GPS).
* `auth.users`: Tabella di sistema (bunker) per le credenziali di accesso.
* `profiles`: Tabella pubblica con i dati degli utenti (nome, avatar), popolata automaticamente tramite **Trigger SQL** alla registrazione di un nuovo utente.
* `reviews`: Contiene il testo della recensione, il voto, e i collegamenti (`foreign keys`) all'area di servizio e all'autore.
* `review_likes`: Tabella ponte che gestisce i "Mi piace" unici per ogni recensione da parte degli utenti, evitando voti doppi.

---

## 🚀 Come avviare il progetto in locale

Se vuoi clonare e far girare questo progetto sul tuo computer, segui questi passaggi:

### 1. Prerequisiti
* [Node.js](https://nodejs.org/) installato.
* Un account gratuito su [Supabase](https://supabase.com/).
* L'app [Expo Go](https://expo.dev/client) installata sul tuo smartphone fisico per testare.

### 2. Installazione
Clona la repository e installa le dipendenze:
```bash
git clone [https://github.com/tuo-username/tripautostrade.git](https://github.com/tuo-username/tripautostrade.git)
cd tripautostrade
npm install
