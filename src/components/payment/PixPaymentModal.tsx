import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Clock, QrCode, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    qrCode: string;
    brCode: string;
    value: number;
    expiresAt: string;
  } | null;
  onPaymentConfirmed?: () => void;
}

export function PixPaymentModal({
  open,
  onOpenChange,
  payment,
  onPaymentConfirmed,
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Countdown timer
  useEffect(() => {
    if (!payment?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(payment.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [payment?.expiresAt]);

  const handleCopyCode = async () => {
    if (!payment?.brCode) return;

    try {
      await navigator.clipboard.writeText(payment.brCode);
      setCopied(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  const formatValue = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <QrCode className="w-5 h-5 text-primary" />
            Pagamento Pix
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Expira em: <strong className="text-foreground">{timeLeft}</strong></span>
          </div>

          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-3xl font-bold text-primary">{formatValue(payment.value)}</p>
          </div>

          {/* QR Code */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center"
          >
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <img
                src={payment.qrCode}
                alt="QR Code Pix"
                className="w-48 h-48"
              />
            </div>
          </motion.div>

          {/* Instruções */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>1. Abra o app do seu banco</p>
            <p>2. Escaneie o QR Code ou copie o código</p>
            <p>3. Confirme o pagamento</p>
          </div>

          {/* Código Copia e Cola */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Ou copie o código Pix:</p>
            <div className="flex gap-2">
              <div className="flex-1 glass rounded-lg p-3 text-xs font-mono break-all max-h-20 overflow-y-auto">
                {payment.brCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Botão fechar */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
