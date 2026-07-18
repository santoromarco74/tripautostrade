import { createContext, useContext, ReactNode } from 'react';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CATEGORIE_PAGELLA, Pagelle } from '../constants/pagelle';

export interface Recensione {
  id: string;
  areaId: string;
  userId?: string;
  autore: string;
  avatarUrl?: string;
  stelle: number;
  testo: string;
  data: string;
  imageUrl?: string;
  likeCount: number;
  likedByMe: boolean;
  /** Voti per categoria (pagella), solo quelli compilati */
  pagelle?: Pagelle;
}

interface DbProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface DbRow {
  id: string;
  service_area_id: string;
  user_id?: string;
  rating: number;
  comment: string;
  created_at: string;
  image_url?: string;
  profiles?: DbProfile | null;
  [pagellaCol: string]: unknown;
}

function dbToPagelle(row: DbRow): Pagelle | undefined {
  const pagelle: Pagelle = {};
  for (const c of CATEGORIE_PAGELLA) {
    const v = row[c.dbColumn];
    if (typeof v === 'number') pagelle[c.key] = v;
  }
  return Object.keys(pagelle).length > 0 ? pagelle : undefined;
}

/** Da oggetto Pagelle alle colonne DB (solo quelle valorizzate). */
function pagelleToDbCols(pagelle?: Pagelle): Record<string, number> {
  const cols: Record<string, number> = {};
  if (!pagelle) return cols;
  for (const c of CATEGORIE_PAGELLA) {
    const v = pagelle[c.key];
    if (v != null) cols[c.dbColumn] = v;
  }
  return cols;
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
    autore: row.profiles?.full_name || 'Utente Autostradale',
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    stelle: row.rating,
    testo: row.comment,
    data,
    imageUrl: row.image_url ?? undefined,
    likeCount,
    likedByMe,
    pagelle: dbToPagelle(row),
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
    pagelle?: Pagelle;
  }) => Promise<void>;
  updateReview: (params: {
    id: string;
    stelle: number;
    testo: string;
    fotoBase64?: string;
    pagelle?: Pagelle;
  }) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  toggleLike: (reviewId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

const REVIEWS_CACHE_KEY = '@reviews_cache';

async function readReviewsCache(): Promise<Recensione[]> {
  try {
    const cached = await AsyncStorage.getItem(REVIEWS_CACHE_KEY);
    return cached ? (JSON.parse(cached) as Recensione[]) : [];
  } catch {
    return [];
  }
}

const fetchReviewsFn = async (): Promise<Recensione[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error || !reviews) {
    // Offline o errore di rete: fallback stale-while-revalidate dalla cache
    return readReviewsCache();
  }

  // Utenti bloccati dall'utente corrente: le loro recensioni non vanno mostrate
  const blockedIds = new Set<string>();
  if (currentUserId) {
    const { data: blocks } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', currentUserId);
    for (const b of blocks ?? []) blockedIds.add(b.blocked_id);
  }

  const visibleReviews = (reviews as DbRow[]).filter(
    (r) => !r.user_id || !blockedIds.has(r.user_id),
  );

  const reviewIds = visibleReviews.map((r) => r.id);

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

  const result = visibleReviews.map((row) =>
    dbToRecensione(row, countMap[row.id] ?? 0, myLikes.has(row.id)),
  );

  try {
    await AsyncStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify(result));
  } catch {
    // errore di scrittura cache non critico
  }

  return result;
};

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: recensioni, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: fetchReviewsFn,
    // 'always': la queryFn gira anche offline così può servire la cache locale
    networkMode: 'always',
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      // NB: non leggere lo stato del like dalla cache di React Query: onMutate
      // gira PRIMA di mutationFn e ha già invertito `likedByMe` per l'optimistic
      // update, quindi la cache riflette lo stato NUOVO. Interrogare il DB dà lo
      // stato reale ed evita di eseguire l'operazione opposta (bug: like che
      // parte come DELETE e si annulla da solo).
      const { data: existing, error: selError } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (selError) throw new Error(selError.message);

      const wasLiked = !!existing;

      if (wasLiked) {
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('review_likes')
          .insert({ review_id: reviewId, user_id: user.id });

        if (error) throw new Error(error.message);
      }
    },
    onMutate: async (reviewId: string) => {
      await queryClient.cancelQueries({ queryKey: ['reviews'] });
      const previousReviews = queryClient.getQueryData<Recensione[]>(['reviews']);

      if (previousReviews) {
        queryClient.setQueryData<Recensione[]>(['reviews'], (old) => {
          if (!old) return old;
          return old.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  likedByMe: !r.likedByMe,
                  likeCount: r.likedByMe ? r.likeCount - 1 : r.likeCount + 1,
                }
              : r
          );
        });
      }

      return { previousReviews };
    },
    onError: (err, reviewId, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(['reviews'], context.previousReviews);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (params: {
      areaId: string | number;
      stelle: number;
      testo: string;
      fotoBase64?: string;
      pagelle?: Pagelle;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

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
          rating: params.stelle,
          comment: params.testo,
          ...(imageUrl ? { image_url: imageUrl } : {}),
          ...pagelleToDbCols(params.pagelle),
        })
        .select('*, profiles(full_name, avatar_url)')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      stelle: number;
      testo: string;
      fotoBase64?: string;
      pagelle?: Pagelle;
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
          ...pagelleToDbCols(params.pagelle),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');
      const { error } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: userId });
      // 23505 = già bloccato: non è un errore per l'utente
      if (error && error.code !== '23505') throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  return (
    <ReviewsContext.Provider
      value={{
        recensioni: recensioni ?? [],
        isLoading: isLoading,
        addReview: async (params) => { await addMutation.mutateAsync(params); },
        updateReview: async (params) => { await updateMutation.mutateAsync(params); },
        deleteReview: async (id) => { await deleteMutation.mutateAsync(id); },
        toggleLike: async (reviewId) => { await toggleLikeMutation.mutateAsync(reviewId); },
        blockUser: async (userId) => { await blockMutation.mutateAsync(userId); },
        unblockUser: async (userId) => { await unblockMutation.mutateAsync(userId); },
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews(): ReviewsContextValue {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews deve essere usato dentro ReviewsProvider');
  return ctx;
}
