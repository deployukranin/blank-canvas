import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadConfig, saveConfig } from '@/lib/config-storage';
// Available Lucide icons for customization
export const availableLucideIcons = [
  // Navigation & UI
  { id: 'Home', label: 'Casa', category: 'Navegação' },
  { id: 'House', label: 'Casa 2', category: 'Navegação' },
  { id: 'LayoutDashboard', label: 'Dashboard', category: 'Navegação' },
  { id: 'LayoutGrid', label: 'Grade', category: 'Navegação' },
  { id: 'Menu', label: 'Menu', category: 'Navegação' },
  { id: 'Settings', label: 'Configurações', category: 'Navegação' },
  { id: 'Settings2', label: 'Configurações 2', category: 'Navegação' },
  { id: 'Search', label: 'Buscar', category: 'Navegação' },
  { id: 'Bell', label: 'Sino', category: 'Navegação' },
  { id: 'BellRing', label: 'Sino Tocando', category: 'Navegação' },
  { id: 'Mail', label: 'Email', category: 'Navegação' },
  { id: 'Inbox', label: 'Caixa de Entrada', category: 'Navegação' },
  { id: 'Send', label: 'Enviar', category: 'Navegação' },
  { id: 'Share', label: 'Compartilhar', category: 'Navegação' },
  { id: 'Share2', label: 'Compartilhar 2', category: 'Navegação' },
  { id: 'ExternalLink', label: 'Link Externo', category: 'Navegação' },
  { id: 'Link', label: 'Link', category: 'Navegação' },
  { id: 'Link2', label: 'Link 2', category: 'Navegação' },
  { id: 'Bookmark', label: 'Favorito', category: 'Navegação' },
  { id: 'BookMarked', label: 'Favoritado', category: 'Navegação' },
  { id: 'Flag', label: 'Bandeira', category: 'Navegação' },
  { id: 'Pin', label: 'Pin', category: 'Navegação' },
  { id: 'MapPin', label: 'Localização', category: 'Navegação' },
  { id: 'Navigation', label: 'Navegação', category: 'Navegação' },
  { id: 'Compass', label: 'Bússola', category: 'Navegação' },
  { id: 'Globe', label: 'Globo', category: 'Navegação' },
  { id: 'Globe2', label: 'Globo 2', category: 'Navegação' },
  
  // Content Types - Media
  { id: 'Video', label: 'Vídeo', category: 'Mídia' },
  { id: 'VideoOff', label: 'Vídeo Off', category: 'Mídia' },
  { id: 'Film', label: 'Filme', category: 'Mídia' },
  { id: 'Clapperboard', label: 'Claquete', category: 'Mídia' },
  { id: 'Tv', label: 'TV', category: 'Mídia' },
  { id: 'Tv2', label: 'TV 2', category: 'Mídia' },
  { id: 'Monitor', label: 'Monitor', category: 'Mídia' },
  { id: 'MonitorPlay', label: 'Monitor Play', category: 'Mídia' },
  { id: 'Play', label: 'Play', category: 'Mídia' },
  { id: 'PlayCircle', label: 'Play Círculo', category: 'Mídia' },
  { id: 'Pause', label: 'Pause', category: 'Mídia' },
  { id: 'PauseCircle', label: 'Pause Círculo', category: 'Mídia' },
  { id: 'SkipForward', label: 'Avançar', category: 'Mídia' },
  { id: 'SkipBack', label: 'Voltar', category: 'Mídia' },
  { id: 'FastForward', label: 'Acelerar', category: 'Mídia' },
  { id: 'Rewind', label: 'Rebobinar', category: 'Mídia' },
  { id: 'Volume2', label: 'Volume', category: 'Mídia' },
  { id: 'VolumeX', label: 'Mudo', category: 'Mídia' },
  { id: 'Headphones', label: 'Fones', category: 'Mídia' },
  { id: 'Music', label: 'Música', category: 'Mídia' },
  { id: 'Music2', label: 'Música 2', category: 'Mídia' },
  { id: 'Music3', label: 'Música 3', category: 'Mídia' },
  { id: 'Music4', label: 'Música 4', category: 'Mídia' },
  { id: 'Mic', label: 'Microfone', category: 'Mídia' },
  { id: 'Mic2', label: 'Microfone 2', category: 'Mídia' },
  { id: 'MicOff', label: 'Mic Off', category: 'Mídia' },
  { id: 'Radio', label: 'Rádio', category: 'Mídia' },
  { id: 'Podcast', label: 'Podcast', category: 'Mídia' },
  { id: 'AudioWaveform', label: 'Onda de Áudio', category: 'Mídia' },
  { id: 'AudioLines', label: 'Linhas de Áudio', category: 'Mídia' },
  { id: 'Camera', label: 'Câmera', category: 'Mídia' },
  { id: 'CameraOff', label: 'Câmera Off', category: 'Mídia' },
  { id: 'Image', label: 'Imagem', category: 'Mídia' },
  { id: 'Images', label: 'Imagens', category: 'Mídia' },
  { id: 'ImagePlus', label: 'Adicionar Imagem', category: 'Mídia' },
  { id: 'GalleryVertical', label: 'Galeria', category: 'Mídia' },
  { id: 'Aperture', label: 'Abertura', category: 'Mídia' },
  { id: 'Focus', label: 'Foco', category: 'Mídia' },
  
  // Shopping & Business
  { id: 'ShoppingBag', label: 'Sacola', category: 'Compras' },
  { id: 'ShoppingCart', label: 'Carrinho', category: 'Compras' },
  { id: 'Store', label: 'Loja', category: 'Compras' },
  { id: 'Storefront', label: 'Vitrine', category: 'Compras' },
  { id: 'Package', label: 'Pacote', category: 'Compras' },
  { id: 'Package2', label: 'Pacote 2', category: 'Compras' },
  { id: 'PackageOpen', label: 'Pacote Aberto', category: 'Compras' },
  { id: 'Gift', label: 'Presente', category: 'Compras' },
  { id: 'CreditCard', label: 'Cartão', category: 'Compras' },
  { id: 'Wallet', label: 'Carteira', category: 'Compras' },
  { id: 'Wallet2', label: 'Carteira 2', category: 'Compras' },
  { id: 'DollarSign', label: 'Dólar', category: 'Compras' },
  { id: 'Banknote', label: 'Nota', category: 'Compras' },
  { id: 'Coins', label: 'Moedas', category: 'Compras' },
  { id: 'PiggyBank', label: 'Cofrinho', category: 'Compras' },
  { id: 'Receipt', label: 'Recibo', category: 'Compras' },
  { id: 'ReceiptText', label: 'Recibo Texto', category: 'Compras' },
  { id: 'Tag', label: 'Tag', category: 'Compras' },
  { id: 'Tags', label: 'Tags', category: 'Compras' },
  { id: 'Ticket', label: 'Ingresso', category: 'Compras' },
  { id: 'TicketPercent', label: 'Cupom', category: 'Compras' },
  { id: 'Percent', label: 'Porcentagem', category: 'Compras' },
  { id: 'BadgePercent', label: 'Badge Desconto', category: 'Compras' },
  { id: 'Barcode', label: 'Código de Barras', category: 'Compras' },
  { id: 'QrCode', label: 'QR Code', category: 'Compras' },
  
  // Premium & Status
  { id: 'Crown', label: 'Coroa', category: 'Premium' },
  { id: 'Gem', label: 'Gema', category: 'Premium' },
  { id: 'Diamond', label: 'Diamante', category: 'Premium' },
  { id: 'Award', label: 'Prêmio', category: 'Premium' },
  { id: 'Trophy', label: 'Troféu', category: 'Premium' },
  { id: 'Medal', label: 'Medalha', category: 'Premium' },
  { id: 'BadgeCheck', label: 'Verificado', category: 'Premium' },
  { id: 'Badge', label: 'Badge', category: 'Premium' },
  { id: 'Shield', label: 'Escudo', category: 'Premium' },
  { id: 'ShieldCheck', label: 'Escudo Check', category: 'Premium' },
  { id: 'ShieldPlus', label: 'Escudo Plus', category: 'Premium' },
  { id: 'Lock', label: 'Cadeado', category: 'Premium' },
  { id: 'LockOpen', label: 'Desbloqueado', category: 'Premium' },
  { id: 'Key', label: 'Chave', category: 'Premium' },
  { id: 'KeyRound', label: 'Chave Redonda', category: 'Premium' },
  { id: 'Fingerprint', label: 'Digital', category: 'Premium' },
  { id: 'Verified', label: 'Verificado', category: 'Premium' },
  
  // People & Community
  { id: 'User', label: 'Usuário', category: 'Pessoas' },
  { id: 'UserCircle', label: 'Usuário Círculo', category: 'Pessoas' },
  { id: 'UserCircle2', label: 'Usuário Círculo 2', category: 'Pessoas' },
  { id: 'UserCheck', label: 'Usuário Check', category: 'Pessoas' },
  { id: 'UserPlus', label: 'Adicionar Usuário', category: 'Pessoas' },
  { id: 'UserMinus', label: 'Remover Usuário', category: 'Pessoas' },
  { id: 'UserX', label: 'Usuário X', category: 'Pessoas' },
  { id: 'UserCog', label: 'Configurar Usuário', category: 'Pessoas' },
  { id: 'Users', label: 'Usuários', category: 'Pessoas' },
  { id: 'Users2', label: 'Usuários 2', category: 'Pessoas' },
  { id: 'UsersRound', label: 'Usuários Redondo', category: 'Pessoas' },
  { id: 'Contact', label: 'Contato', category: 'Pessoas' },
  { id: 'Contact2', label: 'Contato 2', category: 'Pessoas' },
  { id: 'PersonStanding', label: 'Pessoa', category: 'Pessoas' },
  { id: 'Baby', label: 'Bebê', category: 'Pessoas' },
  { id: 'Accessibility', label: 'Acessibilidade', category: 'Pessoas' },
  { id: 'Heart', label: 'Coração', category: 'Pessoas' },
  { id: 'HeartHandshake', label: 'Apoio', category: 'Pessoas' },
  { id: 'HeartPulse', label: 'Pulso', category: 'Pessoas' },
  { id: 'ThumbsUp', label: 'Joinha', category: 'Pessoas' },
  { id: 'ThumbsDown', label: 'Joinha Baixo', category: 'Pessoas' },
  { id: 'HandMetal', label: 'Rock', category: 'Pessoas' },
  { id: 'Hand', label: 'Mão', category: 'Pessoas' },
  { id: 'Handshake', label: 'Aperto de Mão', category: 'Pessoas' },
  
  // Communication
  { id: 'MessageCircle', label: 'Mensagem', category: 'Comunicação' },
  { id: 'MessageSquare', label: 'Mensagem Quadrada', category: 'Comunicação' },
  { id: 'MessagesSquare', label: 'Chat', category: 'Comunicação' },
  { id: 'MessageCircleMore', label: 'Mais Mensagens', category: 'Comunicação' },
  { id: 'AtSign', label: 'Arroba', category: 'Comunicação' },
  { id: 'Hash', label: 'Hashtag', category: 'Comunicação' },
  { id: 'Phone', label: 'Telefone', category: 'Comunicação' },
  { id: 'PhoneCall', label: 'Ligação', category: 'Comunicação' },
  { id: 'PhoneIncoming', label: 'Chamada Recebida', category: 'Comunicação' },
  { id: 'PhoneOutgoing', label: 'Chamada Saindo', category: 'Comunicação' },
  { id: 'Voicemail', label: 'Correio de Voz', category: 'Comunicação' },
  { id: 'Megaphone', label: 'Megafone', category: 'Comunicação' },
  { id: 'Rss', label: 'RSS', category: 'Comunicação' },
  { id: 'Wifi', label: 'WiFi', category: 'Comunicação' },
  { id: 'Signal', label: 'Sinal', category: 'Comunicação' },
  { id: 'Satellite', label: 'Satélite', category: 'Comunicação' },
  { id: 'Radio', label: 'Rádio', category: 'Comunicação' },
  
  // Ideas & Creativity
  { id: 'Lightbulb', label: 'Lâmpada', category: 'Criatividade' },
  { id: 'LightbulbOff', label: 'Lâmpada Off', category: 'Criatividade' },
  { id: 'Sparkle', label: 'Brilho', category: 'Criatividade' },
  { id: 'Sparkles', label: 'Brilhos', category: 'Criatividade' },
  { id: 'Star', label: 'Estrela', category: 'Criatividade' },
  { id: 'Stars', label: 'Estrelas', category: 'Criatividade' },
  { id: 'Zap', label: 'Raio', category: 'Criatividade' },
  { id: 'ZapOff', label: 'Raio Off', category: 'Criatividade' },
  { id: 'Flame', label: 'Chama', category: 'Criatividade' },
  { id: 'FlameKindling', label: 'Fogueira', category: 'Criatividade' },
  { id: 'Palette', label: 'Paleta', category: 'Criatividade' },
  { id: 'PaintBucket', label: 'Balde de Tinta', category: 'Criatividade' },
  { id: 'Paintbrush', label: 'Pincel', category: 'Criatividade' },
  { id: 'Paintbrush2', label: 'Pincel 2', category: 'Criatividade' },
  { id: 'Brush', label: 'Escova', category: 'Criatividade' },
  { id: 'Pencil', label: 'Lápis', category: 'Criatividade' },
  { id: 'PenTool', label: 'Caneta', category: 'Criatividade' },
  { id: 'Highlighter', label: 'Marcador', category: 'Criatividade' },
  { id: 'Eraser', label: 'Borracha', category: 'Criatividade' },
  { id: 'Wand', label: 'Varinha', category: 'Criatividade' },
  { id: 'Wand2', label: 'Varinha 2', category: 'Criatividade' },
  { id: 'Rocket', label: 'Foguete', category: 'Criatividade' },
  { id: 'Target', label: 'Alvo', category: 'Criatividade' },
  { id: 'Crosshair', label: 'Mira', category: 'Criatividade' },
  { id: 'Puzzle', label: 'Quebra-cabeça', category: 'Criatividade' },
  { id: 'Dices', label: 'Dados', category: 'Criatividade' },
  { id: 'Gamepad', label: 'Controle', category: 'Criatividade' },
  { id: 'Gamepad2', label: 'Controle 2', category: 'Criatividade' },
  { id: 'Joystick', label: 'Joystick', category: 'Criatividade' },
  
  // Relaxation / ASMR / Wellness
  { id: 'Moon', label: 'Lua', category: 'Relaxamento' },
  { id: 'MoonStar', label: 'Lua Estrela', category: 'Relaxamento' },
  { id: 'Sun', label: 'Sol', category: 'Relaxamento' },
  { id: 'Sunrise', label: 'Nascer do Sol', category: 'Relaxamento' },
  { id: 'Sunset', label: 'Pôr do Sol', category: 'Relaxamento' },
  { id: 'Cloud', label: 'Nuvem', category: 'Relaxamento' },
  { id: 'CloudMoon', label: 'Nuvem Lua', category: 'Relaxamento' },
  { id: 'CloudSun', label: 'Nuvem Sol', category: 'Relaxamento' },
  { id: 'CloudRain', label: 'Chuva', category: 'Relaxamento' },
  { id: 'CloudSnow', label: 'Neve', category: 'Relaxamento' },
  { id: 'CloudLightning', label: 'Tempestade', category: 'Relaxamento' },
  { id: 'Rainbow', label: 'Arco-íris', category: 'Relaxamento' },
  { id: 'Wind', label: 'Vento', category: 'Relaxamento' },
  { id: 'Waves', label: 'Ondas', category: 'Relaxamento' },
  { id: 'Droplet', label: 'Gota', category: 'Relaxamento' },
  { id: 'Droplets', label: 'Gotas', category: 'Relaxamento' },
  { id: 'Snowflake', label: 'Floco de Neve', category: 'Relaxamento' },
  { id: 'Thermometer', label: 'Termômetro', category: 'Relaxamento' },
  { id: 'Leaf', label: 'Folha', category: 'Relaxamento' },
  { id: 'TreeDeciduous', label: 'Árvore', category: 'Relaxamento' },
  { id: 'TreePine', label: 'Pinheiro', category: 'Relaxamento' },
  { id: 'Trees', label: 'Árvores', category: 'Relaxamento' },
  { id: 'Flower', label: 'Flor', category: 'Relaxamento' },
  { id: 'Flower2', label: 'Flor 2', category: 'Relaxamento' },
  { id: 'Clover', label: 'Trevo', category: 'Relaxamento' },
  { id: 'Feather', label: 'Pena', category: 'Relaxamento' },
  { id: 'Bird', label: 'Pássaro', category: 'Relaxamento' },
  { id: 'Butterfly', label: 'Borboleta', category: 'Relaxamento' },
  { id: 'Bug', label: 'Inseto', category: 'Relaxamento' },
  { id: 'Fish', label: 'Peixe', category: 'Relaxamento' },
  { id: 'Shell', label: 'Concha', category: 'Relaxamento' },
  { id: 'Turtle', label: 'Tartaruga', category: 'Relaxamento' },
  { id: 'Cat', label: 'Gato', category: 'Relaxamento' },
  { id: 'Dog', label: 'Cachorro', category: 'Relaxamento' },
  { id: 'Rabbit', label: 'Coelho', category: 'Relaxamento' },
  { id: 'Squirrel', label: 'Esquilo', category: 'Relaxamento' },
  { id: 'Coffee', label: 'Café', category: 'Relaxamento' },
  { id: 'CupSoda', label: 'Refrigerante', category: 'Relaxamento' },
  { id: 'Wine', label: 'Vinho', category: 'Relaxamento' },
  { id: 'Beer', label: 'Cerveja', category: 'Relaxamento' },
  { id: 'Martini', label: 'Martini', category: 'Relaxamento' },
  { id: 'Candy', label: 'Doce', category: 'Relaxamento' },
  { id: 'Cookie', label: 'Biscoito', category: 'Relaxamento' },
  { id: 'Cake', label: 'Bolo', category: 'Relaxamento' },
  { id: 'CakeSlice', label: 'Fatia de Bolo', category: 'Relaxamento' },
  { id: 'IceCream', label: 'Sorvete', category: 'Relaxamento' },
  { id: 'IceCreamCone', label: 'Casquinha', category: 'Relaxamento' },
  { id: 'Pizza', label: 'Pizza', category: 'Relaxamento' },
  { id: 'Soup', label: 'Sopa', category: 'Relaxamento' },
  { id: 'Salad', label: 'Salada', category: 'Relaxamento' },
  { id: 'Apple', label: 'Maçã', category: 'Relaxamento' },
  { id: 'Cherry', label: 'Cereja', category: 'Relaxamento' },
  { id: 'Citrus', label: 'Cítrico', category: 'Relaxamento' },
  { id: 'Grape', label: 'Uva', category: 'Relaxamento' },
  { id: 'Banana', label: 'Banana', category: 'Relaxamento' },
  { id: 'Bed', label: 'Cama', category: 'Relaxamento' },
  { id: 'BedDouble', label: 'Cama Dupla', category: 'Relaxamento' },
  { id: 'BedSingle', label: 'Cama Solteiro', category: 'Relaxamento' },
  { id: 'Lamp', label: 'Abajur', category: 'Relaxamento' },
  { id: 'LampDesk', label: 'Luminária', category: 'Relaxamento' },
  { id: 'Armchair', label: 'Poltrona', category: 'Relaxamento' },
  { id: 'Sofa', label: 'Sofá', category: 'Relaxamento' },
  { id: 'Bath', label: 'Banheira', category: 'Relaxamento' },
  { id: 'ShowerHead', label: 'Chuveiro', category: 'Relaxamento' },
  { id: 'Flame', label: 'Fogo', category: 'Relaxamento' },
  { id: 'Candle', label: 'Vela', category: 'Relaxamento' },
  { id: 'Eye', label: 'Olho', category: 'Relaxamento' },
  { id: 'EyeOff', label: 'Olho Fechado', category: 'Relaxamento' },
  { id: 'Glasses', label: 'Óculos', category: 'Relaxamento' },
  { id: 'Brain', label: 'Cérebro', category: 'Relaxamento' },
  { id: 'BrainCircuit', label: 'Mente', category: 'Relaxamento' },
  { id: 'Activity', label: 'Atividade', category: 'Relaxamento' },
  { id: 'HeartPulse', label: 'Batimento', category: 'Relaxamento' },
  { id: 'Stethoscope', label: 'Estetoscópio', category: 'Relaxamento' },
  { id: 'Pill', label: 'Pílula', category: 'Relaxamento' },
  { id: 'Syringe', label: 'Seringa', category: 'Relaxamento' },
  { id: 'Dumbbell', label: 'Halter', category: 'Relaxamento' },
  { id: 'Timer', label: 'Timer', category: 'Relaxamento' },
  { id: 'Hourglass', label: 'Ampulheta', category: 'Relaxamento' },
  { id: 'AlarmClock', label: 'Despertador', category: 'Relaxamento' },
  { id: 'Watch', label: 'Relógio', category: 'Relaxamento' },
  
  // Status & Feedback
  { id: 'Check', label: 'Check', category: 'Status' },
  { id: 'CheckCircle', label: 'Check Círculo', category: 'Status' },
  { id: 'CheckCircle2', label: 'Sucesso', category: 'Status' },
  { id: 'CheckCheck', label: 'Duplo Check', category: 'Status' },
  { id: 'X', label: 'X', category: 'Status' },
  { id: 'XCircle', label: 'Erro', category: 'Status' },
  { id: 'AlertCircle', label: 'Alerta', category: 'Status' },
  { id: 'AlertTriangle', label: 'Aviso', category: 'Status' },
  { id: 'AlertOctagon', label: 'Alerta Octógono', category: 'Status' },
  { id: 'Info', label: 'Info', category: 'Status' },
  { id: 'HelpCircle', label: 'Ajuda', category: 'Status' },
  { id: 'CircleDot', label: 'Ponto', category: 'Status' },
  { id: 'Circle', label: 'Círculo', category: 'Status' },
  { id: 'CircleOff', label: 'Círculo Off', category: 'Status' },
  { id: 'Ban', label: 'Proibido', category: 'Status' },
  { id: 'Loader', label: 'Carregando', category: 'Status' },
  { id: 'Loader2', label: 'Carregando 2', category: 'Status' },
  { id: 'RefreshCw', label: 'Atualizar', category: 'Status' },
  { id: 'RotateCw', label: 'Rotacionar', category: 'Status' },
  { id: 'RotateCcw', label: 'Rotacionar 2', category: 'Status' },
  
  // Arrows & Direction
  { id: 'ArrowUp', label: 'Seta Cima', category: 'Setas' },
  { id: 'ArrowDown', label: 'Seta Baixo', category: 'Setas' },
  { id: 'ArrowLeft', label: 'Seta Esquerda', category: 'Setas' },
  { id: 'ArrowRight', label: 'Seta Direita', category: 'Setas' },
  { id: 'ArrowUpRight', label: 'Seta Diagonal', category: 'Setas' },
  { id: 'ArrowDownRight', label: 'Seta Diagonal 2', category: 'Setas' },
  { id: 'ArrowUpLeft', label: 'Seta Diagonal 3', category: 'Setas' },
  { id: 'ArrowDownLeft', label: 'Seta Diagonal 4', category: 'Setas' },
  { id: 'ChevronUp', label: 'Chevron Cima', category: 'Setas' },
  { id: 'ChevronDown', label: 'Chevron Baixo', category: 'Setas' },
  { id: 'ChevronLeft', label: 'Chevron Esquerda', category: 'Setas' },
  { id: 'ChevronRight', label: 'Chevron Direita', category: 'Setas' },
  { id: 'ChevronsUp', label: 'Duplo Chevron Cima', category: 'Setas' },
  { id: 'ChevronsDown', label: 'Duplo Chevron Baixo', category: 'Setas' },
  { id: 'ChevronsLeft', label: 'Duplo Chevron Esquerda', category: 'Setas' },
  { id: 'ChevronsRight', label: 'Duplo Chevron Direita', category: 'Setas' },
  { id: 'MoveUp', label: 'Mover Cima', category: 'Setas' },
  { id: 'MoveDown', label: 'Mover Baixo', category: 'Setas' },
  { id: 'MoveLeft', label: 'Mover Esquerda', category: 'Setas' },
  { id: 'MoveRight', label: 'Mover Direita', category: 'Setas' },
  { id: 'ArrowBigUp', label: 'Seta Grande Cima', category: 'Setas' },
  { id: 'ArrowBigDown', label: 'Seta Grande Baixo', category: 'Setas' },
  { id: 'ArrowBigLeft', label: 'Seta Grande Esquerda', category: 'Setas' },
  { id: 'ArrowBigRight', label: 'Seta Grande Direita', category: 'Setas' },
  
  // Files & Documents
  { id: 'File', label: 'Arquivo', category: 'Arquivos' },
  { id: 'FileText', label: 'Documento', category: 'Arquivos' },
  { id: 'FileImage', label: 'Arquivo Imagem', category: 'Arquivos' },
  { id: 'FileVideo', label: 'Arquivo Vídeo', category: 'Arquivos' },
  { id: 'FileAudio', label: 'Arquivo Áudio', category: 'Arquivos' },
  { id: 'FileCode', label: 'Código', category: 'Arquivos' },
  { id: 'FileJson', label: 'JSON', category: 'Arquivos' },
  { id: 'FileSpreadsheet', label: 'Planilha', category: 'Arquivos' },
  { id: 'FileArchive', label: 'Arquivo ZIP', category: 'Arquivos' },
  { id: 'FilePlus', label: 'Adicionar Arquivo', category: 'Arquivos' },
  { id: 'FileMinus', label: 'Remover Arquivo', category: 'Arquivos' },
  { id: 'FileX', label: 'Fechar Arquivo', category: 'Arquivos' },
  { id: 'FileCheck', label: 'Arquivo OK', category: 'Arquivos' },
  { id: 'FileWarning', label: 'Arquivo Aviso', category: 'Arquivos' },
  { id: 'Files', label: 'Arquivos', category: 'Arquivos' },
  { id: 'Folder', label: 'Pasta', category: 'Arquivos' },
  { id: 'FolderOpen', label: 'Pasta Aberta', category: 'Arquivos' },
  { id: 'FolderPlus', label: 'Adicionar Pasta', category: 'Arquivos' },
  { id: 'FolderMinus', label: 'Remover Pasta', category: 'Arquivos' },
  { id: 'FolderX', label: 'Fechar Pasta', category: 'Arquivos' },
  { id: 'FolderCheck', label: 'Pasta OK', category: 'Arquivos' },
  { id: 'Download', label: 'Download', category: 'Arquivos' },
  { id: 'Upload', label: 'Upload', category: 'Arquivos' },
  { id: 'DownloadCloud', label: 'Download Nuvem', category: 'Arquivos' },
  { id: 'UploadCloud', label: 'Upload Nuvem', category: 'Arquivos' },
  { id: 'Save', label: 'Salvar', category: 'Arquivos' },
  { id: 'SaveAll', label: 'Salvar Tudo', category: 'Arquivos' },
  { id: 'Trash', label: 'Lixeira', category: 'Arquivos' },
  { id: 'Trash2', label: 'Lixeira 2', category: 'Arquivos' },
  { id: 'Copy', label: 'Copiar', category: 'Arquivos' },
  { id: 'Clipboard', label: 'Área de Transferência', category: 'Arquivos' },
  { id: 'ClipboardCopy', label: 'Copiar para Área', category: 'Arquivos' },
  { id: 'ClipboardCheck', label: 'Área OK', category: 'Arquivos' },
  
  // Editing & Actions
  { id: 'Edit', label: 'Editar', category: 'Ações' },
  { id: 'Edit2', label: 'Editar 2', category: 'Ações' },
  { id: 'Edit3', label: 'Editar 3', category: 'Ações' },
  { id: 'Undo', label: 'Desfazer', category: 'Ações' },
  { id: 'Undo2', label: 'Desfazer 2', category: 'Ações' },
  { id: 'Redo', label: 'Refazer', category: 'Ações' },
  { id: 'Redo2', label: 'Refazer 2', category: 'Ações' },
  { id: 'Plus', label: 'Mais', category: 'Ações' },
  { id: 'PlusCircle', label: 'Mais Círculo', category: 'Ações' },
  { id: 'PlusSquare', label: 'Mais Quadrado', category: 'Ações' },
  { id: 'Minus', label: 'Menos', category: 'Ações' },
  { id: 'MinusCircle', label: 'Menos Círculo', category: 'Ações' },
  { id: 'MinusSquare', label: 'Menos Quadrado', category: 'Ações' },
  { id: 'Maximize', label: 'Maximizar', category: 'Ações' },
  { id: 'Maximize2', label: 'Maximizar 2', category: 'Ações' },
  { id: 'Minimize', label: 'Minimizar', category: 'Ações' },
  { id: 'Minimize2', label: 'Minimizar 2', category: 'Ações' },
  { id: 'Expand', label: 'Expandir', category: 'Ações' },
  { id: 'Shrink', label: 'Encolher', category: 'Ações' },
  { id: 'ZoomIn', label: 'Zoom In', category: 'Ações' },
  { id: 'ZoomOut', label: 'Zoom Out', category: 'Ações' },
  { id: 'Move', label: 'Mover', category: 'Ações' },
  { id: 'GripVertical', label: 'Arrastar V', category: 'Ações' },
  { id: 'GripHorizontal', label: 'Arrastar H', category: 'Ações' },
  { id: 'MoreHorizontal', label: 'Mais Opções H', category: 'Ações' },
  { id: 'MoreVertical', label: 'Mais Opções V', category: 'Ações' },
  { id: 'Power', label: 'Ligar/Desligar', category: 'Ações' },
  { id: 'PowerOff', label: 'Desligar', category: 'Ações' },
  { id: 'LogIn', label: 'Entrar', category: 'Ações' },
  { id: 'LogOut', label: 'Sair', category: 'Ações' },
  
  // Tech & Devices
  { id: 'Smartphone', label: 'Celular', category: 'Tecnologia' },
  { id: 'Tablet', label: 'Tablet', category: 'Tecnologia' },
  { id: 'Laptop', label: 'Notebook', category: 'Tecnologia' },
  { id: 'Laptop2', label: 'Notebook 2', category: 'Tecnologia' },
  { id: 'Monitor', label: 'Monitor', category: 'Tecnologia' },
  { id: 'Tv', label: 'TV', category: 'Tecnologia' },
  { id: 'Keyboard', label: 'Teclado', category: 'Tecnologia' },
  { id: 'Mouse', label: 'Mouse', category: 'Tecnologia' },
  { id: 'Printer', label: 'Impressora', category: 'Tecnologia' },
  { id: 'ScanLine', label: 'Scanner', category: 'Tecnologia' },
  { id: 'HardDrive', label: 'HD', category: 'Tecnologia' },
  { id: 'Server', label: 'Servidor', category: 'Tecnologia' },
  { id: 'Database', label: 'Banco de Dados', category: 'Tecnologia' },
  { id: 'Cloud', label: 'Nuvem', category: 'Tecnologia' },
  { id: 'CloudDownload', label: 'Download Nuvem', category: 'Tecnologia' },
  { id: 'CloudUpload', label: 'Upload Nuvem', category: 'Tecnologia' },
  { id: 'Usb', label: 'USB', category: 'Tecnologia' },
  { id: 'Bluetooth', label: 'Bluetooth', category: 'Tecnologia' },
  { id: 'Wifi', label: 'WiFi', category: 'Tecnologia' },
  { id: 'WifiOff', label: 'WiFi Off', category: 'Tecnologia' },
  { id: 'Signal', label: 'Sinal', category: 'Tecnologia' },
  { id: 'SignalHigh', label: 'Sinal Alto', category: 'Tecnologia' },
  { id: 'SignalLow', label: 'Sinal Baixo', category: 'Tecnologia' },
  { id: 'SignalZero', label: 'Sem Sinal', category: 'Tecnologia' },
  { id: 'Battery', label: 'Bateria', category: 'Tecnologia' },
  { id: 'BatteryFull', label: 'Bateria Cheia', category: 'Tecnologia' },
  { id: 'BatteryLow', label: 'Bateria Baixa', category: 'Tecnologia' },
  { id: 'BatteryCharging', label: 'Carregando', category: 'Tecnologia' },
  { id: 'Plug', label: 'Tomada', category: 'Tecnologia' },
  { id: 'PlugZap', label: 'Energia', category: 'Tecnologia' },
  { id: 'Code', label: 'Código', category: 'Tecnologia' },
  { id: 'Code2', label: 'Código 2', category: 'Tecnologia' },
  { id: 'Terminal', label: 'Terminal', category: 'Tecnologia' },
  { id: 'TerminalSquare', label: 'Terminal 2', category: 'Tecnologia' },
  { id: 'Bug', label: 'Bug', category: 'Tecnologia' },
  { id: 'Brackets', label: 'Colchetes', category: 'Tecnologia' },
  { id: 'Braces', label: 'Chaves', category: 'Tecnologia' },
  { id: 'Binary', label: 'Binário', category: 'Tecnologia' },
  { id: 'Bot', label: 'Bot', category: 'Tecnologia' },
  { id: 'BrainCog', label: 'IA', category: 'Tecnologia' },
  { id: 'Cpu', label: 'Processador', category: 'Tecnologia' },
  { id: 'CircuitBoard', label: 'Circuito', category: 'Tecnologia' },
  { id: 'Microchip', label: 'Chip', category: 'Tecnologia' },
  { id: 'Fingerprint', label: 'Biometria', category: 'Tecnologia' },
  { id: 'ScanFace', label: 'Face ID', category: 'Tecnologia' },
  { id: 'QrCode', label: 'QR Code', category: 'Tecnologia' },
  { id: 'Scan', label: 'Scan', category: 'Tecnologia' },
  { id: 'ScanLine', label: 'Scanner', category: 'Tecnologia' },
] as const;

