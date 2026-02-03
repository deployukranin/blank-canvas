import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-mode, x-forwarded-for',
};

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 payment attempts
const RATE_LIMIT_WINDOW_MINUTES = 60; // Per hour

interface CreateChargeRequest {
  amount: number;
  productType: 'video' | 'audio';
  category: string;
  categoryName?: string;
  durationMinutes?: number;
  durationLabel?: string;
  customerName: string;
  triggers?: string;
  script?: string;
  preferences?: string;
  observations?: string;
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

    // Get user ID from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id || null;
    }

    // Rate limiting: use user_id if logged in, otherwise use IP
    const clientIP = getClientIP(req);
    const rateLimitIdentifier = userId || `ip:${clientIP}`;
    
    console.log('Rate limit check for:', rateLimitIdentifier);

    // Check rate limit using database function
    const { data: rateLimitResult, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_identifier: rateLimitIdentifier,
        p_endpoint: 'create-pix-charge',
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
          error: 'Muitas tentativas de pagamento. Tente novamente mais tarde.',
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

    const body: CreateChargeRequest = await req.json();
    console.log('Creating charge for:', body);

    // Validate required fields
    if (!body.amount || !body.productType || !body.category || !body.customerName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount (minimum R$1.00, maximum R$10,000.00)
    if (body.amount < 1 || body.amount > 10000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valor inválido. Mínimo R$1,00, máximo R$10.000,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate customer name (basic sanitization)
    if (body.customerName.length < 2 || body.customerName.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome do cliente inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert amount to cents
    const amountCents = Math.round(body.amount * 100);
    
    // Generate unique correlationID
    const correlationID = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Calculate expiration (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Create charge in OpenPix
    console.log('Calling OpenPix API...');
    const openPixResponse = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': OPENPIX_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID,
        value: amountCents,
        comment: `${body.productType === 'video' ? 'Vídeo' : 'Áudio'} Personalizado - ${body.categoryName || body.category}`,
        expiresIn: 900, // 15 minutes in seconds
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

    // Save order in database
    const { data: order, error: dbError } = await supabase
      .from('custom_orders')
      .insert({
        user_id: userId,
        product_type: body.productType,
        category: body.category,
        category_name: body.categoryName,
        duration_minutes: body.durationMinutes,
        duration_label: body.durationLabel,
        customer_name: body.customerName,
        triggers: body.triggers,
        script: body.script,
        preferences: body.preferences,
        observations: body.observations,
        amount_cents: amountCents,
        correlation_id: correlationID,
        openpix_charge_id: charge.identifier,
        qr_code_image: charge.qrCodeImage,
        br_code: charge.brCode,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save order', details: dbError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created successfully:', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        correlation_id: correlationID,
        qr_code_image: charge.qrCodeImage,
        br_code: charge.brCode,
        expires_at: expiresAt.toISOString(),
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
