import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { type DigitalSubscription } from '@/lib/mock-data';
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

        {/* Empty State */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {storeTexts.sectionTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {storeTexts.sectionSubtitle}
          </p>

          <GlassCard className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Em breve</h3>
            <p className="text-sm text-muted-foreground">
              Novos produtos serão adicionados em breve. Fique atento!
            </p>
          </GlassCard>
        </div>

      </div>

      {/* Support Chat Button */}
      <SupportChat defaultCategory="payment" />
    </MobileLayout>
  );
};

export default LojaPage;
