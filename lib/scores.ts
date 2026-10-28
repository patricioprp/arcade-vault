export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

const SCORE_DATE = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Fecha de una marca en formato dd/mm/aaaa (zona horaria fija: mismo resultado en servidor y navegador).
export function formatScoreDate(iso: string): string {
  return SCORE_DATE.format(new Date(iso));
}