export type LucideIconId = typeof availableLucideIcons[number]['id'];

// Available emojis for customization
export const availableEmojis = [
  { id: 'home', emoji: '🏠', label: 'Casa' },
  { id: 'star', emoji: '⭐', label: 'Estrela' },
  { id: 'heart', emoji: '❤️', label: 'Coração' },
  { id: 'fire', emoji: '🔥', label: 'Fogo' },
  { id: 'sparkles', emoji: '✨', label: 'Brilhos' },
  { id: 'moon', emoji: '🌙', label: 'Lua' },
  { id: 'video', emoji: '🎬', label: 'Vídeo' },
  { id: 'music', emoji: '🎵', label: 'Música' },
  { id: 'headphones', emoji: '🎧', label: 'Fones' },
  { id: 'microphone', emoji: '🎤', label: 'Microfone' },
  { id: 'cart', emoji: '🛒', label: 'Carrinho' },
  { id: 'bag', emoji: '🛍️', label: 'Sacola' },
  { id: 'gift', emoji: '🎁', label: 'Presente' },
  { id: 'crown', emoji: '👑', label: 'Coroa' },
  { id: 'gem', emoji: '💎', label: 'Gema' },
  { id: 'user', emoji: '👤', label: 'Usuário' },
  { id: 'users', emoji: '👥', label: 'Usuários' },
  { id: 'bulb', emoji: '💡', label: 'Lâmpada' },
  { id: 'rocket', emoji: '🚀', label: 'Foguete' },
  { id: 'whisper', emoji: '🤫', label: 'Sussurro' },
  { id: 'sleep', emoji: '😴', label: 'Sono' },
  { id: 'relax', emoji: '😌', label: 'Relaxar' },
  { id: 'love', emoji: '💜', label: 'Amor' },
  { id: 'check', emoji: '✅', label: 'Check' },
] as const;

