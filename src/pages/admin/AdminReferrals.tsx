import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Copy, Gift, Loader2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Commission {
  id: string;
  status: 'pending' | 'available' | 'paid' | 'cancelled';
  base_amount_cents: number;
  commission_cents: number;
  eligible_at: string;
  paid_at: string | null;
  created_at: string;
  referred_store_id: string;
}

interface ReferredStore {
  id: string;
  name: string;
  slug: string | null;
  plan_type: string;
  status: string;
  created_at: string;
}

const AdminReferrals: React.FC = () => {
  const { store } = useTenant();
  const { t, i18n } = useTranslation();
  const [refCode, setRefCode] = useState<string>('');
  const [items, setItems] = useState<Commission[]>([]);
  const [signups, setSignups] = useState<ReferredStore[]>([]);
  const [loading, setLoading] = useState(true);

  const locale = i18n.language?.startsWith('pt') ? 'pt-BR' : i18n.language?.startsWith('es') ? 'es-ES' : 'en-US';
  const currency = i18n.language?.startsWith('pt') ? 'BRL' : 'USD';
  const fmtMoney = useMemo(
    () => (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100),
    [locale, currency]
  );
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [s, c, r] = await Promise.all([
        supabase.from('stores').select('referral_code').eq('id', store.id).maybeSingle(),
        supabase.from('referral_commissions' as any).select('*').eq('referrer_store_id', store.id).order('created_at', { ascending: false }),
        supabase.from('stores').select('id,name,slug,plan_type,status,created_at').eq('referred_by_store_id', store.id).order('created_at', { ascending: false }),
      ]);
      setRefCode((s.data as any)?.referral_code || '');
      setItems(((c.data as any) || []) as Commission[]);
      setSignups(((r.data as any) || []) as ReferredStore[]);
    } catch {
      toast.error(t('admin.referrals.loadError'));
    } finally { setLoading(false); }
  }, [store?.id, t]);

  useEffect(() => { load(); }, [load]);

  const refLink = refCode ? `${window.location.origin}/auth?tab=signup&ref=${refCode}` : '';
  const totals = items.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + c.commission_cents;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout title={t('admin.referrals.title')}>
      <div className="space-y-6">
        <GlassCard className="p-5">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">{t('admin.referrals.linkTitle')}</h2>
              <p className="text-sm text-muted-foreground">
                <Trans i18nKey="admin.referrals.description" components={{ strong: <strong /> }} />
              </p>
              {refLink ? (
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">{refLink}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(refLink); toast.success(t('admin.referrals.linkCopied')); }}>
                    <Copy className="h-4 w-4 mr-1" /> {t('admin.referrals.copy')}
                  </Button>
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">{t('admin.referrals.loadingCode')}</div>
              )}
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['available','pending','paid','cancelled'] as Commission['status'][]).map((k) => (
            <GlassCard key={k} className="p-4">
              <div className="text-xs uppercase text-muted-foreground">{t(`admin.referrals.status.${k}`)}</div>
              <div className="text-xl font-semibold mt-1">{fmtMoney(totals[k] || 0)}</div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t('admin.referrals.signupsTitle')}</h3>
            <Badge variant="outline">{t('admin.referrals.signupsCount', { count: signups.length })}</Badge>
          </div>
          {loading ? (
            <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : signups.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{t('admin.referrals.signupsEmpty')}</div>
          ) : (
            <div className="space-y-2">
              {signups.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}{s.slug ? <span className="text-xs text-muted-foreground ml-2">/{s.slug}</span> : null}</div>
                    <div className="text-xs text-muted-foreground">{t('admin.referrals.signupsJoined', { date: fmtDate(s.created_at) })}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{s.plan_type}</Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4">
          <h3 className="font-semibold mb-3">{t('admin.referrals.history')}</h3>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('admin.referrals.empty')}</div>
          ) : (
            <div className="space-y-2">
              {items.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                  <div>
                    <div className="text-sm font-medium">
                      {fmtMoney(c.commission_cents)}{' '}
                      <span className="text-xs text-muted-foreground">{t('admin.referrals.ofAmount', { amount: fmtMoney(c.base_amount_cents) })}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.status === 'pending' && t('admin.referrals.availableIn', { date: fmtDate(c.eligible_at) })}
                      {c.status === 'available' && t('admin.referrals.awaitingPayment')}
                      {c.status === 'paid' && c.paid_at && t('admin.referrals.paidOn', { date: fmtDate(c.paid_at) })}
                      {c.status === 'cancelled' && t('admin.referrals.cancelled')}
                    </div>
                  </div>
                  <Badge variant={c.status === 'paid' ? 'default' : c.status === 'cancelled' ? 'destructive' : 'outline'}>
                    {t(`admin.referrals.status.${c.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
