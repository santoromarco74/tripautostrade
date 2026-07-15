// Categorie della "pagella" di un'area di servizio — la firma di TripAutostrade.
// Valutazioni strutturate (1-5) su ciò che conta davvero durante una sosta,
// in aggiunta alle stelle complessive. Fonte unica: modificare qui aggiunge/
// toglie la categoria ovunque (AddReview, ServiceArea, ReviewCard, DB mapping).

export type PagellaKey = 'bagni' | 'caffe' | 'prezzi' | 'pulizia' | 'cibo';

export interface CategoriaPagella {
  /** chiave usata nell'oggetto Pagelle in app */
  key: PagellaKey;
  /** colonna corrispondente nella tabella reviews (Supabase) */
  dbColumn: string;
  label: string;
  emoji: string;
}

export const CATEGORIE_PAGELLA: readonly CategoriaPagella[] = [
  { key: 'bagni',   dbColumn: 'rating_bathrooms',   label: 'Bagni',   emoji: '🚻' },
  { key: 'caffe',   dbColumn: 'rating_coffee',      label: 'Caffè',   emoji: '☕' },
  { key: 'prezzi',  dbColumn: 'rating_price',       label: 'Prezzi',  emoji: '💶' },
  { key: 'pulizia', dbColumn: 'rating_cleanliness', label: 'Pulizia', emoji: '🧼' },
  { key: 'cibo',    dbColumn: 'rating_food',        label: 'Cibo',    emoji: '🍽️' },
];

/** Voti per categoria di una singola recensione (tutte opzionali). */
export type Pagelle = Partial<Record<PagellaKey, number>>;
