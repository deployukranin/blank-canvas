import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, TrendingUp, ShoppingCart, CreditCard } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthlyData = [
  { month: 'Jan', receita: 4200 },
  { month: 'Fev', receita: 5100 },
  { month: 'Mar', receita: 4800 },
  { month: 'Abr', receita: 6200 },
  { month: 'Mai', receita: 7100 },
  { month: 'Jun', receita: 8450 },
];

const recentSales = [
  { store: 'ASMR Luna Store', product: 'Vídeo Custom 30min', value: 149.9, date: 'Hoje, 14:32' },
  { store: 'Relaxing Vibes Shop', product: 'Áudio Personalizado', value: 79.9, date: 'Hoje, 12:15' },
  { store: 'ASMR Luna Store', product: 'Vídeo Custom 15min', value: 89.9, date: 'Hoje, 10:40' },
  { store: 'Relaxing Vibes Shop', product: 'Assinatura VIP', value: 29.9, date: 'Ontem, 22:10' },
  { store: 'ASMR Luna Store', product: 'Vídeo Custom 60min', value: 249.9, date: 'Ontem, 18:55' },
];

const CEOVendas = () => (
  <CEOLayout title="Vendas">
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Receita do Mês', value: 'R$ 8.450', icon: DollarSign, change: '+18%' },
          { label: 'Pedidos do Mês', value: '62', icon: ShoppingCart, change: '+12%' },
          { label: 'Ticket Médio', value: 'R$ 136,29', icon: CreditCard, change: '+5%' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" /> {stat.change}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Receita Mensal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                />
                <Bar dataKey="receita" fill="hsl(45 80% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </motion.div>

      {/* Recent Sales */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <GlassCard>
          <h3 className="font-semibold mb-4">Vendas Recentes</h3>
          <div className="divide-y divide-border">
            {recentSales.map((sale, i) => (
              <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{sale.product}</p>
                  <p className="text-xs text-muted-foreground">{sale.store} · {sale.date}</p>
                </div>
                <span className="font-semibold text-sm text-emerald-400">R$ {sale.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  </CEOLayout>
);

export default CEOVendas;
