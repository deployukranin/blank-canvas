import { motion } from 'framer-motion';
import { 
  Crown, 
  Store,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';

const mockStores = [
  {
    id: '1',
    name: 'ASMR Luna Store',
    url: 'luna-asmr.lovable.app',
    status: 'active' as const,
    revenue: 12450,
    orders: 87,
    visitors: 3420,
    conversionRate: 2.5,
    trend: 'up' as const,
  },
  {
    id: '2',
    name: 'Relaxing Vibes Shop',
    url: 'relaxing-vibes.lovable.app',
    status: 'active' as const,
    revenue: 8320,
    orders: 54,
    visitors: 2180,
    conversionRate: 2.1,
    trend: 'up' as const,
  },
  {
    id: '3',
    name: 'Whisper Dreams',
    url: 'whisper-dreams.lovable.app',
    status: 'inactive' as const,
    revenue: 1200,
    orders: 12,
    visitors: 640,
    conversionRate: 1.8,
    trend: 'down' as const,
  },
];

const globalStats = [
  {
    label: 'Receita Total',
    value: 'R$ 21.970',
    change: '+18.2%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    label: 'Total de Pedidos',
    value: '153',
    change: '+12.5%',
    trend: 'up' as const,
    icon: ShoppingCart,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'Visitantes',
    value: '6.240',
    change: '+24.1%',
    trend: 'up' as const,
    icon: Eye,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    label: 'Lojas Ativas',
    value: '2 / 3',
    change: '',
    trend: 'up' as const,
    icon: Store,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
];

const recentActivity = [
  { type: 'sale', store: 'ASMR Luna Store', message: 'Novo pedido #1087 — R$ 149,90', time: 'há 12 min' },
  { type: 'user', store: 'Relaxing Vibes Shop', message: 'Novo cadastro: maria_asmr', time: 'há 25 min' },
  { type: 'sale', store: 'ASMR Luna Store', message: 'Novo pedido #1086 — R$ 79,90', time: 'há 1h' },
  { type: 'visit', store: 'Whisper Dreams', message: '32 visitantes na última hora', time: 'há 1h' },
  { type: 'user', store: 'ASMR Luna Store', message: '5 novos cadastros hoje', time: 'há 2h' },
];

const CEODashboard = () => {
  return (
    <CEOLayout title="Minhas Lojas">
      <div className="space-y-8">
        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {globalStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="font-display text-2xl font-bold">{stat.value}</p>
                    {stat.change && (
                      <div className={`flex items-center gap-1 mt-1 text-xs ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{stat.change}</span>
                        <span className="text-muted-foreground">vs mês anterior</span>
                      </div>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Stores Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-amber-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              Lojas Cadastradas
            </h3>
            <span className="text-sm text-muted-foreground">{mockStores.length} lojas</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockStores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <GlassCard className="hover:border-amber-500/30 transition-colors cursor-pointer">
                  <div className="space-y-4">
                    {/* Store Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-base">{store.name}</h4>
                        <p className="text-xs text-muted-foreground">{store.url}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        store.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {store.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    {/* Store Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Receita
                        </p>
                        <p className="font-semibold text-sm">R$ {store.revenue.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" /> Pedidos
                        </p>
                        <p className="font-semibold text-sm">{store.orders}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Visitantes
                        </p>
                        <p className="font-semibold text-sm">{store.visitors.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Conversão
                        </p>
                        <p className="font-semibold text-sm">{store.conversionRate}%</p>
                      </div>
                    </div>

                    {/* Trend indicator */}
                    <div className={`flex items-center gap-1 text-xs ${
                      store.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {store.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{store.trend === 'up' ? 'Crescendo' : 'Em queda'} este mês</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-display font-semibold text-lg mb-4 text-amber-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Atividade Recente
          </h3>
          <GlassCard>
            <div className="divide-y divide-border">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'sale' ? 'bg-emerald-500/10' :
                      activity.type === 'user' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                    }`}>
                      {activity.type === 'sale' ? <DollarSign className="w-4 h-4 text-emerald-400" /> :
                       activity.type === 'user' ? <Users className="w-4 h-4 text-blue-400" /> :
                       <Eye className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.store}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEODashboard;
