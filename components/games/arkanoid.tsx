"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArkanoidGame,
  WORLD_H,
  WORLD_W,
  type ArkanoidEvent,
  type ArkanoidStats,
} from "@/lib/arkanoid/engine";
import { drawArkanoid } from "@/lib/arkanoid/render";
import type { PlayableGameProps, PlayableGameStats } from "./registry";

const GAME_OVER_DELAY = 1000; // ms para que se vean las chispas o el borde de victoria antes del modal

const SOUNDS: Record<ArkanoidEvent, string> = {
  bounce: "/games/bloque-buster/ball-bounce.mp3",
  break: "/games/bloque-buster/break-sound.mp3",
};

const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight", "Space"]);

const CONTROLS = [
  { keys: "MOUSE ← →", action: "Mover" },
  { keys: "ESPACIO CLICK", action: "Lanzar" },
  { keys: "P", action: "Pausa" },
];

function toHud(s: ArkanoidStats): PlayableGameStats {
  return {
    score: s.score,
    lives: s.lives,
    level: s.level,
    extra: { label: "Bloques", value: String(s.blocksLeft) },
  };
}

export function ArkanoidCanvas({
  paused,
  onStats,
  onGameOver,
}: PlayableGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ArkanoidGame | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const pointerXRef = useRef<number | null>(null);
  const launchRef = useRef(false);
  const [started, setStarted] = useState(false);

  // Callbacks del reproductor siempre actualizados, sin reiniciar el juego cuando cambian.
  const onStatsRef = useRef(onStats);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onStatsRef.current = onStats;
    onGameOverRef.current = onGameOver;
  });

  // Montaje: canvas con devicePixelRatio, sonidos precargados, partida nueva y primer frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WORLD_W * dpr;
    canvas.height = WORLD_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sounds = {
      bounce: new Audio(SOUNDS.bounce),
      break: new Audio(SOUNDS.break),
    };
    sounds.bounce.preload = "auto";
    sounds.break.preload = "auto";
    // cloneNode permite que dos sonidos se solapen; si el navegador rechaza play(), el juego sigue mudo.
    const play = (event: ArkanoidEvent) => {
      const clip = sounds[event].cloneNode() as HTMLAudioElement;
      clip.play().catch(() => {});
    };

    let gameOverTimer: ReturnType<typeof setTimeout> | undefined;
    const game = new ArkanoidGame((stats) => {
      onStatsRef.current(toHud(stats));
      if (stats.status === "gameover" && gameOverTimer === undefined) {
        gameOverTimer = setTimeout(
          () => onGameOverRef.current(stats.score),
          GAME_OVER_DELAY,
        );
      }
    }, play);
    gameRef.current = game;
    ctxRef.current = ctx;
    drawArkanoid(ctx, game, performance.now());

    return () => {
      // Con Cache Components la ruta queda oculta con su estado: al volver se vuelve a la pantalla de inicio.
      setStarted(false);
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
      const input = {
        ...keysRef.current,
        pointerX: pointerXRef.current,
        launch: launchRef.current,
      };
      pointerXRef.current = null;
      launchRef.current = false;
      game.update(dt, input);
      drawArkanoid(ctx, game, ts);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [started, paused]);

  // Teclado. Con pausa o modal abierto no captura nada, para no bloquear el input del modal.
  useEffect(() => {
    if (paused) return;
    const clearInput = () => {
      keysRef.current = { left: false, right: false };
      pointerXRef.current = null;
      launchRef.current = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!CAPTURED_KEYS.has(e.code)) return;
      e.preventDefault();
      if (!started) {
        // El Espacio que inicia la partida no lanza la pelota.
        if (e.code === "Space" && !e.repeat) setStarted(true);
        return;
      }
      if (e.code === "ArrowLeft") keysRef.current.left = true;
      else if (e.code === "ArrowRight") keysRef.current.right = true;
      else if (!e.repeat) launchRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!CAPTURED_KEYS.has(e.code)) return;
      e.preventDefault(); // evita que Espacio active el botón con foco al soltarlo
      if (e.code === "ArrowLeft") keysRef.current.left = false;
      else if (e.code === "ArrowRight") keysRef.current.right = false;
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

  // Puntero: x reescalada al mundo lógico, para que funcione con el CRT a cualquier tamaño.
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused || !started) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerXRef.current = ((e.clientX - rect.left) * WORLD_W) / rect.width;
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused || !started || e.button !== 0) return;
    launchRef.current = true;
  };

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
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        className="block h-full w-full"
        aria-label="BLOQUE BUSTER: muro de bloques de neón, paleta y pelota"
      />
      {!started && (
        <button
          type="button"
          onClick={start}
          className="crt-content z-[4] cursor-pointer flex-col gap-6 bg-black/55"
        >
          <span className="pixel neon-cyan text-[clamp(18px,4vw,30px)]">
            BLOQUE BUSTER
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
