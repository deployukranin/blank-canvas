import { motion } from 'framer-motion';
import { Users, UserPlus, Crown, ArrowUpRight } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const growthData = [
  { week: 'Sem 1', usuarios: 120 },
  { week: 'Sem 2', usuarios: 185 },
  { week: 'Sem 3', usuarios: 240 },
  { week: 'Sem 4', usuarios: 310 },
  { week: 'Sem 5', usuarios: 398 },
  { week: 'Sem 6', usuarios: 462 },
];

const topStores = [
  { name: 'ASMR Luna Store', users: 342, newThisMonth: 48, vip: 28 },
  { name: 'Relaxing Vibes Shop', users: 218, newThisMonth: 31, vip: 15 },
  { name: 'Whisper Dreams', users: 64, newThisMonth: 5, vip: 3 },
];

const CEOUsuarios = () => (
  <CEOLayout title="Usuários">
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total de Usuários', value: '624', icon: Users, change: '+84 este mês' },
          { label: 'Novos este Mês', value: '84', icon: UserPlus, change: '+22%' },
          { label: 'Assinantes VIP', value: '46', icon: Crown, change: '+8 este mês' },
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

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-400" /> Crescimento Semanal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="usuarios" stroke="hsl(45 80% 55%)" strokeWidth={2} dot={{ fill: 'hsl(45 80% 55%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <GlassCard>
          <h3 className="font-semibold mb-4">Usuários por Loja</h3>
          <div className="divide-y divide-border">
            {topStores.map((store) => (
              <div key={store.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-sm">{store.name}</p>
                <div className="flex items-center gap-6 text-sm">
                  <span>{store.users} total</span>
                  <span className="text-emerald-400">+{store.newThisMonth}</span>
                  <span className="text-amber-400 flex items-center gap-1"><Crown className="w-3 h-3" /> {store.vip}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  </CEOLayout>
);

export default CEOUsuarios;
