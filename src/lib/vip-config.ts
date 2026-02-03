/**
 * VIP Subscription Configuration
 */

export interface VipPlan {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  description: string;
  features: string[];
}

export interface VipConfig {
  plans: VipPlan[];
}

// Default configuration
export const defaultVipConfig: VipConfig = {
  plans: [
    {
      id: 'monthly',
      name: 'Mensal',
      type: 'monthly',
      price: 19.90,
      description: 'Acesso VIP por 1 mês',
      features: [
        'Acesso a conteúdo exclusivo',
        'Vídeos antecipados',
        'Chat exclusivo',
        'Bastidores',
      ],
    },
    {
      id: 'quarterly',
      name: 'Trimestral',
      type: 'quarterly',
      price: 49.90,
      description: 'Acesso VIP por 3 meses (economia de 16%)',
      features: [
        'Tudo do plano mensal',
        'Economia de 16%',
        'Acesso antecipado a novidades',
      ],
    },
    {
      id: 'yearly',
      name: 'Anual',
      type: 'yearly',
      price: 199.90,
      description: 'Acesso VIP por 1 ano (economia de 17%)',
      features: [
        'Tudo do plano mensal',
        'Economia de 17%',
        'Prioridade em customs',
        'Brindes exclusivos',
      ],
    },
  ],
};

// Get config from localStorage cache (for sync access)
export const getVipConfig = (): VipConfig => {
  const savedConfig = localStorage.getItem('vipConfig_cache');
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch {
      return defaultVipConfig;
    }
  }
  return defaultVipConfig;
};

// Save config to localStorage cache
export const saveVipConfig = (config: VipConfig): void => {
  localStorage.setItem('vipConfig_cache', JSON.stringify(config));
};
