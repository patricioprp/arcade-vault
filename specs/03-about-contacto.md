# SPEC 03 — Acerca de y formulario de Contacto con Resend

> **Estado:** aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-22
> **Objetivo:** Portar la pantalla de `references/templates/home-about/about.jsx` a `/about` y hacer que su formulario de Contacto envíe un correo real al equipo con Resend.

## Por qué existe esta spec

La SPEC 02 dejó fuera la pantalla Acerca de y su link en el nav.
El template simula el envío: valida campos vacíos y muestra una terminal de éxito sin salir del navegador.
Esta spec agrega el primer código de servidor del proyecto (una Server Action) y la primera dependencia externa con secreto (`RESEND_API_KEY`).
Por eso define también el estado de error, que el template no tiene.

## Alcance

**Entra:**

- Pantalla **Acerca de** en `/about` portada de `about.jsx`, con estas partes en orden:
  - Hero: kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT", párrafo de misión y 3 highlights con íconos pixel (`HighlightIcon`: HEART, BROWSER, PLANT).
  - Divisor decorativo `.about-divider` con 24 píxeles parpadeantes.
  - Sección Contacto: kicker "▸ CONTACTO", título "CONTÁCTANOS", subtítulo, 3 tips con LED y formulario NOMBRE / CORREO ELECTRÓNICO / MENSAJE con botón "▶  ENVIAR MENSAJE".
- Textos, placeholders, colores y delays (`i * 80` ms) literales del template.
- Animación `.reveal` en el divisor y la sección Contacto, reutilizando `components/reveal-root.tsx` de la SPEC 02.
- Validación en cliente igual al template: si algún campo está vacío tras `trim`, el formulario hace `shake` y no se envía.
- Server Action `sendContact` que valida en servidor y envía un correo en texto plano al equipo con el SDK `resend`.
- Estado de envío pendiente: botón deshabilitado con texto "▶  ENVIANDO…".
- Estado de éxito: terminal VAULT-OS del template con "GRACIAS, <NOMBRE>." y botón "ENVIAR OTRO MENSAJE" que limpia el formulario.
- Estado de error: la misma terminal con borde rojo y líneas `[ERR]`, más un botón "REINTENTAR" que vuelve al formulario con los datos conservados.
- Honeypot anti-spam: campo oculto `website`; si llega con valor, la action responde éxito sin enviar.
- Link **Acerca de** (`/about`) en el nav desktop y en el panel móvil, después de "Salón de la Fama", con estado activo en `/about`.
- Variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` documentadas en `.env.example`.
- Port a `app/globals.css` solo del bloque `/* ===== ABOUT PAGE ===== */` de `home-about/styles.css` más las reglas nuevas del estado de error.

**Fuera de alcance (para specs futuras):**

- Correo de confirmación al jugador.
- Verificación de dominio propio en Resend (el código ya lo soporta cambiando `CONTACT_FROM_EMAIL`).
- Rate limiting, CAPTCHA o Turnstile.
- Plantilla HTML o React Email para el correo.
- Guardar los mensajes en una base de datos o mostrarlos en un panel.
- Reproductor tipo gabinete (`.gp-*`) de `home-about/styles.css`.
- Cambios en otras pantallas más allá del link del nav.
- Tests automatizados.

## Modelo de datos

No hay datos persistidos. Se introducen los tipos del formulario y del resultado de la action:

```ts
// lib/contact.ts — compartido entre cliente y servidor (sin "use server")
export type ContactInput = { name: string; email: string; msg: string };

export type ContactField = "name" | "email" | "msg";

export type ContactState =
  | { status: "idle" }
  | { status: "sent"; name: string }                                   // name ya con trim
  | { status: "error"; reason: "invalid"; field: ContactField; input: ContactInput }
  | { status: "error"; reason: "send"; input: ContactInput };          // Resend falló o falta config

export const CONTACT_LIMITS = { name: 50, msg: 2000 } as const;

export function validateContact(input: ContactInput): ContactField | null; // primer campo inválido o null
```

```ts
// app/about/actions.ts
"use server";
export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState>;
```

Correo enviado (texto plano):

```text
from:    process.env.CONTACT_FROM_EMAIL ?? "Arcade Vault <onboarding@resend.dev>"
to:      process.env.CONTACT_TO_EMAIL
replyTo: <correo del jugador>
subject: "[Arcade Vault] Mensaje de <nombre>"
text:    "Nombre: <nombre>\nCorreo: <correo>\n\n<mensaje>"
```

```bash
# .env.example
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL="Arcade Vault <onboarding@resend.dev>"
```

Convenciones:

- Validación de servidor: `trim` en los tres campos; todos obligatorios; `name` ≤ 50 y `msg` ≤ 2000 caracteres; `email` cumple `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- Nombres de campo del `FormData`: `name`, `email`, `msg`, `website` (honeypot).
- El honeypot no forma parte de `ContactInput`.
- Líneas de la terminal de error:
  - `invalid`: "[OK] Conectando con servidor…", "[ERR] Validando contenido… campo <NOMBRE|CORREO ELECTRÓNICO|MENSAJE> inválido" y "> NO SE PUDO ENVIAR EL MENSAJE. REVISA LOS DATOS."
  - `send`: "[OK] Conectando con servidor…", "[OK] Validando contenido…", "[ERR] Transmitiendo paquete…" y "> NO SE PUDO ENVIAR EL MENSAJE. INTENTA DE NUEVO MÁS TARDE."
- Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, la action hace `console.error` en el servidor y devuelve `reason: "send"`; nunca lanza ni expone el detalle al cliente.

## Plan de implementación

1. Instalar `resend` como dependencia. Crear `.env.example` con las tres variables y agregar `!.env.example` a `.gitignore` (hoy `.env*` lo ignora). Verificar con `git status` que `.env.example` aparece y `.env.local` no.
2. Portar a `app/globals.css` el bloque `/* ===== ABOUT PAGE ===== */` de `home-about/styles.css`: `.about*`, `.highlight*`, `.hl-*`, `.div-bar`, `.div-pixels` + `@keyframes pxblink`, `.contact-*`, `.tip*`, `@keyframes shake`, `.btn.press`, `.terminal-success`, `.term-*`. No duplicar `.divider` ni `@keyframes blink`, que ya existen. Agregar `.terminal-error` (borde y sombra `var(--magenta)` o rojo, `.line.err` en rojo) y una regla de reduced-motion que detenga `pxblink` y `shake`.
3. Crear `lib/contact.ts` con los tipos, `CONTACT_LIMITS` y `validateContact`. Verificar con `npx tsc --noEmit`.
4. Crear `components/about-icons.tsx` con `HighlightIcon` (Server Component, SVG puro, `aria-hidden`), copiado literal de `about.jsx`.
5. Crear `app/about/page.tsx` (Server Component) envuelto en `<RevealRoot className="about fade-in">` con hero, highlights, divisor y la intro de Contacto. Dejar en el lugar del formulario un placeholder. Verificar `/about` en el navegador.
6. Actualizar `components/nav.tsx`: sección `"about"` activa cuando `pathname === "/about"`; link "Acerca de" a `/about` en desktop y panel móvil, después de "Salón de la Fama".
7. Crear `app/about/actions.ts` con `sendContact`: leer `FormData`, salir con `{ status: "sent" }` si `website` tiene valor, validar con `validateContact`, chequear env vars, instanciar `new Resend(process.env.RESEND_API_KEY)` dentro de la función y llamar a `resend.emails.send` con el formato del modelo de datos. Si la respuesta trae `error`, loguear y devolver `reason: "send"`. Consultar `node_modules/next/dist/docs/` sobre Server Actions y `useActionState` antes de escribirlo.
8. Crear `components/contact-form.tsx` (Client) con `useActionState(sendContact, { status: "idle" })`: inputs controlados (para conservar datos en REINTENTAR), honeypot oculto (`tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`, fuera de pantalla con CSS), validación de vacíos con `shake` antes de despachar, botón deshabilitado mientras `isPending`. Renderizar la terminal de éxito o de error según el estado. "ENVIAR OTRO MENSAJE" limpia los campos y "REINTENTAR" restaura `input`; ambos vuelven a mostrar el formulario con un estado local `view: "form" | "result"`. Reemplazar el placeholder del paso 5 por `<ContactForm />`.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `/about` muestra "ACERCA DE ARCADE VAULT", el párrafo de misión y los 3 highlights con sus íconos y colores (magenta, cyan, green).
- [ ] `/about` muestra el divisor con 24 píxeles y la sección "CONTÁCTANOS" con 3 tips y el formulario de 3 campos.
- [ ] El nav muestra "Acerca de" en desktop y en el panel móvil, y queda activo solo en `/about`.
- [ ] Enviar con algún campo vacío o solo espacios hace `shake` y no dispara ninguna request de red.
- [ ] Mientras se envía, el botón muestra "▶  ENVIANDO…" y está deshabilitado.
- [ ] Con env vars válidas, enviar el formulario hace llegar un correo a `CONTACT_TO_EMAIL` con asunto "[Arcade Vault] Mensaje de <nombre>", el mensaje en el cuerpo y `Reply-To` igual al correo ingresado.
- [ ] Tras un envío exitoso aparece la terminal con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE EN MAYÚSCULAS>."
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los tres campos vacíos.
- [ ] Sin `RESEND_API_KEY` en el entorno, enviar muestra la terminal de error con "[ERR] Transmitiendo paquete…" y el servidor loguea el motivo.
- [ ] "REINTENTAR" vuelve al formulario con nombre, correo y mensaje conservados.
- [ ] Un mensaje de 2001 caracteres (forzado sin validación de cliente) devuelve la terminal de error con "campo MENSAJE inválido" y no envía correo.
- [ ] Un correo `jugador@vault` (sin punto en el dominio) devuelve la terminal de error con "campo CORREO ELECTRÓNICO inválido".
- [ ] Rellenar el campo `website` vía DevTools y enviar muestra la terminal de éxito y no llega ningún correo.
- [ ] `RESEND_API_KEY` no aparece en ningún archivo bajo `.next/static`.
- [ ] `.env.example` está versionado y `.env.local` no.
- [ ] Con viewport ≤ 900 px la grilla de Contacto se apila en una columna y con ≤ 820 px los highlights también; no hay scroll horizontal.
- [ ] Con `prefers-reduced-motion: reduce` emulado, el divisor y la sección Contacto son visibles sin animar.
- [ ] No hay errores ni warnings de hidratación en la consola en `/about`.

