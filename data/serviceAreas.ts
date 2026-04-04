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
  // Servizi disponibili (aggiornati da Supabase)
  has_restaurant?: boolean;
  has_cafe?: boolean;
  has_showers?: boolean;
  has_wifi?: boolean;
  pet_friendly?: boolean;
  ev_charging?: boolean;
}