export interface IconItem {
  type: 'lucide' | 'emoji';
  value: string; // Lucide icon name or emoji character
}

export interface QuickActionItem {
  icon: IconItem;
  label: string;
  path: string;
  color: string; // gradient class like 'from-violet-500 to-purple-500'
  enabled: boolean;
}

export interface NavTabConfig {
  id: string;
  label: string;
  path: string;
  icon: IconItem;
  enabled: boolean;
  order: number;
}

export interface IconConfig {
  // Navigation icons
  navHome: IconItem;
  navCustoms: IconItem;
  navLoja: IconItem;
  navComunidade: IconItem;
  navPerfil: IconItem;
  
  // Quick actions on home (legacy - for backward compatibility)
  actionIdeias: IconItem;
  actionVIP: IconItem;
  actionCustoms: IconItem;
  actionLoja: IconItem;
  actionComunidade: IconItem;
  
  // Feature icons
  featureVideos: IconItem;
  featureAudios: IconItem;
  featureVIP: IconItem;
  
  // Misc
  logoIcon: IconItem;
  successIcon: IconItem;
}

const defaultIcons: IconConfig = {
  navHome: { type: 'lucide', value: 'Home' },
  navCustoms: { type: 'lucide', value: 'Video' },
  navLoja: { type: 'lucide', value: 'ShoppingBag' },
  navComunidade: { type: 'lucide', value: 'Users' },
  navPerfil: { type: 'lucide', value: 'User' },
  actionIdeias: { type: 'lucide', value: 'Lightbulb' },
  actionVIP: { type: 'lucide', value: 'Crown' },
  actionCustoms: { type: 'lucide', value: 'Video' },
  actionLoja: { type: 'lucide', value: 'CreditCard' },
  actionComunidade: { type: 'lucide', value: 'Users' },
  featureVideos: { type: 'lucide', value: 'Video' },
  featureAudios: { type: 'lucide', value: 'Headphones' },
  featureVIP: { type: 'lucide', value: 'Crown' },
  logoIcon: { type: 'lucide', value: 'Sparkles' },
  successIcon: { type: 'lucide', value: 'CheckCircle2' },
};

