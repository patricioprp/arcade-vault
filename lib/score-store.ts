export type SavedScore = { game: string; score: number; name: string; at: number };

const KEY = "av_scores";

export function saveScore(entry: Omit<SavedScore, "at">): void {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "[]") as SavedScore[];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}
