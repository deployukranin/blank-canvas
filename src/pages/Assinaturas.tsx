import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';

const AssinaturasPage = () => {
  return (
    <MobileLayout title="Assinaturas" showBack>
      <div className="px-4 py-6">
        <GlassCard className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Em breve</h3>
          <p className="text-sm text-muted-foreground">
            Novas assinaturas serão adicionadas em breve. Fique atento!
          </p>
        </GlassCard>
      </div>
    </MobileLayout>
  );
};

export default AssinaturasPage;