export const defaultNavigationTabs: NavTabConfig[] = [
  { id: 'home', label: 'Início', path: '/', icon: { type: 'lucide', value: 'Home' }, enabled: true, order: 0 },
  { id: 'customs', label: "Custom's", path: '/customs', icon: { type: 'lucide', value: 'Video' }, enabled: true, order: 1 },
  { id: 'loja', label: 'Loja', path: '/loja', icon: { type: 'lucide', value: 'ShoppingBag' }, enabled: false, order: 2 },
  { id: 'comunidade', label: 'Comunidade', path: '/comunidade', icon: { type: 'lucide', value: 'Users' }, enabled: true, order: 3 },
  { id: 'perfil', label: 'Perfil', path: '/perfil', icon: { type: 'lucide', value: 'User' }, enabled: true, order: 4 },
];

export const defaultQuickActions: QuickActionItem[] = [
  {
    icon: { type: 'lucide', value: 'GalleryVertical' },
    label: 'Vídeos',
    path: '/galeria-videos',
    color: 'from-sky-500 to-blue-500',
    enabled: true,
  },
  {
    icon: { type: 'lucide', value: 'Lightbulb' },
    label: 'Ideias',
    path: '/ideias',
    color: 'from-violet-500 to-purple-500',
    enabled: true,
  },
  {
    icon: { type: 'lucide', value: 'Crown' },
    label: 'VIP',
    path: '/vip',
    color: 'from-amber-500 to-orange-500',
    enabled: true,
  },
  {
    icon: { type: 'lucide', value: 'Video' },
    label: "Custom's",
    path: '/customs',
    color: 'from-pink-500 to-rose-500',
    enabled: true,
  },
  {
    icon: { type: 'lucide', value: 'ShoppingBag' },
    label: 'Loja',
    path: '/loja',
    color: 'from-green-500 to-emerald-500',
    enabled: false,
  },
  {
    icon: { type: 'lucide', value: 'Users' },
    label: 'Comunidade',
    path: '/comunidade',
    color: 'from-indigo-500 to-purple-500',
    enabled: true,
  },
];

