import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export interface Recensione {
  id: string;
  areaId: string;
  autore: string;
  stelle: number;
  testo: string;
  data: string;
  imageUrl?: string;
}

interface DbRow {
  id: string;
  service_area_id: string;
  rating: number;
  comment: string;
  created_at: string;
  image_url?: string;
  author_name?: string;
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
    autore: row.author_name ?? 'Anonimo',
    stelle: row.rating,
    testo: row.comment,
    data,
    imageUrl: row.image_url ?? undefined,
  };
}

interface ReviewsContextValue {
  recensioni: Recensione[];
  isLoading: boolean;
  addReview: (params: {
    areaId: string;
    stelle: number;
    testo: string;
    fotoBase64?: string;
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
    fotoBase64?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Devi essere loggato per inviare una recensione.');

    const authorName: string =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split('@')[0] ??
      'Utente';

    let imageUrl: string | undefined;

    if (params.fotoBase64) {
      const fileName = `review_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(fileName, decode(params.fotoBase64), { contentType: 'image/jpeg' });
      if (uploadError) throw new Error(uploadError.message);
      const { data: urlData } = supabase.storage
        .from('review-photos')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        service_area_id: params.areaId,
        rating: params.stelle,
        comment: params.testo,
        user_id: user.id,
        author_name: authorName,
        ...(imageUrl ? { image_url: imageUrl } : {}),
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
