"use client";

import { useEffect, useRef, useState } from "react";
import {
  SnakeGame,
  WORLD_H,
  WORLD_W,
  type Direction,
  type SnakeStats,
} from "@/lib/snake/engine";
import { drawSnake } from "@/lib/snake/render";
import type { PlayableGameProps, PlayableGameStats } from "./registry";

const GAME_OVER_DELAY = 1000; // ms para que se vea la serpiente apagarse o la pared de victoria antes del modal

const FRUITS_SRC = "/games/serpentina/fruits.png";

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};

const CONTROLS = [
  { keys: "← ↑ → ↓ WASD", action: "Mover" },
  { keys: "ESPACIO", action: "Seguir tras un choque" },
  { keys: "P", action: "Pausa" },
];

function toHud(s: SnakeStats): PlayableGameStats {
  return {
    score: s.score,
    lives: s.lives,
    level: s.level,
    extra: { label: "Largo", value: String(s.length) },
  };
}

export function SnakeCanvas({
  paused,
  onStats,
  onGameOver,
}: PlayableGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SnakeGame | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const turnsRef = useRef<Direction[]>([]);
  const goRef = useRef(false);
  const [started, setStarted] = useState(false);

  // Callbacks del reproductor siempre actualizados, sin reiniciar el juego cuando cambian.
  const onStatsRef = useRef(onStats);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onStatsRef.current = onStats;
    onGameOverRef.current = onGameOver;
  });

  // Montaje: canvas con devicePixelRatio, sprites de frutas, partida nueva y primer frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WORLD_W * dpr;
    canvas.height = WORLD_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let gameOverTimer: ReturnType<typeof setTimeout> | undefined;
    const game = new SnakeGame((stats) => {
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
    drawSnake(ctx, game, null, performance.now());

    // El juego no espera a la imagen: hasta el onload la fruta es un núcleo neón.
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Redibuja el frame detrás del overlay de inicio con la fruta real.
      if (gameRef.current === game)
        drawSnake(ctx, game, img, performance.now());
    };
    img.src = FRUITS_SRC;

    return () => {
      // Con Cache Components la ruta queda oculta con su estado: al volver se vuelve a la pantalla de inicio.
      setStarted(false);
      clearTimeout(gameOverTimer);
      img.onload = null;
      imgRef.current = null;
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
      const input = { turns: turnsRef.current, go: goRef.current };
      turnsRef.current = [];
      goRef.current = false;
      game.update(dt, input);
      drawSnake(ctx, game, imgRef.current, ts);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [started, paused]);

  // Teclado. Con pausa o modal abierto no captura nada, para no bloquear el input del modal.
  useEffect(() => {
    if (paused) return;
    const clearInput = () => {
      turnsRef.current = [];
      goRef.current = false;
    };

    const captured = (code: string) =>
      code === "Space" || code in KEY_DIRECTIONS;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!captured(e.code)) return;
      e.preventDefault();
      if (!started) {
        // El Espacio que inicia la partida no se encola: la serpiente ya arranca en marcha.
        if (e.code === "Space" && !e.repeat) setStarted(true);
        return;
      }
      if (e.code === "Space") {
        if (!e.repeat) goRef.current = true;
        return;
      }
      // Las repeticiones también se encolan: el motor descarta las direcciones repetidas.
      turnsRef.current.push(KEY_DIRECTIONS[e.code]);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!captured(e.code)) return;
      e.preventDefault(); // evita que Espacio active el botón con foco al soltarlo
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearInput);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearInput);
      clearInput();
    };
  }, [paused, started]);

  const start = () => {
    // Quita el foco del botón para que el Espacio no lo vuelva a activar.
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    setStarted(true);
  };

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        className="block h-full w-full"
        aria-label="SERPENTINA: serpiente de neón en una grilla buscando frutas"
      />
      {!started && (
        <button
          type="button"
          onClick={start}
          className="crt-content z-[4] cursor-pointer flex-col gap-6 bg-black/55"
        >
          <span className="pixel neon-green text-[clamp(18px,4vw,30px)]">
            SERPENTINA
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