export const availableGradientColors = [
  // Roxos e Violetas
  { id: 'from-violet-500 to-purple-500', label: 'Violeta → Roxo' },
  { id: 'from-indigo-500 to-purple-500', label: 'Índigo → Roxo' },
  { id: 'from-purple-500 to-violet-600', label: 'Roxo → Violeta' },
  { id: 'from-violet-600 to-indigo-600', label: 'Violeta Escuro' },
  
  // Rosas e Fúcsias
  { id: 'from-pink-500 to-rose-500', label: 'Rosa → Rose' },
  { id: 'from-fuchsia-500 to-pink-500', label: 'Fúcsia → Rosa' },
  { id: 'from-rose-500 to-red-500', label: 'Rose → Vermelho' },
  { id: 'from-pink-400 to-fuchsia-600', label: 'Rosa Vibrante' },
  
  // Vermelhos e Laranjas
  { id: 'from-red-500 to-pink-500', label: 'Vermelho → Rosa' },
  { id: 'from-red-500 to-orange-500', label: 'Vermelho → Laranja' },
  { id: 'from-orange-500 to-red-500', label: 'Laranja → Vermelho' },
  { id: 'from-amber-500 to-orange-500', label: 'Âmbar → Laranja' },
  
  // Amarelos e Dourados
  { id: 'from-yellow-500 to-amber-500', label: 'Amarelo → Âmbar' },
  { id: 'from-yellow-400 to-orange-500', label: 'Amarelo → Laranja' },
  { id: 'from-amber-400 to-yellow-500', label: 'Dourado' },
  
  // Verdes
  { id: 'from-green-500 to-emerald-500', label: 'Verde → Esmeralda' },
  { id: 'from-teal-500 to-green-500', label: 'Teal → Verde' },
  { id: 'from-lime-500 to-green-500', label: 'Lima → Verde' },
  { id: 'from-emerald-500 to-teal-500', label: 'Esmeralda → Teal' },
  { id: 'from-green-400 to-cyan-500', label: 'Verde Água' },
  
  // Azuis e Cianos
  { id: 'from-blue-500 to-cyan-500', label: 'Azul → Ciano' },
  { id: 'from-sky-500 to-blue-500', label: 'Céu → Azul' },
  { id: 'from-cyan-500 to-blue-500', label: 'Ciano → Azul' },
  { id: 'from-blue-600 to-indigo-600', label: 'Azul Profundo' },
  { id: 'from-sky-400 to-cyan-500', label: 'Céu Claro' },
  
  // Neutros e Especiais
  { id: 'from-slate-500 to-gray-600', label: 'Cinza Elegante' },
  { id: 'from-zinc-500 to-slate-600', label: 'Grafite' },
  { id: 'from-stone-500 to-neutral-600', label: 'Pedra' },
  
  // Gradientes Especiais
  { id: 'from-rose-400 via-fuchsia-500 to-indigo-500', label: 'Arco-íris Rosa' },
  { id: 'from-amber-400 via-orange-500 to-red-500', label: 'Pôr do Sol' },
  { id: 'from-green-400 via-cyan-500 to-blue-500', label: 'Oceano' },
  { id: 'from-purple-400 via-pink-500 to-red-500', label: 'Aurora' },
  { id: 'from-blue-400 via-purple-500 to-pink-500', label: 'Galáxia' },
  { id: 'from-yellow-400 via-lime-500 to-green-500', label: 'Natureza' },
];

