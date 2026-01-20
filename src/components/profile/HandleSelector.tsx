import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtSign, Check, Loader2, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HandleSelectorProps {
  currentHandle?: string | null;
  onHandleSet: (handle: string) => void;
}

export const HandleSelector = ({ currentHandle, onHandleSet }: HandleSelectorProps) => {
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handle.trim()) {
      setError('Digite um @ para continuar');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('set_user_handle', {
        new_handle: handle.trim()
      });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; error?: string; handle?: string };

      if (!result.success) {
        setError(result.error || 'Erro ao definir @');
        return;
      }

      toast({
        title: '@ definido com sucesso!',
        description: `Seu @ agora é @${result.handle}`,
      });

      onHandleSet(result.handle!);
    } catch (err) {
      console.error('Error setting handle:', err);
      setError('Erro ao definir @. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // If handle is already set, show it
  if (currentHandle) {
    return (
      <GlassCard className="p-4 bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Seu @</p>
            <p className="text-xs text-muted-foreground">@{currentHandle}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <AtSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium text-sm">Escolha seu @</p>
                <p className="text-xs text-muted-foreground">
                  3-20 caracteres • minúsculas, números e _
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </div>
                <Input
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value.toLowerCase());
                    setError('');
                  }}
                  placeholder="seuusuario"
                  className="pl-8 bg-background/50 border-white/10"
                  disabled={isLoading}
                  maxLength={20}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !handle.trim()}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Definindo...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Definir @ (única vez)
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
};
