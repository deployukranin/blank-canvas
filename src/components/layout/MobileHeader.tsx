import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const MobileHeader = ({ title, showBack }: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-area-top">
      <div className="glass border-b border-white/5 h-14 flex items-center px-4">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}

        <h1 className="flex-1 text-center font-display font-semibold">
          {title || 'ASMR Luna'}
        </h1>

        {/* Spacer for centering */}
        <div className="w-10" />
      </div>
    </header>
  );
};