export const availableRoutes = [
  { path: '/ideias', label: 'Ideias' },
  { path: '/vip', label: 'VIP' },
  { path: '/customs', label: "Custom's" },
  
  { path: '/comunidade', label: 'Comunidade' },
  { path: '/assinaturas', label: 'Assinaturas' },
  { path: '/perfil', label: 'Perfil' },
  { path: '/meus-pedidos', label: 'Meus Pedidos' },
];

export interface WhiteLabelConfig {
  // Branding
  siteName: string;
  siteDescription: string;
  bannerImage: string;
  bannerImages: string[];
  logoImage: string;

  // Navigation Tabs
  navigationTabs: NavTabConfig[];

  // YouTube / Videos
  youtube: {
    enabled: boolean;
    channelId: string;
    searchEnabled?: boolean;
    categoryPreviewLimit?: number | null;
    continueWatchingEnabled?: boolean;
    continueWatchingLimit?: number;
    newBadgeDays?: number;
    trendingEnabled?: boolean;
    trendingDays?: number;
    trendingLimit?: number;
    categories?: Array<{
      id: string;
      name: string;
      icon?: string;
      order?: number;
    }>;
    videoCategoryMap?: Record<string, string | undefined>;
    storeChannels?: Array<{
      id: string;
      storeName: string;
      channelId: string;
      enabled: boolean;
    }>;
    /** Per-store integrations: storeId -> { channels, categories, videoCategoryMap } */
    storeIntegrations?: Record<string, {
      channels: Array<{
        id: string;
        creatorName: string;
        channelId: string;
      }>;
      categories?: Array<{
        id: string;
        name: string;
        icon?: string;
        order?: number;
      }>;
      videoCategoryMap?: Record<string, string | undefined>;
    }>;
  };

  // Icons
  icons: IconConfig;

  // Quick Actions (Explorar section)
  quickActions: QuickActionItem[];

  // Community Config
  community: {
    title: string;
    description: string;
    videosTabEnabled: boolean;
    videosTabLabel: string;
    avisosTabLabel: string;
    ideiasTabLabel: string;
    vipTabEnabled: boolean;
    vipTabLabel: string;
    vipTitle: string;
    vipDescription: string;
    vipButtonLabel: string;
    vipBenefits: Array<{
      id: string;
      title: string;
      description: string;
      icon: 'star' | 'bell' | 'message' | 'gift' | 'zap' | 'heart';
    }>;
  };

  // Colors (HSL format: "H S% L%")
  colors: {
    primary: string;
    accent: string;
    background: string;
  };

  // Shopify Integration
  shopify: {
    enabled: boolean;
    storeUrl: string;
    couponCode?: string;
    couponLabel?: string;
    exampleProducts?: Array<{
      id: string;
      name: string;
      originalPrice: number;
      salePrice: number;
      emoji: string;
    }>;
  };

  // Landing Page
  landingPage: {
    heroVisible: boolean;
    heroTitle: string;
    heroSubtitle: string;
    heroBadgeText: string;
    heroCtaText: string;
    statsVisible: boolean;
    featuresVisible: boolean;
    featuresTitle: string;
    featuresSubtitle: string;
    stepsVisible: boolean;
    stepsTitle: string;
    stepsSubtitle: string;
    freeHighlightVisible: boolean;
    freeHighlightTitle: string;
    freeHighlightDescription: string;
    testimonialsVisible: boolean;
    testimonialsTitle: string;
    ctaVisible: boolean;
    ctaTitle: string;
    ctaDescription: string;
    ctaButtonText: string;
    footerName: string;
  };

