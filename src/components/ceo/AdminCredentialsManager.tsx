import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Crown, Eye, EyeOff, Save, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

interface CredentialCardProps {
  role: 'admin' | 'ceo';
  icon: React.ReactNode;
  title: string;
  email: string;
  password: string;
  onSave: (email: string, password: string) => void;
  otherEmail: string;
}

const CredentialCard = ({ 
  role, 
  icon, 
  title, 
  email: initialEmail, 
  password: initialPassword,
  onSave,
  otherEmail
}: CredentialCardProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateAndSave = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Email inválido';
    } else if (email.toLowerCase().trim() === otherEmail.toLowerCase().trim()) {
      newErrors.email = 'Email não pode ser igual ao da outra conta';
    }
    
    // Validate password
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave(email.trim(), password);
      toast.success(`Credenciais ${title} salvas com sucesso!`);
    }
  };

  const bgColor = role === 'ceo' 
    ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20' 
    : 'bg-primary/10';
  
  const iconColor = role === 'ceo' ? 'text-yellow-500' : 'text-primary';

  return (
    <div className={`p-5 rounded-2xl ${bgColor} border border-border/50`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'ceo' ? 'bg-yellow-500/20' : 'bg-primary/20'}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <h4 className="font-display font-semibold">{title}</h4>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
            }}
            placeholder="email@exemplo.com"
            className="mt-1.5"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label className="text-sm">Senha</Label>
          <div className="relative mt-1.5">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password}</p>
          )}
        </div>

        <Button 
          onClick={validateAndSave}
          className="w-full gap-2"
          variant={role === 'ceo' ? 'default' : 'secondary'}
        >
          <Save className="w-4 h-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
};

export const AdminCredentialsManager = () => {
  const { config, setConfig } = useWhiteLabel();

  const handleSaveAdmin = (email: string, password: string) => {
    setConfig({
      ...config,
      adminCredentials: {
        ...config.adminCredentials,
        admin: { email, password },
      },
    });
  };

  const handleSaveCEO = (email: string, password: string) => {
    setConfig({
      ...config,
      adminCredentials: {
        ...config.adminCredentials,
        ceo: { email, password },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <GlassCard>
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Contas Administrativas</h3>
            <p className="text-sm text-muted-foreground">
              Configure as credenciais de acesso ao painel admin e CEO
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <CredentialCard
            role="admin"
            icon={<Shield className="w-5 h-5" />}
            title="Conta Admin"
            email={config.adminCredentials?.admin?.email || 'admin@whisperscape.com'}
            password={config.adminCredentials?.admin?.password || 'admin123'}
            onSave={handleSaveAdmin}
            otherEmail={config.adminCredentials?.ceo?.email || 'ceo@whisperscape.com'}
          />
          
          <CredentialCard
            role="ceo"
            icon={<Crown className="w-5 h-5" />}
            title="Conta CEO"
            email={config.adminCredentials?.ceo?.email || 'ceo@whisperscape.com'}
            password={config.adminCredentials?.ceo?.password || 'ceo123'}
            onSave={handleSaveCEO}
            otherEmail={config.adminCredentials?.admin?.email || 'admin@whisperscape.com'}
          />
        </div>

        <div className="flex items-start gap-2 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Aviso de Segurança</p>
            <p>
              As credenciais são armazenadas no navegador local. Para ambientes de produção,
              recomenda-se implementar autenticação via banco de dados com hash de senhas.
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
