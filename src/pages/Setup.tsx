import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Youtube,
  CreditCard,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Settings,
  TestTube,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  isLast?: boolean;
}

// Step 1: Welcome
const WelcomeStep = ({ onNext }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="text-center space-y-8"
  >
    <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
      <Settings className="w-12 h-12 text-primary" />
    </div>
    <div>
      <h1 className="text-3xl font-display font-bold mb-4">
        Bem-vindo ao Setup Inicial
      </h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        Vamos configurar seu projeto em poucos passos. Você precisará das credenciais
        do Supabase e, opcionalmente, YouTube.
      </p>
    </div>
    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <Database className="w-6 h-6 text-green-400 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Supabase</p>
      </div>
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <CreditCard className="w-6 h-6 text-blue-400 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">PIX Manual</p>
      </div>
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <Youtube className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">YouTube</p>
      </div>
    </div>
    <Button onClick={onNext} size="lg" className="gap-2">
      Começar Configuração
      <ArrowRight className="w-4 h-4" />
    </Button>
  </motion.div>
);

// Step 2: Supabase
const SupabaseStep = ({ onNext, onBack }: StepProps) => {
  const { config, updateToken, testConnection } = useWhiteLabel();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [url, setUrl] = useState(config.tokens.supabase.url);
  const [anonKey, setAnonKey] = useState(config.tokens.supabase.anonKey);

  const handleTest = async () => {
    updateToken('supabase', { url, anonKey, enabled: true });
    setTesting(true);
    const result = await testConnection('supabase');
    setTestResult(result);
    setTesting(false);
  };

  const handleNext = () => {
    updateToken('supabase', { url, anonKey, enabled: true });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
          <Database className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-display font-bold">Configurar Supabase</h2>
        <p className="text-muted-foreground mt-2">
          Conecte seu projeto Supabase para banco de dados e autenticação
        </p>
      </div>

      <GlassCard className="space-y-4">
        <div>
          <Label>URL do Projeto</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxx.supabase.co"
            className="mt-2"
          />
        </div>
        <div>
          <Label>Anon Key (Publishable)</Label>
          <Input
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR..."
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Encontre em: Supabase Dashboard → Settings → API
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !url || !anonKey}
            className="gap-2"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            Testar Conexão
          </Button>
          {testResult && (
            <span className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {testResult.message}
            </span>
          )}
        </div>
      </GlassCard>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} disabled={!url || !anonKey} className="gap-2">
          Próximo
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};



// Step 4: YouTube (Optional)
const YouTubeStep = ({ onNext, onBack }: StepProps) => {
  const { config, updateYouTube } = useWhiteLabel();
  const [enabled, setEnabled] = useState(config.youtube?.enabled ?? true);
  const [channelId, setChannelId] = useState(config.youtube?.channelId ?? '');

  const handleNext = () => {
    updateYouTube({ ...config.youtube, enabled, channelId });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <Youtube className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-display font-bold">Configurar YouTube</h2>
        <p className="text-muted-foreground mt-2">
          Configure a galeria de vídeos do influenciador (opcional)
        </p>
      </div>

      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar Galeria de Vídeos</Label>
            <p className="text-xs text-muted-foreground">
              Mostra vídeos do canal na página de comunidade
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <div>
            <Label>Channel ID</Label>
            <Input
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O Channel ID começa com "UC" e tem 24 caracteres
            </p>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} className="gap-2">
          {enabled && channelId ? 'Próximo' : 'Pular'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Step 5: Branding
const BrandingStep = ({ onNext, onBack }: StepProps) => {
  const { config, updateBranding } = useWhiteLabel();
  const [siteName, setSiteName] = useState(config.siteName);
  const [siteDescription, setSiteDescription] = useState(config.siteDescription);

  const handleNext = () => {
    updateBranding({ siteName, siteDescription });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4">
          <Palette className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-display font-bold">Branding</h2>
        <p className="text-muted-foreground mt-2">
          Configure o nome e descrição do seu projeto
        </p>
      </div>

      <GlassCard className="space-y-4">
        <div>
          <Label>Nome do Site</Label>
          <Input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="WhisperScape"
            className="mt-2"
          />
        </div>
        <div>
          <Label>Descrição</Label>
          <Input
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder="Sua experiência ASMR personalizada"
            className="mt-2"
          />
        </div>
      </GlassCard>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} className="gap-2">
          Finalizar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Step 6: Complete
const CompleteStep = ({ onNext }: StepProps) => {
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem('setup_completed', 'true');
    toast.success('Configuração concluída!');
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8"
    >
      <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-green-400" />
      </div>
      <div>
        <h1 className="text-3xl font-display font-bold mb-4">
          Configuração Concluída! 🎉
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Seu projeto está pronto para uso. Você pode ajustar as configurações
          a qualquer momento no Painel CEO.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleFinish} size="lg" className="gap-2">
          Ir para o Site
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/ceo')}
          className="gap-2"
        >
          Abrir Painel CEO
        </Button>
      </div>
    </motion.div>
  );
};

// Main Setup Page
const Setup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  // Check if setup was already completed
  useEffect(() => {
    const completed = localStorage.getItem('setup_completed');
    if (completed === 'true') {
      // Allow revisiting setup, but show a message
    }
  }, []);

  const steps = [
    { component: WelcomeStep, title: 'Bem-vindo' },
    { component: SupabaseStep, title: 'Supabase' },
    { component: YouTubeStep, title: 'YouTube' },
    { component: BrandingStep, title: 'Branding' },
    { component: CompleteStep, title: 'Concluído' },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Skip button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground"
        >
          Pular Setup
        </Button>
      </div>

      {/* Step indicators */}
      <div className="pt-12 pb-4 px-4">
        <div className="flex justify-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {currentStep + 1} de {steps.length}: {steps[currentStep].title}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <CurrentStepComponent
              key={currentStep}
              onNext={handleNext}
              onBack={currentStep > 0 ? handleBack : undefined}
              isLast={currentStep === steps.length - 1}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Setup;
