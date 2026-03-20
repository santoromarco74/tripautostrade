import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export interface Recensione {
  id: string;
  areaId: string;
  userId?: string;
  autore: string;
  stelle: number;
  testo: string;
  data: string;
  imageUrl?: string;
  likeCount: number;
  likedByMe: boolean;
}

interface DbRow {
  id: string;
  service_area_id: string;
  user_id?: string;
  author_name?: string;
  rating: number;
  comment: string;
  created_at: string;
  image_url?: string;
}

function dbToRecensione(
  row: DbRow,
  likeCount: number,
  likedByMe: boolean,
): Recensione {
  const data = new Date(row.created_at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return {
    id: row.id,
    areaId: row.service_area_id,
    userId: row.user_id,
    autore: row.author_name ?? 'Anonimo',
    stelle: row.rating,
    testo: row.comment,
    data,
    imageUrl: row.image_url ?? undefined,
    likeCount,
    likedByMe,
  };
}

interface ReviewsContextValue {
  recensioni: Recensione[];
  isLoading: boolean;
  addReview: (params: {
    areaId: string | number;
    stelle: number;
    testo: string;
    fotoBase64?: string;
  }) => Promise<void>;
  updateReview: (params: {
    id: string;
    stelle: number;
    testo: string;
    fotoBase64?: string;
  }) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  toggleLike: (reviewId: string) => Promise<void>;
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

    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !reviews) {
      setIsLoading(false);
      return;
    }

    const reviewIds = (reviews as DbRow[]).map((r) => r.id);

    const { data: likeCounts } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds);

    const countMap: Record<string, number> = {};
    for (const like of likeCounts ?? []) {
      countMap[like.review_id] = (countMap[like.review_id] ?? 0) + 1;
    }

    const myLikes = new Set<string>();
    if (currentUserId) {
      const { data: userLikes } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', currentUserId)
        .in('review_id', reviewIds);

      for (const like of userLikes ?? []) {
        myLikes.add(like.review_id);
      }
    }

    setRecensioni(
      (reviews as DbRow[]).map((row) =>
        dbToRecensione(row, countMap[row.id] ?? 0, myLikes.has(row.id)),
      ),
    );
    setIsLoading(false);
  };

  const toggleLike = async (reviewId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const review = recensioni.find((r) => r.id === reviewId);
    if (!review) return;

    const wasLiked = review.likedByMe;

    setRecensioni((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              likedByMe: !wasLiked,
              likeCount: wasLiked ? r.likeCount - 1 : r.likeCount + 1,
            }
          : r,
      ),
    );

    if (wasLiked) {
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);

      if (error) {
        setRecensioni((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, likedByMe: true, likeCount: r.likeCount + 1 }
              : r,
          ),
        );
      }
    } else {
      const { error } = await supabase
        .from('review_likes')
        .insert({ review_id: reviewId, user_id: user.id });

      if (error) {
        setRecensioni((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, likedByMe: false, likeCount: r.likeCount - 1 }
              : r,
          ),
        );
      }
    }
  };

  const addReview = async (params: {
    areaId: string | number;
    stelle: number;
    testo: string;
    fotoBase64?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const authorName =
      (user?.user_metadata?.full_name as string | undefined) ??
      user?.email?.split('@')[0] ??
      'Anonimo';

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
        user_id: user?.id,
        author_name: authorName,
        rating: params.stelle,
        comment: params.testo,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    setRecensioni((prev) => [dbToRecensione(data as DbRow, 0, false), ...prev]);
  };

  const updateReview = async (params: {
    id: string;
    stelle: number;
    testo: string;
    fotoBase64?: string;
  }) => {
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
      .update({
        rating: params.stelle,
        comment: params.testo,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const existing = recensioni.find((r) => r.id === params.id);
    setRecensioni((prev) =>
      prev.map((r) =>
        r.id === params.id
          ? dbToRecensione(data as DbRow, existing?.likeCount ?? 0, existing?.likedByMe ?? false)
          : r,
      ),
    );
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setRecensioni((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <ReviewsContext.Provider value={{ recensioni, isLoading, addReview, updateReview, deleteReview, toggleLike }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews(): ReviewsContextValue {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews deve essere usato dentro ReviewsProvider');
  return ctx;
}
