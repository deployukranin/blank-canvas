import { WifiOff } from 'lucide-react';

export const StoreOffline = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="text-center max-w-md space-y-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Plataforma Offline</h1>
      <p className="text-muted-foreground">
        Esta plataforma está temporariamente offline. Entre em contato com o criador para mais informações.
      </p>
    </div>
  </div>
);
