import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useVideoReactions, type ReactionType } from '@/hooks/use-video-reactions';

interface ReactionOption {
  type: ReactionType;
  emoji: string;
  label: string;
}

const REACTIONS: ReactionOption[] = [
  { type: 'relaxante', emoji: '👍', label: 'Relaxante' },
  { type: 'dormi', emoji: '😴', label: 'Dormi com esse' },
  { type: 'arrepios', emoji: '🧠', label: 'Arrepios' },
  { type: 'favorito', emoji: '💜', label: 'Favorito' },
];

interface VideoReactionsProps {
  videoId: string;
  className?: string;
  compact?: boolean;
}

export function VideoReactions({ videoId, className, compact = false }: VideoReactionsProps) {
  const { userReaction, isLoading, isSaving, setReaction } = useVideoReactions(videoId);

  if (isLoading) {
    return (
      <div className={cn('flex gap-2', className)}>
        {REACTIONS.map((r) => (
          <div
            key={r.type}
            className="w-10 h-10 rounded-full bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {REACTIONS.map((reaction) => {
        const isSelected = userReaction === reaction.type;

        return (
          <motion.button
            key={reaction.type}
            type="button"
            onClick={() => setReaction(reaction.type)}
            disabled={isSaving}
            className={cn(
              'relative flex items-center justify-center rounded-full transition-all duration-200',
              compact ? 'w-9 h-9' : 'w-10 h-10',
              isSelected
                ? 'bg-primary/20 ring-2 ring-primary/50 scale-110'
                : 'bg-muted/30 hover:bg-muted/50 hover:scale-105',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
            whileTap={{ scale: 0.9 }}
            aria-label={reaction.label}
            aria-pressed={isSelected}
          >
            <span className={cn('text-lg', compact && 'text-base')}>
              {reaction.emoji}
            </span>
            
            <AnimatePresence>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full flex items-center justify-center"
                >
                  <span className="text-[8px] text-primary-foreground">✓</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
      
      {/* Subtle label for selected reaction */}
      <AnimatePresence mode="wait">
        {userReaction && !compact && (
          <motion.span
            key={userReaction}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="ml-2 text-xs text-muted-foreground"
          >
            {REACTIONS.find((r) => r.type === userReaction)?.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact inline version for cards
export function VideoReactionBadge({ videoId }: { videoId: string }) {
  const { userReaction } = useVideoReactions(videoId);

  if (!userReaction) return null;

  const reaction = REACTIONS.find((r) => r.type === userReaction);
  if (!reaction) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs"
      title={reaction.label}
    >
      <span>{reaction.emoji}</span>
    </span>
  );
}
