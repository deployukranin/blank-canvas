import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Split percentages
const CREATOR_PERCENTAGE = 0.79; // 79% for creator
const PLATFORM_PERCENTAGE = 0.21; // 21% for platform
const OPENPIX_FEE_PERCENTAGE = 0.008; // 0.80% fee

interface OpenPixWebhookPayload {
  event: string;
  charge?: {
    correlationID: string;
    value: number;
    status: string;
    identifier: string;
  };
  pix?: {
    value: number;
    time: string;
    transactionID: string;
  };
}

// Validate OpenPix webhook signature using HMAC SHA-256
async function validateSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures (constant-time comparison to prevent timing attacks)
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get('OPENPIX_APP_ID');
    const OPENPIX_WEBHOOK_SECRET = Deno.env.get('OPENPIX_WEBHOOK_SECRET');
    const CREATOR_PIX_KEY = Deno.env.get('CREATOR_PIX_KEY');
    const CREATOR_TAX_ID = Deno.env.get('CREATOR_TAX_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // CRITICAL: Require webhook secret in production
    if (!OPENPIX_WEBHOOK_SECRET) {
      console.error('CRITICAL: OPENPIX_WEBHOOK_SECRET not configured - rejecting all webhooks for security');
      return new Response(
        JSON.stringify({ error: 'Webhook security not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENPIX_APP_ID) {
      console.error('OPENPIX_APP_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Payment provider not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!CREATOR_PIX_KEY) {
      console.error('CREATOR_PIX_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Creator PIX key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!CREATOR_TAX_ID) {
      console.error('CREATOR_TAX_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Creator Tax ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature validation
    const rawBody = await req.text();
    
    // Validate webhook signature BEFORE processing
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('X-Webhook-Signature');
    
    if (!signature) {
      console.error('SECURITY: Missing webhook signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature', message: 'Webhook signature is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isValidSignature = await validateSignature(rawBody, signature, OPENPIX_WEBHOOK_SECRET);
    
    if (!isValidSignature) {
      console.error('SECURITY: Invalid webhook signature detected - potential fraud attempt');
      return new Response(
        JSON.stringify({ error: 'Invalid signature', message: 'Webhook signature validation failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook signature validated successfully');

    // Parse payload after signature validation
    const payload: OpenPixWebhookPayload = JSON.parse(rawBody);
    console.log('Webhook received:', JSON.stringify(payload));

    // Handle test webhooks from OpenPix dashboard
    const isTestWebhook = (payload as any).evento === 'teste_webhook';
    if (isTestWebhook) {
      console.log('Test webhook received - responding with success');
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Test webhook acknowledged' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process charge completed events
    if (payload.event !== 'OPENPIX:CHARGE_COMPLETED') {
      console.log('Ignoring event:', payload.event);
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Event not relevant' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload.charge?.correlationID) {
      console.error('Missing correlationID in payload');
      return new Response(
        JSON.stringify({ error: 'Missing correlationID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correlationID = payload.charge.correlationID;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the order by correlationID
    const { data: order, error: fetchError } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('correlation_id', correlationID)
      .single();

    if (fetchError || !order) {
      console.error('Order not found:', correlationID, fetchError);
      return new Response(
        JSON.stringify({ error: 'Order not found', correlationID }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency / resume:
    // - pending: first time processing
    // - paid: payment confirmed but payout may not have been executed (e.g. function crashed) -> resume payout
    // - payout_done/delivered: fully processed
    if (['payout_done', 'delivered'].includes(order.status)) {
      console.log('Order already fully processed:', order.id, order.status);
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Already processed', status: order.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle VIP subscription payments (no split, just activate subscription)
    if (order.product_type === 'vip_subscription' && order.product_id) {
      console.log('Processing VIP subscription payment for:', order.product_id);
      
      // Activate the VIP subscription
      const { error: vipUpdateError } = await supabase
        .from('vip_subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', order.product_id);

      if (vipUpdateError) {
        console.error('Failed to activate VIP subscription:', vipUpdateError);
        return new Response(
          JSON.stringify({ error: 'Failed to activate VIP subscription', details: vipUpdateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark order as paid
      await supabase
        .from('custom_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      console.log('VIP subscription activated:', order.product_id);
      
      return new Response(
        JSON.stringify({
          received: true,
          processed: true,
          order_id: order.id,
          subscription_id: order.product_id,
          payment_status: 'paid',
          type: 'vip_subscription',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate split
    const totalCents = order.amount_cents;
    const creatorShareCents = Math.floor(totalCents * CREATOR_PERCENTAGE);
    const platformShareCents = totalCents - creatorShareCents;
    const feeCents = Math.round(totalCents * OPENPIX_FEE_PERCENTAGE);
    const platformNetCents = platformShareCents - feeCents;

    console.log('Split calculation:', {
      total: totalCents,
      creatorShare: creatorShareCents,
      platformShare: platformShareCents,
      fee: feeCents,
      platformNet: platformNetCents,
    });

    // Update order status to paid (only if still pending)
    if (order.status === 'pending') {
      const { error: updateError } = await supabase
        .from('custom_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_amount_cents: creatorShareCents,
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update order', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Order already marked paid, resuming payout:', order.id);
    }

    // Create Pix Out for creator (79%)
    const payoutCorrelationID = `payout_${correlationID}`;
    
    console.log('Creating Pix Out:', {
      value: creatorShareCents,
      destination: CREATOR_PIX_KEY,
      taxId: CREATOR_TAX_ID,
      correlationID: payoutCorrelationID,
    });

    const pixOutResponse = await fetch('https://api.openpix.com.br/api/v1/payment', {
      method: 'POST',
      headers: {
        'Authorization': OPENPIX_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID: payoutCorrelationID,
        value: creatorShareCents,
        destinationAlias: CREATOR_PIX_KEY,
        taxId: CREATOR_TAX_ID,
        comment: `Pagamento Custom ${order.product_type} - ${order.category_name || order.category}`,
      }),
    });

    const pixOutData = await pixOutResponse.json();
    console.log('Pix Out response:', JSON.stringify(pixOutData));

    if (!pixOutResponse.ok || pixOutData.error) {
      console.error('Pix Out failed:', pixOutData);
      
      // Update order with payout failure
      await supabase
        .from('custom_orders')
        .update({
          payout_correlation_id: payoutCorrelationID,
          payout_status: 'failed',
        })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ 
          received: true, 
          processed: true, 
          payment_status: 'paid',
          payout_status: 'failed',
          error: pixOutData.error || 'Pix Out creation failed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with payout info (Pix Out was created successfully)
    // Note: Some OpenPix accounts have auto-approve enabled, so we don't need to call /approve
    let payoutFinalStatus = 'created';
    
    // Try to approve the Pix Out (required in many accounts)
    try {
      console.log('Attempting to approve Pix Out...');
      // Woovi/OpenPix docs: approve endpoint is /api/v1/payment/approve and expects correlationID in body
      const approveResponse = await fetch('https://api.openpix.com.br/api/v1/payment/approve', {
        method: 'POST',
        headers: {
          'Authorization': OPENPIX_APP_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correlationID: payoutCorrelationID }),
      });

      if (approveResponse.ok) {
        const approveData = await approveResponse.json();
        console.log('Approve response:', JSON.stringify(approveData));
        payoutFinalStatus = 'approved';
      } else {
        // Check if it's a 404 (account may not support API approval or endpoint not available)
        const responseText = await approveResponse.text();
        console.log(`Approve endpoint returned ${approveResponse.status}: ${responseText}`);
        
        payoutFinalStatus = approveResponse.status === 404 ? 'pending_approval' : 'pending_approval';
      }
    } catch (approveError) {
      console.error('Error during approval attempt:', approveError);
      payoutFinalStatus = 'pending_approval';
    }

    // Update order with final payout status
    const { error: finalUpdateError } = await supabase
      .from('custom_orders')
      .update({
        status: 'payout_done',
        payout_correlation_id: payoutCorrelationID,
        payout_status: payoutFinalStatus,
      })
      .eq('id', order.id);

    if (finalUpdateError) {
      console.error('Failed to update final status:', finalUpdateError);
    }

    console.log('Webhook processed successfully for order:', order.id);

    return new Response(
      JSON.stringify({
        received: true,
        processed: true,
        order_id: order.id,
        payment_status: 'paid',
        payout_status: payoutFinalStatus,
        split: {
          total: totalCents,
          creator: creatorShareCents,
          platform: platformNetCents,
          fee: feeCents,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
