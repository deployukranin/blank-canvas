import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-mode',
};

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

    const body: CreateChargeRequest = await req.json();
    console.log('Creating charge for:', body);

    // Validate required fields
    if (!body.amount || !body.productType || !body.category || !body.customerName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert amount to cents
    const amountCents = Math.round(body.amount * 100);
    
    // Generate unique correlationID
    const correlationID = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
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
