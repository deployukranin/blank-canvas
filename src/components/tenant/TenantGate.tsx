import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

interface TenantStoreNotFoundProps {
  slug: string;
}

const TenantStoreNotFound = ({ slug }: TenantStoreNotFoundProps) => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="text-center max-w-md">
      <h1 className="text-4xl font-bold text-foreground mb-3">404</h1>
      <p className="text-muted-foreground mb-2">
        A loja <span className="font-semibold text-foreground">"{slug}"</span> não foi encontrada.
      </p>
      <p className="text-sm text-muted-foreground">
        Verifique se o endereço está correto ou entre em contato com o criador.
      </p>
    </div>
  </div>
);

/**
 * Wraps tenant-scoped pages. Shows loading/error states while resolving store.
 */
export const TenantGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug, store, isLoading, error } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store) {
    return <TenantStoreNotFound slug={slug || ''} />;
  }

  return <>{children}</>;
};
