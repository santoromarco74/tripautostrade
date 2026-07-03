# CLAUDE.md — Linee guida per lo sviluppo di TripAutostrade

Questo file contiene le regole architetturali, le convenzioni di stile e le note tecniche critiche da rispettare durante lo sviluppo. Va letto prima di aggiungere nuove funzionalità o modificare codice esistente.

---

## 1. Stack e dipendenze chiave

| Tecnologia | Versione | Note |
|---|---|---|
| React Native | 0.81.x | Tramite Expo SDK 54 |
| Expo | 54 | `npx expo start --clear` per avviare |
| TypeScript | strict mode | `tsconfig.json` con `jsx: react-native` |
| Supabase | client JS v2 | Configurato in `lib/supabase.ts` |
| React Query | `@tanstack/react-query` v5 | Stato server delle recensioni (`ReviewsContext`) |
| React Navigation | v7 | Stack + Bottom Tabs |
| react-native-maps | latest | Con `react-native-map-clustering` |
| expo-network | ~8.0 | Rilevamento offline (`OfflineBanner`, `onlineManager`) |

---

## 2. Design System — Material 3 (Google Stitch)

### Palette colori (da `constants/Colors.ts`)

```ts
Colors.primary      = '#00695C'   // Verde Autostrada — usato per header, FAB, bottoni primari
Colors.accent       = '#FFC107'   // Ambra — stelle, badge attivi, chip servizi selezionati
Colors.background   = '#F5F7FA'   // Sfondo globale di tutte le schermate
Colors.surface      = '#FFFFFF'   // Card, modal, pannelli
Colors.text         = '#1E293B'   // Testo principale
Colors.textSecondary= '#64748B'   // Sottotitoli, date, label secondari
Colors.border       = '#E2E8F0'   // Divisori, bordi card
Colors.warning      = '#B45309'   // Banner offline, avvisi
```

**Regola:** non usare mai colori hardcoded nelle schermate. Importare sempre da `Colors`.

### Componenti e stile

- **Card**: `borderRadius: 16`, `elevation: 2`, `shadowOpacity: 0.05` — mai bordi netti
- **Bottoni primari**: `borderRadius: 28` (pillola), `backgroundColor: Colors.primary`
- **Bottoni secondari/outlined**: bordo `Colors.primary` o rosso, sfondo trasparente
- **Chip / filtri**: `borderRadius: 20`, `paddingHorizontal: 16`, con `elevation: 3`
- **FAB**: `borderRadius: 30`, `60×60`, `Colors.primary`, `elevation: 6`
- **Header card** (es. ServiceAreaScreen): `borderBottomLeftRadius: 30`, `borderBottomRightRadius: 30`
- **Modale bottom sheet**: `borderTopLeftRadius: 28`, `borderTopRightRadius: 28`

---

## 3. Architettura e pattern React Native

### Context globali

- **`ReviewsContext`** (`context/ReviewsContext.tsx`): stato globale di tutte le recensioni. Espone `recensioni`, `addReview`, `updateReview`, `deleteReview`, `toggleLike`, `isLoading`. Non fare fetch di recensioni localmente nelle schermate — usare sempre il context. **Internamente è implementato con React Query** (`useQuery`/`useMutation`, queryKey `['reviews']`, optimistic update sul like): l'interfaccia esposta resta invariata, quindi non usare `useQuery` direttamente nelle schermate.
- **`AuthContext`** (`context/AuthContext.tsx`): sessione utente. Espone `user`, `session`, `signOut`, `isLoading`.
- **`FavoritesContext`** (`context/FavoritesContext.tsx`): aree preferite/segnalibri. Espone `isFavorite`, `toggleFavorite`.

### Navigazione

- Stack principale in `App.tsx` (Login, Onboarding, Main, ServiceArea, Reviews, AddReview)
- Tab navigator in `navigation/TabNavigator.tsx` (Esplora, Attività, Profilo)
- Tipi in `types/navigation.ts` — aggiornare `RootStackParamList` quando si aggiungono schermate

### Refresh dati al focus

Usare `useFocusEffect(useCallback(...))` (non `useEffect`) per i dati che devono aggiornarsi quando l'utente torna su una schermata:

```ts
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

useFocusEffect(
  useCallback(() => {
    // fetch dati
  }, [dipendenze])
);
```

### Cache stale-while-revalidate

`HomeScreen` usa `AsyncStorage` con chiave `@service_areas_cache` per mostrare i dati immediatamente mentre fetcha in background da Supabase. Rispettare questo pattern per dati che cambiano raramente.

