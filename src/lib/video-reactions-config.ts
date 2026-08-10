import type { ReactionType } from '@/hooks/use-video-reactions';

export interface ReactionConfigItem {
  type: ReactionType;
  /** Custom label; empty means "use the translated default" */
  label: string;
  /** Emoji shown when no custom icon image is set */
  emoji: string;
  /** Optional PNG uploaded by the store admin */
  iconUrl?: string;
  /** Highlight color (hex or CSS color); empty means "use the theme primary" */
  color?: string;
  enabled: boolean;
}

export const REACTION_TYPES: ReactionType[] = ['relaxante', 'dormi', 'arrepios', 'favorito'];

export const DEFAULT_REACTION_EMOJIS: Record<ReactionType, string> = {
  relaxante: '👍',
  dormi: '😴',
  arrepios: '🧠',
  favorito: '💜',
};

export const DEFAULT_REACTION_LABEL_KEYS: Record<ReactionType, { key: string; fallback: string }> = {
  relaxante: { key: 'reactions.relaxing', fallback: 'Relaxing' },
  dormi: { key: 'reactions.sleep', fallback: 'Fell asleep' },
  arrepios: { key: 'reactions.tingles', fallback: 'Tingles' },
  favorito: { key: 'reactions.favorite', fallback: 'Favorite' },
};

export const defaultReactions: ReactionConfigItem[] = REACTION_TYPES.map((type) => ({
  type,
  label: '',
  emoji: DEFAULT_REACTION_EMOJIS[type],
  iconUrl: '',
  color: '',
  enabled: true,
}));

/** Ensures the config always has exactly the 4 known reaction slots. */
export const normalizeReactions = (value: unknown): ReactionConfigItem[] => {
  const list = Array.isArray(value) ? (value as Partial<ReactionConfigItem>[]) : [];
  return REACTION_TYPES.map((type) => {
    const found = list.find((r) => r?.type === type);
    return {
      type,
      label: typeof found?.label === 'string' ? found.label : '',
      emoji: found?.emoji || DEFAULT_REACTION_EMOJIS[type],
      iconUrl: typeof found?.iconUrl === 'string' ? found.iconUrl : '',
      color: typeof found?.color === 'string' ? found.color : '',
      enabled: found?.enabled !== false,
    };
  });
};
