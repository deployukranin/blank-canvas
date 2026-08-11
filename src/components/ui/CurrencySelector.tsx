import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import { loadConfig, saveConfig } from '@/lib/config-storage';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { normalizeCurrency, type DisplayCurrency } from '@/lib/currency';

const currencies: { code: DisplayCurrency; label: string; short: string; symbol: string }[] = [
  { code: 'BRL', label: 'Real (BRL)', short: 'BRL', symbol: 'R$' },
  { code: 'USD', label: 'Dólar (USD)', short: 'USD', symbol: '$' },
];

interface CurrencySelectorProps {
  variant?: 'default' | 'minimal';
}

/**
 * Store currency selector (admin only). The currency is defined here and by
 * the payment settings — never by the interface language.
 */
export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ variant = 'minimal' }) => {
  const { store } = useTenant();
  const { toast } = useToast();
  const storeId = store?.id ?? null;
  const [currency, setCurrency] = useState<DisplayCurrency>('BRL');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    (async () => {
      const conf = await loadConfig<{ currency?: string }>('payment_config', storeId);
      if (active) setCurrency(normalizeCurrency(conf?.currency));
    })();
    return () => { active = false; };
  }, [storeId]);

  const change = async (next: DisplayCurrency) => {
    if (!storeId || next === currency || saving) return;
    setSaving(true);
    const previous = currency;
    setCurrency(next);
    const existing = (await loadConfig<Record<string, unknown>>('payment_config', storeId)) || {};
    const ok = await saveConfig('payment_config', { ...existing, currency: next }, storeId);
    setSaving(false);
    if (!ok) {
      setCurrency(previous);
      toast({ title: 'Erro', description: 'Não foi possível alterar a moeda.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Moeda atualizada', description: `Todos os preços agora usam ${next}.` });
    window.dispatchEvent(new CustomEvent('store-currency-changed', { detail: { storeId, currency: next } }));
  };

  if (!storeId) return null;
  const current = currencies.find(c => c.code === currency) ?? currencies[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={
            variant === 'minimal'
              ? 'h-8 gap-1.5 text-foreground/50 hover:text-foreground text-xs'
              : 'h-8 gap-2 text-sm'
          }
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="font-semibold">{current.symbol}</span>}
          <span>{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {currencies.map(c => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => change(c.code)}
            className={`gap-2 text-sm cursor-pointer ${c.code === currency ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="w-4 font-semibold">{c.symbol}</span>
            <span>{c.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
