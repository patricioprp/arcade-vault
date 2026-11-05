export type SkinId = "neon" | "retro" | "clasico";

export const SKIN_IDS: readonly SkinId[] = ["neon", "retro", "clasico"];

export const SKIN_LABELS: Record<SkinId, string> = {
  neon: "NEÓN",
  retro: "RETRO",
  clasico: "CLÁSICO",
};

export const DEFAULT_SKIN: SkinId = "neon";

// Valida lo leído de localStorage.
export function isSkinId(value: unknown): value is SkinId {
  return (
    typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value)
  );
}
