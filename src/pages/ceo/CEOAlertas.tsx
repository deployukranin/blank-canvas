import { motion } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';

const alerts = [
  { type: 'warning', title: 'Whisper Dreams com queda de 20% em acessos', time: 'há 2h', message: 'O tráfego da loja caiu significativamente na última semana.' },
  { type: 'success', title: 'ASMR Luna Store bateu recorde de vendas', time: 'há 5h', message: '87 pedidos este mês — maior volume desde a criação.' },
  { type: 'info', title: 'Novo recurso disponível: Relatórios PDF', time: 'há 1 dia', message: 'Agora você pode exportar relatórios em PDF diretamente do painel.' },
  { type: 'warning', title: '3 pedidos pendentes há mais de 48h', time: 'há 2 dias', message: 'Relaxing Vibes Shop tem pedidos aguardando ação.' },
  { type: 'success', title: 'Taxa de conversão aumentou 0.3%', time: 'há 3 dias', message: 'Média geral das lojas subiu de 2.1% para 2.4%.' },
];

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    default: return <Info className="w-4 h-4 text-blue-400" />;
  }
};

const getAlertBg = (type: string) => {
  switch (type) {
    case 'warning': return 'bg-amber-500/10';
    case 'success': return 'bg-emerald-500/10';
    default: return 'bg-blue-500/10';
  }
};

const CEOAlertas = () => (
  <CEOLayout title="Alertas">
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Notificações e alertas importantes sobre suas lojas.</p>
      {alerts.map((alert, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="flex items-start gap-4">
            <div className={`w-9 h-9 rounded-lg ${getAlertBg(alert.type)} flex items-center justify-center shrink-0 mt-0.5`}>
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{alert.title}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  </CEOLayout>
);

export default CEOAlertas;
