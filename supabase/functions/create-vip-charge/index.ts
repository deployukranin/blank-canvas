import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CreateVIPChargeRequest {
  planType: 'monthly' | 'quarterly' | 'yearly';
  customerName?: string;
  storeId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isSafeRedirectUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getPlanInterval(planType: CreateVIPChargeRequest['planType']): 'month' | 'year' {
  return planType === 'yearly' ? 'year' : 'month';
}

function getPlanIntervalCount(planType: CreateVIPChargeRequest['planType']): string {
  return planType === 'quarterly' ? '3' : '1';
}

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

  // Merchant Account Information (GUI + Key)
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', cleanKey);
  const mai = tlv('26', gui + key);

  let payload = '';
  payload += tlv('00', '01');           // Payload Format Indicator
  payload += mai;                        // Merchant Account Information
  payload += tlv('52', '0000');          // Merchant Category Code
  payload += tlv('53', '986');           // Transaction Currency (BRL)
  payload += tlv('54', amountStr);       // Transaction Amount
  payload += tlv('58', 'BR');            // Country Code
  payload += tlv('59', cleanName);       // Merchant Name
  payload += tlv('60', cleanCity);       // Merchant City
  payload += tlv('62', tlv('05', cleanTxId)); // Additional Data (txid)
  payload += '6304';                     // CRC placeholder

  // CRC16-CCITT
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ success: false, error: 'Invalid authentication token' }, 401);
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || 'User';

    // Rate limiting
    const { data: rlResult } = await supabase.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: 'create-vip-charge',
      p_max_requests: 10,
      p_window_minutes: 60,
    });
    if (rlResult && !rlResult.allowed) {
      return jsonResponse({ success: false, error: 'Too many requests, try again later' }, 429);
    }
    const body: CreateVIPChargeRequest = await req.json();

    if (!body.planType || !['monthly', 'quarterly', 'yearly'].includes(body.planType)) {
      return jsonResponse({ success: false, error: 'Invalid plan type' }, 400);
    }

    const storeId = body.storeId || null;

    // Check existing active subscription
    let existingSubQuery = supabase
      .from('vip_subscriptions')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (storeId) {
      existingSubQuery = existingSubQuery.eq('store_id', storeId);
    }

    const { data: existingSub } = await existingSubQuery.maybeSingle();
    if (existingSub) {
      return new Response(
        JSON.stringify({ success: false, error: 'You already have an active VIP subscription', expires_at: existingSub.expires_at }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Load store's VIP prices ───
    let amountCents: number;
    if (storeId) {
      const { data: vipCfg } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'vip_config')
        .eq('store_id', storeId)
        .maybeSingle();

      const plans = (vipCfg?.config_value as any)?.plans || [];
      const matchingPlan = plans.find((p: any) => p.type === body.planType);
      amountCents = matchingPlan ? Math.round(matchingPlan.price * 100) : 1990;
    } else {
      const defaultPrices: Record<string, number> = { monthly: 1990, quarterly: 4990, yearly: 19990 };
      amountCents = defaultPrices[body.planType] || 1990;
    }

    const correlationID = `vip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Calculate subscription expiration
    const subscriptionExpiresAt = new Date();
    if (body.planType === 'monthly') subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
    else if (body.planType === 'quarterly') subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 3);
    else subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);

    // ─── Load store's payment config ───
    let paymentConfig: any = null;
    let stripeAccountId: string | null = null;
    let storeName = 'VIP';
    if (storeId) {
      const [payCfgRes, storeRes] = await Promise.all([
        supabase
          .from('app_configurations')
          .select('config_value')
          .eq('config_key', 'payment_config')
          .eq('store_id', storeId)
          .maybeSingle(),
        supabase
          .from('stores')
          .select('name, stripe_account_id')
          .eq('id', storeId)
          .maybeSingle(),
      ]);
      if (!storeRes.data) {
        return jsonResponse({ success: false, error: 'Store not found' }, 404);
      }
      paymentConfig = payCfgRes.data?.config_value;
      stripeAccountId = storeRes.data.stripe_account_id;
      storeName = storeRes.data.name || storeName;
    }

    const activeGateway = paymentConfig?.activeGateway || null;
    const chargeExpiresAt = new Date();
    chargeExpiresAt.setMinutes(chargeExpiresAt.getMinutes() + 30);

    let qrCodeImage: string | null = null;
    let brCode: string | null = null;
    let paymentMethod = 'pending_config';
    let stripeCheckoutUrl: string | null = null;
    let stripeSessionId: string | null = null;

    // ─── PIX Manual: Generate BRCode ───
    if (activeGateway === 'pix_manual') {
      const pix = paymentConfig.pixManual;
      if (!pix?.key || !pix?.receiverName || !pix?.city) {
        return new Response(
          JSON.stringify({ success: false, error: 'Store PIX payment not fully configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const txId = correlationID.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '');
      brCode = generatePixBrCode(pix.key, pix.receiverName, pix.city, amountCents / 100, txId);

      // Generate QR code image via Google Charts API
      qrCodeImage = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(brCode)}&choe=UTF-8`;
      paymentMethod = 'pix_manual';
    }
    // ─── Stripe Connect: create Checkout session as Direct Charge ───
    else if (activeGateway === 'stripe') {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeSecretKey) {
        return jsonResponse({ success: false, error: 'Stripe is not configured on the platform' }, 500);
      }
      if (!stripeAccountId) {
        return jsonResponse({ success: false, error: 'Store has not connected Stripe yet' }, 400);
      }
      const origin = req.headers.get('origin') || 'https://www.mytinglebox.com';
      const successUrl = body.successUrl || `${origin}/vip?payment=success`;
      const cancelUrl = body.cancelUrl || `${origin}/vip?payment=cancelled`;
      if (!isSafeRedirectUrl(successUrl) || !isSafeRedirectUrl(cancelUrl)) {
        return jsonResponse({ success: false, error: 'Invalid redirect URLs' }, 400);
      }

      const params = new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price_data][currency]': 'brl',
        'line_items[0][price_data][product_data][name]': `${storeName} VIP ${body.planType}`.substring(0, 200),
        'line_items[0][price_data][unit_amount]': String(amountCents),
        'line_items[0][price_data][recurring][interval]': getPlanInterval(body.planType),
        'line_items[0][price_data][recurring][interval_count]': getPlanIntervalCount(body.planType),
        'line_items[0][quantity]': '1',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userEmail !== 'User' ? userEmail : '',
        'metadata[store_id]': storeId || '',
        'metadata[user_id]': userId,
        'metadata[correlation_id]': correlationID,
        'metadata[product_type]': 'vip_subscription',
        'metadata[plan_type]': body.planType,
        'subscription_data[metadata][store_id]': storeId || '',
        'subscription_data[metadata][user_id]': userId,
        'subscription_data[metadata][correlation_id]': correlationID,
        'subscription_data[metadata][product_type]': 'vip_subscription',
        'subscription_data[metadata][plan_type]': body.planType,
      });

      const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Stripe-Account': stripeAccountId,
        },
        body: params,
      });

      if (!sessionRes.ok) {
        const errBody = await sessionRes.text();
        console.error('Stripe VIP checkout error:', errBody);
        return jsonResponse({ success: false, error: 'Failed to create Stripe checkout session' }, 500);
      }

      const session = await sessionRes.json();
      stripeCheckoutUrl = session.url;
      stripeSessionId = session.id;
      paymentMethod = 'stripe';
    }
    // ─── No payment configured ───
    else {
      return jsonResponse({ success: false, error: 'No payment method configured for this store. Ask the creator to set up payments.' }, 400);
    }

    // Create pending VIP subscription
    const { data: subscription, error: dbError } = await supabase
      .from('vip_subscriptions')
      .insert({
        user_id: userId,
        plan_type: body.planType,
        price_cents: amountCents,
        expires_at: subscriptionExpiresAt.toISOString(),
        status: 'pending_payment',
        store_id: storeId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order entry for tracking
    await supabase
      .from('custom_orders')
      .insert({
        user_id: userId,
        product_type: 'vip_subscription',
        product_id: subscription.id,
        category: body.planType,
        category_name: `VIP ${body.planType}`,
        customer_name: body.customerName || userEmail,
        amount_cents: amountCents,
        correlation_id: correlationID,
        qr_code_image: qrCodeImage,
        br_code: brCode,
        expires_at: chargeExpiresAt.toISOString(),
        status: 'pending',
        store_id: storeId,
      });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        correlation_id: correlationID,
        qr_code_image: qrCodeImage,
        br_code: brCode,
        expires_at: chargeExpiresAt.toISOString(),
        amount_cents: amountCents,
        plan_type: body.planType,
        payment_method: paymentMethod,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
