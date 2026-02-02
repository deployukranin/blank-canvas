import { motion } from 'framer-motion';
import { ExternalLink, Tag, ShoppingBag } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LojaShopify = () => {
  const { config } = useWhiteLabel();

  const storeUrl = config.shopify?.storeUrl || '';
  const couponCode = config.shopify?.couponCode || '';
  const couponLabel = config.shopify?.couponLabel || 'Use o cupom';

  // Normalize URL to ensure HTTPS
  const normalizedUrl = (() => {
    if (!storeUrl) return '';
    let url = storeUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.replace('http://', 'https://');
  })();

  const handleOpenStore = () => {
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyCoupon = () => {
    if (couponCode) {
      navigator.clipboard.writeText(couponCode);
    }
  };

  return (
    <MobileLayout hideHeader>
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-6 py-12 gap-8">
        {/* Store Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20"
        >
          <ShoppingBag className="w-12 h-12 text-primary" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-2"
        >
          <h1 className="font-display font-semibold text-2xl">Loja</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Acesse nossa loja para ver todos os produtos disponíveis
          </p>
        </motion.div>

        {/* Coupon Alert */}
        {couponCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm"
          >
            <Alert className="bg-primary/10 border-primary/30 cursor-pointer hover:bg-primary/15 transition-colors" onClick={handleCopyCoupon}>
              <Tag className="w-4 h-4 text-primary" />
              <AlertDescription className="flex items-center gap-2">
                <span className="text-foreground">{couponLabel}</span>
                <span className="font-bold text-primary">{couponCode}</span>
                <span className="text-xs text-muted-foreground ml-auto">(toque para copiar)</span>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Open Store Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm"
        >
          <Button 
            onClick={handleOpenStore} 
            className="w-full gap-2 h-12 text-base"
            disabled={!normalizedUrl}
          >
            <ExternalLink className="w-5 h-5" />
            Ir para Loja
          </Button>
        </motion.div>

        {/* No URL configured */}
        {!normalizedUrl && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-sm text-center"
          >
            Nenhuma URL de loja configurada. Configure no painel CEO.
          </motion.p>
        )}
      </div>
    </MobileLayout>
  );
};

export default LojaShopify;
