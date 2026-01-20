import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export const MobileLayout = ({ children, title, showBack }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <MobileHeader title={title} showBack={showBack} />
      <main className="flex-1 pt-14">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
