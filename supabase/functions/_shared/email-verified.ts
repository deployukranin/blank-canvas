// Shared guard: blocks sensitive actions until the account email is verified.
// Verification state lives in public.profiles.email_verified_at.

export async function isEmailVerified(userId: string): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const res = await fetch(
      `${url}/rest/v1/profiles?select=email_verified_at&user_id=eq.${userId}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    );
    if (!res.ok) return false;
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) && !!rows[0]?.email_verified_at;
  } catch {
    return false;
  }
}

/**
 * Returns a 403 Response when the user has not verified their email yet,
 * or null when the action may proceed.
 */
export async function emailUnverifiedResponse(
  userId: string,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  if (await isEmailVerified(userId)) return null;
  return new Response(
    JSON.stringify({
      error: "email_not_verified",
      message: "Verifique seu email para liberar esta ação.",
    }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
