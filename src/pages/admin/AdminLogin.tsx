import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, Crown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Mock admin credentials for testing
const MOCK_ADMINS = [
  { email: 'admin@whisperscape.com', password: 'admin123', role: 'admin' as const },
  { email: 'ceo@whisperscape.com', password: 'ceo123', role: 'ceo' as const },
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const admin = MOCK_ADMINS.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );

    if (admin) {
      const result = await loginAsAdmin(email, password, admin.role);
      
      if (result.success) {
        toast({
          title: admin.role === 'ceo' ? '👑 Bem-vindo, CEO!' : '🛡️ Bem-vindo, Admin!',
          description: 'Login realizado com sucesso.',
        });
        
        // Redirect based on role
        if (admin.role === 'ceo') {
          navigate('/ceo');
        } else {
          navigate('/admin');
        }
      }
    } else {
      setError('Email ou senha inválidos.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">Acesso Administrativo</h1>
          <p className="text-muted-foreground mt-2">
            Faça login para acessar o painel
          </p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Role indicators */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Credenciais de teste:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Admin</p>
                <p className="text-[10px] text-muted-foreground">admin@whisperscape.com</p>
                <p className="text-[10px] text-muted-foreground">admin123</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-center">
                <Crown className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xs font-medium">CEO</p>
                <p className="text-[10px] text-muted-foreground">ceo@whisperscape.com</p>
                <p className="text-[10px] text-muted-foreground">ceo123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para o início
          </button>
        </p>
      </motion.div>
    </div>
  );
}
