import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Crown } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface RankedStore {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  userCount: number;
  revenue: number;
}

const SuperAdminRanking: React.FC = () => {
  const [stores, setStores] = useState<RankedStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Get all stores
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, name, slug, status');

        if (!storesData || storesData.length === 0) {
          setIsLoading(false);
          return;
        }

        // Get user counts per store
        const { data: storeUsers } = await supabase
          .from('store_users')
          .select('store_id');

        // Get revenue per store
        const { data: orders } = await supabase
          .from('custom_orders')
          .select('store_id, amount_cents, status');

        const paidOrders = orders?.filter(o => o.status === 'paid' || o.status === 'completed') || [];

        const ranked: RankedStore[] = storesData.map(store => {
          const userCount = storeUsers?.filter(u => u.store_id === store.id).length || 0;
          const revenue = paidOrders
            .filter(o => o.store_id === store.id)
            .reduce((sum, o) => sum + (o.amount_cents || 0), 0) / 100;

          return { ...store, userCount, revenue };
        });

        // Sort by user count + revenue weighted
        ranked.sort((a, b) => (b.userCount * 10 + b.revenue) - (a.userCount * 10 + a.revenue));

        setStores(ranked);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <SuperAdminLayout title="Ranking">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Plataformas ranqueadas por volume de clientes e faturamento.
        </p>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : stores.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma plataforma para ranquear</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className={`p-4 ${index < 3 ? 'border-yellow-500/20' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold w-12 text-center shrink-0">
                      {getMedal(index)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{store.name}</h4>
                        <Badge variant={store.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                          {store.status === 'active' ? 'Ativa' : 'Suspensa'}
                        </Badge>
                      </div>
                      {store.slug && (
                        <p className="text-xs text-muted-foreground">/{store.slug}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          {store.userCount}
                        </div>
                        <p className="text-[10px] text-muted-foreground">clientes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <DollarSign className="w-3.5 h-3.5 text-green-400" />
                          {store.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-muted-foreground">receita</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRanking;
