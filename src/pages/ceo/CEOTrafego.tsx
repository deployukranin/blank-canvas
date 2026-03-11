import { motion } from 'framer-motion';
import { Eye, Globe, Smartphone, Monitor, ArrowUpRight } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const trafficData = [
  { day: 'Seg', visitas: 320 },
  { day: 'Ter', visitas: 410 },
  { day: 'Qua', visitas: 380 },
  { day: 'Qui', visitas: 520 },
  { day: 'Sex', visitas: 610 },
  { day: 'Sáb', visitas: 480 },
  { day: 'Dom', visitas: 350 },
];

const deviceBreakdown = [
  { device: 'Mobile', icon: Smartphone, percent: 68, visits: 4243 },
  { device: 'Desktop', icon: Monitor, percent: 28, visits: 1747 },
  { device: 'Outros', icon: Globe, percent: 4, visits: 250 },
];

const CEOTrafego = () => (
  <CEOLayout title="Tráfego">
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Visitantes Hoje', value: '610', change: '+15%' },
          { label: 'Pageviews Hoje', value: '1.840', change: '+22%' },
          { label: 'Tempo Médio', value: '4m 32s', change: '+8%' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-display text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" /> {stat.change}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" /> Visitantes — Última Semana
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45 80% 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(45 80% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="visitas" stroke="hsl(45 80% 55%)" fillOpacity={1} fill="url(#colorVisitas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <GlassCard>
          <h3 className="font-semibold mb-4">Dispositivos</h3>
          <div className="space-y-3">
            {deviceBreakdown.map((d) => (
              <div key={d.device} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <d.icon className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{d.device}</span>
                    <span className="text-xs text-muted-foreground">{d.visits.toLocaleString('pt-BR')} visitas</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold w-10 text-right">{d.percent}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  </CEOLayout>
);

export default CEOTrafego;
