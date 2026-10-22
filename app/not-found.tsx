import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in mx-auto flex max-w-[720px] flex-col items-center gap-6 px-4 py-24 text-center">
      <div className="pixel neon-magenta flicker text-[clamp(48px,10vw,96px)]">404</div>
      <div className="pixel neon-cyan text-[clamp(12px,2vw,16px)] tracking-[0.16em]">
        GAME OVER · PANTALLA NO ENCONTRADA
      </div>
      <p className="m-0 max-w-[48ch] text-ink-dim">
        Esta dirección no existe en el vault. Revisa la URL o vuelve a la
        biblioteca para elegir otro juego.
      </p>
      <Link href="/juegos" className="btn lg mt-2">
        VOLVER AL VAULT
      </Link>
    </div>
  );
}
