import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ShoppingCart } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { mockSubscriptions, type DigitalSubscription } from '@/lib/mock-data';
import { onPurchase, trackEvent } from '@/lib/integrations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AssinaturasPage = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<DigitalSubscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSelectProduct = (product: DigitalSubscription) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedProduct(product);
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    setIsProcessing(true);

    const result = await onPurchase({
      productId: selectedProduct.id,
      productType: 'subscription',
      amount: selectedProduct.price,
      currency: 'BRL',
    });

    setIsProcessing(false);

    if (result.success) {
      trackEvent('subscription_purchase', { productId: selectedProduct.id });
      toast({
        title: 'Pedido realizado! 🎉',
        description: `Pedido #${result.orderId} registrado`,
      });
      setSelectedProduct(null);
    }
  };

  return (
    <MobileLayout title="Assinaturas" showBack>
      <div className="px-4 py-6 space-y-4">
        {mockSubscriptions.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard className={`p-4 relative ${product.popular ? 'ring-2 ring-primary' : ''}`}>
              {product.popular && (
                <div className="absolute -top-2 right-4">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    <Star className="w-3 h-3" />
                    Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-xl font-bold gradient-text">
                    {product.name.charAt(0)}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.description}</p>
                </div>

                <div className="text-right">
                  <div className="font-display font-bold text-primary">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </div>
                  {product.originalPrice && (
                    <div className="text-xs text-muted-foreground line-through">
                      R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {product.features.slice(0, 2).map((feature, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-success" />
                    {feature}
                  </span>
                ))}
              </div>

              <Button
                className="w-full mt-4 gap-2"
                variant={product.popular ? 'default' : 'outline'}
                onClick={() => handleSelectProduct(product)}
              >
                <ShoppingCart className="w-4 h-4" />
                Comprar
              </Button>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Faça login para comprar assinaturas"
      />

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - R$ {selectedProduct?.price.toFixed(2).replace('.', ',')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Pagamento via PIX ou cartão</p>
              <p>• Dados de acesso em até 24h</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedProduct(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent"
                onClick={handlePurchase}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default AssinaturasPage;
