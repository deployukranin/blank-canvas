import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const AuthModal = ({ isOpen, onClose, message }: AuthModalProps) => {
  const navigate = useNavigate();
  const { basePath, isTenantScope } = useTenant();

  const handleGoToAuth = () => {
    onClose();
    navigate(isTenantScope ? `${basePath}/entrar` : '/entrar');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom"
          >
            <div className="glass rounded-3xl p-6 max-w-md mx-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold mb-2">
                  Entre para continuar
                </h2>
                <p className="text-muted-foreground text-sm">
                  {message || 'Faça login para acessar esta funcionalidade'}
                </p>
              </div>

              <Button
                onClick={handleGoToAuth}
                className="w-full h-12 font-medium"
              >
                Entrar ou Criar Conta
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Ao continuar, você concorda com nossos{' '}
                <Link to="/termos" className="underline underline-offset-2 hover:text-foreground">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacidade" className="underline underline-offset-2 hover:text-foreground">
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
