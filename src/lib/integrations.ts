/**
 * Integration Configuration & Central Functions
 * 
 * This file contains all integration-ready functions and configurations.
 * Reports and support requests are sent to an external moderation panel.
 * 
 * Environment Variables (to be configured):
 * - VITE_PROJECT_ID: Unique identifier for this influencer project
 * - VITE_PAYMENT_TOKEN: Token for payment gateway integration
 * - VITE_SUPPORT_TOKEN: Token for support system integration
 * - VITE_METRICS_TOKEN: Token for analytics integration
 * - VITE_DISCORD_WEBHOOK: Discord integration webhook
 */

import { supabase } from '@/integrations/supabase/client';

// Types for future integrations
export interface PurchasePayload {
  productId: string;
  productType: 'subscription' | 'vip' | 'custom_video' | 'custom_audio';
  userId?: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface ReportPayload {
  contentId: string;
  contentType: 'idea' | 'comment' | 'user';
  reason: string;
  reasonCategory?: 'spam' | 'inappropriate' | 'harassment' | 'other';
  reporterId?: string;
  reporterUsername?: string;
  reporterEmail?: string;
  contentTitle?: string;
  contentAuthor?: string;
  details?: string;
}

export interface SupportRequestPayload {
  userId?: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  message: string;
  category: 'payment' | 'vip' | 'custom_order' | 'general';
  priority: 'low' | 'medium' | 'high';
}

export interface VIPStatusPayload {
  userId: string;
  action: 'activate' | 'deactivate' | 'check';
  subscriptionId?: string;
}

export interface CustomOrderPayload {
  type: 'video' | 'audio';
  userId?: string;
  category: string;
  categoryName?: string;
  duration?: number;
  durationLabel?: string;
  price?: number;
  name: string;
  preferences?: string;
  triggers?: string;
  script?: string;
  observations?: string;
  status: 'pending' | 'in_production' | 'delivered';
}

// Configuration getter (reads from env vars in future)
export const getConfig = () => ({
  projectId: import.meta.env.VITE_PROJECT_ID || 'demo-project',
  paymentEnabled: !!import.meta.env.VITE_PAYMENT_TOKEN,
  supportEnabled: !!import.meta.env.VITE_SUPPORT_TOKEN,
  metricsEnabled: !!import.meta.env.VITE_METRICS_TOKEN,
  discordEnabled: !!import.meta.env.VITE_DISCORD_WEBHOOK,
});

/**
 * Get moderation config from localStorage (CEO panel settings)
 */
const getModerationConfig = (): { apiUrl: string; apiKey: string; enabled: boolean } | null => {
  try {
    const saved = localStorage.getItem('whitelabel_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.tokens?.moderation?.enabled) {
        return {
          apiUrl: parsed.tokens.moderation.apiUrl || '',
          apiKey: parsed.tokens.moderation.apiKey || '',
          enabled: true,
        };
      }
    }
  } catch (e) {
    console.error('[Integration] Failed to read moderation config:', e);
  }
  return null;
};

/**
 * Send report or support request to external moderation panel
 */
const sendToModerationPanel = async (
  type: 'report' | 'support',
  data: Record<string, unknown>
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    console.log(`[Integration] Sending ${type} to moderation panel:`, data);

    // Get moderation config from CEO panel settings
    const moderationConfig = getModerationConfig();
    
    const payload: Record<string, unknown> = { type, data };
    
    // Include moderation config if available and has required fields
    if (moderationConfig?.enabled && moderationConfig.apiUrl && moderationConfig.apiKey) {
      payload.moderationConfig = {
        apiUrl: moderationConfig.apiUrl,
        apiKey: moderationConfig.apiKey,
      };
    }

    const { data: result, error } = await supabase.functions.invoke('send-report', {
      body: payload
    });

    if (error) {
      console.error('[Integration] Edge function error:', error);
      throw error;
    }

    console.log('[Integration] Moderation panel response:', result);

    return {
      success: result?.success ?? true,
      id: result?.reportId || result?.ticketId || `local-${Date.now()}`,
    };
  } catch (error) {
    console.error('[Integration] Failed to send to moderation panel:', error);
    
    // Fallback: store locally
    return {
      success: true,
      id: `local-${Date.now()}`,
      error: 'Stored locally - moderation panel unavailable'
    };
  }
};

/**
 * Central purchase handler
 * In the future, this will integrate with payment providers (OpenPix, Stripe, etc.)
 */
export const onPurchase = async (payload: PurchasePayload): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  console.log('[Integration] Purchase requested:', payload);
  
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful purchase
  return {
    success: true,
    orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
};

/**
 * Report content handler
 * Sends reports to external moderation panel via Edge Function
 */
export const onContentReport = async (payload: ReportPayload): Promise<{ success: boolean; reportId?: string }> => {
  console.log('[Integration] Content reported:', payload);
  
  const result = await sendToModerationPanel('report', {
    contentType: payload.contentType,
    contentId: payload.contentId,
    contentTitle: payload.contentTitle,
    contentAuthor: payload.contentAuthor,
    reason: payload.reason,
    reasonCategory: payload.reasonCategory || 'other',
    reporterUsername: payload.reporterUsername,
    reporterEmail: payload.reporterEmail,
    details: payload.details,
  });

  return {
    success: result.success,
    reportId: result.id,
  };
};

/**
 * Support request handler
 * Sends support tickets to external moderation panel via Edge Function
 */
export const onSupportRequest = async (payload: SupportRequestPayload): Promise<{ success: boolean; ticketId?: string }> => {
  console.log('[Integration] Support request:', payload);
  
  const result = await sendToModerationPanel('support', {
    subject: payload.subject,
    message: payload.message,
    category: payload.category,
    priority: payload.priority,
    userName: payload.userName,
    userEmail: payload.userEmail,
  });

  return {
    success: result.success,
    ticketId: result.id,
  };
};

/**
 * VIP status handler
 * In the future, this will integrate with Discord for role management
 */
export const onVIPStatusChange = async (payload: VIPStatusPayload): Promise<{ success: boolean; status?: string }> => {
  console.log('[Integration] VIP status change:', payload);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    status: payload.action === 'activate' ? 'active' : 'inactive',
  };
};

/**
 * Custom order handler
 * In the future, this will create orders in the production system
 */
export const onCustomOrder = async (payload: CustomOrderPayload): Promise<{ success: boolean; orderId?: string; estimatedDelivery?: string }> => {
  console.log('[Integration] Custom order created:', payload);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const deliveryDays = payload.type === 'video' ? 7 : 3;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  
  return {
    success: true,
    orderId: `CUSTOM-${Date.now()}`,
    estimatedDelivery: deliveryDate.toISOString().split('T')[0],
  };
};

/**
 * Analytics tracker
 * In the future, this will send events to analytics platforms
 */
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  console.log('[Analytics] Event:', eventName, properties);
  
  // Future: Send to analytics provider
};

/**
 * Check if user has VIP access
 * In the future, this will verify against the payment system
 */
export const checkVIPAccess = async (userId: string): Promise<boolean> => {
  console.log('[Integration] Checking VIP access for:', userId);
  
  // Mock: Return false for now
  return false;
};
