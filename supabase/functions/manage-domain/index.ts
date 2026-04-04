import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const VERCEL_NAMESERVERS = ["ns1.vercel-dns.com", "ns2.vercel-dns.com"];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

interface VerificationLike {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

const normalizeVerification = (verification: unknown) => {
  if (!Array.isArray(verification)) {
    return null;
  }

  return verification.map((record: Record<string, unknown>) => ({
    type: typeof record.type === "string" ? record.type : "DNS",
    domain: typeof record.domain === "string" ? record.domain : "@",
    value:
      typeof record.value === "string"
        ? record.value
        : typeof record.reason === "string"
          ? record.reason
          : "",
    reason: typeof record.reason === "string" ? record.reason : "",
  }));
};

const looksLikeExistingDomainError = (status: number, errorMessage: string) => {
  const normalizedMessage = errorMessage.toLowerCase();

  return [400, 409].includes(status) && ["already", "exists", "in use", "assigned", "taken"].some((snippet) => normalizedMessage.includes(snippet));
};

const getProjectDomain = async (domain: string) => {
  const response = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
  });

  const data = await response.json().catch(() => null);
  return { response, data };
};

const getDomainConfig = async (domain: string) => {
  const response = await fetch(`https://api.vercel.com/v6/domains/${domain}/config?projectIdOrName=${VERCEL_PROJECT_ID}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
  });

  const data = await response.json().catch(() => null);
  return { response, data };
};

const getDnsMode = (vercelDomain: Record<string, unknown> | null, existingDomain: boolean) => {
  // If Vercel returned verification records, user needs to set DNS records
  if (Array.isArray(vercelDomain?.verification) && vercelDomain.verification.length > 0) {
    return "records";
  }

  if (existingDomain) {
    return "nameservers";
  }

  if (Array.isArray(vercelDomain?.nameservers) && vercelDomain.nameservers.length > 0) {
    return "nameservers";
  }

  return "records";
};

const getDomainStatus = async (domain: string, vercelDomain: Record<string, unknown> | null, existingDomain: boolean) => {
  const { response: configResponse, data: configData } = await getDomainConfig(domain);

  const config = configResponse.ok && configData && typeof configData === "object"
    ? (configData as Record<string, unknown>)
    : null;

  const intendedNameservers = Array.isArray(config?.intendedNameservers) && config.intendedNameservers.length > 0
    ? config.intendedNameservers
    : null;

  const projectNameservers = Array.isArray(vercelDomain?.nameservers) && vercelDomain.nameservers.length > 0
    ? vercelDomain.nameservers
    : null;

  const configuredBy = typeof config?.configuredBy === "string" ? config.configuredBy : null;
  const misconfigured = typeof config?.misconfigured === "boolean"
    ? config.misconfigured
    : Boolean(vercelDomain?.misconfigured);

  const isConfigured = config ? misconfigured === false : false;

  // Determine DNS mode: prioritize what Vercel actually asks for
  let dnsMode: "nameservers" | "records";
  if (configuredBy === "A" || configuredBy === "CNAME") {
    dnsMode = "records";
  } else if (Array.isArray(vercelDomain?.verification) && (vercelDomain.verification as unknown[]).length > 0) {
    // Vercel returned specific verification records — show those
    dnsMode = "records";
  } else if (Array.isArray(config?.nameservers) && (config.nameservers as unknown[]).length > 0) {
    dnsMode = "nameservers";
  } else {
    dnsMode = getDnsMode(vercelDomain, existingDomain);
  }

  // Build A/CNAME records from config if verification array is empty
  const aRecords: VerificationLike[] = [];
  if (dnsMode === "records" && (!Array.isArray(vercelDomain?.verification) || (vercelDomain?.verification as unknown[]).length === 0)) {
    // Provide default A record from Vercel's recommended IP
    const aValue = typeof config?.aValue === "string" ? config.aValue : "76.76.21.21";
    aRecords.push({ type: "A", domain: "@", value: aValue, reason: "" });
    if (typeof config?.cnames === "object" && config.cnames) {
      // Add CNAME for www if available
      const cnameEntries = config.cnames as Record<string, string>;
      for (const [name, value] of Object.entries(cnameEntries)) {
        aRecords.push({ type: "CNAME", domain: name, value, reason: "" });
      }
    }
  }

  return {
    isConfigured,
    misconfigured,
    dnsMode,
    nameservers: intendedNameservers ?? projectNameservers ?? VERCEL_NAMESERVERS,
    fallbackRecords: aRecords,
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return jsonResponse({ success: false, error: "Vercel credentials not configured" }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Not authenticated" }, 401);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ success: false, error: "Invalid token" }, 401);
    }

    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);

    const userRoles = (roles || []).map((roleRow: { role: string }) => roleRow.role);
    const isAdmin = ["admin", "creator", "ceo", "super_admin"].some((role) => userRoles.includes(role));

    if (!isAdmin) {
      return jsonResponse({ success: false, error: "Access denied" }, 403);
    }

    const body = await req.json();
    const { action, store_id, domain } = body;

    if (!store_id) {
      return jsonResponse({ success: false, error: "store_id required" }, 400);
    }

    const { data: storeCheck } = await supabaseAdmin.from("stores").select("id, created_by").eq("id", store_id).single();

    if (!storeCheck) {
      return jsonResponse({ success: false, error: "Store not found" }, 404);
    }

    const { data: storeAdminCheck } = await supabaseAdmin
      .from("store_admins")
      .select("id")
      .eq("store_id", store_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (storeCheck.created_by !== user.id && !storeAdminCheck && !userRoles.includes("super_admin")) {
      return jsonResponse({ success: false, error: "Not authorized for this store" }, 403);
    }

    switch (action) {
      case "add": {
        if (!domain || typeof domain !== "string") {
          return jsonResponse({ success: false, error: "Domain is required" }, 400);
        }

        const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
        const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

        if (!domainRegex.test(cleanDomain)) {
          return jsonResponse({ success: false, error: "Invalid domain format" }, 400);
        }

        const createDomainResponse = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: cleanDomain }),
        });

        const createDomainData = await createDomainResponse.json().catch(() => null);
        let vercelDomain = createDomainData as Record<string, unknown> | null;
        let existingDomain = false;

        if (!createDomainResponse.ok) {
          const errorMessage =
            typeof createDomainData?.error?.message === "string"
              ? createDomainData.error.message
              : "Failed to add domain to Vercel";

          if (!looksLikeExistingDomainError(createDomainResponse.status, errorMessage)) {
            return jsonResponse({ success: false, error: errorMessage, vercel_error: createDomainData }, 400);
          }

          const { response: existingDomainResponse, data: existingDomainData } = await getProjectDomain(cleanDomain);

          if (!existingDomainResponse.ok) {
            return jsonResponse(
              {
                success: false,
                error: errorMessage,
                vercel_error: createDomainData,
              },
              400,
            );
          }

          vercelDomain = existingDomainData as Record<string, unknown> | null;
          existingDomain = true;
        }

        const domainStatus = await getDomainStatus(cleanDomain, vercelDomain, existingDomain);

        await supabaseAdmin
          .from("stores")
          .update({
            custom_domain: cleanDomain,
            domain_verified: domainStatus.isConfigured,
            domain_added_at: new Date().toISOString(),
          })
          .eq("id", store_id);

        return jsonResponse({
          success: true,
          domain: cleanDomain,
          verified: domainStatus.isConfigured,
          existing: existingDomain,
          verification: normalizeVerification(vercelDomain?.verification),
          dnsMode: domainStatus.dnsMode,
          nameservers: domainStatus.nameservers,
          misconfigured: domainStatus.misconfigured,
        });
      }

      case "verify": {
        const { data: store } = await supabaseAdmin.from("stores").select("custom_domain").eq("id", store_id).single();

        if (!store?.custom_domain) {
          return jsonResponse({ success: false, error: "No domain configured" }, 400);
        }

        const { response: domainResponse, data: vercelData } = await getProjectDomain(store.custom_domain);

        if (!domainResponse.ok) {
          const errorMessage =
            typeof vercelData?.error?.message === "string"
              ? vercelData.error.message
              : "Failed to fetch domain status from Vercel";

          return jsonResponse({ success: false, error: errorMessage, vercel_error: vercelData }, 400);
        }

        const domainStatus = await getDomainStatus(store.custom_domain, vercelData as Record<string, unknown> | null, false);
        const isVerified = domainStatus.isConfigured;

        await supabaseAdmin.from("stores").update({ domain_verified: isVerified }).eq("id", store_id);

        return jsonResponse({
          success: true,
          verified: isVerified,
          domain: store.custom_domain,
          verification: normalizeVerification(vercelData?.verification),
          dnsMode: domainStatus.dnsMode,
          nameservers: domainStatus.nameservers,
          misconfigured: domainStatus.misconfigured,
        });
      }

      case "remove": {
        const { data: store } = await supabaseAdmin.from("stores").select("custom_domain").eq("id", store_id).single();

        if (!store?.custom_domain) {
          return jsonResponse({ success: true });
        }

        const vercelResponse = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${store.custom_domain}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
          },
        });

        await vercelResponse.text();

        await supabaseAdmin
          .from("stores")
          .update({
            custom_domain: null,
            domain_verified: false,
            domain_added_at: null,
          })
          .eq("id", store_id);

        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ success: false, error: "Invalid action. Use: add, verify, remove" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