## Decisiones

- **Sí:** ruta `/about`. Elegida por el usuario.
- **No:** `/acerca-de`. Seguiría la convención en español de las otras rutas, pero el usuario prefirió `/about`.
- **Sí:** Server Action (`app/about/actions.ts`) + `useActionState`. La API key queda en el servidor y no se expone un endpoint público extra.
- **No:** Route Handler `app/api/contacto/route.ts`. Más código y ningún otro cliente lo necesita.
- **Sí:** SDK oficial `resend`. Es lo pedido y maneja auth y errores tipados.
- **Sí:** correo en texto plano con `replyTo` del jugador. Cero dependencias extra y sin riesgo de inyección HTML; el equipo responde con "Responder".
- **No:** React Email o HTML a mano. Agrega dependencia o escapado de input sin beneficio para un correo interno.
- **Sí:** remitente y destino por env vars, con `onboarding@resend.dev` como default de `CONTACT_FROM_EMAIL`. Funciona en sandbox hoy y pasar a dominio propio es cambiar una variable.
- **No:** correo de confirmación al jugador. En sandbox Resend solo entrega al correo de la cuenta; va en otra spec junto con el dominio verificado.
- **Sí:** terminal de error con líneas `[ERR]` y REINTENTAR. Mantiene la estética del template y no pierde lo escrito.
- **No:** mensaje inline o solo shake. El shake ya significa "campo vacío" en el template.
- **Sí:** validación manual con límites en servidor y validación de vacíos en cliente. Sin agregar zod para tres campos.
- **No:** zod. Dependencia nueva para una validación trivial.
- **Sí:** honeypot `website` que responde éxito falso. Frena bots simples sin dependencias y sin darles señal.
- **No:** rate limit en memoria. No es confiable en serverless; si hace falta, va con un store real en otra spec.
- **Sí:** `new Resend(...)` dentro de la action. Evita que el build falle o que se lea la key al importar el módulo cuando falta la variable.
- **Sí:** reutilizar `RevealRoot` de la SPEC 02. Mismo comportamiento sin JS y con reduced-motion.
- **No:** port 1:1 del `useEffect` con `document.querySelectorAll` de `about.jsx`. Ya se descartó en la SPEC 02.
- **Sí:** página como Server Component con un único Client Component (`ContactForm`). Minimiza el JS enviado.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La API de Server Actions o `useActionState` difiere en Next 16.4 / React 19.3 | Consultar `node_modules/next/dist/docs/` antes del paso 7 y seguir la forma documentada. |
| En sandbox, Resend rechaza `to` distinto al correo de la cuenta | `CONTACT_TO_EMAIL` debe ser el correo de la cuenta Resend hasta verificar dominio; queda anotado en `.env.example`. |
| `.env*` en `.gitignore` oculta `.env.example` | Paso 1 agrega `!.env.example` y lo verifica con `git status`. |
| Filtrar la API key al bundle del cliente | Solo se lee `process.env.RESEND_API_KEY` en `actions.ts` con `"use server"`; criterio de aceptación revisa `.next/static`. |
| Abuso del formulario para enviar spam al equipo | Honeypot y límites de longitud; el `replyTo` nunca se usa como destinatario. |
| `cacheComponents` exige `<Suspense>` si la página lee datos dinámicos | La página no lee `searchParams` ni datos dinámicos; si el build lo pide, envolver `<ContactForm />` en `<Suspense>`. |
| Los inputs controlados y el `FormData` de la action se desincronizan | Los inputs llevan `name` y el `FormData` sale del propio `<form>`; el estado local solo sirve para conservar y restaurar valores. |

## Lo que **no** entra en esta spec

- Correo de confirmación al jugador.
- Dominio propio verificado en Resend.
- Rate limiting, CAPTCHA o Turnstile.
- Plantilla HTML o React Email.
- Persistencia o panel de mensajes.
- Reproductor tipo gabinete (`.gp-*`).
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.
