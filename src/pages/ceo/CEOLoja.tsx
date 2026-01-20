import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

interface StoreTexts {
  pageTitle: string;
  pageSubtitle: string;
  sectionTitle: string;
  sectionSubtitle: string;
  // Product page fixed texts
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
  pageTitle: 'Loja',
  pageSubtitle: 'Explore nossos produtos e serviços',
  sectionTitle: 'Assinaturas Digitais',
  sectionSubtitle: 'Entrega automática em até 24h',
  productIncludedTitle: 'O que está incluso',
  productDeliveryTitle: 'Entrega Automática',
  productDeliveryDescription: 'Após a confirmação do pagamento, você receberá os dados de acesso diretamente no seu email cadastrado em até 24 horas.',
  productDeliveryTip: '💡 Verifique sua caixa de spam caso não receba o email.',
  productDurationLabel: 'Duração',
  productTypeLabel: 'Tipo',
  productBuyButton: 'Comprar Agora',
};

const defaultProducts: ProductCustomization[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    description: 'Acesso completo ao catálogo de filmes e séries',
    features: ['Catálogo completo', '4 telas simultâneas', 'Qualidade 4K', 'Downloads ilimitados'],
    duration: '30 dias',
    type: 'Conta compartilhada',
  },
  {
    id: 'spotify',
    name: 'Spotify Premium',
    description: 'Músicas e podcasts sem anúncios',
    features: ['Sem anúncios', 'Downloads offline', 'Qualidade máxima', 'Spotify Connect'],
    duration: '30 dias',
    type: 'Conta compartilhada',
  },
  {
    id: 'youtube',
    name: 'YouTube Premium',
    description: 'Vídeos sem anúncios + YouTube Music',
    features: ['Sem anúncios', 'YouTube Music incluído', 'Downloads offline', 'Background play'],
    duration: '30 dias',
    type: 'Conta compartilhada',
  },
  {
    id: 'disney',
    name: 'Disney+',
    description: 'Universo Disney, Pixar, Marvel e Star Wars',
    features: ['Catálogo completo', '4 telas simultâneas', 'Qualidade 4K', 'Downloads'],
    duration: '30 dias',
    type: 'Conta compartilhada',
  },
];

