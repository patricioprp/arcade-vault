"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/lib/user-store";

type Section = "biblioteca" | "salon" | "about" | "login";

function sectionOf(pathname: string): Section | null {
  if (pathname === "/juegos" || pathname.startsWith("/juegos/")) return "biblioteca";
  if (pathname.startsWith("/salon-de-la-fama")) return "salon";
  if (pathname === "/about") return "about";
  if (pathname.startsWith("/login")) return "login";
  return null;
}

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [open, setOpen] = useState(false);
  const section = sectionOf(pathname);
  const cls = (s: Section) => (section === s ? "active" : "");
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/juegos" className={cls("biblioteca")}>
            Biblioteca
          </Link>
          <Link href="/salon-de-la-fama" className={cls("salon")}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={cls("about")}>
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={logout}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/login" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
          aria-expanded={open}
          aria-controls="av-mobile-panel"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      ></div>
      <aside
        id="av-mobile-panel"
        className={"av-mobile-panel" + (open ? " open" : "")}
        inert={!open}
      >
        <div className="pixel neon-cyan mb-4 text-[11px]">MENÚ</div>
        <Link href="/juegos" className={cls("biblioteca")} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon-de-la-fama" className={cls("salon")} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/about" className={cls("about")} onClick={close}>
          Acerca de
        </Link>
        <Link href="/login" className={cls("login")} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div className="flex-1"></div>
        <div className="pixel text-[9px] tracking-[0.16em] text-ink-faint">
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
