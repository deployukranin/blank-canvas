import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtSign, Check, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle.trim()) {
      setError(t('profile.handle.required', 'Type a username to continue'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('set_user_handle', {
        new_handle: handle.trim(),
      });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; error?: string; handle?: string };

      if (!result.success) {
        setError(result.error || t('profile.handle.error', 'Could not set your username'));
        return;
      }

      toast({
        title: t('profile.handle.successTitle', 'Username set!'),
        description: t('profile.handle.successDesc', 'Your username is now @{{handle}}', { handle: result.handle }),
      });

      onHandleSet(result.handle!);
    } catch (err) {
      console.error('Error setting handle:', err);
      setError(t('profile.handle.error', 'Could not set your username'));
    } finally {
      setIsLoading(false);
    }
  };

  // Already defined — permanent, no editing allowed
  if (currentHandle) {
    return (
      <GlassCard className="p-4 bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Check className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">@{currentHandle}</p>
            <p className="text-xs text-muted-foreground">
              {t('profile.handle.locked', 'Your username is permanent and cannot be changed.')}
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <AtSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium text-sm">{t('profile.handle.title', 'Choose your username')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('profile.handle.rules', '3-20 characters • lowercase, numbers and _')}
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</div>
                <Input
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value.toLowerCase());
                    setError('');
                  }}
                  placeholder={t('profile.handle.placeholder', 'yourusername')}
                  className="pl-8 bg-background/50"
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

              <Button type="submit" disabled={isLoading || !handle.trim()} className="w-full gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('profile.handle.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t('profile.handle.submit', 'Set username (only once)')}
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
