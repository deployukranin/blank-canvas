import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Package, ShoppingCart, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockSubscriptions } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface StoreTexts {
  productIncludedTitle: string;
  productDeliveryTitle: string;
  productDeliveryDescription: string;
  productDeliveryTip: string;
  productDurationLabel: string;
  productTypeLabel: string;
  productBuyButton: string;
}

interface ProductCustomization {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  features: string[];
  duration: string;
  type: string;
}

const defaultStoreTexts: StoreTexts = {
  productIncludedTitle: 'O que está incluso',
  productDeliveryTitle: 'Entrega Automática',
  productDeliveryDescription: 'Após a confirmação do pagamento, você receberá os dados de acesso diretamente no seu email cadastrado em até 24 horas.',
  productDeliveryTip: '💡 Verifique sua caixa de spam caso não receba o email.',
  productDurationLabel: 'Duração',
  productTypeLabel: 'Tipo',
  productBuyButton: 'Comprar Agora',
};

const ProdutoAssinatura = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [storeTexts, setStoreTexts] = useState<StoreTexts>(() => {
    const saved = localStorage.getItem('ceo_store_texts');
    return saved ? JSON.parse(saved) : defaultStoreTexts;
  });

  const [products, setProducts] = useState<ProductCustomization[]>(() => {
    const saved = localStorage.getItem('ceo_store_products');
    return saved ? JSON.parse(saved) : [];
  });

  const mockProduct = mockSubscriptions.find((p) => p.id === id);
  const customization = products.find(p => p.id === id);

  // Merge mock data with CEO customizations
  const product = mockProduct ? {
    ...mockProduct,
    name: customization?.name || mockProduct.name,
    description: customization?.description || mockProduct.description,
    logoUrl: customization?.logoUrl,
    features: customization?.features || mockProduct.features,
    duration: customization?.duration || '30 dias',
    type: customization?.type || 'Conta compartilhada',
  } : null;

  if (!product) {
    return (
      <MobileLayout title="Produto não encontrado">
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">Este produto não existe.</p>
          <Button variant="link" onClick={() => navigate('/loja')}>
            Voltar à loja
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleBuy = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // TODO: Implement purchase flow
    toast.success('Pedido realizado com sucesso!', {
      description: 'Você receberá os dados de acesso por email em até 24h.',
    });
    navigate('/meus-pedidos');
  };

  return (
    <MobileLayout 
      title={product.name}
      showBack
    >
      <div className="px-4 py-6 space-y-6 pb-32">
        {/* Product Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {product.logoUrl ? (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-primary/20 mx-auto mb-4">
              <img src={product.logoUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 mx-auto mb-4">
              <span className="text-4xl font-bold text-primary">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="font-display text-2xl font-bold">{product.name}</h1>
            {product.popular && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                ⭐ Popular
              </Badge>
            )}
          </div>
          
          <p className="text-muted-foreground">{product.description}</p>
        </motion.div>

        {/* Price Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-primary">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
            {discount > 0 && (
              <Badge variant="secondary" className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                {discount}% de desconto
              </Badge>
            )}
          </GlassCard>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {storeTexts.productIncludedTitle}
            </h2>
            <ul className="space-y-3">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>

        {/* Delivery Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-4">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {storeTexts.productDeliveryTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {storeTexts.productDeliveryDescription}
            </p>
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                {storeTexts.productDeliveryTip}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Duration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{storeTexts.productDurationLabel}</span>
              <span className="font-semibold">{product.duration}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">{storeTexts.productTypeLabel}</span>
              <span className="font-semibold">{product.type}</span>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Fixed Buy Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pb-6">
        <Button 
          size="lg" 
          className="w-full gap-2"
          onClick={handleBuy}
        >
          <ShoppingCart className="w-5 h-5" />
          {storeTexts.productBuyButton}
        </Button>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </MobileLayout>
  );
};

export default ProdutoAssinatura;
