import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { mockSubscriptions } from '@/lib/mock-data';
import { useState } from 'react';
import { SupportChat } from '@/components/support/SupportChat';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import LojaShopify from './LojaShopify';

interface StoreTexts {
  pageTitle: string;
  pageSubtitle: string;
  sectionTitle: string;
  sectionSubtitle: string;
}

interface ProductCustomization {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
}

const defaultStoreTexts: StoreTexts = {
  pageTitle: 'Loja',
  pageSubtitle: 'Explore nossos produtos e serviços',
  sectionTitle: 'Assinaturas Digitais',
  sectionSubtitle: 'Entrega automática em até 24h',
};

const LojaPage = () => {
  const { config } = useWhiteLabel();
  
  // If Shopify is enabled, render the Shopify embed page
  if (config.shopify?.enabled && config.shopify?.storeUrl) {
    return <LojaShopify />;
  }

  // Otherwise, render the default digital store
  return <LojaDigital />;
};

const LojaDigital = () => {
  const [storeTexts, setStoreTexts] = useState<StoreTexts>(() => {
    const saved = localStorage.getItem('ceo_store_texts');
    return saved ? JSON.parse(saved) : defaultStoreTexts;
  });

  const [products, setProducts] = useState<ProductCustomization[]>(() => {
    const saved = localStorage.getItem('ceo_store_products');
    return saved ? JSON.parse(saved) : [];
  });

  // Merge CEO customizations with mock data
  const getProductData = (mockProduct: typeof mockSubscriptions[0]) => {
    const customization = products.find(p => p.id === mockProduct.id);
    return {
      ...mockProduct,
      name: customization?.name || mockProduct.name,
      description: customization?.description || mockProduct.description,
      logoUrl: customization?.logoUrl,
    };
  };

  return (
    <MobileLayout title={storeTexts.pageTitle} hideHeader>
      <div className="px-4 py-6 space-y-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-sm"
        >
          {storeTexts.pageSubtitle}
        </motion.p>

        {/* Subscription Products */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {storeTexts.sectionTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {storeTexts.sectionSubtitle}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {mockSubscriptions.map((product, index) => {
              const productData = getProductData(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/loja/produto/${product.id}`}>
                    <GlassCard className="p-3 hover:scale-[1.02] transition-transform h-full">
                      <div className="flex flex-col items-center text-center gap-3">
                        {productData.logoUrl ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/20">
                            <img src={productData.logoUrl} alt={productData.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                            <span className="text-3xl font-bold text-primary">
                              {productData.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex flex-col items-center gap-1">
                            <h3 className="font-display font-semibold text-sm leading-tight">{productData.name}</h3>
                            {product.popular && (
                              <Badge variant="secondary" className="text-[10px]">Popular</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{productData.description}</p>
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
              );
            })}
          </div>
        </div>

      </div>

      {/* Support Chat Button */}
      <SupportChat defaultCategory="payment" />
    </MobileLayout>
  );
};

export default LojaPage;
