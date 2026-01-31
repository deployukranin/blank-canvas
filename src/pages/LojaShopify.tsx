import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

const LOAD_TIMEOUT_MS = 8000;

const LojaShopify = () => {
  const { config } = useWhiteLabel();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storeUrl = config.shopify?.storeUrl || '';

  // Normalize URL to ensure HTTPS
  const normalizedUrl = (() => {
    if (!storeUrl) return '';
    let url = storeUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.replace('http://', 'https://');
  })();

  useEffect(() => {
    if (!normalizedUrl) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Set timeout for load detection
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
      }
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [normalizedUrl, isLoading]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(false);
    // Note: We can't detect X-Frame-Options block directly
    // The iframe will appear blank if blocked
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload
    if (iframeRef.current) {
      iframeRef.current.src = normalizedUrl;
    }
  };

  const handleOpenExternal = () => {
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <MobileLayout hideHeader>
      <div className="h-[calc(100vh-5rem)] w-full relative flex flex-col">
        {/* Loading State */}
        {isLoading && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background gap-4"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Carregando loja...</p>
          </motion.div>
        )}

        {/* Error State / Fallback */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background px-6 gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="font-display font-semibold text-lg">
                Não foi possível carregar a loja
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                A loja pode estar bloqueando o carregamento embutido. 
                Tente abrir diretamente no navegador.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button onClick={handleOpenExternal} className="gap-2 w-full">
                <ExternalLink className="w-4 h-4" />
                Abrir Loja
              </Button>
              <Button variant="outline" onClick={handleRetry} className="gap-2 w-full">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            </div>
          </motion.div>
        )}

        {/* Iframe */}
        {normalizedUrl && (
          <iframe
            ref={iframeRef}
            src={normalizedUrl}
            onLoad={handleIframeLoad}
            className={`flex-1 w-full border-0 ${isLoading || hasError ? 'invisible' : 'visible'}`}
            title="Loja Shopify"
            allow="payment; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}

        {/* No URL configured */}
        {!normalizedUrl && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Nenhuma URL de loja configurada. Configure no painel CEO.
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default LojaShopify;