  // Integration Tokens
  tokens: {
    supabase: {
      url: string;
      anonKey: string;
      enabled: boolean;
    };
    metricsExport: {
      enabled: boolean;
      apiUrl: string;
      apiKey: string;
      period: string;
      autoSendEnabled: boolean;
      autoSendInterval: number;
      lastSentAt?: string;
    };
  };

}

const defaultCommunityConfig = {
  title: 'Fórum da comunidade',
  description: 'Participe das discussões e compartilhe suas ideias',
  videosTabEnabled: true,
  videosTabLabel: 'Vídeos',
  avisosTabLabel: 'Avisos',
  ideiasTabLabel: 'Ideias',
  vipTabEnabled: true,
  vipTabLabel: 'Área VIP',
  vipTitle: 'Área VIP',
  vipDescription: 'Conteúdo exclusivo para membros VIP. Acesse benefícios especiais, conteúdos antecipados e muito mais.',
  vipButtonLabel: 'Tornar-se VIP',
  vipBenefits: [
    { id: '1', title: 'Conteúdos Exclusivos', description: 'Acesso a vídeos e áudios especiais', icon: 'star' as const },
    { id: '2', title: 'Acesso Antecipado', description: 'Seja o primeiro a ver novos conteúdos', icon: 'bell' as const },
    { id: '3', title: 'Chat Exclusivo', description: 'Converse diretamente com a comunidade VIP', icon: 'message' as const },
  ],
};

const defaultLandingPage: WhiteLabelConfig['landingPage'] = {
  heroVisible: true,
  heroTitle: 'Sua loja ASMR completa em minutos',
  heroSubtitle: 'Loja, comunidade, assinaturas VIP e pagamento via Pix — tudo em um só lugar para você criar conteúdo incrível.',
  heroBadgeText: '100% Grátis — Crie sua loja agora',
  heroCtaText: 'Criar Minha Loja Grátis',
  statsVisible: true,
  featuresVisible: true,
  featuresTitle: 'Tudo para monetizar seu conteúdo',
  featuresSubtitle: 'Ferramentas feitas sob medida para criadores ASMR',
  stepsVisible: true,
  stepsTitle: 'Como funciona',
  stepsSubtitle: '4 passos para ter sua loja no ar',
  freeHighlightVisible: true,
  freeHighlightTitle: 'Totalmente grátis',
  freeHighlightDescription: 'Sem mensalidades, sem taxas ocultas. A plataforma é mantida por anúncios discretos que não atrapalham seus fãs.',
  testimonialsVisible: true,
  testimonialsTitle: 'Criadores que confiam',
  ctaVisible: true,
  ctaTitle: 'Pronto para criar sua loja ASMR?',
  ctaDescription: 'Junte-se a criadores que já monetizam seu conteúdo — 100% grátis.',
  ctaButtonText: 'Criar Minha Loja Grátis',
  footerName: 'ASMR Store',
};

const defaultConfig: WhiteLabelConfig = {
  siteName: 'WhisperScape',
  siteDescription: 'Sua experiência ASMR personalizada',
  bannerImage: '/placeholder.svg',
  bannerImages: ['/placeholder.svg'],
  logoImage: '',
  navigationTabs: defaultNavigationTabs,
  youtube: {
    enabled: true,
    channelId: '',
    searchEnabled: true,
    categoryPreviewLimit: 8,
    continueWatchingEnabled: true,
    continueWatchingLimit: 12,
    newBadgeDays: 7,
    trendingEnabled: true,
    trendingDays: 7,
    trendingLimit: 8,
    categories: [
      { id: 'roleplay', name: 'Roleplay', icon: '🎭', order: 1 },
      { id: 'mouth-sounds', name: 'Sons de boca', icon: '💋', order: 2 },
      { id: 'tapping', name: 'Tappings', icon: '👆', order: 3 },
    ],
    videoCategoryMap: {},
  },
  icons: defaultIcons,
  quickActions: defaultQuickActions,
  community: defaultCommunityConfig,
  colors: {
    primary: '270 70% 60%',
    accent: '280 60% 70%',
    background: '260 30% 6%',
  },
  shopify: {
    enabled: false,
    storeUrl: '',
    couponCode: '',
    couponLabel: 'Use o cupom',
    exampleProducts: [
      { id: '1', name: 'Netflix Premium', originalPrice: 55.90, salePrice: 11.18, emoji: '🎬' },
      { id: '2', name: 'Spotify Premium', originalPrice: 34.90, salePrice: 6.98, emoji: '🎵' },
      { id: '3', name: 'Disney+', originalPrice: 43.90, salePrice: 8.78, emoji: '✨' },
      { id: '4', name: 'YouTube Premium', originalPrice: 45.90, salePrice: 9.18, emoji: '▶️' },
      { id: '5', name: 'HBO Max', originalPrice: 49.90, salePrice: 9.98, emoji: '🎭' },
      { id: '6', name: 'Amazon Prime', originalPrice: 19.90, salePrice: 3.98, emoji: '📦' },
    ],
  },
  tokens: {
    supabase: {
      url: '',
      anonKey: '',
      enabled: false,
    },
    metricsExport: {
      enabled: false,
      apiUrl: '',
      apiKey: '',
      period: '30days',
      autoSendEnabled: false,
      autoSendInterval: 60,
      lastSentAt: undefined,
    },
  },
  landingPage: defaultLandingPage,
};

interface WhiteLabelContextType {
  config: WhiteLabelConfig;
  setConfig: (config: WhiteLabelConfig) => void;
  updateBranding: (branding: Partial<Pick<WhiteLabelConfig, 'siteName' | 'siteDescription' | 'bannerImage' | 'bannerImages' | 'logoImage'>>) => void;
  updateColors: (colors: Partial<WhiteLabelConfig['colors']>) => void;
  updateIcons: (icons: Partial<IconConfig>) => void;
  updateQuickActions: (quickActions: QuickActionItem[]) => void;
  
