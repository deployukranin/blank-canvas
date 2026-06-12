import React, { useEffect, useState, useCallback } from 'react';
import {
  Store, Users, Mail, Copy, ChevronDown, ChevronRight, Loader2, Clock,
  Handshake, Gift, TrendingUp, MessageCircle, DollarSign,
} from 'lucide-react';
import SuperAdminLayout from '../SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fmtBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

async function callPortal<T = any>(section: string): Promise<T | null> {
  const { data, error } = await supabase.functions.invoke('tracker-portal', { body: { section } });
  if (error) { toast.error(error.message || 'Erro ao carregar'); return null; }
  if (data?.error) { toast.error(data.error); return null; }
  return data as T;
}

const Empty = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <GlassCard className="p-8 text-center">
    <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
    <p className="text-muted-foreground">{label}</p>
  </GlassCard>
);

const Loading = () => (
  <p className="text-muted-foreground text-sm flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
  </p>
);

/* ============================ TENANTS ============================ */
export const TrackerTenants: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { callPortal('tenants').then((d) => { setTenants(d?.tenants || []); setLoading(false); }); }, []);

  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;
  return (
    <SuperAdminLayout title="Plataformas">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 text-center"><p className="text-2xl font-bold">{tenants.length}</p><p className="text-xs text-muted-foreground">Total</p></GlassCard>
          <GlassCard className="p-4 text-center"><p className="text-2xl font-bold text-green-400">{tenants.filter(t => t.status === 'active').length}</p><p className="text-xs text-muted-foreground">Ativas</p></GlassCard>
        </div>
        {loading ? <Loading /> : tenants.length === 0 ? <Empty icon={Store} label="Nenhuma plataforma veio do seu tracking ainda" /> : (
          <div className="space-y-3">
            {tenants.map((t) => (
              <GlassCard key={t.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold truncate">{t.name}</h4>
                  <Badge variant={t.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">{t.status === 'active' ? 'Ativa' : 'Suspensa'}</Badge>
                  <Badge variant="outline" className="text-[10px]">{isExpired(t.plan_expires_at) ? 'Expirado' : t.plan_type}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {t.slug && <span>/{t.slug}</span>}
                  <span>Criada em {new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                  {t.plan_expires_at && <span><Clock className="w-3 h-3 inline mr-1" />{isExpired(t.plan_expires_at) ? 'Expirado' : new Date(t.plan_expires_at).toLocaleDateString('pt-BR')}</span>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

/* ============================ CLIENTS ============================ */
export const TrackerClients: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => { callPortal('clients').then((d) => { setStores(d?.stores || []); setLoading(false); }); }, []);

  const toggle = (id: string) => setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const total = stores.reduce((a, s) => a + s.client_count, 0);

  const copyEmails = (s: any) => {
    const emails = (s.clients || []).map((c: any) => c.email).filter((e: string) => e && e !== '(desconhecido)');
    if (!emails.length) { toast.info('Sem emails'); return; }
    navigator.clipboard.writeText(emails.join(', '));
    toast.success(`${emails.length} email(s) copiado(s)`);
  };

  return (
    <SuperAdminLayout title="Clientes por Loja">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 text-center"><p className="text-2xl font-bold">{stores.length}</p><p className="text-xs text-muted-foreground">Lojas</p></GlassCard>
          <GlassCard className="p-4 text-center"><p className="text-2xl font-bold text-purple-400">{total}</p><p className="text-xs text-muted-foreground">Clientes totais</p></GlassCard>
        </div>
        {loading ? <Loading /> : stores.length === 0 ? <Empty icon={Users} label="Nenhum cliente veio do seu tracking ainda" /> : (
          <div className="space-y-3">
            {stores.map((s) => {
              const open = expanded.has(s.id);
              return (
                <GlassCard key={s.id} className="overflow-hidden">
                  <button onClick={() => toggle(s.id)} className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition">
                    {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{s.name}</h4>
                        {s.slug && <span className="text-xs text-muted-foreground">/{s.slug}</span>}
                        <Badge variant="outline" className="text-[10px]">{s.plan_type}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.client_count} clientes</span>
                        {s.owner_email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> dono: {s.owner_email}</span>}
                      </div>
                    </div>
                    {s.client_count > 0 && (
                      <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); copyEmails(s); }}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-xs border border-input bg-background hover:bg-accent cursor-pointer">
                        <Copy className="w-3 h-3" /> Copiar ({s.client_count})
                      </span>
                    )}
                  </button>
                  {open && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {(s.clients || []).length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum cliente.</p> : (s.clients || []).map((c: any) => (
                        <div key={c.user_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate">{c.email}</p>
                            <p className="text-[11px] text-muted-foreground">desde {new Date(c.joined_at).toLocaleDateString('pt-BR')}{c.banned && <span className="ml-2 text-red-400">banido</span>}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { navigator.clipboard.writeText(c.email); toast.success('Email copiado'); }}><Copy className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

/* ============================ PARTNERS ============================ */
export const TrackerPartners: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { callPortal('partners').then((d) => { setPartners(d?.partners || []); setLoading(false); }); }, []);

  return (
    <SuperAdminLayout title="Parceiros">
      <div className="space-y-6">
        {loading ? <Loading /> : partners.length === 0 ? <Empty icon={Handshake} label="Nenhum parceiro nas suas lojas" /> : (
          <div className="space-y-3">
            {partners.map((p) => (
              <GlassCard key={p.partner_id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake className="w-4 h-4 text-purple-400" />
                  <p className="font-medium truncate">{p.email || p.partner_id}</p>
                  <Badge variant="outline" className="text-[10px]">{p.stores.length} loja(s)</Badge>
                </div>
                <div className="space-y-1">
                  {p.stores.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between text-sm border-b border-white/5 last:border-0 py-1">
                      <span className="truncate">{s.name} <span className="text-xs text-muted-foreground">/{s.slug}</span></span>
                      <Badge variant="outline" className="text-[10px]">{s.plan_type}</Badge>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

/* ============================ REFERRALS ============================ */
const REF_LABEL: Record<string, string> = { available: 'Disponíveis', pending: 'Em carência', paid: 'Pagas', cancelled: 'Canceladas' };
export const TrackerReferrals: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { callPortal('referrals').then((d) => { setCommissions(d?.commissions || []); setSummary(d?.summary || null); setLoading(false); }); }, []);

  return (
    <SuperAdminLayout title="Indicações">
      <div className="space-y-6">
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(REF_LABEL).map((k) => (
              <GlassCard key={k} className="p-4">
                <div className="text-xs uppercase text-muted-foreground">{REF_LABEL[k]}</div>
                <div className="text-xl font-semibold mt-1">{fmtBRL(summary.sum_cents?.[k] || 0)}</div>
                <div className="text-xs text-muted-foreground">{summary.count?.[k] || 0} comissões</div>
              </GlassCard>
            ))}
          </div>
        )}
        {loading ? <Loading /> : commissions.length === 0 ? <Empty icon={Gift} label="Nenhuma indicação nas suas lojas" /> : (
          <div className="space-y-3">
            {commissions.map((c) => (
              <GlassCard key={c.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center">
                  <div><div className="text-xs text-muted-foreground">Indicador</div><div className="font-medium">{c.referrer?.name || '—'}</div></div>
                  <div><div className="text-xs text-muted-foreground">Loja indicada</div><div className="font-medium">{c.referred?.name || '—'}</div></div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Comissão ({c.commission_percent}%)</div>
                    <div className="text-lg font-semibold">{fmtBRL(c.commission_cents)}</div>
                    <Badge variant={c.status === 'paid' ? 'default' : c.status === 'cancelled' ? 'destructive' : 'outline'} className="text-[10px] mt-1">{REF_LABEL[c.status] || c.status}</Badge>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

/* ============================ RANKING ============================ */
export const TrackerRanking: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { callPortal('ranking').then((d) => { setStores(d?.stores || []); setLoading(false); }); }, []);
  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  return (
    <SuperAdminLayout title="Ranking">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Suas plataformas ranqueadas por volume de clientes e faturamento.</p>
        {loading ? <Loading /> : stores.length === 0 ? <Empty icon={TrendingUp} label="Nenhuma plataforma para ranquear" /> : (
          <div className="space-y-3">
            {stores.map((s, i) => (
              <GlassCard key={s.id} className={`p-4 ${i < 3 ? 'border-yellow-500/20' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold w-12 text-center shrink-0">{medal(i)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><h4 className="font-semibold truncate">{s.name}</h4>
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{s.status === 'active' ? 'Ativa' : 'Suspensa'}</Badge></div>
                    {s.slug && <p className="text-xs text-muted-foreground">/{s.slug}</p>}
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center"><div className="flex items-center gap-1 text-sm font-semibold"><Users className="w-3.5 h-3.5 text-blue-400" />{s.userCount}</div><p className="text-[10px] text-muted-foreground">clientes</p></div>
                    <div className="text-center"><div className="flex items-center gap-1 text-sm font-semibold"><DollarSign className="w-3.5 h-3.5 text-green-400" />{s.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><p className="text-[10px] text-muted-foreground">receita</p></div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

/* ============================ SUPPORT ============================ */
export const TrackerSupport: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { callPortal('support').then((d) => { setTickets(d?.tickets || []); setLoading(false); }); }, []);
  const statusColor: Record<string, string> = {
    open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    answered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    closed: 'bg-white/10 text-white/50 border-white/10',
  };

  return (
    <SuperAdminLayout title="Suporte">
      <div className="max-w-4xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">Tickets das lojas que vieram do seu tracking (somente leitura).</p>
        {loading ? <Loading /> : tickets.length === 0 ? <Empty icon={MessageCircle} label="Nenhum ticket nas suas lojas" /> : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-purple-500/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{t.subject}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {t.store_name && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Store className="w-3 h-3" /> {t.store_name}</span>}
                      <span className="text-xs text-white/20">{new Date(t.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${statusColor[t.status] || statusColor.open} shrink-0`}>{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};
