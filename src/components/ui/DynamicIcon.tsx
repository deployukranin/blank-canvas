import * as LucideIcons from 'lucide-react';
import { IconItem } from '@/contexts/WhiteLabelContext';
import { cn } from '@/lib/utils';

interface DynamicIconProps {
  icon: IconItem;
  className?: string;
  size?: number;
}

// Get Lucide icon component by name
const getLucideIcon = (name: string): LucideIcons.LucideIcon | null => {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] || null;
};

export const DynamicIcon = ({ icon, className, size = 20 }: DynamicIconProps) => {
  if (icon.type === 'emoji') {
    return (
      <span 
        className={cn("inline-flex items-center justify-center", className)}
        style={{ fontSize: size }}
      >
        {icon.value}
      </span>
    );
  }

  // Lucide icon
  const IconComponent = getLucideIcon(icon.value);
  
  if (!IconComponent) {
    // Fallback to a default icon
    return <LucideIcons.Circle className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};

// Helper to render icon in a styled container
interface IconContainerProps {
  icon: IconItem;
  className?: string;
  iconClassName?: string;
  size?: number;
}

export const IconContainer = ({ icon, className, iconClassName, size }: IconContainerProps) => {
  return (
    <div className={className}>
      <DynamicIcon icon={icon} className={iconClassName} size={size} />
    </div>
  );
};
