"use client";

import { useEffect, useRef, useState } from "react";
import {
  TetrisGame,
  WORLD_H,
  WORLD_W,
  type TetrisAction,
  type TetrisStats,
} from "@/lib/tetris/engine";
import { drawTetris } from "@/lib/tetris/render";
import type { PlayableGameProps, PlayableGameStats } from "./registry";

const GAME_OVER_DELAY = 1000; // ms para que se vea el apagado de las filas antes del modal

// Tecla → acción. `repeat` indica si la repetición del SO encola más acciones.
const KEY_ACTIONS: Record<string, { action: TetrisAction; repeat: boolean }> = {
  ArrowLeft: { action: "left", repeat: true },
  ArrowRight: { action: "right", repeat: true },
  ArrowDown: { action: "softDrop", repeat: true },
  ArrowUp: { action: "rotate", repeat: false },
  KeyX: { action: "rotate", repeat: false },
  Space: { action: "hardDrop", repeat: false },
};

const CONTROLS = [
  { keys: "← →", action: "Mover" },
  { keys: "↑ X", action: "Rotar" },
  { keys: "↓", action: "Bajar" },
  { keys: "ESPACIO", action: "Soltar" },
  { keys: "P", action: "Pausa" },
];

function toHud(s: TetrisStats): PlayableGameStats {
  return {
    score: s.score,
    lives: 0,
    level: s.level,
    extra: { label: "Líneas", value: String(s.lines) },
  };
}

export function TetrisCanvas({
  paused,
  onStats,
  onGameOver,
}: PlayableGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fontProbeRef = useRef<HTMLSpanElement>(null);
  const gameRef = useRef<TetrisGame | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fontRef = useRef("monospace");
  const actionsRef = useRef<TetrisAction[]>([]);
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
    const game = new TetrisGame((stats) => {
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

    // El rótulo SIGUIENTE usa la fuente pixel de la plataforma: se dibuja cuando está cargada.
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive || !fontProbeRef.current) return;
      fontRef.current = getComputedStyle(fontProbeRef.current).fontFamily;
      if (gameRef.current === game) drawTetris(ctx, game, fontRef.current);
    });
    drawTetris(ctx, game, fontRef.current);

    return () => {
      alive = false;
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
      const actions = actionsRef.current;
      actionsRef.current = [];
      game.update(dt, { actions });
      drawTetris(ctx, game, fontRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [started, paused]);

  // Teclado. Con pausa o modal abierto no captura nada, para no bloquear el input del modal.
  useEffect(() => {
    if (paused) return;
    const clearActions = () => {
      actionsRef.current = [];
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mapped = KEY_ACTIONS[e.code];
      if (!mapped) return;
      e.preventDefault();
      if (!started) {
        // El Espacio que inicia la partida no encola hardDrop.
        if (e.code === "Space" && !e.repeat) setStarted(true);
        return;
      }
      if (e.repeat && !mapped.repeat) return;
      actionsRef.current.push(mapped.action);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (KEY_ACTIONS[e.code]) e.preventDefault(); // evita que Espacio active el botón con foco al soltarlo
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearActions);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearActions);
      clearActions();
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
        aria-label="CAÍDA: tablero de piezas que caen y panel con la siguiente pieza"
      />
      <span ref={fontProbeRef} className="pixel hidden" aria-hidden="true" />
      {!started && (
        <button
          type="button"
          onClick={start}
          className="crt-content z-[4] cursor-pointer flex-col gap-6 bg-black/55"
        >
          <span className="pixel neon-cyan text-[clamp(18px,4vw,30px)]">
            CAÍDA
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
