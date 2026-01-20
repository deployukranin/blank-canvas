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
import { useState } from 'react';
import { toast } from 'sonner';

const ProdutoAssinatura = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const product = mockSubscriptions.find((p) => p.id === id);

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
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 mx-auto mb-4">
            <span className="text-4xl font-bold text-primary">
              {product.name.charAt(0)}
            </span>
          </div>
          
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
              O que está incluso
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
              Entrega Automática
            </h2>
            <p className="text-sm text-muted-foreground">
              Após a confirmação do pagamento, você receberá os dados de acesso diretamente no seu email cadastrado em até <strong className="text-foreground">24 horas</strong>.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                💡 Verifique sua caixa de spam caso não receba o email.
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
              <span className="text-sm text-muted-foreground">Duração</span>
              <span className="font-semibold">30 dias</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <span className="font-semibold">Conta compartilhada</span>
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
          Comprar Agora
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