const CEOLoja = () => {
  const { config, updateBranding } = useWhiteLabel();
  
  const [storeTexts, setStoreTexts] = useState<StoreTexts>(() => {
    const saved = localStorage.getItem('ceo_store_texts');
    return saved ? JSON.parse(saved) : defaultStoreTexts;
  });

  const [products, setProducts] = useState<ProductCustomization[]>(() => {
    const saved = localStorage.getItem('ceo_store_products');
    return saved ? JSON.parse(saved) : defaultProducts;
  });

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('ceo_store_texts', JSON.stringify(storeTexts));
  }, [storeTexts]);

  useEffect(() => {
    localStorage.setItem('ceo_store_products', JSON.stringify(products));
  }, [products]);

  const handleSaveTexts = () => {
    toast.success('Textos da loja salvos!');
  };

  const handleProductUpdate = (id: string, field: keyof ProductCustomization, value: any) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleProductFeatureUpdate = (id: string, index: number, value: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const newFeatures = [...p.features];
        newFeatures[index] = value;
        return { ...p, features: newFeatures };
      }
      return p;
    }));
  };

  const handleAddProductFeature = (id: string) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, features: [...p.features, ''] } : p
    ));
  };

  const handleRemoveProductFeature = (id: string, index: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, features: p.features.filter((_, i) => i !== index) };
      }
      return p;
    }));
  };

  const handleLogoUpload = (productId: string) => {
    // Simulated upload - in production, integrate with file storage
    const mockUrl = 'https://via.placeholder.com/200x200/8b5cf6/ffffff?text=' + productId.charAt(0).toUpperCase();
    handleProductUpdate(productId, 'logoUrl', mockUrl);
    toast.success('Logo atualizado!');
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <CEOLayout title="Configurar Loja">
      <div className="space-y-8">
        {/* Store Page Texts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg">Textos da Página /loja</h2>
                <p className="text-sm text-muted-foreground">Personalize os textos exibidos na página principal da loja</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Título da Página</Label>
                  <Input
                    value={storeTexts.pageTitle}
                    onChange={(e) => setStoreTexts(prev => ({ ...prev, pageTitle: e.target.value }))}
                    placeholder="Ex: Loja"
                  />
                </div>
                <div>
                  <Label>Subtítulo da Página</Label>
                  <Input
                    value={storeTexts.pageSubtitle}
                    onChange={(e) => setStoreTexts(prev => ({ ...prev, pageSubtitle: e.target.value }))}
                    placeholder="Ex: Explore nossos produtos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Título da Seção de Produtos</Label>
                  <Input
                    value={storeTexts.sectionTitle}
                    onChange={(e) => setStoreTexts(prev => ({ ...prev, sectionTitle: e.target.value }))}
                    placeholder="Ex: Assinaturas Digitais"
                  />
                </div>
                <div>
                  <Label>Subtítulo da Seção</Label>
                  <Input
                    value={storeTexts.sectionSubtitle}
                    onChange={(e) => setStoreTexts(prev => ({ ...prev, sectionSubtitle: e.target.value }))}
                    placeholder="Ex: Entrega automática em até 24h"
                  />
                </div>
              </div>

              <Button onClick={handleSaveTexts} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Textos da Loja
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Product Page Fixed Texts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <h2 className="font-display font-semibold text-lg mb-4">Textos Fixos das Páginas de Produto</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Esses textos aparecem em todas as páginas de produtos individuais (/loja/produto/*)
            </p>

            <div className="space-y-4">
              <div>
                <Label>Título "O que está incluso"</Label>
                <Input
                  value={storeTexts.productIncludedTitle}
                  onChange={(e) => setStoreTexts(prev => ({ ...prev, productIncludedTitle: e.target.value }))}
                />
              </div>

              <div>
                <Label>Título "Entrega"</Label>
                <Input
                  value={storeTexts.productDeliveryTitle}
                  onChange={(e) => setStoreTexts(prev => ({ ...prev, productDeliveryTitle: e.target.value }))}
                />
              </div>

              <div>
                <Label>Descrição da Entrega</Label>
                <Textarea
                  value={storeTexts.productDeliveryDescription}
                  onChange={(e) => setStoreTexts(prev => ({ ...prev, productDeliveryDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Dica de Entrega</Label>
                <Input
                  value={storeTexts.productDeliveryTip}
                  onChange={(e) => setStoreTexts(prev => ({ ...prev, productDeliveryTip: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Label "Duração"</Label>
                  <Input
                    value={storeTexts.productDurationLabel}
                    onChange={(e) => setStoreTexts(prev => ({ ...prev, productDurationLabel: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Label "Tipo"</Label>
                  <Input
                    value={storeTexts.productTypeLabel}
                    onChange={(e) => setStoreTexts(prev => ({ ...prev, productTypeLabel: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Texto do Botão Comprar</Label>
                  <Input
                    value={storeTexts.productBuyButton}
                    onChange={(e) => setStoreTexts(prev => ({ ...prev, productBuyButton: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveTexts} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Textos de Produto
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Products Customization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <h2 className="font-display font-semibold text-lg mb-4">Produtos Individuais</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Configure nome, descrição, logo e features de cada produto
            </p>

            <div className="space-y-6">
              {products.map((product) => (
                <div key={product.id} className="border border-border/50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{product.name}</h3>
                    <Button
                      size="sm"
                      variant={selectedProduct === product.id ? 'default' : 'outline'}
                      onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                    >
                      {selectedProduct === product.id ? 'Fechar' : 'Editar'}
                    </Button>
                  </div>

                  {selectedProduct === product.id && (
                    <div className="space-y-4 pt-4 border-t border-border/30">
                      {/* Logo Upload */}
                      <div>
                        <Label>Logo do Produto</Label>
                        <div className="flex items-center gap-4 mt-2">
                          {product.logoUrl ? (
                            <div className="w-20 h-20 rounded-lg border border-primary/20 overflow-hidden">
                              <img src={product.logoUrl} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                              <span className="text-2xl font-bold text-primary">
                                {product.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleLogoUpload(product.id)} className="gap-2">
                            <Upload className="w-4 h-4" />
                            {product.logoUrl ? 'Trocar Logo' : 'Adicionar Logo'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nome do Produto</Label>
                          <Input
                            value={product.name}
                            onChange={(e) => handleProductUpdate(product.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Descrição</Label>
                          <Input
                            value={product.description}
                            onChange={(e) => handleProductUpdate(product.id, 'description', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Duração</Label>
                          <Input
                            value={product.duration}
                            onChange={(e) => handleProductUpdate(product.id, 'duration', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Input
                            value={product.type}
                            onChange={(e) => handleProductUpdate(product.id, 'type', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Features/Benefícios</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddProductFeature(product.id)}
                            className="gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {product.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={feature}
                                onChange={(e) => handleProductFeatureUpdate(product.id, index, e.target.value)}
                                placeholder="Ex: Sem anúncios"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveProductFeature(product.id, index)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button onClick={() => toast.success(`${product.name} atualizado!`)} className="gap-2">
                        <Save className="w-4 h-4" />
                        Salvar {product.name}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEOLoja;
