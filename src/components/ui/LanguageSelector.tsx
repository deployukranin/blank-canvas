import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
];

interface LanguageSelectorProps {
  variant?: 'default' | 'minimal';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const current = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'minimal' ? (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-white/50 hover:text-white/80 hover:bg-white/5 text-xs">
            <Globe className="w-3.5 h-3.5" />
            {current.flag}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm">
            <Globe className="w-4 h-4" />
            <span>{current.flag} {current.label}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black border-purple-500/20 min-w-[140px]">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`gap-2 text-sm cursor-pointer ${
              i18n.language === lang.code ? 'text-purple-400' : 'text-white/70'
            } hover:text-white hover:bg-white/5`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
