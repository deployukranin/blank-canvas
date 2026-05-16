import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, Ban, RefreshCw, Users, ChevronDown, ChevronRight } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fmtBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

interface Commission {
  id: string;
  status: 'pending' | 'available' | 'paid' | 'cancelled';
  base_amount_cents: number;
  commission_cents: number;
  commission_percent: number;
  eligible_at: string;
  paid_at: string | null;
  payment_note: string | null;
  cancel_reason: string | null;
  created_at: string;
  referrer: { name: string; slug: string | null; email: string | null } | null;
  referred: { name: string; slug: string | null; email: string | null; plan_type: string; status: string } | null;
}

const STATUS_TABS: Array<{ key: Commission['status']; label: string }> = [
  { key: 'available', label: 'Disponíveis' },
  { key: 'pending', label: 'Em carência' },
  { key: 'paid', label: 'Pagas' },
  { key: 'cancelled', label: 'Canceladas' },
];

interface ReferrerGroup {
  referrer_id: string;
  referrer: { name: string; slug: string | null; email: string | null } | null;
  signups: Array<{ id: string; name: string; slug: string | null; plan_type: string; status: string; created_at: string; email: string | null }>;
  commissions: Commission[];
  totals: { pending: number; available: number; paid: number; cancelled: number; signups: number };
}

const SuperAdminReferrals: React.FC = () => {
  const [view, setView] = useState<'by_status' | 'by_referrer'>('by_referrer');
  const [tab, setTab] = useState<Commission['status']>('available');
  const [items, setItems] = useState<Commission[]>([]);
  const [groups, setGroups] = useState<ReferrerGroup[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ sum_cents: Record<string, number>; count: Record<string, number> } | null>(null);
  const [payOpen, setPayOpen] = useState<Commission | null>(null);
  const [payNote, setPayNote] = useState('');
  const [cancelOpen, setCancelOpen] = useState<Commission | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async (status: Commission['status']) => {
    setLoading(true);
    try {
      const [list, sum, grp] = await Promise.all([
        supabase.functions.invoke('super-admin-referrals', { body: { action: 'list', status } }),
        supabase.functions.invoke('super-admin-referrals', { body: { action: 'summary' } }),
        supabase.functions.invoke('super-admin-referrals', { body: { action: 'by_referrer' } }),
      ]);
      if (list.error) throw list.error;
      if (list.data?.error) throw new Error(list.data.error);
      setItems(list.data?.commissions || []);
      if (!sum.error && !sum.data?.error) setSummary(sum.data);
      if (!grp.error && !grp.data?.error) setGroups(grp.data?.groups || []);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar comissões');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [load, tab]);

  const handleMarkPaid = async () => {
    if (!payOpen) return;
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-referrals', {
        body: { action: 'mark_paid', id: payOpen.id, payment_note: payNote },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Comissão marcada como paga');
      setPayOpen(null); setPayNote('');
      load(tab);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao marcar como paga');
    } finally { setActing(false); }
  };

  const handleCancel = async () => {
    if (!cancelOpen) return;
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-referrals', {
        body: { action: 'cancel', id: cancelOpen.id, cancel_reason: cancelReason },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Comissão cancelada');
      setCancelOpen(null); setCancelReason('');
      load(tab);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao cancelar');
    } finally { setActing(false); }
  };

  return (
    <SuperAdminLayout title="Indicações">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Indicações</h1>
            <p className="text-sm text-muted-foreground">Comissões de indicação entre lojas — pagamento manual.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(tab)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATUS_TABS.map((s) => (
              <GlassCard key={s.key} className="p-4">
                <div className="text-xs uppercase text-muted-foreground">{s.label}</div>
                <div className="text-xl font-semibold mt-1">{fmtBRL(summary.sum_cents[s.key] || 0)}</div>
                <div className="text-xs text-muted-foreground">{summary.count[s.key] || 0} comissões</div>
              </GlassCard>
            ))}
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as Commission['status'])}>
          <TabsList>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>
            ))}
          </TabsList>
          {STATUS_TABS.map((s) => (
            <TabsContent key={s.key} value={s.key} className="mt-4">
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : items.length === 0 ? (
                <GlassCard className="p-8 text-center text-muted-foreground">Nenhuma comissão {s.label.toLowerCase()}.</GlassCard>
              ) : (
                <div className="space-y-3">
                  {items.map((c) => (
                    <GlassCard key={c.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Indicador</div>
                          <div className="font-medium">{c.referrer?.name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{c.referrer?.email || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Loja indicada</div>
                          <div className="font-medium">
                            {c.referred?.name || '—'}
                            {c.referred && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                {c.referred.plan_type}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.referred?.email || '—'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Comissão ({c.commission_percent}%)</div>
                          <div className="text-lg font-semibold">{fmtBRL(c.commission_cents)}</div>
                          <div className="text-xs text-muted-foreground">de {fmtBRL(c.base_amount_cents)}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div>
                          {c.status === 'pending' && <>Liberação em <strong>{new Date(c.eligible_at).toLocaleDateString('pt-BR')}</strong></>}
                          {c.status === 'available' && <>Disponível desde <strong>{new Date(c.eligible_at).toLocaleDateString('pt-BR')}</strong></>}
                          {c.status === 'paid' && c.paid_at && <>Paga em <strong>{new Date(c.paid_at).toLocaleDateString('pt-BR')}</strong>{c.payment_note && <> — {c.payment_note}</>}</>}
                          {c.status === 'cancelled' && <>Cancelada{c.cancel_reason && <> — {c.cancel_reason}</>}</>}
                        </div>
                        <div className="flex gap-2">
                          {c.status === 'available' && (
                            <Button size="sm" onClick={() => { setPayOpen(c); setPayNote(''); }}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Marcar como paga
                            </Button>
                          )}
                          {(c.status === 'pending' || c.status === 'available') && (
                            <Button size="sm" variant="outline" onClick={() => { setCancelOpen(c); setCancelReason(''); }}>
                              <Ban className="h-3.5 w-3.5 mr-1" /> Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar comissão como paga</DialogTitle>
          </DialogHeader>
          {payOpen && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {fmtBRL(payOpen.commission_cents)} para <strong>{payOpen.referrer?.name}</strong> ({payOpen.referrer?.email}).
              </div>
              <Textarea
                placeholder="Observação / comprovante PIX (opcional)"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(null)} disabled={acting}>Cancelar</Button>
            <Button onClick={handleMarkPaid} disabled={acting}>
              {acting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelOpen} onOpenChange={(o) => !o && setCancelOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar comissão</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motivo do cancelamento"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(null)} disabled={acting}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={acting}>
              {acting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Cancelar comissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminReferrals;
