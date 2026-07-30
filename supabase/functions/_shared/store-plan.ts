/**
 * Shared store plan guard.
 *
 * A store on an expired trial must not be able to run paid actions
 * (charging customers, VIP subscriptions, connecting a payout account).
 * The rule lives here so every edge function enforces it identically.
 *
 * Uses the Fetch API only — no third-party SDKs.
 */

export interface StorePlanCheck {
  ok: boolean;
  code?: "store_not_found" | "trial_expired" | "store_suspended" | "lookup_failed";
  message?: string;
  plan_type?: string;
  plan_expires_at?: string | null;
}

const TRIAL_EXPIRED_MESSAGE = "O período de teste desta loja expirou. Contrate um plano para continuar.";

/**
 * Returns { ok: true } when the store may perform paid actions.
 * A null/undefined storeId is treated as "not applicable" and passes through,
 * since some legacy flows have no tenant scope.
 */
export async function checkStoreActive(storeId: string | null | undefined): Promise<StorePlanCheck> {
  if (!storeId) return { ok: true };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, code: "lookup_failed", message: "Server misconfigured" };
  }

  let rows: Array<{ plan_type: string | null; plan_expires_at: string | null; status: string | null }> = [];
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=plan_type,plan_expires_at,status`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok) {
      return { ok: false, code: "lookup_failed", message: "Could not verify store plan" };
    }
    rows = await res.json();
  } catch (_err) {
    return { ok: false, code: "lookup_failed", message: "Could not verify store plan" };
  }

  const store = rows?.[0];
  if (!store) {
    return { ok: false, code: "store_not_found", message: "Loja não encontrada" };
  }

  if (store.status === "suspended") {
    return {
      ok: false,
      code: "store_suspended",
      message: "Esta loja está suspensa.",
      plan_type: store.plan_type ?? undefined,
      plan_expires_at: store.plan_expires_at,
    };
  }

  const isTrial = (store.plan_type ?? "trial") === "trial";
  const expired = !!store.plan_expires_at && new Date(store.plan_expires_at).getTime() < Date.now();

  if (isTrial && expired) {
    return {
      ok: false,
      code: "trial_expired",
      message: TRIAL_EXPIRED_MESSAGE,
      plan_type: store.plan_type ?? undefined,
      plan_expires_at: store.plan_expires_at,
    };
  }

  return { ok: true, plan_type: store.plan_type ?? undefined, plan_expires_at: store.plan_expires_at };
}

/**
 * Convenience wrapper: returns a ready-to-send 403 Response when blocked,
 * or null when the store may proceed.
 */
export async function storeBlockedResponse(
  storeId: string | null | undefined,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const check = await checkStoreActive(storeId);
  if (check.ok) return null;

  const status = check.code === "store_not_found" ? 404 : check.code === "lookup_failed" ? 500 : 403;
  return new Response(
    JSON.stringify({ success: false, error: check.code, message: check.message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
