import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Target, Percent, Clock, Repeat } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';

const metrics = [
  { label: 'Taxa de Conversão', value: '2.4%', change: '+0.3%', trend: 'up' as const, icon: Target },
  { label: 'Taxa de Retenção', value: '68%', change: '+5%', trend: 'up' as const, icon: Repeat },
  { label: 'Churn Rate', value: '4.2%', change: '-0.8%', trend: 'up' as const, icon: Percent },
  { label: 'Tempo para 1ª Compra', value: '3.2 dias', change: '-0.5d', trend: 'up' as const, icon: Clock },
];

const storeMetrics = [
  { store: 'ASMR Luna Store', conversion: '3.1%', retention: '72%', churn: '3.8%', ltv: 'R$ 245' },
  { store: 'Relaxing Vibes Shop', conversion: '2.1%', retention: '65%', churn: '4.5%', ltv: 'R$ 180' },
  { store: 'Whisper Dreams', conversion: '1.8%', retention: '58%', churn: '5.2%', ltv: 'R$ 120' },
];

const CEOMetricas = () => (
  <CEOLayout title="Métricas">
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="font-display text-2xl font-bold mt-1">{m.value}</p>
                  <p className={`text-xs flex items-center gap-1 mt-1 ${m.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {m.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {m.change}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <m.icon className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Comparativo por Loja
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-muted-foreground font-medium">Loja</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Conversão</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Retenção</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Churn</th>
                  <th className="text-center py-3 pl-4 text-muted-foreground font-medium">LTV</th>
                </tr>
              </thead>
              <tbody>
                {storeMetrics.map((s) => (
                  <tr key={s.store} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium">{s.store}</td>
                    <td className="py-3 px-4 text-center">{s.conversion}</td>
                    <td className="py-3 px-4 text-center">{s.retention}</td>
                    <td className="py-3 px-4 text-center">{s.churn}</td>
                    <td className="py-3 pl-4 text-center font-semibold text-emerald-400">{s.ltv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  </CEOLayout>
);

export default CEOMetricas;
