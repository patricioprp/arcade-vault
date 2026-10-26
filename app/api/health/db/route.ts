import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type HealthResponse = { ok: true; now: string } | { ok: false };

export async function GET(): Promise<Response> {
  // Con Cache Components un GET se prerenderiza si no toca datos de runtime.
  // connection() lo fuerza a request time incluso si createClient falla antes de cookies().
  await connection();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("health");
    if (error) throw error;

    return Response.json({ ok: true, now: data } satisfies HealthResponse);
  } catch (err) {
    console.error("[health/db] Supabase no responde:", err);
    return Response.json({ ok: false } satisfies HealthResponse, {
      status: 503,
    });
  }
}
