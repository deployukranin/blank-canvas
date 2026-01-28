import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubaccountRequest {
  action: 'create' | 'list' | 'get' | 'sync';
  pixKey?: string;
  name?: string;
  influencerId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");
    if (!OPENPIX_APP_ID) {
      console.error("OPENPIX_APP_ID não configurado");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar se é modo desenvolvimento/sandbox via header especial
    const devModeHeader = req.headers.get("X-Dev-Mode");
    const isDevMode = devModeHeader === "true";

    // Autenticação do usuário (requer admin ou ceo, exceto em modo dev)
    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      // Verificar se não é o token anon (que indica mock login)
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (token !== anonKey) {
        const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
        if (!claimsError && claimsData?.user) {
          // Verificar se é admin ou ceo
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", claimsData.user.id)
            .in("role", ["admin", "ceo"])
            .maybeSingle();

          if (roleData) {
            isAuthenticated = true;
          }
        }
      }
    }

    // Permitir acesso em modo dev para facilitar testes
    if (!isAuthenticated && !isDevMode) {
      console.log("Auth failed: isDevMode=", isDevMode, "authHeader present=", !!authHeader);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso restrito a administradores. Use modo dev para testes." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Access granted:", isAuthenticated ? "authenticated user" : "dev mode");

    const body: CreateSubaccountRequest = await req.json();
    console.log("=== Manage Subaccount ===");
    console.log("Action:", body.action);

    switch (body.action) {
      case 'create': {
        if (!body.pixKey || !body.name) {
          return new Response(
            JSON.stringify({ success: false, error: "pixKey e name são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Criar subconta na OpenPix/Woovi
        const createResponse = await fetch("https://api.openpix.com.br/api/v1/subaccount", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: OPENPIX_APP_ID,
          },
          body: JSON.stringify({
            pixKey: body.pixKey,
            name: body.name,
          }),
        });

        const createData = await createResponse.json();
        console.log("OpenPix Create Response:", JSON.stringify(createData, null, 2));

        if (!createResponse.ok) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: createData?.error?.message || "Erro ao criar subconta",
              details: createData 
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Se tiver influencerId, atualizar no banco
        if (body.influencerId) {
          const subaccountId = createData?.subaccount?.id || createData?.id;
          if (subaccountId) {
            await supabase
              .from("influencers")
              .update({ woovi_subaccount_id: subaccountId })
              .eq("id", body.influencerId);
          }
        }

        return new Response(
          JSON.stringify({ success: true, subaccount: createData.subaccount || createData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'list': {
        // Listar subcontas na OpenPix/Woovi
        const listResponse = await fetch("https://api.openpix.com.br/api/v1/subaccount", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: OPENPIX_APP_ID,
          },
        });

        const listData = await listResponse.json();
        console.log("OpenPix List Response:", JSON.stringify(listData, null, 2));

        return new Response(
          JSON.stringify({ success: true, subaccounts: listData.subaccounts || listData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'get': {
        if (!body.pixKey) {
          return new Response(
            JSON.stringify({ success: false, error: "pixKey é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Buscar subconta específica
        const getResponse = await fetch(`https://api.openpix.com.br/api/v1/subaccount/${encodeURIComponent(body.pixKey)}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: OPENPIX_APP_ID,
          },
        });

        const getData = await getResponse.json();
        console.log("OpenPix Get Response:", JSON.stringify(getData, null, 2));

        return new Response(
          JSON.stringify({ success: true, subaccount: getData.subaccount || getData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'sync': {
        // Sincronizar todos os influencers ativos que não têm woovi_subaccount_id
        const { data: influencers, error: fetchError } = await supabase
          .from("influencers")
          .select("id, name, pix_key, woovi_subaccount_id")
          .eq("is_active", true)
          .is("woovi_subaccount_id", null);

        if (fetchError) {
          return new Response(
            JSON.stringify({ success: false, error: "Erro ao buscar influencers" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const results: Array<{ influencerId: string; success: boolean; error?: string }> = [];

        for (const influencer of influencers || []) {
          try {
            const createResponse = await fetch("https://api.openpix.com.br/api/v1/subaccount", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: OPENPIX_APP_ID,
              },
              body: JSON.stringify({
                pixKey: influencer.pix_key,
                name: influencer.name,
              }),
            });

            const createData = await createResponse.json();

            if (createResponse.ok) {
              const subaccountId = createData?.subaccount?.id || createData?.id;
              if (subaccountId) {
                await supabase
                  .from("influencers")
                  .update({ woovi_subaccount_id: subaccountId })
                  .eq("id", influencer.id);
              }
              results.push({ influencerId: influencer.id, success: true });
            } else {
              results.push({ 
                influencerId: influencer.id, 
                success: false, 
                error: createData?.error?.message || "Erro ao criar subconta" 
              });
            }
          } catch (err) {
            results.push({ 
              influencerId: influencer.id, 
              success: false, 
              error: String(err) 
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Erro inesperado:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
