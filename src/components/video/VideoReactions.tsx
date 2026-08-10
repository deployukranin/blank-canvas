import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useVideoReactions, type ReactionType } from '@/hooks/use-video-reactions';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import {
  DEFAULT_REACTION_LABEL_KEYS,
  defaultReactions,
  normalizeReactions,
  type ReactionConfigItem,
} from '@/lib/video-reactions-config';

interface VideoReactionsProps {
  videoId: string;
  className?: string;
  compact?: boolean;
}

/** Resolves the reactions to render (admin config + translated fallbacks). */
export const useResolvedReactions = () => {
  const { t } = useTranslation();
  const { config } = useWhiteLabel();
  const items = normalizeReactions(config?.reactions ?? defaultReactions);

  return items.map((item) => {
    const fallback = DEFAULT_REACTION_LABEL_KEYS[item.type];
    return {
      ...item,
      resolvedLabel: item.label?.trim() || t(fallback.key, fallback.fallback),
    };
  });
};

const ReactionIcon = ({ item, label, size }: { item: ReactionConfigItem; label: string; size: 'sm' | 'md' }) => {
  if (item.iconUrl) {
    return (
      <img
        src={item.iconUrl}
        alt={label}
        loading="lazy"
        className={cn('object-contain', size === 'sm' ? 'w-5 h-5' : 'w-6 h-6')}
      />
    );
  }
  return <span className={cn(size === 'sm' ? 'text-base' : 'text-lg')}>{item.emoji}</span>;
};

export function VideoReactions({ videoId, className, compact = false }: VideoReactionsProps) {
  const { userReaction, isLoading, isSaving, setReaction } = useVideoReactions(videoId);
  const reactions = useResolvedReactions().filter((r) => r.enabled);

  if (isLoading) {
    return (
      <div className={cn('flex gap-2', className)}>
        {reactions.map((r) => (
          <div key={r.type} className="w-10 h-10 rounded-full bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (reactions.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {reactions.map((reaction) => {
        const isSelected = userReaction === reaction.type;

        return (
          <motion.button
            key={reaction.type}
            type="button"
            onClick={() => setReaction(reaction.type)}
            disabled={isSaving}
            style={
              isSelected && reaction.color
                ? { backgroundColor: `${reaction.color}33`, boxShadow: `0 0 0 2px ${reaction.color}80` }
                : undefined
            }
            className={cn(
              'relative flex items-center justify-center rounded-full transition-all duration-200',
              compact ? 'w-9 h-9' : 'w-10 h-10',
              isSelected
                ? cn('scale-110', !reaction.color && 'bg-primary/20 ring-2 ring-primary/50')
                : 'bg-muted/30 hover:bg-muted/50 hover:scale-105',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
            whileTap={{ scale: 0.9 }}
            aria-label={reaction.resolvedLabel}
            title={reaction.resolvedLabel}
            aria-pressed={isSelected}
          >
            <ReactionIcon item={reaction} label={reaction.resolvedLabel} size={compact ? 'sm' : 'md'} />

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
            {reactions.find((r) => r.type === userReaction)?.resolvedLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact inline version for cards
export function VideoReactionBadge({ videoId }: { videoId: string }) {
  const { userReaction } = useVideoReactions(videoId);
  const reactions = useResolvedReactions();

  if (!userReaction) return null;

  const reaction = reactions.find((r) => r.type === (userReaction as ReactionType));
  if (!reaction || !reaction.enabled) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs"
      title={reaction.resolvedLabel}
    >
      <ReactionIcon item={reaction} label={reaction.resolvedLabel} size="sm" />
    </span>
  );
}
