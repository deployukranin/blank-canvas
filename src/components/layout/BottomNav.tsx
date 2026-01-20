import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

export const BottomNav = () => {
  const location = useLocation();
  const { config } = useWhiteLabel();

  const navItems = [
    { path: '/', icon: config.icons.navHome, label: 'Início' },
    { path: '/customs', icon: config.icons.navCustoms, label: "Custom's" },
    { path: '/loja', icon: config.icons.navLoja, label: 'Loja' },
    { path: '/comunidade', icon: config.icons.navComunidade, label: 'Comunidade' },
    { path: '/perfil', icon: config.icons.navPerfil, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass border-t border-white/10 px-2 pt-2 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
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
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
