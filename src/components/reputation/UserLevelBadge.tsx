import { cn } from '@/lib/utils';
import { useReputationByHandle } from '@/hooks/use-gamification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserLevelBadgeProps {
  username?: string | null;
  level?: number;
  title?: string;
  icon?: string;
  points?: number;
  showLevel?: boolean;
  showTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-0.5',
  md: 'text-sm px-2 py-1 gap-1',
  lg: 'text-base px-3 py-1.5 gap-1.5',
};

const levelColors: Record<number, string> = {
  1: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  2: 'bg-green-500/20 text-green-400 border-green-500/30',
  3: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  4: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  5: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  6: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  7: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  8: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  9: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  10: 'bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30',
};

export const UserLevelBadge = ({
  username,
  level,
  title,
  icon,
  points,
  showLevel = true,
  showTitle = false,
  size = 'sm',
  className,
}: UserLevelBadgeProps) => {
  const byHandle = useReputationByHandle();
  const fromMap = username ? byHandle.get(username.toLowerCase()) : undefined;

  const resolvedLevel = level ?? fromMap?.level;
  const resolvedTitle = title ?? fromMap?.title;
  const resolvedIcon = icon ?? fromMap?.icon;
  const resolvedPoints = points ?? fromMap?.totalPoints;

  if (!resolvedLevel || !resolvedTitle) return null;

  const colorClass = levelColors[resolvedLevel] || levelColors[1];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center rounded-full border font-medium cursor-help',
              sizeClasses[size],
              colorClass,
              className
            )}
          >
            <span>{resolvedIcon}</span>
            {showLevel && <span>Lv.{resolvedLevel}</span>}
            {showTitle && <span>{resolvedTitle}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-center">
          <p className="font-semibold">{resolvedIcon} {resolvedTitle}</p>
          {resolvedPoints !== undefined && (
            <p className="text-xs text-muted-foreground">Lv.{resolvedLevel} • {resolvedPoints} pts</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
