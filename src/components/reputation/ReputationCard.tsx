import { motion } from 'framer-motion';
import { Trophy, Star, MessageSquare, Lightbulb, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import type { ReputationSummary } from '@/lib/gamification';

interface ReputationCardProps {
  reputation: ReputationSummary;
  showBadges?: boolean;
  showStats?: boolean;
}

export const ReputationCard = ({ reputation, showBadges = true, showStats = true }: ReputationCardProps) => {
  const { t } = useTranslation();

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{reputation.icon}</span>
          <div>
            <p className="font-semibold text-sm">{reputation.title}</p>
            <p className="text-xs text-muted-foreground">Lv.{reputation.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary">{reputation.totalPoints}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('profile.points', 'points')}</p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${reputation.progressPercent}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      {reputation.nextLevelPoints !== null && (
        <p className="text-[11px] text-muted-foreground">
          {t('profile.pointsToNext', '{{points}} points to the next level', {
            points: Math.max(0, reputation.nextLevelPoints - reputation.totalPoints),
          })}
        </p>
      )}

      {showStats && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-white/[0.03] py-2">
            <Lightbulb className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
            <p className="text-sm font-bold">{reputation.ideasCreated}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] py-2">
            <Star className="w-3.5 h-3.5 mx-auto mb-1 text-yellow-400" />
            <p className="text-sm font-bold">{reputation.votesReceived}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] py-2">
            <MessageSquare className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
            <p className="text-sm font-bold">{reputation.commentsGiven}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] py-2">
            <ShoppingBag className="w-3.5 h-3.5 mx-auto mb-1 text-green-400" />
            <p className="text-sm font-bold">{reputation.ordersPaid}</p>
          </div>
        </div>
      )}

      {showBadges && reputation.badges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> {t('storefront.achievements', 'achievements')}
          </p>
          <div className="flex flex-wrap gap-2">
            {reputation.badges.map((badge) => (
              <span key={badge.id} title={badge.description} className="px-2 py-1 rounded-lg bg-white/[0.05] text-xs">
                {badge.icon} {badge.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
