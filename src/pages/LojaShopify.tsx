import { motion } from 'framer-motion';
import { ExternalLink, Tag, ShoppingBag, Sparkles, Copy } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/GlassCard';

// Produtos padrão caso não haja configuração
const defaultProducts = [
  { id: '1', name: 'Netflix Premium', originalPrice: 55.90, salePrice: 11.18, emoji: '🎬' },
  { id: '2', name: 'Spotify Premium', originalPrice: 34.90, salePrice: 6.98, emoji: '🎵' },
  { id: '3', name: 'Disney+', originalPrice: 43.90, salePrice: 8.78, emoji: '✨' },
  { id: '4', name: 'YouTube Premium', originalPrice: 45.90, salePrice: 9.18, emoji: '▶️' },
  { id: '5', name: 'HBO Max', originalPrice: 49.90, salePrice: 9.98, emoji: '🎭' },
  { id: '6', name: 'Amazon Prime', originalPrice: 19.90, salePrice: 3.98, emoji: '📦' },
];

const LojaShopify = () => {
  const { config } = useWhiteLabel();

  const storeUrl = config.shopify?.storeUrl || '';
  const couponCode = config.shopify?.couponCode || '';
  const couponLabel = config.shopify?.couponLabel || 'Use o cupom';
  const exampleProducts = config.shopify?.exampleProducts?.length 
    ? config.shopify.exampleProducts 
    : defaultProducts;


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

  const handleCopyCouponButton = () => {
    if (couponCode) {
      navigator.clipboard.writeText(couponCode);
      toast.success('Cupom copiado!');
    }
  };

  // Calcula percentual de desconto
  const calculateDiscountPercent = (originalPrice: number, salePrice: number) => {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  return (
    <MobileLayout hideHeader>
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center px-6 py-8 gap-6">
        {/* Store Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20"
        >
          <ShoppingBag className="w-10 h-10 text-primary" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-1"
        >
          <h1 className="font-display font-semibold text-2xl">Nossa Loja Parceira</h1>
        </motion.div>

        {/* Benefits Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-5 space-y-4">
            {/* Coupon benefit */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium text-sm">
                  Compre usando meu cupom e ganhe
                </p>
                <p className="text-primary font-bold text-lg">30% OFF em todos os produtos</p>
              </div>
            </div>

            {/* Subscription benefit */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium text-sm">
                  Assinaturas por até
                </p>
                <p className="text-primary font-bold text-lg">-80% do valor</p>
              </div>
            </div>

            {/* Coupon display */}
            {couponCode && (
              <div className="pt-2 border-t border-primary/20">
                <p className="text-muted-foreground text-xs mb-2">{couponLabel}</p>
                <div className="flex items-center justify-between bg-background/50 rounded-lg px-4 py-2 border border-primary/20">
                  <span className="font-mono font-bold text-primary text-lg tracking-wider">{couponCode}</span>
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-3"
        >
          {couponCode && (
            <Button 
              onClick={handleCopyCouponButton} 
              variant="outline"
              className="w-full gap-2 h-12 text-base border-primary/30 hover:bg-primary/10"
            >
              <Copy className="w-5 h-5" />
              Copiar Cupom
            </Button>
          )}
          
          <Button 
            onClick={handleOpenStore} 
            className="w-full gap-2 h-12 text-base"
            disabled={!normalizedUrl}
          >
            <ExternalLink className="w-5 h-5" />
            Abrir Loja Parceira
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

        {/* Example Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm space-y-4 pt-4"
        >
          <div className="text-center">
            <h2 className="font-display font-semibold text-lg">Exemplos de Produtos</h2>
            <p className="text-muted-foreground text-sm">Veja quanto você economiza!</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {exampleProducts.map((product, index) => {
              const salePrice = product.salePrice ?? product.originalPrice * 0.2;
              const discountPercent = calculateDiscountPercent(product.originalPrice, salePrice);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <GlassCard className="p-3 h-full">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                        <span className="text-2xl">{product.emoji}</span>
                      </div>
                      <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground line-through">
                          R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-primary font-bold text-base">
                          R$ {salePrice.toFixed(2).replace('.', ',')}
                        </p>
                        {discountPercent > 0 && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold">
                            -{discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default LojaShopify;
