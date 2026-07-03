# 🚗 TripAutostrade

**TripAutostrade** è un'applicazione mobile community-driven progettata per aiutare i viaggiatori a scoprire, valutare e recensire le aree di servizio lungo le autostrade italiane.

L'obiettivo è creare un database affidabile generato dagli utenti per sapere sempre dove conviene fermarsi per un buon caffè, bagni puliti o una ricarica EV.

---

## ✨ Funzionalità Principali

* **🗺️ Mappa Interattiva:** Visualizzazione di tutte le aree di servizio tramite pin geolocalizzati con clustering automatico. Filtri rapidi per brand (Autogrill, Chef Express, Sarni) e per servizio (Bar, Wi-Fi, Pet, Docce, EV).
* **📍 Vicino a te:** FAB sulla mappa che apre un bottom sheet con le aree di servizio più vicine alla posizione GPS, ordinate per distanza.
* **🔍 Ricerca con Autocomplete:** Barra di ricerca fluttuante con dropdown risultati e animazione `animateToRegion` sulla mappa.
* **✍️ Sistema di Recensioni:** Testo, voto da 1 a 5 stelle e foto opzionale (compressa automaticamente prima dell'upload) per ogni area di servizio. Ordinamento per data, voto e utilità.
* **❤️ Mi Piace Globali:** Like interattivi sulle recensioni con optimistic update (React Query), disponibili in tutte le schermate (area di servizio, profilo, attività).
* **🔖 Preferiti:** Segnalibri sulle aree di servizio, consultabili dall'Activity Feed.
* **🚩 Segnalazioni:** Modal per segnalare contenuti inappropriati nelle recensioni.
* **📴 Modalità Offline:** Banner globale quando manca la connessione, cache locale di aree e recensioni, refetch automatico al ritorno online.
* **🏆 Gamification:** Sistema a punti e livelli nel profilo utente — da *Novellino del Casello* a *Leggenda dell'Asfalto*. I punti vengono gestiti automaticamente da Trigger SQL su Supabase.
* **👤 Profilo Utente:** Hero con avatar, badge livello, statistiche (recensioni, media stelle, like ricevuti) e lista delle proprie recensioni con possibilità di eliminare.
* **🎬 Onboarding:** Tutorial di benvenuto scorrevole alla prima apertura, con 3 slide animate e salvataggio su AsyncStorage.
* **🔐 Autenticazione Sicura:** Registrazione, login e sessione persistente gestiti da Supabase Auth.
* **🎨 Design System Material 3:** UI coerente con palette Verde Autostrada (`#00695C`) e Ambra (`#FFC107`), card con angoli arrotondati, chip, FAB e overlay fluttuanti.

---

## 🛠️ Stack Tecnologico

* **Frontend:** React Native 0.81 + Expo 54 (TypeScript)
* **Stato server:** `@tanstack/react-query` v5 (recensioni, optimistic updates)
* **Navigazione:** React Navigation (Native Stack + Bottom Tabs)
* **Backend & Database:** Supabase (PostgreSQL + Auth + Storage)
* **Mappe:** `react-native-maps` + `react-native-map-clustering`
* **Storage locale:** `@react-native-async-storage/async-storage`
* **Foto:** `expo-image-picker` + `expo-image-manipulator` + `base64-arraybuffer`
* **GPS:** `expo-location`
* **Rete/Offline:** `expo-network`

---

## 🗄️ Struttura del Database (Supabase)

* `service_areas` — dati statici delle aree (nome, coordinate, brand, servizi, autostrada)
* `auth.users` — credenziali (gestito da Supabase Auth)
* `profiles` — dati pubblici utente con campo `points`; popolato da Trigger SQL alla registrazione
* `reviews` — recensioni con testo, rating, foto URL, FK a `service_areas` e `profiles`
* `review_likes` — tabella ponte per i like unici (utente × recensione)

**Trigger SQL attivi:**
- `handle_new_user` — crea il profilo pubblico al primo accesso
- `update_user_points` — aggiorna `profiles.points` in base alle recensioni scritte e ai like ricevuti

---

## 🚀 Come avviare il progetto in locale

### Prerequisiti
* Node.js installato
* Account [Supabase](https://supabase.com/) con progetto configurato
* App [Expo Go](https://expo.dev/client) sullo smartphone per il test

### Installazione

```bash
git clone https://github.com/santoromarco74/tripautostrade.git
cd tripautostrade
npm install
```

### Variabili d'ambiente

Crea un file `.env` nella root (o configura `lib/supabase.ts`) con:

```
SUPABASE_URL=https://<tuo-progetto>.supabase.co
SUPABASE_ANON_KEY=<tua-chiave-anon>
```

### Asset richiesti per la build

Prima di eseguire `eas build`, assicurati che nella cartella `assets/` siano presenti:
- `icon.png` — icona principale (1024×1024 px consigliato)
- `splash.png` — splash screen (sfondo deve essere `#00695C` per una fusione perfetta)

### Avvio

```bash
npx expo start --clear
# poi premi 'i' per iOS Simulator o 'a' per Android Emulator
```
