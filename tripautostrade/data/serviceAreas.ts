export interface ServiceArea {
  id: number;
  name: string;
  brand: string;
  latitude: number;
  longitude: number;
  // Campi non presenti nel DB Supabase — opzionali per retrocompatibilità
  highway?: string;
  direction?: string;
  km?: number;
}
