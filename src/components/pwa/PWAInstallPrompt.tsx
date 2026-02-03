import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export const PWAInstallPrompt = () => {
  const { canInstall, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (canInstall) {
      // Delay inicial de 3 segundos para não interromper imediatamente
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleInstall = async () => {
    await promptInstall();
    if (!isIOS) {
      setShowPrompt(false);
    }
    // For iOS, keep showing instructions
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-28"
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
              {/* Glow effect */}
              <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="relative flex flex-col items-center text-center">
                {/* App Icon */}
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
                  <img 
                    src="/icon-192.png" 
                    alt="ASMR Luna" 
                    className="h-16 w-16 rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('fallback-icon');
                    }}
                  />
                  <Smartphone className="hidden h-10 w-10 text-primary-foreground" />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Instale o ASMR Luna!
                </h3>

                {/* Description - Different for iOS */}
                {isIOS ? (
                  <div className="mb-5 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Para instalar no seu iPhone/iPad, siga os passos:
                    </p>
                    
                    {/* iOS Installation Steps */}
                    <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                          <Share className="h-4 w-4" />
                        </div>
                        <p className="text-sm text-foreground">
                          <span className="font-medium">1.</span> Toque no botão <span className="font-semibold">Compartilhar</span> do Safari
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                          <Plus className="h-4 w-4" />
                        </div>
                        <p className="text-sm text-foreground">
                          <span className="font-medium">2.</span> Selecione <span className="font-semibold">"Adicionar à Tela de Início"</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                          <Download className="h-4 w-4" />
                        </div>
                        <p className="text-sm text-foreground">
                          <span className="font-medium">3.</span> Toque em <span className="font-semibold">"Adicionar"</span> no canto superior
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mb-6 text-sm text-muted-foreground">
                    Adicione nosso app na sua tela inicial para acesso rápido e melhor experiência.
                  </p>
                )}

                {/* Buttons */}
                <div className="flex w-full gap-3">
                  {isIOS ? (
                    <Button
                      onClick={handleDismiss}
                      className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                    >
                      Entendi!
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleInstall}
                        className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                      >
                        <Download className="h-4 w-4" />
                        Instalar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        className="flex-1 text-muted-foreground hover:text-foreground"
                      >
                        Agora não
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
