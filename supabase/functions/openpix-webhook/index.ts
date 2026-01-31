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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get('OPENPIX_APP_ID');
    const CREATOR_PIX_KEY = Deno.env.get('CREATOR_PIX_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const payload: OpenPixWebhookPayload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload));

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

    // Idempotency: if already paid, return success
    if (order.status !== 'pending') {
      console.log('Order already processed:', order.id, order.status);
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Already processed', status: order.status }),
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

    // Update order status to paid
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

    // Create Pix Out for creator (79%)
    const payoutCorrelationID = `payout_${correlationID}`;
    
    console.log('Creating Pix Out:', {
      value: creatorShareCents,
      destination: CREATOR_PIX_KEY,
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

    // Approve the Pix Out
    console.log('Approving Pix Out...');
    const approveResponse = await fetch(
      `https://api.openpix.com.br/api/v1/payment/${payoutCorrelationID}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': OPENPIX_APP_ID,
          'Content-Type': 'application/json',
        },
      }
    );

    const approveData = await approveResponse.json();
    console.log('Approve response:', JSON.stringify(approveData));

    // Update order with payout success
    const { error: finalUpdateError } = await supabase
      .from('custom_orders')
      .update({
        status: 'payout_done',
        payout_correlation_id: payoutCorrelationID,
        payout_status: approveResponse.ok ? 'completed' : 'pending_approval',
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
        payout_status: approveResponse.ok ? 'completed' : 'pending_approval',
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
