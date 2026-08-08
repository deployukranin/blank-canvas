/** Maps storefront paths to i18n keys so nav tabs / quick actions follow the selected language. */
export const PATH_I18N_KEYS: Record<string, string> = {
  '/': 'nav.home',
  '/customs': 'nav.customs',
  '/vip': 'nav.vip',
  '/community': 'nav.community',
  '/profile': 'nav.profile',
  '/videos': 'nav.videos',
  '/gallery': 'nav.videos',
  '/ideas': 'nav.ideas',
  '/help': 'nav.help',
  '/notifications': 'nav.notifications',
  '/orders': 'nav.myOrders',
  '/subscriptions': 'nav.subscriptions',
};

/** Returns the translated label for a path, falling back to the admin-configured label. */
export const translatePathLabel = (
  t: (key: string, fallback?: string) => string,
  path: string,
  fallbackLabel: string,
): string => {
  const key = PATH_I18N_KEYS[path];
  return key ? t(key, fallbackLabel) : fallbackLabel;
};
