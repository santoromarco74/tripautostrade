export interface AreaServizio {
  id: string;
  nome: string;
  brand: string;
  autostrada: string;
  direzione: string;
  stelle: string;
  valutazione: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export const AREE_SERVIZIO: AreaServizio[] = [
  {
    id: '1',
    nome: 'Cantagallo',
    brand: 'Autogrill',
    autostrada: 'A1',
    direzione: 'Milano → Bologna',
    stelle: '⭐⭐⭐⭐',
    valutazione: 4.2,
    coordinate: {
      latitude: 44.023,
      longitude: 11.124,
    },
  },
  {
    id: '2',
    nome: 'Secchia Ovest',
    brand: 'Chef Express',
    autostrada: 'A1',
    direzione: 'Bologna → Milano',
    stelle: '⭐⭐⭐',
    valutazione: 3.8,
    coordinate: {
      latitude: 44.679,
      longitude: 10.639,
    },
  },
  {
    id: '3',
    nome: 'Villoresi Ovest',
    brand: 'Autogrill',
    autostrada: 'A8',
    direzione: 'Milano → Varese',
    stelle: '⭐⭐⭐⭐',
    valutazione: 4.5,
    coordinate: {
      latitude: 45.570,
      longitude: 9.025,
    },
  },
];
