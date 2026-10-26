"use client";

import { useEffect, useRef, useState } from "react";
import {
  AsteroidsGame,
  WORLD_H,
  WORLD_W,
  type AsteroidsStats,
} from "@/lib/asteroids/engine";
import { drawAsteroids } from "@/lib/asteroids/render";
import type { PlayableGameProps, PlayableGameStats } from "./registry";

const GAME_OVER_DELAY = 1000; // ms para que se vea la explosión de la nave antes del modal
const CAPTURED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);

type Keys = { left: boolean; right: boolean; thrust: boolean };
const NO_KEYS: Keys = { left: false, right: false, thrust: false };

const CONTROLS = [
  { keys: "← →", action: "Rotar" },
  { keys: "↑", action: "Propulsar" },
  { keys: "ESPACIO", action: "Disparar" },
  { keys: "P", action: "Pausa" },
];

function toHud(s: AsteroidsStats): PlayableGameStats {
  return {
    score: s.score,
    lives: s.lives,
    level: s.level,
    extra:
      s.tripleShot > 0
        ? { label: "Disparo 3x", value: `${s.tripleShot.toFixed(1)}s` }
        : undefined,
  };
}

export function AsteroidsCanvas({
  paused,
  onStats,
  onGameOver,
}: PlayableGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AsteroidsGame | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const keysRef = useRef<Keys>({ ...NO_KEYS });
  const fireRef = useRef(false);
  const [started, setStarted] = useState(false);

  // Callbacks del reproductor siempre actualizados, sin reiniciar el juego cuando cambian.
  const onStatsRef = useRef(onStats);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onStatsRef.current = onStats;
    onGameOverRef.current = onGameOver;
  });

  // Montaje: canvas con devicePixelRatio, partida nueva y primer frame detrás del overlay de inicio.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WORLD_W * dpr;
    canvas.height = WORLD_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let gameOverTimer: ReturnType<typeof setTimeout> | undefined;
    const game = new AsteroidsGame((stats) => {
      onStatsRef.current(toHud(stats));
      if (stats.status === "gameover" && gameOverTimer === undefined) {
        gameOverTimer = setTimeout(
          () => onGameOverRef.current(stats.score),
          GAME_OVER_DELAY,
        );
      }
    });
    gameRef.current = game;
    ctxRef.current = ctx;
    drawAsteroids(ctx, game, performance.now());

    return () => {
      clearTimeout(gameOverTimer);
      gameRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  // Loop: solo corre con la partida iniciada y sin pausa. Cada arranque reinicia el timestamp.
  useEffect(() => {
    if (!started || paused) return;
    let raf = 0;
    let last: number | null = null;

    const frame = (ts: number) => {
      const game = gameRef.current;
      const ctx = ctxRef.current;
      if (!game || !ctx) return;
      const dt = last === null ? 0 : Math.min((ts - last) / 1000, 0.05);
      last = ts;
      game.update(dt, { ...keysRef.current, fire: fireRef.current });
      fireRef.current = false;
      drawAsteroids(ctx, game, ts);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [started, paused]);

  // Teclado. Con pausa o modal abierto no captura nada, para no bloquear el input del modal.
  useEffect(() => {
    if (paused) return;
    const clearKeys = () => {
      keysRef.current = { ...NO_KEYS };
      fireRef.current = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!CAPTURED_KEYS.has(e.code)) return;
      e.preventDefault();
      if (!started) {
        if (e.code === "Space") setStarted(true);
        return;
      }
      if (e.code === "ArrowLeft") keysRef.current.left = true;
      if (e.code === "ArrowRight") keysRef.current.right = true;
      if (e.code === "ArrowUp") keysRef.current.thrust = true;
      if (e.code === "Space" && !e.repeat) fireRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!CAPTURED_KEYS.has(e.code)) return;
      e.preventDefault(); // evita que Espacio active el botón con foco al soltarlo
      if (e.code === "ArrowLeft") keysRef.current.left = false;
      if (e.code === "ArrowRight") keysRef.current.right = false;
      if (e.code === "ArrowUp") keysRef.current.thrust = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      clearKeys();
    };
  }, [paused, started]);

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        className="block h-full w-full"
        aria-label="ROCAS: nave y asteroides"
      />
      {!started && (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="crt-content z-[4] cursor-pointer flex-col gap-6 bg-black/55"
        >
          <span className="pixel neon-cyan text-[clamp(18px,4vw,30px)]">
            ROCAS
          </span>
          <span className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2 text-left">
            {CONTROLS.map((c) => (
              <span key={c.action} className="contents">
                <span className="pixel text-right text-[10px] text-yellow">
                  {c.keys}
                </span>
                <span className="mono text-[11px] tracking-[0.12em] text-ink-dim">
                  {c.action}
                </span>
              </span>
            ))}
          </span>
          <span className="pixel text-[11px] text-ink animate-[blink_1.2s_steps(1,end)_infinite] motion-reduce:animate-none">
            PULSA ESPACIO PARA EMPEZAR
          </span>
        </button>
      )}
    </div>
  );
}
