import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@favorites_cache';

interface FavoritesContextValue {
  favorites: number[];
  isLoading: boolean;
  toggleFavorite: (areaId: number) => Promise<void>;
  isFavorite: (areaId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);

    // Stale-while-revalidate: mostra cache subito
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setFavorites(JSON.parse(cached));
        setIsLoading(false);
      }
    } catch {
      // cache corrotta, continua
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('service_area_id')
      .eq('user_id', user.id);

    if (!error && data) {
      const ids = data.map((row) => row.service_area_id);
      setFavorites(ids);
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(ids));
      } catch {
        // errore cache non critico
      }
    }

    setIsLoading(false);
  };

  const isFavorite = useCallback(
    (areaId: number) => favorites.includes(areaId),
    [favorites],
  );

  const toggleFavorite = async (areaId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const wasFavorite = favorites.includes(areaId);

    // Optimistic update
    setFavorites((prev) =>
      wasFavorite ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );

    if (wasFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('service_area_id', areaId)
        .eq('user_id', user.id);

      if (error) {
        // Rollback
        setFavorites((prev) => [...prev, areaId]);
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ service_area_id: areaId, user_id: user.id });

      if (error) {
        // Rollback
        setFavorites((prev) => prev.filter((id) => id !== areaId));
      }
    }

    // Aggiorna cache
    try {
      const updated = wasFavorite
        ? favorites.filter((id) => id !== areaId)
        : [...favorites, areaId];
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch {
      // non critico
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isLoading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites deve essere usato dentro FavoritesProvider');
  return ctx;
}
