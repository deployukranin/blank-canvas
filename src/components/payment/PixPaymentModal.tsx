import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Clock, CheckCircle, Loader2, QrCode, AlertCircle, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { usePixPayment, type OrderStatus } from '@/hooks/use-pix-payment';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
  qrCodeImage: string;
  brCode: string;
  correlationId: string;
  expiresAt: string;
  amount: number;
  isManualPix?: boolean;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  onPaymentConfirmed,
  qrCodeImage,
  brCode,
  correlationId,
  expiresAt,
  amount,
  isManualPix = false,
}: PixPaymentModalProps) {
  const { copyBrCode, checkPaymentStatus } = usePixPayment();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Poll for payment status (only for non-manual PIX)
  useEffect(() => {
    if (!isOpen || isPaid || isExpired || !correlationId || isManualPix) return;

    const pollStatus = async () => {
      setIsChecking(true);
      const status = await checkPaymentStatus(correlationId);
      setIsChecking(false);
      
      if (status && status.status !== 'pending') {
        setIsPaid(true);
        setTimeout(() => {
          onPaymentConfirmed();
        }, 1500);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    pollStatus();
    
    return () => clearInterval(interval);
  }, [isOpen, isPaid, isExpired, correlationId, checkPaymentStatus, onPaymentConfirmed, isManualPix]);

  const handleCopy = useCallback(() => {
    copyBrCode(brCode);
  }, [brCode, copyBrCode]);

  const handleManualConfirm = () => {
    setIsPaid(true);
    setTimeout(() => {
      onPaymentConfirmed();
    }, 1500);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (!isPaid) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass mx-4 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Display */}
          <GlassCard className="p-4 text-center">
            <div className="text-sm text-muted-foreground">Valor a pagar</div>
            <div className="text-3xl font-bold text-primary">
              R$ {amount.toFixed(2).replace('.', ',')}
            </div>
          </GlassCard>

          {/* QR Code */}
          <div className="flex justify-center">
            {isPaid ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-48 h-48 flex flex-col items-center justify-center bg-success/20 rounded-lg"
              >
                <CheckCircle className="w-16 h-16 text-success mb-2" />
                <span className="text-success font-semibold text-center">
                  {isManualPix ? 'Pedido Registrado!' : 'Pagamento Confirmado!'}
                </span>
              </motion.div>
            ) : isExpired ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center bg-destructive/20 rounded-lg">
                <AlertCircle className="w-16 h-16 text-destructive mb-2" />
                <span className="text-destructive font-semibold text-center">QR Code Expirado</span>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <img
                  src={qrCodeImage}
                  alt="QR Code PIX"
                  className="w-48 h-48 rounded-lg bg-white p-2"
                />
                {isChecking && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Timer */}
          {!isPaid && !isExpired && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Expira em: <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-destructive' : 'text-primary'}`}>
                  {formatTime(timeLeft)}
                </span>
              </span>
            </div>
          )}

          {/* Copy Button */}
          {!isPaid && !isExpired && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4" />
              Copiar Código PIX
            </Button>
          )}

          {/* "Já Paguei" button for manual PIX */}
          {isManualPix && !isPaid && !isExpired && (
            <Button
              className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
              onClick={handleManualConfirm}
            >
              <CreditCard className="w-4 h-4" />
              Já Paguei
            </Button>
          )}

          {/* Status Messages */}
          {!isPaid && !isExpired && (
            <div className="text-center text-sm text-muted-foreground">
              {isManualPix ? (
                <>
                  <p>Após pagar, clique em "Já Paguei" para registrar seu pedido.</p>
                  <p className="text-xs mt-1">O pagamento será confirmado pelo criador.</p>
                </>
              ) : (
                <>
                  <p>Aguardando confirmação do pagamento...</p>
                  <p className="text-xs mt-1">O status será atualizado automaticamente</p>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isExpired && !isPaid && (
              <Button variant="destructive" className="flex-1" onClick={onClose}>
                Fechar
              </Button>
            )}
            {!isPaid && !isExpired && (
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
