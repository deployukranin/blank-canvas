import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { generatePixBRCode } from '@/lib/pix-generator';
import { toast } from 'sonner';

interface PixQRCodeProps {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId?: string;
}

export const PixQRCode: React.FC<PixQRCodeProps> = ({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId,
}) => {
  const [copied, setCopied] = useState(false);

  const brCode = generatePixBRCode({
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txId,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(brCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <GlassCard className="p-4 bg-white rounded-xl">
        <QRCodeSVG
          value={brCode}
          size={220}
          level="M"
          includeMargin
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </GlassCard>

      <div className="text-center space-y-1">
        <p className="text-2xl font-bold text-primary">
          R$ {amount.toFixed(2).replace('.', ',')}
        </p>
        <p className="text-xs text-muted-foreground">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copiar Código PIX
          </>
        )}
      </Button>
    </div>
  );
};
