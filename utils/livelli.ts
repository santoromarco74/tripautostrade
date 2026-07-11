export interface Livello {
  titolo: string;
  emoji: string;
}

export function calcolaTitolo(points: number): Livello {
  if (points >= 100) return { titolo: "Leggenda dell'Asfalto",      emoji: '🏆' };
  if (points >= 50)  return { titolo: 'Veterano delle Aree di Sosta', emoji: '🥇' };
  if (points >= 20)  return { titolo: 'Esploratore Autostradale',    emoji: '🧭' };
  return               { titolo: 'Novellino del Casello',            emoji: '🚗' };
}
