# Changelog

Tutte le modifiche rilevanti al progetto sono documentate in questo file.  
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.0.0/).

---

## [1.0.0-beta] - 2026-04-07

### Added

#### 🎨 UI/UX — Restyling completo Material 3 (Google Stitch)
- Nuova palette cromatica: Verde Autostrada `#00695C` (primary) + Ambra `#FFC107` (accent)
- Tutti i token di design centralizzati in `constants/Colors.ts`
- `HomeScreen`: barra di ricerca fluttuante con `borderRadius: 24`, chip brand e chip servizi arrotondati (`borderRadius: 20`), overlay con `elevation` e backdrop semi-trasparente
- `ServiceAreaScreen`: header card con angoli inferiori arrotondati (`borderBottomLeftRadius: 30`), badge servizi, FAB verde per la scrittura recensioni
- `ProfileScreen`: hero con avatar, badge livello gamification, stats card fluttuante, bottone logout pill outlined
- Componente `ReviewCard.tsx` centralizzato usato in tutte le schermate con recensioni

#### 🏆 Gamification — Sistema punti e livelli
- Campo `points` nella tabella `profiles` su Supabase
- Trigger SQL `update_user_points`: assegna/rimuove punti automaticamente in base alle recensioni scritte e ai like ricevuti (logica lato DB, zero codice RN)
- 4 livelli utente: 🚗 Novellino del Casello (0–19 pt), 🧭 Esploratore Autostradale (20–49 pt), 🥇 Veterano delle Aree di Sosta (50–99 pt), 🏆 Leggenda dell'Asfalto (100+ pt)
- Badge livello visibile nell'hero del profilo con emoji, titolo e contatore punti
- Punti aggiornati automaticamente via `useFocusEffect` ogni volta che si torna alla schermata Profilo

#### 🎬 Onboarding — Tutorial di benvenuto
- Nuova schermata `OnboardingScreen.tsx` con carosello scorrevole (FlatList `horizontal` + `pagingEnabled`)
- 3 slide animate: *Trova l'area giusta*, *La voce dei viaggiatori*, *Fai la tua parte*
- Indicatori di pagina (dots) con transizione animata larghezza
- Pulsante "Inizia a Viaggiare" (FAB pillola) solo nell'ultima slide
- Stato di visualizzazione salvato su `AsyncStorage` (`hasSeenOnboarding`)
- `App.tsx` aggiornato: legge AsyncStorage all'avvio e instrada verso Onboarding o Login di conseguenza

#### ❤️ Like globali sulle recensioni
- `ReviewCard.tsx`: componente condiviso che centralizza l'UI del like (cuoricino + contatore) per tutte le schermate
- Like interattivo disponibile in `ServiceAreaScreen`, `ProfileScreen` e `ReviewsScreen`
- `toggleLike` estratto da `ReviewsContext` e passato ovunque

#### 📱 Assets ufficiali
- `app.json` aggiornato: `icon`, `splash.image`, `splash.backgroundColor` (`#00695C`), `splash.resizeMode` (`contain`)
- `android.adaptiveIcon` aggiornato con `foregroundImage: icon.png` e `backgroundColor: #00695C`

### Fixed

#### 🗺️ Bug Android — Pin mappa tagliati/invisibili
- Aggiunta `key` dinamica sui `<Marker>`: `` `${area.id}-${activeFilter || 'all'}` `` forza Android a ricostruire il pin da zero ad ogni cambio filtro, eliminando il glitch di clipping
- `tracksViewChanges={false}` fisso su tutti i marker per evitare overhead sul frame thread
- Outer wrapper del pin con dimensioni fisse `46×46` per mantenere la clip region costante

#### 🔍 Ricerca e navigazione
- Dropdown autocomplete sotto la search bar con fino a 6 risultati e `animateToRegion` sulla mappa
- Fix navigazione: parametro `{ area }` invece di `{ serviceArea }` passato ad `AddReviewScreen`

#### 🐛 Altri fix
- Fix campo `item.comment` → `item.testo` nelle card recensioni (nome colonna DB)
- `tsconfig.json` aggiornato con `"jsx": "react-native"` e opzioni Expo per risolvere errori TypeScript in VS Code / Codespaces

---

## [0.2.0] - 2026-03

### Added
- Upload foto nelle recensioni (`expo-image-picker` + `base64-arraybuffer` + Supabase Storage bucket `review-photos`)
- Filtri rapidi per servizi (Ristorante, Bar, Wi-Fi, Pet, Docce, EV) in `HomeScreen`
- `BackHandler` su Android con dialog di conferma uscita
- Pulsante "Segnala Servizi" con Modal e Switch in `ServiceAreaScreen`
- Funzioni `updateReview` e `deleteReview` in `ReviewsContext`
- `useFocusEffect` in `ProfileScreen` per aggiornamento dati al rientro sulla schermata

### Fixed
- Navigazione mappa: sostituita `react-native-map-link` con `Linking` nativo (Universal Link Google Maps su Android, `comgooglemaps://` + fallback `maps://` su iOS) per l'anteprima percorso

---

## [0.1.0] - 2026-02

### Added
- Setup iniziale React Native + Expo + TypeScript
- Integrazione Supabase (Auth, Database, Storage)
- Mappa con clustering (`react-native-map-clustering`) e pin brand personalizzati
- Schermata `HomeScreen` con ricerca base e filtri brand
- Schermata `ServiceAreaScreen` con dettagli area e lista recensioni
- Schermata `AddReviewScreen` con stelle, testo e salvataggio su Supabase
- Schermata `ProfileScreen` con lista recensioni personali
- Schermata `ActivityScreen` con storico attività
- `ReviewsContext` globale con `addReview`, `toggleLike`
- `AuthContext` con login, registrazione, logout
- Navigazione Tab (Esplora, Attività, Profilo) + Stack navigator
- Cache locale delle aree con stale-while-revalidate (`AsyncStorage`)
