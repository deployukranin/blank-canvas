import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-forwarded-for',
};

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 VIP subscription attempts
const RATE_LIMIT_WINDOW_MINUTES = 60; // Per hour

interface CreateVIPChargeRequest {
  planType: 'monthly' | 'quarterly' | 'yearly';
  customerName?: string;
}

// Extract client IP from request headers
function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get('OPENPIX_APP_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!OPENPIX_APP_ID) {
      console.error('OPENPIX_APP_ID not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Payment provider not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user ID from auth header - REQUIRED for VIP subscription
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email || 'Usuário';
    console.log('Creating VIP charge for user:', userId);

    // Rate limiting: use user_id for authenticated requests
    const clientIP = getClientIP(req);
    const rateLimitIdentifier = userId; // VIP requires auth, so always use user_id
    
    console.log('Rate limit check for:', rateLimitIdentifier, 'IP:', clientIP);

    // Check rate limit using database function
    const { data: rateLimitResult, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_identifier: rateLimitIdentifier,
        p_endpoint: 'create-vip-charge',
        p_max_requests: RATE_LIMIT_MAX_REQUESTS,
        p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
      });

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      // Continue without rate limiting if check fails (fail open for usability)
    } else if (rateLimitResult && !rateLimitResult.allowed) {
      console.warn('Rate limit exceeded for:', rateLimitIdentifier, rateLimitResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Muitas tentativas de assinatura. Tente novamente mais tarde.',
          retry_after_seconds: rateLimitResult.retry_after_seconds,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retry_after_seconds || 3600),
          } 
        }
      );
    }

    console.log('Rate limit passed:', rateLimitResult);

    const body: CreateVIPChargeRequest = await req.json();
    
    // Validate plan type
    if (!body.planType || !['monthly', 'quarterly', 'yearly'].includes(body.planType)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid plan type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has active VIP subscription
    const { data: existingSub } = await supabase
      .from('vip_subscriptions')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingSub) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Você já possui uma assinatura VIP ativa',
          expires_at: existingSub.expires_at 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending payment subscriptions to avoid duplicates
    const { data: pendingSub } = await supabase
      .from('vip_subscriptions')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending_payment')
      .gt('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Created in last 15 min
      .maybeSingle();

    if (pendingSub) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Você já tem um pagamento pendente. Aguarde a expiração ou complete o pagamento atual.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set prices (in cents) - these should match admin config
    const prices: Record<string, number> = {
      monthly: 1990,   // R$ 19,90
      quarterly: 4990, // R$ 49,90
      yearly: 19990,   // R$ 199,90
    };
    const amountCents = prices[body.planType] || prices.monthly;
    
    // Generate unique correlationID
    const correlationID = `vip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Calculate expiration for charge (15 minutes)
    const chargeExpiresAt = new Date();
    chargeExpiresAt.setMinutes(chargeExpiresAt.getMinutes() + 15);

    // Calculate subscription expiration
    const subscriptionExpiresAt = new Date();
    if (body.planType === 'monthly') {
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
    } else if (body.planType === 'quarterly') {
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 3);
    } else {
      subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);
    }

    // Plan name for display
    const planNames: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    };

    // Create charge in OpenPix
    console.log('Calling OpenPix API for VIP charge...');
    const openPixResponse = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': OPENPIX_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID,
        value: amountCents,
        comment: `Assinatura VIP ${planNames[body.planType]}`,
        expiresIn: 900, // 15 minutes in seconds
        additionalInfo: [
          { key: 'user_id', value: userId },
          { key: 'plan_type', value: body.planType },
        ],
      }),
    });

    const openPixData = await openPixResponse.json();
    console.log('OpenPix response:', JSON.stringify(openPixData));

    if (!openPixResponse.ok || openPixData.error) {
      console.error('OpenPix error:', openPixData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: openPixData.error || 'Failed to create charge',
          details: openPixData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const charge = openPixData.charge;

    // Create pending VIP subscription in database
    const { data: subscription, error: dbError } = await supabase
      .from('vip_subscriptions')
      .insert({
        user_id: userId,
        plan_type: body.planType,
        price_cents: amountCents,
        expires_at: subscriptionExpiresAt.toISOString(),
        status: 'pending_payment',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save subscription', details: dbError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('VIP subscription created with pending payment:', subscription.id);

    // Also create a custom_orders entry to track the payment (reusing existing webhook)
    await supabase
      .from('custom_orders')
      .insert({
        user_id: userId,
        product_type: 'vip_subscription',
        product_id: subscription.id,
        category: body.planType,
        category_name: `VIP ${planNames[body.planType]}`,
        customer_name: body.customerName || userEmail,
        amount_cents: amountCents,
        correlation_id: correlationID,
        openpix_charge_id: charge.identifier,
        qr_code_image: charge.qrCodeImage,
        br_code: charge.brCode,
        expires_at: chargeExpiresAt.toISOString(),
        status: 'pending',
      });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        correlation_id: correlationID,
        qr_code_image: charge.qrCodeImage,
        br_code: charge.brCode,
        expires_at: chargeExpiresAt.toISOString(),
        amount_cents: amountCents,
        plan_type: body.planType,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
