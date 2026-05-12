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

type Lang = 'pt' | 'en' | 'es';

const NAMES: Record<Lang, { monthly: string; quarterly: string; yearly: string }> = {
  pt: { monthly: 'Mensal', quarterly: 'Trimestral', yearly: 'Anual' },
  en: { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' },
  es: { monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual' },
};

const DESCRIPTIONS: Record<Lang, { monthly: string; quarterly: string; yearly: string }> = {
  pt: {
    monthly: 'Acesso VIP por 1 mês',
    quarterly: 'Acesso VIP por 3 meses (economia de 16%)',
    yearly: 'Acesso VIP por 1 ano (economia de 17%)',
  },
  en: {
    monthly: 'VIP access for 1 month',
    quarterly: 'VIP access for 3 months (save 16%)',
    yearly: 'VIP access for 1 year (save 17%)',
  },
  es: {
    monthly: 'Acceso VIP por 1 mes',
    quarterly: 'Acceso VIP por 3 meses (ahorra 16%)',
    yearly: 'Acceso VIP por 1 año (ahorra 17%)',
  },
};

const FEATURES: Record<Lang, { monthly: string[]; quarterly: string[]; yearly: string[] }> = {
  pt: {
    monthly: ['Acesso a conteúdo exclusivo', 'Vídeos antecipados', 'Chat exclusivo', 'Bastidores'],
    quarterly: ['Tudo do plano mensal', 'Economia de 16%', 'Acesso antecipado a novidades'],
    yearly: ['Tudo do plano mensal', 'Economia de 17%', 'Prioridade em customs', 'Brindes exclusivos'],
  },
  en: {
    monthly: ['Access to exclusive content', 'Early access to videos', 'Exclusive chat', 'Behind the scenes'],
    quarterly: ['Everything in the monthly plan', '16% savings', 'Early access to new releases'],
    yearly: ['Everything in the monthly plan', '17% savings', 'Priority on custom orders', 'Exclusive gifts'],
  },
  es: {
    monthly: ['Acceso a contenido exclusivo', 'Videos anticipados', 'Chat exclusivo', 'Tras bastidores'],
    quarterly: ['Todo del plan mensual', 'Ahorro del 16%', 'Acceso anticipado a novedades'],
    yearly: ['Todo del plan mensual', 'Ahorro del 17%', 'Prioridad en pedidos personalizados', 'Regalos exclusivos'],
  },
};

const normalizeLang = (lang?: string): Lang => {
  if (lang?.startsWith('pt')) return 'pt';
  if (lang?.startsWith('es')) return 'es';
  return 'en';
};

export const getDefaultVipConfig = (lang?: string): VipConfig => {
  const l = normalizeLang(lang);
  return {
    plans: [
      { id: 'monthly', name: NAMES[l].monthly, type: 'monthly', price: 19.90, description: DESCRIPTIONS[l].monthly, features: FEATURES[l].monthly },
      { id: 'quarterly', name: NAMES[l].quarterly, type: 'quarterly', price: 49.90, description: DESCRIPTIONS[l].quarterly, features: FEATURES[l].quarterly },
      { id: 'yearly', name: NAMES[l].yearly, type: 'yearly', price: 199.90, description: DESCRIPTIONS[l].yearly, features: FEATURES[l].yearly },
    ],
  };
};

// Default configuration (PT-BR, kept for backward compatibility with loader/tests)
export const defaultVipConfig: VipConfig = getDefaultVipConfig('pt');

/**
 * Translate any saved plan strings that match the known PT defaults into the
 * target language. Returns the original string unchanged if no match is found
 * (i.e. the user customized it).
 */
export const translateDefaultsToLang = (config: VipConfig, lang?: string): VipConfig => {
  const l = normalizeLang(lang);
  if (l === 'pt') return config;

  const ptDefaults = getDefaultVipConfig('pt');
  const targetDefaults = getDefaultVipConfig(l);

  // Build lookup maps: PT string → target string
  const nameMap = new Map<string, string>();
  const descMap = new Map<string, string>();
  const featureMap = new Map<string, string>();

  ptDefaults.plans.forEach((ptPlan, idx) => {
    const tgt = targetDefaults.plans[idx];
    if (!tgt) return;
    nameMap.set(ptPlan.name, tgt.name);
    descMap.set(ptPlan.description, tgt.description);
    ptPlan.features.forEach((f, i) => {
      if (tgt.features[i]) featureMap.set(f, tgt.features[i]);
    });
  });

  return {
    ...config,
    plans: config.plans.map(plan => ({
      ...plan,
      name: nameMap.get(plan.name) ?? plan.name,
      description: descMap.get(plan.description) ?? plan.description,
      features: plan.features.map(f => featureMap.get(f) ?? f),
    })),
  };
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
