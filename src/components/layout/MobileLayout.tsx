import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideHeader?: boolean;
}

export const MobileLayout = ({ children, title, showBack, hideHeader }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      {!hideHeader && <MobileHeader title={title} showBack={showBack} />}
      <main className={`flex-1 ${hideHeader ? '' : 'pt-14'}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
