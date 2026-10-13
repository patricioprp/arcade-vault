"use client";

import { useSyncExternalStore } from "react";

export type User = { name: string };

const KEY = "av_user";
const listeners = new Set<() => void>();

// useSyncExternalStore exige un snapshot estable: se cachea por el string crudo.
let cachedRaw: string | null = null;
let cachedUser: User | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): User | null {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

function getServerSnapshot(): User | null {
  return null;
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

function emit() {
  listeners.forEach((l) => l());
}

function login(user: User) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {}
  emit();
}

function logout() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  emit();
}

export function useUser() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { user, login, logout };
}
