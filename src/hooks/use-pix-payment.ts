import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateChargeParams {
  amount: number;
  productType: 'video' | 'audio';
  category: string;
  categoryName?: string;
  durationMinutes?: number;
  durationLabel?: string;
  customerName: string;
  triggers?: string;
  script?: string;
  preferences?: string;
  observations?: string;
}

export interface PixChargeResult {
  success: boolean;
  orderId?: string;
  correlationId?: string;
  qrCodeImage?: string;
  brCode?: string;
  expiresAt?: string;
  error?: string;
}

export interface OrderStatus {
  status: 'pending' | 'paid' | 'payout_done' | 'payout_failed' | 'delivered';
  paidAt?: string;
}

export function usePixPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [chargeData, setChargeData] = useState<PixChargeResult | null>(null);
  const { toast } = useToast();

  const createCharge = useCallback(async (params: CreateChargeParams): Promise<PixChargeResult> => {
    setIsLoading(true);
    
    try {
      console.log('Creating PIX charge:', params);
      
      const { data, error } = await supabase.functions.invoke('create-pix-charge', {
        body: params,
      });

      if (error) {
        console.error('Supabase function error:', error);
        const result: PixChargeResult = {
          success: false,
          error: error.message || 'Erro ao criar cobrança PIX',
        };
        setChargeData(result);
        return result;
      }

      if (!data?.success) {
        console.error('Charge creation failed:', data);
        const result: PixChargeResult = {
          success: false,
          error: data?.error || 'Erro ao processar pagamento',
        };
        setChargeData(result);
        return result;
      }

      const result: PixChargeResult = {
        success: true,
        orderId: data.order_id,
        correlationId: data.correlation_id,
        qrCodeImage: data.qr_code_image,
        brCode: data.br_code,
        expiresAt: data.expires_at,
      };

      setChargeData(result);
      console.log('Charge created successfully:', result);
      return result;

    } catch (error) {
      console.error('Unexpected error creating charge:', error);
      const result: PixChargeResult = {
        success: false,
        error: 'Erro inesperado. Tente novamente.',
      };
      setChargeData(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (correlationId: string): Promise<OrderStatus | null> => {
    try {
      // Query the custom_orders table directly
      const { data, error } = await supabase
        .from('custom_orders')
        .select('status, paid_at')
        .eq('correlation_id', correlationId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return null;
      }

      return {
        status: data.status as OrderStatus['status'],
        paidAt: data.paid_at || undefined,
      };
    } catch (error) {
      console.error('Unexpected error checking status:', error);
      return null;
    }
  }, []);

  const copyBrCode = useCallback(async (brCode: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(brCode);
      toast({
        title: 'Código copiado!',
        description: 'Cole no app do seu banco para pagar',
      });
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Copie o código manualmente',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const resetCharge = useCallback(() => {
    setChargeData(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    chargeData,
    createCharge,
    checkPaymentStatus,
    copyBrCode,
    resetCharge,
  };
}
