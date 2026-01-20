import { motion } from 'framer-motion';
import { Headphones, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { mockSubscriptions } from '@/lib/mock-data';

const LojaPage = () => {
  return (
    <MobileLayout title="Loja">
      <div className="px-4 py-6 space-y-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-sm"
        >
          Explore nossos produtos e serviços
        </motion.p>

        {/* Subscription Products */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Assinaturas Digitais
          </h2>
          <p className="text-sm text-muted-foreground">
            Entrega automática em até 24h
          </p>

          <div className="grid grid-cols-2 gap-3">
            {mockSubscriptions.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/loja/produto/${product.id}`}>
                  <GlassCard className="p-3 hover:scale-[1.02] transition-transform h-full">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                        <span className="text-3xl font-bold text-primary">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-col items-center gap-1">
                          <h3 className="font-display font-semibold text-sm leading-tight">{product.name}</h3>
                          {product.popular && (
                            <Badge variant="secondary" className="text-[10px]">Popular</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                        <div className="flex flex-col items-center gap-0.5 pt-1">
                          <span className="font-semibold text-primary">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Audio Category */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg">Conteúdo Personalizado</h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/audios">
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Headphones className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold">Áudios Personalizados</h3>
                    <p className="text-sm text-muted-foreground">Sons relaxantes sob medida</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default LojaPage;
