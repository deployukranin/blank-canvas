import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VIPSubscription {
  id: string;
  user_id: string;
  status: 'active' | 'pending_payment' | 'cancelled' | 'expired';
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  price_cents: number;
  started_at: string;
  expires_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VIPContent {
  id: string;
  title: string;
  content: string;
  content_type: 'post' | 'video' | 'audio' | 'image';
  media_url: string | null;
  created_at: string;
}

export interface VIPChargeResult {
  success: boolean;
  subscriptionId?: string;
  correlationId?: string;
  qrCodeImage?: string;
  brCode?: string;
  expiresAt?: string;
  amountCents?: number;
  planType?: 'monthly' | 'quarterly' | 'yearly';
  error?: string;
}

export const useVIPSubscription = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<VIPSubscription | null>(null);
  const [isVIP, setIsVIP] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vipContent, setVIPContent] = useState<VIPContent[]>([]);

  const userId = session?.user?.id;
  const isAuthenticated = !!session?.user;

  // Fetch user's VIP subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated || !userId) {
        setSubscription(null);
        setIsVIP(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vip_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSubscription(data as VIPSubscription);
          setIsVIP(true);
        } else {
          setSubscription(null);
          setIsVIP(false);
        }
      } catch (error) {
        console.error('Error fetching VIP subscription:', error);
        setSubscription(null);
        setIsVIP(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, userId]);

  // Fetch VIP content
  const fetchVIPContent = useCallback(async () => {
    if (!isVIP) {
      setVIPContent([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vip_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVIPContent((data || []) as VIPContent[]);
    } catch (error) {
      console.error('Error fetching VIP content:', error);
      setVIPContent([]);
    }
  }, [isVIP]);

  useEffect(() => {
    if (isVIP) {
      fetchVIPContent();
    }
  }, [isVIP, fetchVIPContent]);

  // TODO: Integrate new payment provider
  const createCharge = useCallback(async (
    planType: 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    customerName?: string
  ): Promise<VIPChargeResult> => {
    toast({
      title: 'Pagamento em implementação',
      description: 'O novo meio de pagamento será integrado em breve.',
    });
    return { success: false, error: 'Pagamento ainda não configurado' };
  }, [toast]);

  // Cancel VIP subscription
  const cancelSubscription = useCallback(async () => {
    if (!subscription) return { success: false };

    try {
      const { error } = await supabase
        .from('vip_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription(null);
      setIsVIP(false);

      toast({
        title: 'Assinatura cancelada',
        description: 'Você ainda terá acesso até o fim do período pago',
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar sua assinatura',
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [subscription, toast]);

  // Get days remaining
  const getDaysRemaining = useCallback(() => {
    if (!subscription) return 0;
    const expires = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('vip_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (data) {
      setSubscription(data as VIPSubscription);
      setIsVIP(true);
    }
  }, [userId]);

  // Stub functions for payment (to be replaced with new provider)
  const checkPaymentStatus = useCallback(async (_correlationId: string) => {
    return null;
  }, []);

  const copyBrCode = useCallback(async (_brCode: string): Promise<boolean> => {
    return false;
  }, []);

  return {
    subscription,
    isVIP,
    isLoading,
    vipContent,
    createCharge,
    checkPaymentStatus,
    copyBrCode,
    cancelSubscription,
    getDaysRemaining,
    refetchContent: fetchVIPContent,
    refreshSubscription,
  };
};