### Offline

- `components/OfflineBanner.tsx` è montato globalmente in `App.tsx` e mostra una pillola quando `expo-network` rileva l'assenza di connessione. Non aggiungere banner offline locali nelle schermate.
- `onlineManager` di React Query è collegato a `expo-network` in `App.tsx`: al ritorno online le query stale vengono rifetchate automaticamente.
- Le recensioni hanno un fallback offline su `AsyncStorage` (chiave `@reviews_cache`) dentro `fetchReviewsFn`; la query usa `networkMode: 'always'` perché la queryFn deve girare anche offline per servire la cache.

---

## 4. Mappe — Regole critiche per Android

### Chiave dinamica sui Marker

**SEMPRE** includere il filtro attivo nella `key` del `<Marker>`:

```tsx
<Marker
  key={`${area.id}-${activeFilter || 'all'}`}
  ...
>
```

Questo forza Android a ricostruire il pin da zero ad ogni cambio filtro, evitando il bug classico di `react-native-maps` in cui i marker personalizzati vengono tagliati o diventano invisibili.

### tracksViewChanges

Impostare sempre `tracksViewChanges={false}` sui marker con vista personalizzata. Usare `true` solo temporaneamente se si devono mostrare aggiornamenti dinamici critici, e reimpostare a `false` dopo il render.

### Dimensioni pin

La `<View>` dentro il `<Marker>` deve avere **sempre dimensioni fisse in `width` e `height`** (non `flex`, non percentuali). Usare un wrapper esterno con le dimensioni massime del pin per tenere costante la clip region.

---

## 5. Logica Punti Utente — Solo su Supabase

**I punti utente NON devono essere calcolati nel codice React Native.**

La logica vive interamente sul database tramite il Trigger SQL `update_user_points` su Supabase. Il trigger aggiorna automaticamente `profiles.points` quando:
- Un utente scrive o elimina una recensione
- Una recensione riceve o perde un like

Il codice React Native deve solo **leggere** il campo `points` da `profiles` e mostrarlo. Non incrementare/decrementare punti manualmente nel codice.

```ts
// CORRETTO — solo lettura
supabase.from('profiles').select('points').eq('id', user.id).single()

// SBAGLIATO — non fare mai questo
supabase.from('profiles').update({ points: points + 10 }).eq('id', user.id)
```

---

## 6. Onboarding e AsyncStorage

- La schermata `OnboardingScreen` viene mostrata solo alla prima apertura
- La flag `hasSeenOnboarding` è salvata su `AsyncStorage` con `AsyncStorage.setItem('hasSeenOnboarding', 'true')`
- `App.tsx` legge questa flag prima di decidere il primo screen da mostrare
- Per resettare l'onboarding in fase di test: `AsyncStorage.removeItem('hasSeenOnboarding')`

---

## 7. Componenti condivisi

| Componente | Percorso | Uso |
|---|---|---|
| `ReviewCard` | `components/ReviewCard.tsx` | Card recensione con like + cestino opzionale. Usarla in tutte le schermate che mostrano recensioni |
| `EmptyState` | `components/EmptyState.tsx` | Stato vuoto con icona e testo |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | Placeholder durante il caricamento |
| `OfflineBanner` | `components/OfflineBanner.tsx` | Pillola offline globale (montata solo in `App.tsx`) |
| `ReportModal` | `components/ReportModal.tsx` | Segnalazione contenuti inappropriati |
| `SortFilterBar` | `components/SortFilterBar.tsx` | Ordinamento liste recensioni |
| `SegmentedControl` | `components/SegmentedControl.tsx` | Tab interne (es. ActivityScreen) |

---

## 8. Git workflow

- Branch di sviluppo: assegnato per sessione (prefisso `claude/`) — usare il branch indicato nella sessione corrente
- Mai pushare direttamente su `main` — aprire PR
- Prima di pushare: `git fetch origin && git rebase origin/<branch>` per evitare conflitti
- Il remote GitHub è sempre la **source of truth** — in caso di conflitti usare `git reset --hard origin/<branch>`

---

## 9. Build e asset

Per buildare con EAS (`eas build`), la cartella `assets/` deve contenere:
- `icon.png` — icona app (1024×1024 px)
- `splash.png` — splash screen con sfondo `#00695C`

Il `backgroundColor` dello splash in `app.json` è impostato su `#00695C` per fondere i bordi dell'immagine con lo schermo.
