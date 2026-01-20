import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/GlassCard';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationToggleProps {
  variant?: 'button' | 'card';
}

export const PushNotificationToggle = ({ variant = 'button' }: PushNotificationToggleProps) => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { toast } = useToast();

  const handleEnable = async () => {
    if (!isSupported) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return;
    }

    const result = await requestPermission();

    if (result === 'granted') {
      toast({
        title: 'Notificações ativadas! 🔔',
        description: 'Você receberá alertas sobre novos conteúdos e interações.',
      });
    } else if (result === 'denied') {
      toast({
        title: 'Permissão negada',
        description: 'Você pode ativar nas configurações do navegador.',
        variant: 'destructive',
      });
    }
  };

  if (variant === 'card') {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <BellRing className="w-5 h-5 text-primary" />
            ) : permission === 'denied' ? (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Bell className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label className="font-medium">Notificações Push</Label>
              <p className="text-xs text-muted-foreground">
                {permission === 'granted'
                  ? 'Recebendo alertas em tempo real'
                  : permission === 'denied'
                  ? 'Bloqueado nas configurações'
                  : 'Receba alertas sobre interações'}
              </p>
            </div>
          </div>
          
          <Switch
            checked={permission === 'granted'}
            onCheckedChange={handleEnable}
            disabled={!isSupported || permission === 'denied'}
          />
        </div>
      </GlassCard>
    );
  }

  // Button variant
  if (permission === 'granted') {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <BellRing className="w-4 h-4" />
        Notificações ativas
      </Button>
    );
  }

  if (permission === 'denied') {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 text-muted-foreground">
        <BellOff className="w-4 h-4" />
        Bloqueado
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleEnable}
      disabled={!isSupported}
      className="gap-2"
    >
      <Bell className="w-4 h-4" />
      Ativar notificações
    </Button>
  );
};
