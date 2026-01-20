import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreateChargeParams {
  value: number; // valor em centavos
  productType: string;
  productId?: string;
  influencerId?: string; // ID do influencer para split automático
  customer?: {
    name?: string;
    email?: string;
    taxID?: string;
    phone?: string;
  };
  comment?: string;
  expiresIn?: number;
}

interface SplitInfo {
  influencerId: string;
  influencerName: string;
  influencerValue: number;
  platformValue: number;
}

interface PixPayment {
  id: string;
  correlationId: string;
  value: number;
  status: string;
  qrCode: string;
  brCode: string;
  paymentLinkUrl?: string;
  expiresAt: string;
  split?: SplitInfo | null;
}

interface UsePixPaymentReturn {
  createCharge: (params: CreateChargeParams) => Promise<PixPayment | null>;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  payment: PixPayment | null;
  reset: () => void;
}

export function usePixPayment(): UsePixPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [payment, setPayment] = useState<PixPayment | null>(null);

  const createCharge = useCallback(async (params: CreateChargeParams): Promise<PixPayment | null> => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setPayment(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-pix-charge', {
        body: params,
      });

      if (fnError) {
        console.error('Erro ao criar cobrança:', fnError);
        setError(fnError.message || 'Erro ao criar cobrança Pix');
        return null;
      }

      if (!data?.success) {
        setError(data?.error || 'Erro desconhecido');
        setErrorCode(data?.code || null);
        return null;
      }

      const paymentData: PixPayment = {
        id: data.payment.id,
        correlationId: data.payment.correlationId,
        value: data.payment.value,
        status: data.payment.status,
        qrCode: data.payment.qrCode,
        brCode: data.payment.brCode,
        paymentLinkUrl: data.payment.paymentLinkUrl,
        expiresAt: data.payment.expiresAt,
        split: data.payment.split,
      };

      setPayment(paymentData);
      return paymentData;
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro ao processar pagamento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPayment(null);
    setError(null);
    setErrorCode(null);
    setIsLoading(false);
  }, []);

  return {
    createCharge,
    isLoading,
    error,
    errorCode,
    payment,
    reset,
  };
}
