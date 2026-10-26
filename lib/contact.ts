// Contact form types and validation, shared by <ContactForm> and the
// sendContact Server Action (SPEC 03). No "use server": safe to import anywhere.

export type ContactInput = { name: string; email: string; msg: string };

export type ContactField = "name" | "email" | "msg";

export type ContactState =
  | { status: "idle" }
  | { status: "sent"; name: string }
  | { status: "error"; reason: "invalid"; field: ContactField; input: ContactInput }
  | { status: "error"; reason: "send"; input: ContactInput };

export const CONTACT_LIMITS = { name: 50, msg: 2000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns the first invalid field (in form order) or null. Values are trimmed here.
export function validateContact(input: ContactInput): ContactField | null {
  const name = input.name.trim();
  const email = input.email.trim();
  const msg = input.msg.trim();
  if (!name || name.length > CONTACT_LIMITS.name) return "name";
  if (!email || !EMAIL_RE.test(email)) return "email";
  if (!msg || msg.length > CONTACT_LIMITS.msg) return "msg";
  return null;
}
