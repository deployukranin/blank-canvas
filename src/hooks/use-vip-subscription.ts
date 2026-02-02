import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VIPSubscription {
  id: string;
  user_id: string;
  status: 'active' | 'cancelled' | 'expired';
  plan_type: 'monthly' | 'yearly';
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

export const useVIPSubscription = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<VIPSubscription | null>(null);
  const [isVIP, setIsVIP] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vipContent, setVIPContent] = useState<VIPContent[]>([]);

  // Fetch user's VIP subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated || !user?.id) {
        setSubscription(null);
        setIsVIP(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vip_subscriptions')
          .select('*')
          .eq('user_id', user.id)
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
  }, [isAuthenticated, user?.id]);

  // Fetch VIP content (only works if user is VIP)
  const fetchVIPContent = async () => {
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
  };

  useEffect(() => {
    if (isVIP) {
      fetchVIPContent();
    }
  }, [isVIP]);

  // Subscribe to VIP
  const subscribe = async (planType: 'monthly' | 'yearly' = 'monthly') => {
    if (!isAuthenticated || !user?.id) {
      toast({
        title: 'Faça login primeiro',
        description: 'Você precisa estar logado para assinar o VIP',
        variant: 'destructive',
      });
      return { success: false };
    }

    const priceMonthly = 1990; // R$ 19,90
    const priceYearly = 19900; // R$ 199,00
    const priceCents = planType === 'monthly' ? priceMonthly : priceYearly;
    
    const expiresAt = new Date();
    if (planType === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    try {
      const { data, error } = await supabase
        .from('vip_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planType,
          price_cents: priceCents,
          expires_at: expiresAt.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        // Check if user already has active subscription
        if (error.code === '23505') {
          toast({
            title: 'Você já é VIP!',
            description: 'Sua assinatura VIP ainda está ativa',
          });
          return { success: false };
        }
        throw error;
      }

      setSubscription(data as VIPSubscription);
      setIsVIP(true);

      toast({
        title: 'Bem-vindo ao VIP! 👑',
        description: 'Sua assinatura foi ativada com sucesso',
      });

      return { success: true, subscription: data };
    } catch (error) {
      console.error('Error subscribing to VIP:', error);
      toast({
        title: 'Erro ao assinar',
        description: 'Não foi possível processar sua assinatura',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  // Cancel VIP subscription
  const cancelSubscription = async () => {
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
  };

  // Get days remaining in subscription
  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const expires = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return {
    subscription,
    isVIP,
    isLoading,
    vipContent,
    subscribe,
    cancelSubscription,
    getDaysRemaining,
    refetchContent: fetchVIPContent,
  };
};
