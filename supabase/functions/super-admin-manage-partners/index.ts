// Super-admin only — create/list/delete Partner sub-accounts and (un)assign stores
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Claims { sub?: string }

async function getClaims(token: string, url: string): Promise<Claims | null> {
  // Use Supabase JWT endpoint to validate (basic claim parse)
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.sub) return null;
    // Verify with auth endpoint to ensure not revoked
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" },
    });
    if (!res.ok) return null;
    const u = await res.json();
    return { sub: u?.id };
  } catch { return null; }
}

async function sb(path: string, init: RequestInit = {}) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const token = auth.replace("Bearer ", "");
    const claims = await getClaims(token, url);
    if (!claims?.sub) return json({ error: "Unauthorized" }, 401);

    // Verify super_admin
    const r = await sb(
      `/rest/v1/user_roles?user_id=eq.${claims.sub}&role=eq.super_admin&select=role&limit=1`,
    );
    if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || "list";

    if (action === "list") {
      // partners
      const rolesRes = await sb(
        `/rest/v1/user_roles?role=eq.partner&select=user_id,created_at`,
      );
      if (!rolesRes.ok) return json({ error: "Failed to load partners" }, 500);
      const partners = rolesRes.data as Array<{ user_id: string; created_at: string }>;
      const ids = partners.map((p) => p.user_id);

      // emails via admin listUsers
      const emailMap = new Map<string, string>();
      if (ids.length) {
        let page = 1;
        while (emailMap.size < ids.length) {
          const lr = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=1000`, {
            headers: {
              apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
            },
          });
          if (!lr.ok) break;
          const data = await lr.json();
          const users = data?.users || [];
          if (!users.length) break;
          for (const u of users) {
            if (ids.includes(u.id)) emailMap.set(u.id, u.email || "(sem email)");
          }
          if (users.length < 1000) break;
          page++;
          if (page > 20) break;
        }
      }

      // assigned stores per partner
      const storeRes = await sb(
        `/rest/v1/stores?partner_id=in.(${ids.length ? ids.join(",") : "00000000-0000-0000-0000-000000000000"})&select=id,name,slug,partner_id,plan_type,status`,
      );
      const stores = (storeRes.ok ? storeRes.data : []) as Array<{ id: string; name: string; slug: string | null; partner_id: string; plan_type: string; status: string }>;

      // revenue: sum vip_subscriptions price_cents (active, not expired) per partner's stores
      const revenueMap = new Map<string, number>();
      const storeToPartner = new Map<string, string>();
      for (const s of stores) storeToPartner.set(s.id, s.partner_id);
      if (stores.length) {
        const storeIds = stores.map((s) => s.id);
        const subsRes = await sb(
          `/rest/v1/vip_subscriptions?store_id=in.(${storeIds.join(",")})&status=eq.active&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=store_id,price_cents`,
        );
        if (subsRes.ok) {
          for (const sub of subsRes.data as Array<{ store_id: string; price_cents: number }>) {
            const pid = storeToPartner.get(sub.store_id);
            if (pid) revenueMap.set(pid, (revenueMap.get(pid) || 0) + (sub.price_cents || 0));
          }
        }
      }

      const result = partners.map((p) => ({
        user_id: p.user_id,
        email: emailMap.get(p.user_id) || "(desconhecido)",
        created_at: p.created_at,
        store_count: stores.filter((s) => s.partner_id === p.user_id).length,
        stores: stores.filter((s) => s.partner_id === p.user_id).map((s) => ({
          id: s.id, name: s.name, slug: s.slug, plan_type: s.plan_type, status: s.status,
        })),
        revenue_cents: revenueMap.get(p.user_id) || 0,
      }));

      return json({ partners: result });
    }

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Email inválido" }, 400);
      if (password.length < 8) return json({ error: "Senha deve ter ao menos 8 caracteres" }, 400);

      const promote = body.promote_if_exists !== false; // default true
      const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const createRes = await fetch(`${url}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: SRK,
          Authorization: `Bearer ${SRK}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      const createData = await createRes.json();
      let newUserId: string | undefined = createData?.id;
      let promoted = false;

      if (!createRes.ok) {
        const msg = String(createData?.msg || createData?.message || createData?.error || "").toLowerCase();
        const alreadyExists = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
        if (!alreadyExists || !promote) {
          return json({ error: createData?.msg || createData?.message || "Falha ao criar usuário", code: alreadyExists ? "email_exists" : undefined }, 400);
        }
        // Find existing user by email
        const lookup = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
          headers: { apikey: SRK, Authorization: `Bearer ${SRK}` },
        });
        const lookupData = await lookup.json().catch(() => ({}));
        const found = (lookupData?.users || []).find((u: any) => (u.email || "").toLowerCase() === email);
        if (!found?.id) return json({ error: "Email já cadastrado mas usuário não encontrado" }, 400);
        newUserId = found.id;
        promoted = true;
      }

      if (!newUserId) return json({ error: "Sem user id" }, 500);

      // Check if already has partner role
      const existing = await sb(`/rest/v1/user_roles?user_id=eq.${newUserId}&role=eq.partner&select=role&limit=1`);
      if (existing.ok && Array.isArray(existing.data) && existing.data.length > 0) {
        return json({ success: true, user_id: newUserId, email, promoted: true, already_partner: true });
      }

      const insRes = await sb(`/rest/v1/user_roles`, {
        method: "POST",
        body: JSON.stringify({ user_id: newUserId, role: "partner" }),
      });
      if (!insRes.ok) return json({ error: "Usuário encontrado mas role não atribuída" }, 500);

      return json({ success: true, user_id: newUserId, email, promoted });
    }

    if (action === "delete") {
      const userId = String(body.user_id || "");
      if (!userId) return json({ error: "user_id required" }, 400);
      // Unassign stores
      await sb(`/rest/v1/stores?partner_id=eq.${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ partner_id: null }),
      });
      // Remove role
      await sb(`/rest/v1/user_roles?user_id=eq.${userId}&role=eq.partner`, { method: "DELETE" });
      // Delete auth user
      await fetch(`${url}/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        },
      });
      return json({ success: true });
    }

    if (action === "assign" || action === "unassign") {
      const storeId = String(body.store_id || "");
      const partnerId = action === "assign" ? String(body.partner_id || "") : null;
      if (!storeId) return json({ error: "store_id required" }, 400);
      if (action === "assign" && !partnerId) return json({ error: "partner_id required" }, 400);
      const patch = await sb(`/rest/v1/stores?id=eq.${storeId}`, {
        method: "PATCH",
        body: JSON.stringify({ partner_id: partnerId }),
      });
      if (!patch.ok) return json({ error: "Falha ao atualizar loja" }, 500);
      return json({ success: true });
    }

    if (action === "available_stores") {
      // stores without partner
      const res = await sb(
        `/rest/v1/stores?partner_id=is.null&select=id,name,slug,plan_type,status&order=created_at.desc`,
      );
      if (!res.ok) return json({ error: "Falha ao listar lojas" }, 500);
      return json({ stores: res.data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
