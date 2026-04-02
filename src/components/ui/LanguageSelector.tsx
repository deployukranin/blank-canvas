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

const USFlag = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <g fillRule="evenodd">
      <g strokeWidth="1pt">
        <path fill="#bd3d44" d="M0 0h640v37h-640zm0 74h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640zm0-222h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640z"/>
        <path fill="#fff" d="M0 37h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640zm0-222h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640z"/>
      </g>
      <path fill="#192f5d" d="M0 0h364.8v258.5H0z"/>
      <g fill="#fff">
        <g id="us-d">
          <g id="us-c">
            <g id="us-e">
              <g id="us-b">
                <path id="us-a" d="M30.4 11l3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7z"/>
                <path d="M60.8 11l3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7z"/>
              </g>
              <path d="M91.2 11l3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7z"/>
            </g>
            <path d="M121.6 11l3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7z"/>
          </g>
          <path d="M152 11l3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7z"/>
        </g>
      </g>
    </g>
  </svg>
);

const BRFlag = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect width="640" height="480" fill="#229e45"/>
    <path fill="#f8e509" d="M323.4 42L583.9 240 323.4 438 63 240z"/>
    <circle cx="323.4" cy="240" r="112" fill="#2b49a3"/>
    <path fill="#fff" d="M199 225.4c36.2-23.8 92.1-39.2 152.9-36.3 49.7 2.4 95.5 15.8 127.5 35.1l-7 13.2c-30.6-18.3-74.4-31-122.1-33.3-58.4-2.8-112 11.2-146.5 33.7z"/>
  </svg>
);

const ESFlag = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect width="640" height="480" fill="#c60b1e"/>
    <rect width="640" height="240" y="120" fill="#ffc400"/>
  </svg>
);

const languages = [
  { code: 'en', label: 'English', short: 'EN', Flag: USFlag },
  { code: 'es', label: 'Español', short: 'ES', Flag: ESFlag },
  { code: 'pt-BR', label: 'Português', short: 'PT', Flag: BRFlag },
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
            <current.Flag className="w-4 h-3 rounded-sm overflow-hidden" />
            <span>{current.short}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm">
            <current.Flag className="w-5 h-3.5 rounded-sm overflow-hidden" />
            <span>{current.label}</span>
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
            <lang.Flag className="w-5 h-3.5 rounded-sm overflow-hidden" />
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};