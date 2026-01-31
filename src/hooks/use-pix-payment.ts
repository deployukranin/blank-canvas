import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreateOrderParams {
  orderType: 'creator_custom' | 'platform_store';
  influencerId: string;
  amount: number; // valor em reais
  productType?: string;
  productId?: string;
  customerName?: string;
  customerEmail?: string;
  expiresIn?: number; // segundos até expirar
}

interface OrderResult {
  id: string;
  correlationId: string;
  status: string;
  amountCents: number;
  orderType: string;
  influencerName: string;
}

interface ChargeResult {
  brCode: string;
  qrCodeImage: string;
  paymentLinkUrl?: string;
  expiresAt: string;
}

interface PixPayment {
  order: OrderResult;
  charge: ChargeResult;
}

interface UsePixPaymentReturn {
  createOrder: (params: CreateOrderParams) => Promise<PixPayment | null>;
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

  const createOrder = useCallback(async (params: CreateOrderParams): Promise<PixPayment | null> => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setPayment(null);

    try {
      // Converter para snake_case para a API
      const requestBody = {
        order_type: params.orderType,
        influencer_id: params.influencerId,
        amount: params.amount,
        product_type: params.productType,
        product_id: params.productId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        expires_in: params.expiresIn,
      };

      const { data, error: fnError } = await supabase.functions.invoke('create-openpix-charge', {
        body: requestBody,
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
        order: data.order,
        charge: data.charge,
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
    createOrder,
    isLoading,
    error,
    errorCode,
    payment,
    reset,
  };
}
