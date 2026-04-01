import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const MyOrdersRedirect = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const userId = session?.user?.id;
    if (!userId) {
      navigate('/auth', { replace: true });
      return;
    }

    let cancelled = false;

    const resolveStoreSlug = async () => {
      const [adminResult, memberResult, orderResult, subscriptionResult, ownedStoreResult] = await Promise.all([
        supabase
          .from('store_admins')
          .select('store_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('store_users')
          .select('store_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('custom_orders')
          .select('store_id')
          .eq('user_id', userId)
          .not('store_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('vip_subscriptions')
          .select('store_id')
          .eq('user_id', userId)
          .not('store_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('stores')
          .select('id')
          .eq('created_by', userId)
          .limit(1)
          .maybeSingle(),
      ]);

      const storeId =
        adminResult.data?.store_id ??
        memberResult.data?.store_id ??
        orderResult.data?.store_id ??
        subscriptionResult.data?.store_id ??
        ownedStoreResult.data?.id ??
        null;

      if (!storeId) {
        if (!cancelled) navigate('/auth', { replace: true });
        return;
      }

      const { data: store } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .maybeSingle();

      if (cancelled) return;

      if (store?.slug) {
        navigate(`/${store.slug}/meus-pedidos`, { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    };

    resolveStoreSlug();

    return () => {
      cancelled = true;
    };
  }, [isLoading, navigate, session?.user?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};
