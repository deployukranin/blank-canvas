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
}

export interface VideoRules {
  allowed: string[];
  notAllowed: string[];
}

export interface VideoConfig {
  previewVideoUrl: string;
  previewTitle: string;
  previewDescription: string;
  durations: VideoDuration[];
  categories: VideoCategory[];
  rules: VideoRules;
  deliveryDays: number;
}

// Default configuration - will be replaced with database values
export const defaultVideoConfig: VideoConfig = {
  previewVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
  previewTitle: 'Como funcionam os vídeos personalizados?',
  previewDescription: 'Assista este vídeo explicativo para entender como funciona o processo de compra, personalização e entrega do seu vídeo ASMR exclusivo.',
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

// Mock function to get config (will be replaced with API call)
export const getVideoConfig = (): VideoConfig => {
  // In the future, this will fetch from the database
  const savedConfig = localStorage.getItem('videoConfig');
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return defaultVideoConfig;
};

// Mock function to save config (will be replaced with API call)
export const saveVideoConfig = (config: VideoConfig): void => {
  localStorage.setItem('videoConfig', JSON.stringify(config));
};

// Calculate final price based on duration
export const calculatePrice = (duration: VideoDuration): number => {
  return duration.price;
};
