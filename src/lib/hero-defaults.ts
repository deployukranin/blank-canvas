/**
 * Legacy hardcoded hero texts that should be shown translated instead of
 * their stored (Portuguese) value.
 */
export const LEGACY_HERO_GREETINGS = ['Bem-vindo! 🤍', 'Welcome! 🤍', '¡Bienvenido! 🤍', 'Bem-vindo!', 'Welcome!'];
export const LEGACY_HERO_SUBTITLES = [
  'Relaxe com ASMR de qualidade',
  'Relax with quality ASMR',
  'Relájate con ASMR de calidad',
  'Relax with quality content',
];

export const isLegacyGreeting = (value?: string | null) =>
  !value || LEGACY_HERO_GREETINGS.includes(value.trim());

export const isLegacySubtitle = (value?: string | null) =>
  !value || LEGACY_HERO_SUBTITLES.includes(value.trim());
