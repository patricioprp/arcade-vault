"use server";

import { Resend } from "resend";
import { validateContact, type ContactInput, type ContactState } from "@/lib/contact";

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";

const field = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

// Sends the /about contact form to the team via Resend (SPEC 03).
// Never throws: every failure comes back as an error state for the terminal UI.
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const input: ContactInput = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    msg: field(formData, "msg"),
  };

  // Honeypot: bots get a fake success and nothing is sent.
  if (field(formData, "website")) return { status: "sent", name: input.name.trim() };

  const invalid = validateContact(input);
  if (invalid) return { status: "error", reason: "invalid", field: invalid, input };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contact] Missing RESEND_API_KEY or CONTACT_TO_EMAIL");
    return { status: "error", reason: "send", input };
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const msg = input.msg.trim();

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name.replace(/\s+/g, " ")}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
    });
    if (error) {
      // Log fields explicitly: the error object serializes as {} in the dev log.
      console.error(`[contact] Resend error: ${error.name} (${error.statusCode}) ${error.message}`);
      return { status: "error", reason: "send", input };
    }
  } catch (err) {
    console.error("[contact] Resend request failed:", err);
    return { status: "error", reason: "send", input };
  }

  return { status: "sent", name };
}
