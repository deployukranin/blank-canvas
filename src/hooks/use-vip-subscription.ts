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

  // Get the real Supabase user ID from session
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

  // Fetch VIP content (only works if user is VIP)
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

  // Create VIP charge via edge function
  const createCharge = useCallback(async (
    planType: 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    customerName?: string
  ): Promise<VIPChargeResult> => {
    if (!isAuthenticated || !userId) {
      toast({
        title: 'Faça login primeiro',
        description: 'Você precisa estar logado para assinar o VIP',
        variant: 'destructive',
      });
      return { success: false, error: 'Não autenticado' };
    }

    try {
      console.log('Creating VIP charge:', { planType, userId });
      
      const { data, error } = await supabase.functions.invoke('create-vip-charge', {
        body: { planType, customerName },
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: 'Erro ao criar cobrança',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        console.error('Charge creation failed:', data);
        toast({
          title: 'Erro ao processar',
          description: data?.error || 'Não foi possível criar a cobrança',
          variant: 'destructive',
        });
        return { success: false, error: data?.error };
      }

      console.log('VIP charge created:', data);
      return {
        success: true,
        subscriptionId: data.subscription_id,
        correlationId: data.correlation_id,
        qrCodeImage: data.qr_code_image,
        brCode: data.br_code,
        expiresAt: data.expires_at,
        amountCents: data.amount_cents,
        planType: data.plan_type,
      };

    } catch (error) {
      console.error('Unexpected error creating VIP charge:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
      return { success: false, error: 'Erro inesperado' };
    }
  }, [isAuthenticated, userId, toast]);

  // Check payment status by correlation ID
  const checkPaymentStatus = useCallback(async (correlationId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('status, paid_at')
        .eq('correlation_id', correlationId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return null;
      }

      return {
        status: data.status,
        paidAt: data.paid_at,
      };
    } catch (error) {
      console.error('Unexpected error checking status:', error);
      return null;
    }
  }, []);

  // Copy BR code to clipboard
  const copyBrCode = useCallback(async (brCode: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(brCode);
      toast({
        title: 'Código copiado!',
        description: 'Cole no app do seu banco para pagar',
      });
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Copie o código manualmente',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Cancel VIP subscription
  const cancelSubscription = useCallback(async () => {
    if (!subscription) return { success: false };

    try {
      const { data, error } = await supabase.rpc('cancel_vip_subscription', {
        p_subscription_id: subscription.id,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string } | null;
      if (result && !result.success) throw new Error(result.error || 'Failed to cancel');

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

  // Get days remaining in subscription
  const getDaysRemaining = useCallback(() => {
    if (!subscription) return 0;
    const expires = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription]);

  // Refresh subscription data (call after payment confirmed)
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
