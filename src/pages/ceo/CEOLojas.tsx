import { motion } from 'framer-motion';
import { Store, Plus, ExternalLink, MoreVertical } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';

const stores = [
  { id: '1', name: 'ASMR Luna Store', url: 'luna-asmr.lovable.app', status: 'active', users: 342, orders: 87 },
  { id: '2', name: 'Relaxing Vibes Shop', url: 'relaxing-vibes.lovable.app', status: 'active', users: 218, orders: 54 },
  { id: '3', name: 'Whisper Dreams', url: 'whisper-dreams.lovable.app', status: 'inactive', users: 64, orders: 12 },
];

const CEOLojas = () => (
  <CEOLayout title="Minhas Lojas">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Gerencie todas as suas lojas criadas na plataforma.</p>
        <Button className="gap-2" size="sm">
          <Plus className="w-4 h-4" /> Nova Loja
        </Button>
      </div>

      <div className="space-y-3">
        {stores.map((store, i) => (
          <motion.div key={store.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {store.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{store.users} usuários</p>
                  <p className="text-xs text-muted-foreground">{store.orders} pedidos</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  store.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {store.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  </CEOLayout>
);

export default CEOLojas;
