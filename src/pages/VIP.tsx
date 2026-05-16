import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Zap, Loader2, Copy, Clock, RefreshCw, Lock, Play, FileText, Music, Image, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getVipMediaSignedUrl } from '@/lib/external-storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VipPlanConfig {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  currency?: 'BRL' | 'USD';
  description: string;
  features: string[];
}

interface VipContentItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
  media_url: string | null;
  created_at: string;
}

interface VipSub {
  id: string;
  status: string;
  plan_type: string;
  expires_at: string;
  price_cents: number;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  post: <FileText className="w-4 h-4" />,
  video: <Play className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
};

const VIPPage = () => {
  const { session } = useAuth();
  const { store } = useTenant();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id;
  const tenantStoreId = store?.id;

  const [resolvedStoreId, setResolvedStoreId] = useState<string | undefined>(tenantStoreId);
  const [isLoading, setIsLoading] = useState(true);
  const [isVIP, setIsVIP] = useState(false);
  const [subscription, setSubscription] = useState<VipSub | null>(null);
  const [vipContent, setVipContent] = useState<VipContentItem[]>([]);
  const [vipPlans, setVipPlans] = useState<VipPlanConfig[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<VipPlanConfig | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chargeData, setChargeData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showAdultWarning, setShowAdultWarning] = useState(false);
  const [adultAccepted, setAdultAccepted] = useState(false);
  const [isAdultContent, setIsAdultContent] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve resolvedStoreId: use tenant context, or find user's associated store
  useEffect(() => {
    if (tenantStoreId) {
      setResolvedStoreId(tenantStoreId);
      return;
    }
    if (!userId) {
      setResolvedStoreId(undefined);
      return;
    }
    const resolve = async () => {
      // Check if user is a store admin
      const { data: adminStore } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (adminStore?.store_id) {
        setResolvedStoreId(adminStore.store_id);
        return;
      }
      // Check if user belongs to a store
      const { data: userStore } = await supabase
        .from('store_users')
        .select('store_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (userStore?.store_id) {
        setResolvedStoreId(userStore.store_id);
        return;
      }
      // Check if user created a store
      const { data: ownedStore } = await supabase
        .from('stores')
        .select('id')
        .eq('created_by', userId)
        .limit(1)
        .maybeSingle();
      if (ownedStore?.id) {
        setResolvedStoreId(ownedStore.id);
        return;
      }
      setResolvedStoreId(undefined);
    };
    resolve();
  }, [tenantStoreId, userId]);

  // Check adult content setting
  useEffect(() => {
    if (!resolvedStoreId) return;
    const checkAdult = async () => {
      const { data } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'vip_adult_content')
        .eq('store_id', resolvedStoreId)
        .maybeSingle();
      if (data?.config_value && (data.config_value as any).enabled === true) {
        setIsAdultContent(true);
        if (!adultAccepted) {
          setShowAdultWarning(true);
        }
      }
    };
    checkAdult();
  }, [resolvedStoreId, adultAccepted]);

  // Load VIP plans strictly from this store's config (never fall back to global)
  useEffect(() => {
    const loadPlans = async () => {
      const { loadVipPlansForStore } = await import('@/lib/vip-plans-loader');
      const { plans } = await loadVipPlansForStore(resolvedStoreId);
      setVipPlans(plans);
      setSelectedPlan(plans.length > 0 ? plans[0] : null);
    };
    loadPlans();
  }, [resolvedStoreId]);

  // Check VIP status and load content
  useEffect(() => {
    const checkVIP = async () => {
      setIsLoading(true);
      if (!userId) {
        setIsVIP(false);
        setIsLoading(false);
        return;
      }

      let subQuery = supabase
        .from('vip_subscriptions')
        .select('id, status, plan_type, expires_at, price_cents')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());
      
      if (resolvedStoreId) subQuery = subQuery.eq('store_id', resolvedStoreId);
      else subQuery = subQuery.is('store_id', null);

      const { data: sub } = await subQuery.maybeSingle();

      if (sub) {
        setIsVIP(true);
        setSubscription(sub as VipSub);

        // Load exclusive content
        let contentQuery = supabase
          .from('vip_content')
          .select('id, title, content, content_type, media_url, created_at')
          .order('created_at', { ascending: false });
        
        if (resolvedStoreId) contentQuery = contentQuery.eq('store_id', resolvedStoreId);
        else contentQuery = contentQuery.is('store_id', null);

        const { data: contentData } = await contentQuery;

        setVipContent((contentData || []) as VipContentItem[]);
      } else {
        setIsVIP(false);
        setSubscription(null);
      }
      setIsLoading(false);
    };
    checkVIP();
  }, [userId, resolvedStoreId]);

  // Poll payment status
  useEffect(() => {
    if (chargeData?.correlationId && showPaymentDialog) {
      const poll = async () => {
        const { data } = await supabase
          .from('custom_orders')
          .select('status, paid_at')
          .eq('correlation_id', chargeData.correlationId)
          .single();

        if (data?.status === 'paid') {
          setPaymentStatus('paid');
          // Refresh subscription
          if (userId && resolvedStoreId) {
            const { data: sub } = await supabase
              .from('vip_subscriptions')
              .select('id, status, plan_type, expires_at, price_cents')
              .eq('user_id', userId)
              .eq('store_id', resolvedStoreId)
              .eq('status', 'active')
              .gt('expires_at', new Date().toISOString())
              .maybeSingle();
            if (sub) {
              setIsVIP(true);
              setSubscription(sub as VipSub);
            }
          }
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      };
      pollingRef.current = setInterval(poll, 3000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [chargeData?.correlationId, showPaymentDialog, userId, resolvedStoreId]);

  const formatCurrency = (value: number, currency?: 'BRL' | 'USD') => {
    const cur = currency || (i18n.language?.startsWith('pt') ? 'BRL' : 'USD');
    const locale = cur === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cur,
    }).format(value);
  };

  const getPlanLabel = (type: string) => {
    switch (type) {
      case 'monthly': return '/mo';
      case 'quarterly': return '/quarter';
      case 'yearly': return '/year';
      default: return '';
    }
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const diff = new Date(subscription.expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowPurchaseDialog(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    if (!resolvedStoreId) {
      toast({ title: 'Error', description: 'Store context is required for payment. Access via a creator\'s store link.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-vip-charge', {
        body: {
          planType: selectedPlan.type,
          storeId: resolvedStoreId,
          affiliateCode: getAffiliateCode(resolvedStoreId) || undefined,
          successUrl: `${window.location.origin}${window.location.pathname}?payment=success`,
          cancelUrl: `${window.location.origin}${window.location.pathname}?payment=cancelled`,
        },
      });

      if (error || !data?.success) {
        toast({ title: 'Error', description: data?.error || error?.message || 'Failed to create charge', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      setChargeData({
        correlationId: data.correlation_id,
        qrCodeImage: data.qr_code_image,
        brCode: data.br_code,
        expiresAt: data.expires_at,
        amountCents: data.amount_cents,
      });
      setPaymentStatus('pending');
      setShowPurchaseDialog(false);
      setShowPaymentDialog(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCode = async () => {
    if (chargeData?.brCode) {
      try {
        await navigator.clipboard.writeText(chargeData.brCode);
        toast({ title: 'Code copied!' });
      } catch {
        toast({ title: 'Copy failed', variant: 'destructive' });
      }
    }
  };

  const handleClosePayment = () => {
    setShowPaymentDialog(false);
    setChargeData(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    const { error } = await supabase
      .from('vip_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscription.id);

    if (error) {
      toast({ title: 'Error cancelling', variant: 'destructive' });
    } else {
      setIsVIP(false);
      setSubscription(null);
      toast({ title: 'Subscription cancelled', description: 'Access remains until the end of your paid period.' });
    }
  };

  const featuredPlan = vipPlans.find(p => p.type === 'monthly') || vipPlans[0];

  const adultWarningDialog = isAdultContent ? (
    <AlertDialog open={showAdultWarning} onOpenChange={(open) => { if (!open && !adultAccepted) return; setShowAdultWarning(open); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            {t('vip.adultWarningTitle', 'Aviso de Conteúdo +18')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            {t('vip.adultWarningDesc', 'Esta área contém conteúdo exclusivo para maiores de 18 anos. Ao continuar, você confirma que tem idade legal para visualizar este tipo de conteúdo.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => window.history.back()}>
            {t('vip.adultWarningLeave', 'Sair')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => { setAdultAccepted(true); setShowAdultWarning(false); }} className="bg-destructive hover:bg-destructive/90">
            {t('vip.adultWarningAccept', 'Tenho +18, continuar')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  if (isLoading) {
    return (
      <MobileLayout title="VIP">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  // ── VIP User: Show Content ──
  if (isVIP && subscription) {
    return (
      <MobileLayout title="VIP">
        <div className="px-4 py-6 space-y-6">
          {/* Status Card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard glow className="text-center py-8 relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
              >
                <Crown className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h2 className="font-display text-xl font-bold mb-2">You're VIP! 👑</h2>
              <Badge className="bg-primary/20 text-primary mb-4 capitalize">{subscription.plan_type} Plan</Badge>
              <p className="text-muted-foreground text-sm">{getDaysRemaining()} days remaining</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expires {new Date(subscription.expires_at).toLocaleDateString()}
              </p>
            </GlassCard>
          </motion.div>

          {/* Exclusive Content */}
          <div>
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Exclusive Content
            </h3>
            <div className="space-y-3">
              {vipContent.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {contentTypeIcons[item.content_type] || <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.content}</p>
                        {item.media_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 text-xs"
                            onClick={async () => {
                              const url = await getVipMediaSignedUrl(item.media_url!);
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            View Media
                          </Button>
                        )}
                        <span className="text-[10px] text-muted-foreground block mt-2">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              {vipContent.length === 0 && (
                <GlassCard className="p-8 text-center">
                  <p className="text-muted-foreground">No exclusive content yet. Check back soon!</p>
                </GlassCard>
              )}
            </div>
          </div>

        </div>
      {adultWarningDialog}
      </MobileLayout>
    );
  }

  // ── Non-VIP: Show Plans ──
  return (
    <MobileLayout title="VIP">
      <div className="px-4 py-6 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard glow className="text-center py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
            >
              <Crown className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h2 className="font-display text-xl font-bold mb-2">VIP Subscription</h2>
            {featuredPlan && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="font-display text-3xl font-bold text-primary">
                  {formatCurrency(featuredPlan.price, featuredPlan.currency)}
                </span>
                <span className="text-muted-foreground">{getPlanLabel(featuredPlan.type)}</span>
              </div>
            )}
            <Button onClick={handleSubscribe} className="bg-primary text-primary-foreground gap-2">
              <Zap className="w-4 h-4" />
              Subscribe Now
            </Button>
          </GlassCard>
        </motion.div>

        {/* Plans Preview */}
        {vipPlans.length > 1 && (
          <div>
            <h3 className="font-display font-semibold mb-3">Available Plans</h3>
            <div className="space-y-3">
              {vipPlans.map(plan => (
                <GlassCard key={plan.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{plan.name}</h4>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(plan.price, plan.currency)}</p>
                      <p className="text-xs text-muted-foreground">{getPlanLabel(plan.type)}</p>
                    </div>
                  </div>
                  {plan.features.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Check className="w-3 h-3 text-primary shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Blurred Content Preview */}
        <div>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Exclusive Content
          </h3>
          <div className="space-y-3 relative">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-4 blur-[6px] pointer-events-none select-none">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded mb-2" />
                    <div className="h-3 w-full bg-muted/60 rounded mb-1" />
                    <div className="h-3 w-2/3 bg-muted/40 rounded" />
                  </div>
                </div>
              </GlassCard>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-semibold">Subscribe to unlock</p>
              </div>
            </div>
          </div>
        </div>

        {vipPlans.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">VIP plans are not configured yet.</p>
          </GlassCard>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} message="Log in to subscribe to VIP" />

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Subscribe VIP
            </DialogTitle>
            <DialogDescription>Choose your plan and complete payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3">
              {vipPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPlan?.id === plan.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">{plan.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{formatCurrency(plan.price, plan.currency)}</div>
                      <div className="text-xs text-muted-foreground">{getPlanLabel(plan.type)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowPurchaseDialog(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleConfirmSubscription} disabled={isProcessing || !selectedPlan}>
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Continue to Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={handleClosePayment}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              PIX Payment
            </DialogTitle>
            <DialogDescription>
              {paymentStatus === 'paid' ? 'Payment confirmed!' : 'Scan the QR Code or copy the code'}
            </DialogDescription>
          </DialogHeader>

          {paymentStatus === 'paid' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Welcome to VIP! 👑</h3>
              <p className="text-sm text-muted-foreground mb-4">Your subscription has been activated</p>
              <Button onClick={handleClosePayment}>View Content</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {chargeData?.qrCodeImage && (
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <img src={chargeData.qrCodeImage} alt="QR Code PIX" className="w-48 h-48" />
                  </div>
                </div>
              )}

              {chargeData?.amountCents && (
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(chargeData.amountCents / 100, selectedPlan?.currency)}
                  </span>
                </div>
              )}

              {chargeData?.brCode && (
                <div>
                  <div className="bg-muted p-3 rounded-lg text-xs break-all font-mono max-h-20 overflow-auto">
                    {chargeData.brCode}
                  </div>
                  <Button variant="outline" className="w-full mt-2 gap-2" onClick={handleCopyCode}>
                    <Copy className="w-4 h-4" />
                    Copy PIX Code
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Waiting for payment confirmation...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {adultWarningDialog}
    </MobileLayout>
  );
};

export default VIPPage;
