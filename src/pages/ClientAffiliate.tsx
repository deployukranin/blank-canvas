import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Copy, Loader2, Share2, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'sonner';

interface AffRow { id: string; code: string; status: string }
interface Commission { id: string; status: string; commission_cents: number; base_amount_cents: number; created_at: string; eligible_at: string; source_type: string }
interface Payout { id: string; amount_cents: number; status: string; requested_at: string; paid_at: string | null; note: string | null; reject_reason: string | null }
interface Config { enabled: boolean; commission_percent: number; cookie_days: number; holding_days: number; min_payout_cents: number; rules_md: string }

const fmt = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);

const ClientAffiliate: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { store, basePath } = useTenant();

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [aff, setAff] = useState<AffRow | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  const load = useCallback(async () => {
    if (!store?.id || !user?.id) return;
    setLoading(true);
    try {
      const [cfgRes, affRes] = await Promise.all([
        supabase.from('app_configurations').select('config_value').eq('store_id', store.id).eq('config_key', 'affiliate_config').maybeSingle(),
        supabase.from('store_affiliates').select('id, code, status').eq('store_id', store.id).eq('user_id', user.id).maybeSingle(),
      ]);
      setConfig((cfgRes.data?.config_value as Config) || null);
      const row = (affRes.data as AffRow) || null;
      setAff(row);
      if (row) {
        const [cRes, pRes] = await Promise.all([
          supabase.from('affiliate_commissions').select('*').eq('affiliate_id', row.id).order('created_at', { ascending: false }).limit(200),
          supabase.from('affiliate_payouts').select('*').eq('affiliate_id', row.id).order('requested_at', { ascending: false }).limit(100),
        ]);
        setCommissions((cRes.data as Commission[]) || []);
        setPayouts((pRes.data as Payout[]) || []);
      }
    } finally { setLoading(false); }
  }, [store?.id, user?.id]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const t: Record<string, number> = { pending: 0, available: 0, paid: 0, cancelled: 0 };
    for (const c of commissions) t[c.status] = (t[c.status] || 0) + (c.commission_cents || 0);
    return t;
  }, [commissions]);

  const handleActivate = async () => {
    if (!store?.id || !user?.id) return;
    setActivating(true);
    const { error } = await supabase.from('store_affiliates').insert({ store_id: store.id, user_id: user.id, code: '' });
    setActivating(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Você agora é afiliado!');
    load();
  };

  const handleRequestPayout = async () => {
    if (!store?.id) return;
    setRequestingPayout(true);
    const { data, error } = await supabase.functions.invoke('affiliate-request-payout', { body: { store_id: store.id } });
    setRequestingPayout(false);
    if (error || !data?.success) { toast.error(data?.error || error?.message || 'Falha'); return; }
    toast.success('Solicitação enviada!');
    load();
  };

  if (!isAuthenticated) {
    navigate(`${basePath}/login`);
    return null;
  }

  if (loading) {
    return <Layout><div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></Layout>;
  }

  if (!config?.enabled) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <GlassCard className="p-8 text-center">
            <Share2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h1 className="text-xl font-semibold">Programa de afiliados indisponível</h1>
            <p className="text-sm text-muted-foreground mt-2">Esta loja ainda não habilitou o programa de afiliados.</p>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  const refLink = aff
    ? `${window.location.origin}${basePath}?aff=${aff.code}`
    : '';
  const available = totals.available || 0;
  const minPayout = config.min_payout_cents || 0;
  const canRequest = aff?.status === 'active' && available > 0 && available >= minPayout && !payouts.some(p => p.status === 'requested');

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Seja afiliado de {store?.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Ganhe {config.commission_percent}% por cada venda feita pelo seu link.</p>
        </header>

        {!aff ? (
          <GlassCard className="p-6 text-center space-y-3">
            <Share2 className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Ative seu modo afiliado</h2>
            <p className="text-sm text-muted-foreground">
              Você receberá um link único. Compras feitas a partir dele rendem comissão para você.
            </p>
            <Button onClick={handleActivate} disabled={activating}>{activating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Quero ser afiliado'}</Button>
          </GlassCard>
        ) : (
          <>
            {aff.status === 'banned' && (
              <GlassCard className="p-4 border-destructive/40">
                <p className="text-sm text-destructive">Sua conta de afiliado foi suspensa pelo dono da loja.</p>
              </GlassCard>
            )}

            <GlassCard className="p-5">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Seu link</h2>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">{refLink}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(refLink); toast.success('Link copiado'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cookie ativo por {config.cookie_days} dias. Comissões liberam {config.holding_days} dias após o pagamento.
              </p>
            </GlassCard>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['available','pending','paid','cancelled'] as const).map((k) => (
                <GlassCard key={k} className="p-4">
                  <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                  <div className="text-lg font-semibold mt-1">{fmt(totals[k] || 0)}</div>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4" /> Solicitar saque</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mínimo: {fmt(minPayout)} • Disponível: <strong>{fmt(available)}</strong>
                  </p>
                </div>
                <Button onClick={handleRequestPayout} disabled={!canRequest || requestingPayout}>
                  {requestingPayout ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Solicitar'}
                </Button>
              </div>
            </GlassCard>

            {config.rules_md && (
              <GlassCard className="p-5">
                <h2 className="font-semibold mb-2">Regras</h2>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{config.rules_md}</pre>
              </GlassCard>
            )}

            <GlassCard className="p-5">
              <h2 className="font-semibold mb-3">Histórico de comissões</h2>
              {commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma comissão ainda.</p>
              ) : (
                <div className="space-y-2">
                  {commissions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 text-sm">
                      <div>
                        <div className="font-medium">{fmt(c.commission_cents)} <span className="text-xs text-muted-foreground">de {fmt(c.base_amount_cents)} ({c.source_type === 'vip_subscription' ? 'VIP' : 'Custom'})</span></div>
                        <div className="text-xs text-muted-foreground">
                          {c.status === 'pending' && `Libera em ${new Date(c.eligible_at).toLocaleDateString('pt-BR')}`}
                          {c.status === 'available' && 'Disponível para saque'}
                          {c.status === 'paid' && 'Pago'}
                          {c.status === 'cancelled' && 'Cancelado'}
                        </div>
                      </div>
                      <Badge variant={c.status === 'paid' ? 'default' : c.status === 'cancelled' ? 'destructive' : 'outline'}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="font-semibold mb-3">Saques</h2>
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem solicitações.</p>
              ) : (
                <div className="space-y-2">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 text-sm">
                      <div>
                        <div className="font-medium">{fmt(p.amount_cents)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.requested_at).toLocaleDateString('pt-BR')}</div>
                        {p.note && <div className="text-xs mt-1">{p.note}</div>}
                        {p.reject_reason && <div className="text-xs text-destructive mt-1">{p.reject_reason}</div>}
                      </div>
                      <Badge variant={p.status === 'paid' ? 'default' : p.status === 'rejected' ? 'destructive' : 'outline'}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ClientAffiliate;
