import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Loader2, ShieldOff, Save, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Config {
  enabled: boolean;
  commission_percent: number;
  cookie_days: number;
  holding_days: number;
  min_payout_cents: number;
  rules_md: string;
}

const defaults: Config = {
  enabled: false,
  commission_percent: 20,
  cookie_days: 30,
  holding_days: 14,
  min_payout_cents: 5000,
  rules_md: '',
};

const fmt = (c: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((c || 0) / 100);

const AdminAffiliates: React.FC = () => {
  const { store } = useTenant();
  const [tab, setTab] = useState('config');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>(defaults);
  const [savingCfg, setSavingCfg] = useState(false);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payDialog, setPayDialog] = useState<any | null>(null);
  const [rejectDialog, setRejectDialog] = useState<any | null>(null);
  const [noteText, setNoteText] = useState('');

  const call = useCallback(async (action: string, extra: any = {}) => {
    if (!store?.id) return null;
    const { data, error } = await supabase.functions.invoke('store-affiliate-admin', {
      body: { action, store_id: store.id, ...extra },
    });
    if (error || data?.error) { toast.error(data?.error || error?.message || 'Erro'); return null; }
    return data;
  }, [store?.id]);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    const [cfg, aff, com, pay] = await Promise.all([
      call('get_config'), call('list_affiliates'), call('list_commissions'), call('list_payouts'),
    ]);
    if (cfg?.config) setConfig({ ...defaults, ...cfg.config });
    setAffiliates(aff?.items || []);
    setCommissions(com?.items || []);
    setPayouts(pay?.items || []);
    setLoading(false);
  }, [store?.id, call]);

  useEffect(() => { load(); }, [load]);

  const saveConfig = async () => {
    setSavingCfg(true);
    const r = await call('update_config', { config });
    setSavingCfg(false);
    if (r?.success) toast.success('Configuração salva');
  };

  const totals = useMemo(() => {
    const t: Record<string, number> = { pending: 0, available: 0, paid: 0, cancelled: 0 };
    for (const c of commissions) t[c.status] = (t[c.status] || 0) + (c.commission_cents || 0);
    return t;
  }, [commissions]);

  const requestedPayouts = payouts.filter(p => p.status === 'requested');

  return (
    <AdminLayout title="Afiliados">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['available','pending','paid','cancelled'] as const).map((k) => (
            <GlassCard key={k} className="p-4">
              <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
              <div className="text-lg font-semibold mt-1">{fmt(totals[k] || 0)}</div>
            </GlassCard>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="payouts">Saques {requestedPayouts.length ? <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{requestedPayouts.length}</span> : null}</TabsTrigger>
            <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="mt-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Programa ativo</Label>
                  <p className="text-xs text-muted-foreground">Permite que clientes virem afiliados.</p>
                </div>
                <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>% Comissão</Label>
                  <Input type="number" min={1} max={90} value={config.commission_percent} onChange={(e) => setConfig({ ...config, commission_percent: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Dias do cookie</Label>
                  <Input type="number" min={1} max={365} value={config.cookie_days} onChange={(e) => setConfig({ ...config, cookie_days: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Dias de carência</Label>
                  <Input type="number" min={0} max={180} value={config.holding_days} onChange={(e) => setConfig({ ...config, holding_days: Number(e.target.value) })} />
                  <p className="text-[11px] text-muted-foreground mt-1">Dias após pagamento até a comissão liberar.</p>
                </div>
                <div>
                  <Label>Mínimo para saque (R$)</Label>
                  <Input type="number" min={0} step={1} value={(config.min_payout_cents / 100).toFixed(2)} onChange={(e) => setConfig({ ...config, min_payout_cents: Math.round(Number(e.target.value) * 100) })} />
                </div>
              </div>
              <div>
                <Label>Regras / observações (texto exibido ao afiliado)</Label>
                <Textarea rows={5} value={config.rules_md} onChange={(e) => setConfig({ ...config, rules_md: e.target.value })} placeholder="Ex: Pagamento via PIX em até 5 dias úteis após solicitação..." />
              </div>
              <Button onClick={saveConfig} disabled={savingCfg}>{savingCfg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salvar</Button>
            </GlassCard>
          </TabsContent>

          <TabsContent value="payouts" className="mt-4">
            <GlassCard className="p-5">
              {loading ? <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sem solicitações de saque.</p>
              ) : (
                <div className="space-y-2">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 text-sm">
                      <div>
                        <div className="font-medium">{fmt(p.amount_cents)} <span className="text-xs text-muted-foreground">— {p.store_affiliates?.code}</span></div>
                        <div className="text-xs text-muted-foreground">{new Date(p.requested_at).toLocaleString('pt-BR')}</div>
                        {p.note && <div className="text-xs mt-1">{p.note}</div>}
                        {p.reject_reason && <div className="text-xs text-destructive mt-1">{p.reject_reason}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === 'paid' ? 'default' : p.status === 'rejected' ? 'destructive' : 'outline'}>{p.status}</Badge>
                        {p.status === 'requested' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setPayDialog(p); setNoteText(''); }}><CheckCircle2 className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => { setRejectDialog(p); setNoteText(''); }}><X className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="affiliates" className="mt-4">
            <GlassCard className="p-5">
              {loading ? <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : affiliates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum afiliado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {affiliates.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 text-sm">
                      <div>
                        <div className="font-medium">{a.display_name || a.user_id.slice(0, 8)} <span className="text-xs text-muted-foreground ml-2">/{a.code}</span></div>
                        <div className="text-xs text-muted-foreground">
                          Pago: {fmt(a.totals?.paid || 0)} • Disponível: {fmt(a.totals?.available || 0)} • Pendente: {fmt(a.totals?.pending || 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.status === 'active' ? 'outline' : 'destructive'}>{a.status}</Badge>
                        <Button size="sm" variant="ghost" onClick={async () => { await call('ban_affiliate', { affiliate_id: a.id, ban: a.status === 'active' }); load(); }}>
                          {a.status === 'active' ? <Ban className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="commissions" className="mt-4">
            <GlassCard className="p-5">
              {loading ? <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma comissão.</p>
              ) : (
                <div className="space-y-2">
                  {commissions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 text-sm">
                      <div>
                        <div className="font-medium">{fmt(c.commission_cents)} <span className="text-xs text-muted-foreground">de {fmt(c.base_amount_cents)} • {c.source_type === 'vip_subscription' ? 'VIP' : 'Custom'}</span></div>
                        <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <Badge variant={c.status === 'paid' ? 'default' : c.status === 'cancelled' ? 'destructive' : 'outline'}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!payDialog} onOpenChange={(v) => !v && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marcar como pago</DialogTitle></DialogHeader>
          <div>
            <p className="text-sm mb-3">Valor: <strong>{payDialog && fmt(payDialog.amount_cents)}</strong></p>
            <Label>Observação (ex: comprovante PIX)</Label>
            <Textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayDialog(null)}>Cancelar</Button>
            <Button onClick={async () => { if (!payDialog) return; const r = await call('mark_payout_paid', { payout_id: payDialog.id, note: noteText }); if (r?.success) { toast.success('Marcado como pago'); setPayDialog(null); load(); } }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectDialog} onOpenChange={(v) => !v && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar saque</DialogTitle></DialogHeader>
          <div>
            <Label>Motivo</Label>
            <Textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (!rejectDialog) return; const r = await call('reject_payout', { payout_id: rejectDialog.id, reason: noteText }); if (r?.success) { toast.success('Rejeitado'); setRejectDialog(null); load(); } }}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAffiliates;
