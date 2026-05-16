import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store, TrendingUp, Users, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PartnerStore {
  id: string; name: string; slug: string; status: string; plan_type: string;
  created_at: string; revenue_cents: number; active_subs: number;
}
interface Summary { store_count: number; total_revenue_cents: number; total_active_subs: number }

const fmtBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stores, setStores] = useState<PartnerStore[]>([]);
  const [summary, setSummary] = useState<Summary>({ store_count: 0, total_revenue_cents: 0, total_active_subs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('partner-dashboard', { body: {} });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setStores(data?.stores || []);
        setSummary(data?.summary || { store_count: 0, total_revenue_cents: 0, total_active_subs: 0 });
      } catch (e: any) {
        toast.error(e.message || 'Erro ao carregar painel');
      } finally { setLoading(false); }
    })();
  }, []);

  const handleLogout = () => { logout(); navigate('/admin-master/login'); };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Crown className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h1 className="font-semibold">Painel do Parceiro</h1>
            <p className="text-xs text-white/40">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400/70 hover:text-red-400 gap-2">
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {loading ? (
          <p className="text-sm text-white/60 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <GlassCard className="p-5">
                <Store className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-3xl font-bold">{summary.store_count}</p>
                <p className="text-xs text-white/50">Suas lojas</p>
              </GlassCard>
              <GlassCard className="p-5">
                <Users className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-3xl font-bold">{summary.total_active_subs}</p>
                <p className="text-xs text-white/50">Clientes pagantes ativos</p>
              </GlassCard>
              <GlassCard className="p-5">
                <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-3xl font-bold text-green-400">{fmtBRL(summary.total_revenue_cents)}</p>
                <p className="text-xs text-white/50">Receita atual / mês</p>
              </GlassCard>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-3 text-white/70">Lojas atribuídas</h2>
              {stores.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <Store className="w-12 h-12 mx-auto mb-3 text-white/30" />
                  <p className="text-white/50">Nenhuma loja atribuída ainda.</p>
                  <p className="text-xs text-white/30 mt-1">Aguarde o admin-master vincular suas indicações.</p>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {stores.map((s) => (
                    <GlassCard key={s.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{s.name}</p>
                          <span className="text-xs text-white/40">/{s.slug}</span>
                          <Badge variant="outline" className="text-[10px]">{s.plan_type}</Badge>
                          <Badge variant={s.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">{s.status}</Badge>
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          {s.active_subs} pagante(s) • desde {new Date(s.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-green-400 shrink-0">{fmtBRL(s.revenue_cents)}</p>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PartnerDashboard;
