"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { sendContact } from "@/app/about/actions";
import type { ContactField, ContactInput, ContactState } from "@/lib/contact";

const EMPTY: ContactInput = { name: "", email: "", msg: "" };
const IDLE: ContactState = { status: "idle" };

const FIELD_LABEL: Record<ContactField, string> = {
  name: "NOMBRE",
  email: "CORREO ELECTRÓNICO",
  msg: "MENSAJE",
};

// Contact form of /about (SPEC 03), ported from about.jsx and wired to the
// sendContact Server Action. Shows the VAULT-OS terminal on success or error.
export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, IDLE);
  const [form, setForm] = useState<ContactInput>(EMPTY);
  const [shake, setShake] = useState(false);
  // Result the user already closed (ENVIAR OTRO / REINTENTAR). A new submission
  // returns a new state object, so the terminal only shows fresh results.
  const [dismissed, setDismissed] = useState<ContactState>(IDLE);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      clearTimeout(shakeTimer.current);
      setShake(true);
      shakeTimer.current = setTimeout(() => setShake(false), 400);
      return;
    }
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  const backToForm = (values: ContactInput) => {
    setDismissed(state);
    setForm(values);
  };

  const showResult = !pending && state.status !== "idle" && state !== dismissed;

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit} noValidate>
      {!showResult ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
          </div>
          {/* Honeypot: hidden from people, filled by naive bots. */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="contact-website">WEBSITE</label>
            <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <button
            className="btn xl press w-full disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "▶  ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div
          className={"terminal-success" + (state.status === "error" ? " terminal-error" : "")}
          role="status"
          aria-live="polite"
        >
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            {state.status === "sent" && (
              <>
                <div className="line dim">[OK] Validando contenido…</div>
                <div className="line dim">[OK] Transmitiendo paquete…</div>
                <div className="line success">
                  &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
                  <span className="caret">_</span>
                </div>
                <div className="mt-[18px]">
                  <button className="btn ghost" type="button" onClick={() => backToForm(EMPTY)}>
                    ENVIAR OTRO MENSAJE
                  </button>
                </div>
              </>
            )}
            {state.status === "error" && (
              <>
                {state.reason === "invalid" ? (
                  <>
                    <div className="line err">[ERR] Validando contenido… campo {FIELD_LABEL[state.field]} inválido</div>
                    <div className="fail">
                      &gt; NO SE PUDO ENVIAR EL MENSAJE. REVISA LOS DATOS.<span className="caret">_</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="line dim">[OK] Validando contenido…</div>
                    <div className="line err">[ERR] Transmitiendo paquete…</div>
                    <div className="fail">
                      &gt; NO SE PUDO ENVIAR EL MENSAJE. INTENTA DE NUEVO MÁS TARDE.<span className="caret">_</span>
                    </div>
                  </>
                )}
                <div className="mt-[18px]">
                  <button className="btn ghost" type="button" onClick={() => backToForm(state.input)}>
                    REINTENTAR
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
