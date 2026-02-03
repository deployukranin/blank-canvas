import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Crown, Eye, EyeOff, Save, Loader2, RefreshCw, Lock, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AdminCredential {
  id: string;
  role: string;
  email: string;
  updated_at: string;
}

interface CredentialCardProps {
  role: 'admin' | 'ceo';
  icon: React.ReactNode;
  title: string;
  email: string;
  updatedAt?: string;
  onSave: (email: string, password: string) => Promise<void>;
  otherEmail: string;
  isSaving: boolean;
}

const CredentialCard = ({ 
  role, 
  icon, 
  title, 
  email: initialEmail, 
  updatedAt,
  onSave,
  otherEmail,
  isSaving
}: CredentialCardProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    setEmail(initialEmail);
    // Don't set password - it's not returned from the server
    setPassword('');
    setConfirmPassword('');
  }, [initialEmail]);

  const validateAndSave = async () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
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
    } else if (password.length > 128) {
      newErrors.password = 'Senha muito longa';
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      await onSave(email.trim(), password);
      setPassword('');
      setConfirmPassword('');
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
        <div>
          <h4 className="font-display font-semibold">{title}</h4>
          {updatedAt && (
            <p className="text-xs text-muted-foreground">
              Atualizado: {new Date(updatedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
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
            disabled={isSaving}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label className="text-sm">Nova Senha</Label>
          <div className="relative mt-1.5">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder="Digite a nova senha"
              className="pr-10"
              disabled={isSaving}
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

        <div>
          <Label className="text-sm">Confirmar Senha</Label>
          <div className="relative mt-1.5">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Confirme a nova senha"
              className="pr-10"
              disabled={isSaving}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <Button 
          onClick={validateAndSave}
          className="w-full gap-2"
          variant={role === 'ceo' ? 'default' : 'secondary'}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Credenciais
        </Button>
      </div>
    </div>
  );
};

export const AdminCredentialsManager = () => {
  const [credentials, setCredentials] = useState<AdminCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      // Use RPC function to get credentials (returns only email, role - no password)
      // This function requires CEO role and never exposes password_hash
      const { data, error } = await supabase.rpc('get_admin_credentials_safe');
      
      if (error) {
        console.error('Error fetching credentials:', error);
        // Fallback to edge function if RPC fails (e.g., user not CEO yet)
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('get-admin-credentials');
        if (!edgeError && edgeData?.credentials) {
          setCredentials(edgeData.credentials);
        } else {
          toast.error('Erro ao carregar credenciais');
        }
        return;
      }

      if (data) {
        setCredentials(data as AdminCredential[]);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao carregar credenciais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const getCredentialByRole = (role: 'admin' | 'ceo') => {
    return credentials.find(c => c.role === role);
  };

  const handleSave = async (role: 'admin' | 'ceo', email: string, password: string) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-admin-credentials', {
        body: { role, email, password }
      });

      if (error) {
        console.error('Error updating credentials:', error);
        toast.error('Erro ao salvar credenciais');
        return;
      }

      if (data?.success) {
        toast.success(`Credenciais ${role === 'ceo' ? 'CEO' : 'Admin'} salvas com sucesso!`);
        await fetchCredentials();
      } else {
        toast.error(data?.error || 'Erro ao salvar credenciais');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao salvar credenciais');
    } finally {
      setIsSaving(false);
    }
  };

  const adminCred = getCredentialByRole('admin');
  const ceoCred = getCredentialByRole('ceo');

  if (isLoading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <GlassCard>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
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
          <Button variant="ghost" size="icon" onClick={fetchCredentials} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <CredentialCard
            role="admin"
            icon={<Shield className="w-5 h-5" />}
            title="Conta Admin"
            email={adminCred?.email || ''}
            updatedAt={adminCred?.updated_at}
            onSave={(email, password) => handleSave('admin', email, password)}
            otherEmail={ceoCred?.email || ''}
            isSaving={isSaving}
          />
          
          <CredentialCard
            role="ceo"
            icon={<Crown className="w-5 h-5" />}
            title="Conta CEO"
            email={ceoCred?.email || ''}
            updatedAt={ceoCred?.updated_at}
            onSave={(email, password) => handleSave('ceo', email, password)}
            otherEmail={adminCred?.email || ''}
            isSaving={isSaving}
          />
        </div>

        <div className="flex items-start gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Segurança Aprimorada</p>
            <p>
              As senhas são criptografadas com bcrypt antes de serem armazenadas. 
              Cada login gera uma sessão autenticada via Supabase Auth.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20 mt-4">
          <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Nota de Segurança</p>
            <p>
              As senhas não são exibidas por motivos de segurança. 
              Para alterar uma senha, digite a nova senha e confirme.
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