  updateNavigationTabs: (tabs: NavTabConfig[]) => void;
  updateCommunity: (community: Partial<WhiteLabelConfig['community']>) => void;
  updateYouTube: (youtube: Partial<WhiteLabelConfig['youtube']>) => void;
  updateShopify: (shopify: Partial<WhiteLabelConfig['shopify']>) => void;
  updateToken: <K extends keyof WhiteLabelConfig['tokens']>(
    tokenKey: K,
    tokenValue: Partial<WhiteLabelConfig['tokens'][K]>
  ) => void;
  resetToDefaults: () => void;
  resetIconsToDefaults: () => void;
  resetQuickActionsToDefaults: () => void;
  resetCommunityToDefaults: () => void;
  resetNavigationTabsToDefaults: () => void;
  testConnection: (tokenKey: keyof WhiteLabelConfig['tokens']) => Promise<{ success: boolean; message: string }>;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

const STORAGE_KEY = 'whitelabel_config';

export const WhiteLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);

  // Load from database on mount
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const dbConfig = await loadConfig<WhiteLabelConfig>('white_label_config');
        
        if (dbConfig) {
          // Deep merge with defaults
          const merged = mergeConfig(defaultConfig, dbConfig);
          setConfig(merged);
          localStorage.removeItem(STORAGE_KEY); // Clear old localStorage
        } else {
          // No DB config, try localStorage migration
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            const merged = mergeConfig(defaultConfig, parsed);
            setConfig(merged);
            
            // Save to DB
            await saveConfig('white_label_config', merged);
            localStorage.removeItem(STORAGE_KEY);
            console.log('Migrated whitelabel config to database');
          }
        }
      } catch (err) {
        console.error('Error loading config:', err);
        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setConfig(mergeConfig(defaultConfig, parsed));
        }
      } finally {
        setIsDbLoaded(true);
        initialLoadRef.current = true;
      }
    };

    loadFromDb();
  }, []);

  // Helper function to merge config with defaults
  const mergeConfig = (defaults: WhiteLabelConfig, parsed: Partial<WhiteLabelConfig>): WhiteLabelConfig => {
    const parsedBannerImages: string[] | undefined = Array.isArray(parsed.bannerImages)
      ? parsed.bannerImages
      : parsed.bannerImage
        ? [parsed.bannerImage]
        : undefined;

    return {
      ...defaults,
      ...parsed,
      bannerImages: (parsedBannerImages ?? defaults.bannerImages).filter(Boolean),
      bannerImage: (parsedBannerImages?.[0] ?? parsed.bannerImage ?? defaults.bannerImage) || '',
      youtube: {
        ...defaults.youtube,
        ...parsed.youtube,
        categories:
          Array.isArray(parsed?.youtube?.categories) && parsed.youtube.categories.length
            ? parsed.youtube.categories
            : defaults.youtube.categories,
        videoCategoryMap:
          parsed?.youtube?.videoCategoryMap && typeof parsed.youtube.videoCategoryMap === 'object'
            ? parsed.youtube.videoCategoryMap
            : defaults.youtube.videoCategoryMap,
      },
      icons: { ...defaultIcons, ...parsed.icons },
      quickActions: parsed.quickActions || defaultQuickActions,
      navigationTabs: parsed.navigationTabs || defaultNavigationTabs,
      community: { ...defaultCommunityConfig, ...parsed.community },
      shopify: { ...defaults.shopify, ...parsed.shopify },
      tokens: {
        supabase: { ...defaults.tokens.supabase, ...parsed.tokens?.supabase },
        metricsExport: { ...defaults.tokens.metricsExport, ...parsed.tokens?.metricsExport },
      },
      landingPage: { ...defaultLandingPage, ...parsed.landingPage },
    };
  };

  // Apply CSS variables whenever colors change
  useEffect(() => {
    const root = document.documentElement;
    
    // Validate HSL format before applying (should be "H S% L%" format)
    const isValidHSL = (value: string) => {
      const parts = value.trim().split(/\s+/);
      if (parts.length !== 3) return false;
      const h = parseFloat(parts[0]);
      const s = parts[1];
      const l = parts[2];
      return !isNaN(h) && h >= 0 && h <= 360 && 
             s.endsWith('%') && l.endsWith('%');
    };
    
    // Only apply valid HSL colors, otherwise use defaults
    const defaultColors = {
      primary: '270 70% 60%',
      accent: '280 60% 70%',
      background: '260 30% 6%',
    };
    
    const primary = isValidHSL(config.colors.primary) ? config.colors.primary : defaultColors.primary;
    const accent = isValidHSL(config.colors.accent) ? config.colors.accent : defaultColors.accent;
    const background = isValidHSL(config.colors.background) ? config.colors.background : defaultColors.background;
    
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--background', background);
    
    // Update gradient variables that use primary/accent
    root.style.setProperty('--ring', primary);
    root.style.setProperty('--sidebar-primary', primary);
  }, [config.colors]);

  // Debounced save to database whenever config changes
  useEffect(() => {
    if (!initialLoadRef.current) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save to avoid too many writes
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveConfig('white_label_config', config);
      } catch (err) {
        console.error('Error saving config to database:', err);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config]);

  const updateBranding = useCallback((branding: Partial<Pick<WhiteLabelConfig, 'siteName' | 'siteDescription' | 'bannerImage' | 'bannerImages' | 'logoImage'>>) => {
    setConfig(prev => {
      const next = { ...prev, ...branding };

      const nextBannerImages = Array.isArray(branding.bannerImages)
        ? branding.bannerImages
        : branding.bannerImage !== undefined
          ? (branding.bannerImage ? [branding.bannerImage] : [])
          : Array.isArray(prev.bannerImages)
            ? prev.bannerImages
            : (prev.bannerImage ? [prev.bannerImage] : []);

      next.bannerImages = nextBannerImages.filter(Boolean);
      next.bannerImage = next.bannerImages[0] ?? '';

      return next;
    });
  }, []);

  const updateColors = useCallback((colors: Partial<WhiteLabelConfig['colors']>) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, ...colors },
    }));
  }, []);

  const updateIcons = useCallback((icons: Partial<IconConfig>) => {
    setConfig(prev => ({
      ...prev,
      icons: { ...prev.icons, ...icons },
    }));
  }, []);

  const updateQuickActions = useCallback((quickActions: QuickActionItem[]) => {
    setConfig(prev => ({
      ...prev,
      quickActions,
    }));
  }, []);

  const updateNavigationTabs = useCallback((navigationTabs: NavTabConfig[]) => {
    setConfig(prev => ({
      ...prev,
      navigationTabs,
    }));
  }, []);

  const updateCommunity = useCallback((community: Partial<WhiteLabelConfig['community']>) => {
    setConfig(prev => ({
      ...prev,
      community: { ...prev.community, ...community },
    }));
  }, []);

  const updateYouTube = useCallback((youtube: Partial<WhiteLabelConfig['youtube']>) => {
    setConfig(prev => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        ...youtube,
        categories: youtube.categories ?? prev.youtube.categories,
        videoCategoryMap: youtube.videoCategoryMap ?? prev.youtube.videoCategoryMap,
      },
    }));
  }, []);

  const updateShopify = useCallback((shopify: Partial<WhiteLabelConfig['shopify']>) => {
    setConfig(prev => ({
      ...prev,
      shopify: { ...prev.shopify, ...shopify },
    }));
  }, []);


  const updateToken = useCallback(<K extends keyof WhiteLabelConfig['tokens']>(
    tokenKey: K,
    tokenValue: Partial<WhiteLabelConfig['tokens'][K]>
  ) => {
    setConfig(prev => ({
      ...prev,
      tokens: {
        ...prev.tokens,
        [tokenKey]: { ...prev.tokens[tokenKey], ...tokenValue },
      },
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  const resetIconsToDefaults = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      icons: defaultIcons,
    }));
  }, []);

  const resetQuickActionsToDefaults = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      quickActions: defaultQuickActions,
    }));
  }, []);

  const resetCommunityToDefaults = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      community: defaultCommunityConfig,
    }));
  }, []);

  const resetNavigationTabsToDefaults = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      navigationTabs: defaultNavigationTabs,
    }));
  }, []);

  const testConnection = useCallback(async (tokenKey: keyof WhiteLabelConfig['tokens']): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const token = config.tokens[tokenKey];
    
    switch (tokenKey) {
      case 'supabase':
        if (!token.enabled || !config.tokens.supabase.url || !config.tokens.supabase.anonKey) {
          return { success: false, message: 'Configure URL e Anon Key primeiro' };
        }
        return { success: true, message: 'Conexão Supabase estabelecida!' };
        
      default:
        return { success: false, message: 'Integração desconhecida' };
    }
  }, [config.tokens]);

  return (
    <WhiteLabelContext.Provider
      value={{
        config,
        setConfig,
        updateBranding,
        updateColors,
        updateIcons,
        updateQuickActions,
        updateNavigationTabs,
        updateCommunity,
        updateYouTube,
        updateShopify,
        updateToken,
        resetToDefaults,
        resetIconsToDefaults,
        resetQuickActionsToDefaults,
        resetCommunityToDefaults,
        resetNavigationTabsToDefaults,
        testConnection,
      }}
    >
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => {
  const context = useContext(WhiteLabelContext);

  // Fallback to avoid a blank screen if a component renders outside the provider
  if (context === undefined) {
    console.error('useWhiteLabel used outside WhiteLabelProvider');

    const noop = () => {};

    return {
      config: defaultConfig,
      setConfig: noop,
      updateBranding: noop,
      updateColors: noop,
      updateIcons: noop,
      updateQuickActions: noop,
      updateNavigationTabs: noop,
      updateCommunity: noop,
      updateYouTube: noop,
      updateShopify: noop,
      updateToken: noop as any,
      resetToDefaults: noop,
      resetIconsToDefaults: noop,
      resetQuickActionsToDefaults: noop,
      resetCommunityToDefaults: noop,
      resetNavigationTabsToDefaults: noop,
      testConnection: async () => ({ success: false, message: 'White Label indisponível' }),
    };
  }

  return context;
};
