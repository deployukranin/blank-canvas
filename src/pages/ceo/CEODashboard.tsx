import { motion } from 'framer-motion';
import { 
  Crown, 
  Palette, 
  Image, 
  Link2, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

const CEODashboard = () => {
  const { config } = useWhiteLabel();

  const integrationStatus = [
    {
      name: 'Supabase',
      enabled: config.tokens.supabase.enabled,
      configured: !!(config.tokens.supabase.url && config.tokens.supabase.anonKey),
    },
  ];

  const quickLinks = [
    { icon: Sparkles, label: 'Personalização', path: '/ceo/personalizacao', description: 'Branding, cores, ícones e seções' },
    { icon: Link2, label: 'Integrações', path: '/ceo/integracoes', description: 'YouTube, Shopify e configurações' },
  ];

  return (
    <CEOLayout title="Dashboard CEO">
      <div className="space-y-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-950" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-amber-100 mb-1">
                  Bem-vindo ao Painel CEO
                </h2>
                <p className="text-amber-200/70 text-sm">
                  Configure sua plataforma white-label: branding, cores e integrações externas.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Site Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="text-center">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Nome do Site</p>
              <p className="font-display font-bold text-lg">{config.siteName}</p>
            </GlassCard>
          </motion.div>

          {/* Active Integrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <GlassCard className="text-center">
              <Link2 className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Integrações Ativas</p>
              <p className="font-display font-bold text-lg">
                {integrationStatus.filter(i => i.enabled && i.configured).length} / {integrationStatus.length}
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Integration Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="font-display font-semibold text-lg mb-4 text-amber-100">
            Status das Integrações
          </h3>
          <GlassCard>
            <div className="divide-y divide-border">
              {integrationStatus.map((integration) => (
                <div key={integration.name} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <span className="font-medium">{integration.name}</span>
                  <div className="flex items-center gap-2">
                    {integration.enabled && integration.configured ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-400">Conectado</span>
                      </>
                    ) : integration.enabled && !integration.configured ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-dashed" />
                        <span className="text-sm text-amber-400">Pendente</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Desativado</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display font-semibold text-lg mb-4 text-amber-100">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Link key={link.path} to={link.path}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard className="group cursor-pointer hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <link.icon className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{link.label}</p>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                    </div>
                  </GlassCard>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEODashboard;
