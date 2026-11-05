"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_SKIN, isSkinId, type SkinId } from "@/lib/skins";

const KEY = "av_skin";
const listeners = new Set<() => void>();

// Respaldo en memoria por si localStorage está bloqueado: el selector sigue
// funcionando durante la sesión.
let memorySkin: SkinId = DEFAULT_SKIN;

function getSnapshot(): SkinId {
  try {
    const raw = localStorage.getItem(KEY);
    return isSkinId(raw) ? raw : memorySkin;
  } catch {
    return memorySkin;
  }
}

function getServerSnapshot(): SkinId {
  return DEFAULT_SKIN;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Sincroniza entre pestañas.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setSkin(skin: SkinId) {
  memorySkin = skin;
  try {
    localStorage.setItem(KEY, skin);
  } catch {}
  listeners.forEach((l) => l());
}

export function useSkin() {
  const skin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { skin, setSkin };
}
