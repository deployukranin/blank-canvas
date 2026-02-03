import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export const PWAInstallPrompt = () => {
  const { canInstall, promptInstall, dismissPrompt } = usePWAInstall();
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
    setShowPrompt(false);
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
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
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
                      // Fallback to icon if image fails
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

                {/* Description */}
                <p className="mb-6 text-sm text-muted-foreground">
                  Adicione nosso app na sua tela inicial para acesso rápido e melhor experiência.
                </p>

                {/* Buttons */}
                <div className="flex w-full gap-3">
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
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
