/**
 * Video Configuration for Custom Video Orders
 */

export interface VideoDuration {
  id: string;
  label: string;
  minutes: number;
  price: number;
}

export interface VideoCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  surcharge?: number; // Taxa fixa adicional (R$) para esta categoria
}

export interface AudioDuration {
  id: string;
  label: string;
  minutes: number;
  price: number;
}

export interface AudioCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface VideoRules {
  allowed: string[];
  notAllowed: string[];
}

export interface VideoConfig {
  // Video preview settings
  previewVideoUrl: string;
  previewImageUrl: string;
  previewType: 'video' | 'image';
  previewTitle: string;
  previewDescription: string;
  previewEnabled: boolean; // Toggle to show/hide "Como Funciona" section
  
  // Audio preview settings
  audioPreviewUrl: string;
  audioPreviewEnabled: boolean;
  
  durations: VideoDuration[];
  categories: VideoCategory[];
  audioCategories: AudioCategory[];
  audioDurations: AudioDuration[];
  rules: VideoRules;
  deliveryDays: number;
}

// Default configuration - will be replaced with database values
export const defaultVideoConfig: VideoConfig = {
  previewVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
  previewImageUrl: '',
  previewType: 'video',
  previewTitle: 'Como funcionam os vídeos personalizados?',
  previewDescription: 'Assista este vídeo explicativo para entender como funciona o processo de compra, personalização e entrega do seu vídeo ASMR exclusivo.',
  previewEnabled: true,
  audioPreviewUrl: '',
  audioPreviewEnabled: true,
  deliveryDays: 7,
  durations: [
    { id: '5min', label: '5 minutos', minutes: 5, price: 49.90 },
    { id: '10min', label: '10 minutos', minutes: 10, price: 79.90 },
    { id: '15min', label: '15 minutos', minutes: 15, price: 109.90 },
    { id: '20min', label: '20 minutos', minutes: 20, price: 139.90 },
    { id: '30min', label: '30 minutos', minutes: 30, price: 189.90 },
  ],
  categories: [
    { 
      id: 'roleplay', 
      name: 'Roleplay', 
      description: 'Situações imersivas e personagens', 
      icon: '🎭'
    },
    { 
      id: 'tapping', 
      name: 'Tapping', 
      description: 'Sons de batidas em diferentes superfícies', 
      icon: '👆'
    },
    { 
      id: 'mouth-sounds', 
      name: 'Sons de Boca', 
      description: 'Kisses, tongue clicks, inaudible whispers', 
      icon: '💋'
    },
    { 
      id: 'whispers', 
      name: 'Sussurros', 
      description: 'Sussurros suaves e relaxantes', 
      icon: '🤫'
    },
    { 
      id: 'personal-attention', 
      name: 'Atenção Pessoal', 
      description: 'Cuidando de você com carinho', 
      icon: '💆'
    },
    { 
      id: 'custom-name', 
      name: 'Com Seu Nome', 
      description: 'Vídeo sussurrando seu nome', 
      icon: '💫'
    },
  ],
  audioCategories: [
    {
      id: 'sussurros',
      name: 'Sussurros',
      description: 'Áudios com sussurros suaves',
      icon: '🤫',
    },
    {
      id: 'afirmacoes',
      name: 'Afirmações',
      description: 'Afirmações positivas para relaxar',
      icon: '💝',
    },
    {
      id: 'para-dormir',
      name: 'Para Dormir',
      description: 'Áudios relaxantes para ajudar a dormir',
      icon: '🌙',
    },
    {
      id: 'sons-especificos',
      name: 'Sons Específicos',
      description: 'Tapping, scratching e outros sons',
      icon: '🎵',
    },
  ],
  audioDurations: [
    { id: 'audio-5min', label: '5 minutos', minutes: 5, price: 19.90 },
    { id: 'audio-10min', label: '10 minutos', minutes: 10, price: 34.90 },
    { id: 'audio-15min', label: '15 minutos', minutes: 15, price: 49.90 },
    { id: 'audio-20min', label: '20 minutos', minutes: 20, price: 64.90 },
    { id: 'audio-30min', label: '30 minutos', minutes: 30, price: 89.90 },
  ],
  rules: {
    allowed: [
      'Roleplay de cenários do cotidiano (spa, livraria, café, etc.)',
      'Tapping e scratching em objetos',
      'Sons de boca suaves',
      'Sussurros e inaudible whispers',
      'Atenção pessoal relaxante',
      'Uso do seu nome ou apelido',
      'Afirmações positivas',
      'Sons de chuva, natureza como fundo',
      'Pedidos de triggers específicos',
    ],
    notAllowed: [
      'Conteúdo adulto ou sexual',
      'Linguagem ofensiva ou agressiva',
      'Roleplay de relacionamento romântico/íntimo',
      'Pedidos que envolvam outras pessoas',
      'Conteúdo que promova violência ou ódio',
      'Informações pessoais de terceiros',
      'Sons muito altos ou assustadores',
      'Qualquer coisa que me deixe desconfortável',
    ],
  },
};

// Sync function to get config (for backwards compatibility)
// Loads from localStorage cache, which is populated by the async loader
export const getVideoConfig = (): VideoConfig => {
  const savedConfig = localStorage.getItem('videoConfig_cache');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      return {
        ...defaultVideoConfig,
        ...parsed,
        previewType: parsed.previewType || defaultVideoConfig.previewType,
        previewImageUrl: parsed.previewImageUrl || defaultVideoConfig.previewImageUrl,
        previewEnabled: parsed.previewEnabled ?? defaultVideoConfig.previewEnabled,
        audioPreviewUrl: parsed.audioPreviewUrl || defaultVideoConfig.audioPreviewUrl,
        audioPreviewEnabled: parsed.audioPreviewEnabled ?? defaultVideoConfig.audioPreviewEnabled,
        audioCategories: parsed.audioCategories || defaultVideoConfig.audioCategories,
        audioDurations: parsed.audioDurations || defaultVideoConfig.audioDurations,
      };
    } catch {
      return defaultVideoConfig;
    }
  }
  return defaultVideoConfig;
};

// Sync save for backwards compatibility - updates local cache
export const saveVideoConfig = (config: VideoConfig): void => {
  localStorage.setItem('videoConfig_cache', JSON.stringify(config));
};

// Calculate final price for audio based on duration
export const calculateAudioPrice = (duration: AudioDuration): number => {
  return duration.price;
};

// Calculate final price based on duration and category surcharge
export const calculatePrice = (duration: VideoDuration, category?: VideoCategory): number => {
  const basePrice = duration.price;
  const surcharge = category?.surcharge || 0;
  return basePrice + surcharge;
};
