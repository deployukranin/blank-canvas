import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type ProductType = "video" | "audio";

// ─── BRCode Generator (PIX Manual) ───
function generatePixBrCode(
  pixKey: string,
  receiverName: string,
  city: string,
  amountBRL: number,
  txId: string
): string {
  const cleanKey = pixKey.replace(/[.\-\/\s]/g, '');
  const cleanName = receiverName.substring(0, 25).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanCity = city.substring(0, 15).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanTxId = txId.substring(0, 25);
  const amountStr = amountBRL.toFixed(2);

  const tlv = (id: string, value: string) => `${id}${value.length.toString().padStart(2, '0')}${value}`;

  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', cleanKey);
  const mai = tlv('26', gui + key);

  let payload = '';
  payload += tlv('00', '01');
  payload += mai;
  payload += tlv('52', '0000');
  payload += tlv('53', '986');
  payload += tlv('54', amountStr);
  payload += tlv('58', 'BR');
  payload += tlv('59', cleanName);
  payload += tlv('60', cleanCity);
  payload += tlv('62', tlv('05', cleanTxId));
  payload += '6304';

  const crc = crc16CCITT(payload);
  return payload + crc;
}

function crc16CCITT(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ─── Resolve price from store's video_config ───
function resolvePrice(
  videoConfig: any,
  productType: ProductType,
  category: string,
  durationMinutes: number
): number | null {
  if (!videoConfig) return null;

  if (productType === 'video') {
    const durations = videoConfig.durations || [];
    const categories = videoConfig.categories || [];
    const dur = durations.find((d: any) => d.minutes === durationMinutes);
    if (!dur) return null;
    let price = dur.price;
    const cat = categories.find((c: any) => c.id === category);
    if (cat?.surcharge) price += cat.surcharge;
    return price;
  }

  if (productType === 'audio') {
    const audioDurations = videoConfig.audioDurations || [];
    const dur = audioDurations.find((d: any) => d.minutes === durationMinutes);
    if (!dur) return null;
    return dur.price;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── Auth ───
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // ─── Parse body ───
    let rawBody: any;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productType = String(rawBody.productType || '') as ProductType;
    if (productType !== 'video' && productType !== 'audio') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid productType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const category = String(rawBody.category || '').trim();
    const customerName = String(rawBody.customerName || '').trim();
    const durationMinutes = Number(rawBody.durationMinutes) || 0;
    const storeId = rawBody.storeId || null;

    if (!category || !customerName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Rate limit ───
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentOrders } = await supabase
      .from('custom_orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', oneMinuteAgo);

    if (recentOrders !== null && recentOrders >= 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests, try again later' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Load store configs (video_config + payment_config) ───
    let videoConfig: any = null;
    let paymentConfig: any = null;

    if (storeId) {
      const [videoCfgRes, payCfgRes] = await Promise.all([
        supabase
          .from('app_configurations')
          .select('config_value')
          .eq('config_key', 'video_config')
          .eq('store_id', storeId)
          .maybeSingle(),
        supabase
          .from('app_configurations')
          .select('config_value')
          .eq('config_key', 'payment_config')
          .eq('store_id', storeId)
          .maybeSingle(),
      ]);
      videoConfig = videoCfgRes.data?.config_value;
      paymentConfig = payCfgRes.data?.config_value;
    }

    // ─── Resolve price from server-side config ONLY (never trust client amount) ───
    const MAX_ALLOWED_PRICE = 10000; // R$ 10.000 safety cap
    const resolvedPrice = resolvePrice(videoConfig, productType, category, durationMinutes);
    if (!resolvedPrice || resolvedPrice <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store pricing not configured. Please contact the creator.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (resolvedPrice > MAX_ALLOWED_PRICE) {
      return new Response(
        JSON.stringify({ success: false, error: 'Price exceeds maximum allowed amount.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountCents = Math.round(resolvedPrice * 100);
    const correlationID = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const chargeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // ─── Determine payment gateway ───
    const activeGateway = paymentConfig?.activeGateway || null;

    let qrCodeImage: string | null = null;
    let brCode: string | null = null;
    let checkoutUrl: string | null = null;
    let stripeSessionId: string | null = null;

    // ─── Stripe Connect (Direct Charge) ───
    if (activeGateway === 'stripe') {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeSecretKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Stripe is not configured on the platform' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get store stripe_account_id
      const { data: storeRow } = await supabase
        .from('stores')
        .select('name, stripe_account_id')
        .eq('id', storeId)
        .maybeSingle();

      if (!storeRow?.stripe_account_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Store has not connected Stripe yet' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const origin = req.headers.get('origin') || 'https://www.mytinglebox.com';
      const successUrl = (typeof rawBody.successUrl === 'string' && /^https?:\/\//.test(rawBody.successUrl))
        ? rawBody.successUrl
        : `${origin}/customs?payment=success`;
      const cancelUrl = (typeof rawBody.cancelUrl === 'string' && /^https?:\/\//.test(rawBody.cancelUrl))
        ? rawBody.cancelUrl
        : `${origin}/customs?payment=cancelled`;

      const productLabel = `${storeRow.name || 'Custom'} - ${productType === 'audio' ? 'Áudio' : 'Vídeo'} ${String(rawBody.categoryName || category)} ${durationMinutes ? `(${durationMinutes}min)` : ''}`.trim().substring(0, 200);

      const params = new URLSearchParams({
        mode: 'payment',
        'line_items[0][price_data][currency]': 'brl',
        'line_items[0][price_data][product_data][name]': productLabel,
        'line_items[0][price_data][unit_amount]': String(amountCents),
        'line_items[0][quantity]': '1',
        success_url: successUrl,
        cancel_url: cancelUrl,
        'metadata[store_id]': storeId || '',
        'metadata[user_id]': userId,
        'metadata[correlation_id]': correlationID,
        'metadata[product_type]': productType,
        'payment_intent_data[metadata][store_id]': storeId || '',
        'payment_intent_data[metadata][user_id]': userId,
        'payment_intent_data[metadata][correlation_id]': correlationID,
        'payment_intent_data[metadata][product_type]': productType,
      });

      const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Stripe-Account': storeRow.stripe_account_id,
        },
        body: params,
      });

      if (!sessionRes.ok) {
        const errBody = await sessionRes.text();
        console.error('Stripe custom checkout error:', errBody);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create Stripe checkout session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const session = await sessionRes.json();
      checkoutUrl = session.url;
      stripeSessionId = session.id;
    }
    // ─── PIX Manual ───
    else if (activeGateway === 'pix_manual') {
      const pix = paymentConfig.pixManual;
      if (!pix?.key || !pix?.receiverName || !pix?.city) {
        return new Response(
          JSON.stringify({ success: false, error: 'Store PIX payment not fully configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const txId = correlationID.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '');
      brCode = generatePixBrCode(pix.key, pix.receiverName, pix.city, amountCents / 100, txId);
      qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(brCode)}`;
    }
    // ─── No payment configured ───
    else {
      return new Response(
        JSON.stringify({ success: false, error: 'No payment method configured for this store. Ask the creator to set up payments.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Sanitize text fields ───
    const MAX_TEXT = 1000;
    const script = typeof rawBody.script === 'string' ? rawBody.script.substring(0, MAX_TEXT) : '';
    const observations = typeof rawBody.observations === 'string' ? rawBody.observations.substring(0, MAX_TEXT) : '';
    const preferences = typeof rawBody.preferences === 'string' ? rawBody.preferences.substring(0, MAX_TEXT) : '';
    const triggers = typeof rawBody.triggers === 'string' ? rawBody.triggers.substring(0, MAX_TEXT) : '';

    // ─── Insert order ───
    const { data: order, error: dbError } = await supabase
      .from('custom_orders')
      .insert({
        user_id: userId,
        product_type: productType,
        category,
        category_name: String(rawBody.categoryName || '').substring(0, 100),
        customer_name: customerName.substring(0, 100),
        duration_minutes: durationMinutes,
        duration_label: String(rawBody.durationLabel || '').substring(0, 50),
        amount_cents: amountCents,
        correlation_id: correlationID,
        qr_code_image: qrCodeImage,
        br_code: brCode,
        openpix_charge_id: null,
        expires_at: chargeExpiresAt.toISOString(),
        status: 'pending',
        store_id: storeId,
        script,
        observations,
        preferences,
        triggers,
      })
      .select()
      .single();

    if (dbError || !order) {
      console.error('DB insert error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        correlation_id: correlationID,
        qr_code_image: qrCodeImage,
        br_code: brCode,
        expires_at: chargeExpiresAt.toISOString(),
        amount_cents: amountCents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Internal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
