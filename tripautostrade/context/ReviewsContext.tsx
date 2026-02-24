import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface Recensione {
  id: string;
  areaId: string;
  autore: string;
  stelle: number;
  testo: string;
  data: string;
  fotoUri?: string;
}

interface DbRow {
  id: string;
  service_area_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

function dbToRecensione(row: DbRow): Recensione {
  const data = new Date(row.created_at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return {
    id: row.id,
    areaId: row.service_area_id,
    autore: 'Anonimo',
    stelle: row.rating,
    testo: row.comment,
    data,
  };
}

interface ReviewsContextValue {
  recensioni: Recensione[];
  isLoading: boolean;
  addReview: (params: {
    areaId: string;
    stelle: number;
    testo: string;
    fotoUri?: string;
  }) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [recensioni, setRecensioni] = useState<Recensione[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecensioni((data as DbRow[]).map(dbToRecensione));
    }
    setIsLoading(false);
  };

  const addReview = async (params: {
    areaId: string;
    stelle: number;
    testo: string;
    fotoUri?: string;
  }) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        service_area_id: params.areaId,
        rating: params.stelle,
        comment: params.testo,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    setRecensioni((prev) => [dbToRecensione(data as DbRow), ...prev]);
  };

  return (
    <ReviewsContext.Provider value={{ recensioni, isLoading, addReview }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews(): ReviewsContextValue {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews deve essere usato dentro ReviewsProvider');
  return ctx;
}
