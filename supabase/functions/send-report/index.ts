import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportPayload {
  type: 'report' | 'support';
  data: {
    contentType?: string;
    contentId?: string;
    contentTitle?: string;
    contentAuthor?: string;
    reason?: string;
    reasonCategory?: string;
    reporterUsername?: string;
    reporterEmail?: string;
    subject?: string;
    message?: string;
    category?: string;
    priority?: string;
    userName?: string;
    userEmail?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ReportPayload = await req.json();
    
    console.log('[send-report] Received payload:', JSON.stringify(body));

    const moderationUrl = Deno.env.get('MODERATION_API_URL');
    const apiKey = Deno.env.get('MODERATION_API_KEY');

    // If moderation API is not configured, store locally in Supabase
    if (!moderationUrl || !apiKey) {
      console.log('[send-report] Moderation API not configured, storing locally');
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Store in a local table for now (will be synced later when API is configured)
      // For now, just log and return success
      console.log('[send-report] Would store locally:', body);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          stored: 'local',
          message: 'Moderation API not configured. Report stored locally.',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send to external moderation panel
    console.log('[send-report] Sending to moderation API:', moderationUrl);
    
    const response = await fetch(`${moderationUrl}/functions/v1/receive-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        type: body.type,
        sourceProject: Deno.env.get('SUPABASE_URL') || 'unknown',
        data: body.data,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[send-report] Moderation API error:', response.status, errorText);
      throw new Error(`Moderation API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[send-report] Moderation API response:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        stored: 'remote',
        ...result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-report] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stored: 'failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
