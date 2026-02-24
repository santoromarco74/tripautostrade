import { createContext, useContext, useState, ReactNode } from 'react';

export interface Recensione {
  id: string;
  areaId: string;
  autore: string;
  stelle: number;
  testo: string;
  data: string;
  fotoUri?: string;
}

const RECENSIONI_INIZIALI: Recensione[] = [
  {
    id: '1',
    areaId: '1',
    autore: 'Marco R.',
    stelle: 5,
    testo: 'Ottimo bar, caffè eccellente e personale gentile. Bagni puliti.',
    data: '12 feb 2026',
  },
  {
    id: '2',
    areaId: '1',
    autore: 'Laura M.',
    stelle: 3,
    testo: 'Nella norma per un autogrill. Code alla cassa abbastanza lunghe.',
    data: '5 feb 2026',
  },
  {
    id: '3',
    areaId: '2',
    autore: 'Giorgio P.',
    stelle: 4,
    testo: 'Buona selezione di panini e tavoli disponibili. Prezzi ok.',
    data: '28 gen 2026',
  },
  {
    id: '4',
    areaId: '2',
    autore: 'Silvia T.',
    stelle: 2,
    testo: 'Parcheggio sovraffollato, lunga attesa al banco.',
    data: '20 gen 2026',
  },
];

interface ReviewsContextValue {
  recensioni: Recensione[];
  addReview: (recensione: Omit<Recensione, 'id'>) => void;
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [recensioni, setRecensioni] = useState<Recensione[]>(RECENSIONI_INIZIALI);

  const addReview = (nuova: Omit<Recensione, 'id'>) => {
    setRecensioni((prev) => [
      { ...nuova, id: String(Date.now()) },
      ...prev,
    ]);
  };

  return (
    <ReviewsContext.Provider value={{ recensioni, addReview }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews(): ReviewsContextValue {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews deve essere usato dentro ReviewsProvider');
  return ctx;
}
