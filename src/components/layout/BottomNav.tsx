import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useTenant } from '@/contexts/TenantContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

// Map nav paths to i18n keys
const pathToI18nKey: Record<string, string> = {
  '/': 'nav.home',
  '/customs': 'nav.customs',
  '/vip': 'nav.vip',
  '/community': 'nav.community',
  '/profile': 'nav.profile',
  '/videos': 'nav.videos',
  '/ideas': 'nav.ideas',
  '/help': 'nav.help',
  '/notifications': 'nav.notifications',
  '/orders': 'nav.myOrders',
  '/subscriptions': 'nav.subscriptions',
};

export const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { config } = useWhiteLabel();
  const { basePath, isTenantScope } = useTenant();

  const navItems = config.navigationTabs
    .filter(tab => tab.enabled && tab.path !== '/loja')
    .sort((a, b) => a.order - b.order);

  const resolvePath = (path: string) => {
    if (!isTenantScope) return path;
    if (path === '/') return basePath || '/';
    return `${basePath}${path}`;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass border-t border-primary/10 px-2 pt-2 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const resolvedPath = resolvePath(item.path);
            const isActive = location.pathname === resolvedPath || 
              (item.path === '/' && (location.pathname === basePath || location.pathname === '/'));
            const i18nKey = pathToI18nKey[item.path];
            const label = i18nKey ? t(i18nKey) : item.label;

            return (
              <Link
                key={item.id}
                to={resolvedPath}
                className="relative flex flex-col items-center gap-1 py-2 px-4 min-w-[64px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-primary/20"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <DynamicIcon
                  icon={item.icon}
                  size={20}
                  className={`relative z-10 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium relative z-10 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
