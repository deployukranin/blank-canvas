import { useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Play, Pause, Send, Check } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { mockAudioCategories, type CustomCategory } from '@/lib/mock-data';
import { onCustomOrder, onPurchase, trackEvent } from '@/lib/integrations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AudiosPage = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<CustomCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', preferences: '', observations: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSelectCategory = (category: CustomCategory) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedCategory(category);
  };

  const handleOrder = async () => {
    if (!selectedCategory || !formData.name.trim() || !formData.preferences.trim()) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    const result = await onPurchase({
      productId: `custom-audio-${selectedCategory.id}`,
      productType: 'custom_audio',
      amount: selectedCategory.basePrice,
      currency: 'BRL',
    });

    if (result.success) {
      await onCustomOrder({
        type: 'audio',
        category: selectedCategory.id,
        name: formData.name,
        preferences: formData.preferences,
        observations: formData.observations,
        status: 'pending',
      });

      trackEvent('custom_audio_order', { category: selectedCategory.id });
      setOrderComplete(true);
    }

    setIsProcessing(false);
  };

  const resetOrder = () => {
    setSelectedCategory(null);
    setFormData({ name: '', preferences: '', observations: '' });
    setOrderComplete(false);
  };

  return (
    <MobileLayout title="Áudios" showBack>
      <div className="px-4 py-6 space-y-4">
        {/* Preview Player */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Preview</h3>
              <p className="text-xs text-muted-foreground">Ouça um exemplo de áudio</p>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? { height: [8, Math.random() * 24 + 8, 8] } : {}}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.02 }}
                  className="w-1 bg-primary/40 rounded-full"
                  style={{ height: 8 }}
                />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Categories */}
        <h3 className="font-display font-semibold">Categorias</h3>
        <div className="grid grid-cols-2 gap-3">
          {mockAudioCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard
                className="p-4 text-center"
                onClick={() => handleSelectCategory(category)}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h4 className="font-semibold text-sm mb-1">{category.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                <div className="font-bold text-primary text-sm">
                  R$ {category.basePrice.toFixed(2).replace('.', ',')}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Faça login para pedir áudios personalizados"
      />

      <Dialog open={!!selectedCategory && !orderComplete} onOpenChange={() => !isProcessing && resetOrder()}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle>Pedir Áudio</DialogTitle>
            <DialogDescription>
              {selectedCategory?.name} - R$ {selectedCategory?.basePrice.toFixed(2).replace('.', ',')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Seu nome *"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="glass border-white/10"
            />
            <Textarea
              placeholder="Preferências *"
              value={formData.preferences}
              onChange={e => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
              className="glass border-white/10 min-h-[80px]"
            />
            <Textarea
              placeholder="Observações (opcional)"
              value={formData.observations}
              onChange={e => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              className="glass border-white/10"
            />
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={resetOrder} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent gap-2"
                onClick={handleOrder}
                disabled={isProcessing}
              >
                <Send className="w-4 h-4" />
                {isProcessing ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={orderComplete} onOpenChange={resetOrder}>
        <DialogContent className="glass mx-4 text-center">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Pedido Realizado! 🎧</h3>
            <p className="text-muted-foreground text-sm mb-4">Prazo: 3 dias úteis</p>
            <Button onClick={resetOrder} className="bg-gradient-to-r from-primary to-accent">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default AudiosPage;
