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
    {
      name: 'OpenPix/Woovi',
      enabled: config.tokens.openpix.enabled,
      configured: !!config.tokens.openpix.appId,
    },
    {
      name: 'Suporte Externo',
      enabled: config.tokens.support.enabled,
      configured: !!(config.tokens.support.token),
    },
    {
      name: 'Estoque de Contas',
      enabled: config.tokens.accountStock.enabled,
      configured: !!(config.tokens.accountStock.apiUrl && config.tokens.accountStock.apiKey),
    },
  ];

  const quickLinks = [
    { icon: Image, label: 'Editar Banner', path: '/ceo/branding', description: 'Personalizar banner e logo' },
    { icon: Palette, label: 'Mudar Cores', path: '/ceo/cores', description: 'Alterar tema do app' },
    { icon: Sparkles, label: 'Customizar Ícones', path: '/ceo/icones', description: 'Alterar emojis do app' },
    { icon: Link2, label: 'Conectar APIs', path: '/ceo/integracoes', description: 'Configurar integrações' },
    { icon: Crown, label: 'Configurar Loja', path: '/ceo/loja', description: 'Textos e logos dos produtos' },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Environment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="text-center">
              <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-amber-400/20 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">🔧</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Ambiente OpenPix</p>
              <p className="font-display font-bold text-lg capitalize">
                {config.tokens.openpix.environment || 'sandbox'}
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
              {integrationStatus.map((integration, index) => (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <link.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1 flex items-center gap-2">
                        {link.label}
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEODashboard;
