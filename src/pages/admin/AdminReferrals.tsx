import React, { useEffect, useState, useCallback } from 'react';
import { Copy, Gift, Loader2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

const fmtBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

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

const STATUS_LABEL: Record<Commission['status'], string> = {
  pending: 'Em carência',
  available: 'A receber',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

const AdminReferrals: React.FC = () => {
  const { store } = useTenant();
  const [refCode, setRefCode] = useState<string>('');
  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        supabase.from('stores').select('referral_code').eq('id', store.id).maybeSingle(),
        supabase.from('referral_commissions' as any).select('*').eq('referrer_store_id', store.id).order('created_at', { ascending: false }),
      ]);
      setRefCode((s.data as any)?.referral_code || '');
      setItems(((c.data as any) || []) as Commission[]);
    } catch (e: any) {
      toast.error('Erro ao carregar indicações');
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const refLink = refCode ? `${window.location.origin}/auth?tab=signup&ref=${refCode}` : '';
  const totals = items.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + c.commission_cents;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout title="Indicações">
      <div className="space-y-6">
        <GlassCard className="p-5">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">Seu link de indicação</h2>
              <p className="text-sm text-muted-foreground">
                Ganhe <strong>50%</strong> da primeira mensalidade de cada loja que assinar pelo seu link. Liberado após 30 dias.
              </p>
              {refLink ? (
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">{refLink}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(refLink); toast.success('Link copiado'); }}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">Carregando código…</div>
              )}
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['available','pending','paid','cancelled'] as Commission['status'][]).map((k) => (
            <GlassCard key={k} className="p-4">
              <div className="text-xs uppercase text-muted-foreground">{STATUS_LABEL[k]}</div>
              <div className="text-xl font-semibold mt-1">{fmtBRL(totals[k] || 0)}</div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-4">
          <h3 className="font-semibold mb-3">Histórico</h3>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma indicação ainda. Compartilhe seu link!</div>
          ) : (
            <div className="space-y-2">
              {items.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{fmtBRL(c.commission_cents)} <span className="text-xs text-muted-foreground">de {fmtBRL(c.base_amount_cents)}</span></div>
                    <div className="text-xs text-muted-foreground">
                      {c.status === 'pending' && <>Disponível em {new Date(c.eligible_at).toLocaleDateString('pt-BR')}</>}
                      {c.status === 'available' && <>Aguardando pagamento</>}
                      {c.status === 'paid' && c.paid_at && <>Paga em {new Date(c.paid_at).toLocaleDateString('pt-BR')}</>}
                      {c.status === 'cancelled' && <>Cancelada</>}
                    </div>
                  </div>
                  <Badge variant={c.status === 'paid' ? 'default' : c.status === 'cancelled' ? 'destructive' : 'outline'}>
                    {STATUS_LABEL[c.status]}
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
