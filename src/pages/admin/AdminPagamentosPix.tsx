import { CreditCard, Construction } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';

const AdminPagamentosPix = () => {
  return (
    <AdminLayout title="Pagamentos PIX">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sistema em Reconstrução</h2>
          <p className="text-muted-foreground mb-4">
            O sistema de pagamentos PIX está sendo reconstruído do zero.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>Em breve disponível</span>
          </div>
        </GlassCard>
      </div>
    </AdminLayout>
  );
};

export default AdminPagamentosPix;
