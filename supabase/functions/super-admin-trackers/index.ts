import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "").slice(0, 24);

const randCode = (n = 6) =>
  Array.from({ length: n }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");

const randToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "super_admin").maybeSingle();
    if (!roleData) return json({ error: "Forbidden: super_admin required" }, 403);

    const { action, ...p } = await req.json();

    switch (action) {
      case "list": {
        const { data: trackers } = await admin
          .from("trackers").select("*").order("created_at", { ascending: false });
        const { data: links } = await admin
          .from("tracker_links").select("*").order("created_at", { ascending: false });
        // attach emails from auth users
        const withEmail = await Promise.all((trackers || []).map(async (t: any) => {
          if (!t.owner_user_id) return { ...t, email: null };
          const { data: u } = await admin.auth.admin.getUserById(t.owner_user_id);
          return { ...t, email: u?.user?.email ?? null };
        }));
        return json({ ok: true, trackers: withEmail, links: links || [] });
      }
      case "create_tracker": {
        const name = String(p.name || "").trim();
        const email = String(p.email || "").trim().toLowerCase();
        const password = String(p.password || "");
        if (name.length < 2) return json({ error: "name required" }, 400);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "valid email required" }, 400);
        if (password.length < 6) return json({ error: "password must be at least 6 chars" }, 400);

        // 1. create auth user (already confirmed so they can log in immediately)
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: name, is_tracker: true },
        });
        if (createErr || !created?.user) {
          const msg = (createErr?.message || "").toLowerCase();
          if (msg.includes("already") || msg.includes("email_exists")) {
            return json({ error: "Este email já está cadastrado. Use outro email." }, 400);
          }
          return json({ error: createErr?.message || "could not create user" }, 400);
        }
        const newUserId = created.user.id;

        // 2. assign tracker role
        const { error: roleErr } = await admin
          .from("user_roles").insert({ user_id: newUserId, role: "tracker" });
        if (roleErr) {
          await admin.auth.admin.deleteUser(newUserId);
          return json({ error: roleErr.message }, 400);
        }

        // 3. create tracker row linked to the user
        const { data, error } = await admin
          .from("trackers")
          .insert({ name, dashboard_token: randToken(), owner_user_id: newUserId })
          .select().single();
        if (error) {
          await admin.auth.admin.deleteUser(newUserId);
          return json({ error: error.message }, 400);
        }
        return json({ ok: true, tracker: { ...data, email } });
      }
      case "update_tracker": {
        if (!p.id) return json({ error: "id required" }, 400);
        const upd: Record<string, unknown> = {};
        if (typeof p.name === "string") upd.name = p.name.trim();
        if (typeof p.is_active === "boolean") upd.is_active = p.is_active;
        const { error } = await admin.from("trackers").update(upd).eq("id", p.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "delete_tracker": {
        if (!p.id) return json({ error: "id required" }, 400);
        // remove linked auth user + role first
        const { data: tr } = await admin
          .from("trackers").select("owner_user_id").eq("id", p.id).maybeSingle();
        const { error } = await admin.from("trackers").delete().eq("id", p.id);
        if (error) return json({ error: error.message }, 400);
        if (tr?.owner_user_id) {
          await admin.from("user_roles").delete().eq("user_id", tr.owner_user_id).eq("role", "tracker");
          await admin.auth.admin.deleteUser(tr.owner_user_id).catch(() => {});
        }
        return json({ ok: true });
      }
      case "create_link": {
        if (!p.tracker_id || !p.label) return json({ error: "tracker_id and label required" }, 400);
        // generate unique code
        let code = "";
        for (let i = 0; i < 10; i++) {
          const candidate = (slug(p.label) || "lnk") + randCode(4);
          const { data: exists } = await admin
            .from("tracker_links").select("id").eq("code", candidate).maybeSingle();
          if (!exists) { code = candidate; break; }
        }
        if (!code) code = "lnk" + randCode(8);
        const { data, error } = await admin.from("tracker_links").insert({
          tracker_id: p.tracker_id,
          label: String(p.label).trim(),
          channel: String(p.channel || "other").trim(),
          destination: String(p.destination || "/").trim() || "/",
          code,
        }).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, link: data });
      }
      case "update_link": {
        if (!p.id) return json({ error: "id required" }, 400);
        const upd: Record<string, unknown> = {};
        if (typeof p.label === "string") upd.label = p.label.trim();
        if (typeof p.channel === "string") upd.channel = p.channel.trim();
        if (typeof p.destination === "string") upd.destination = p.destination.trim() || "/";
        if (typeof p.is_active === "boolean") upd.is_active = p.is_active;
        const { error } = await admin.from("tracker_links").update(upd).eq("id", p.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      case "delete_link": {
        if (!p.id) return json({ error: "id required" }, 400);
        const { error } = await admin.from("tracker_links").delete().eq("id", p.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
