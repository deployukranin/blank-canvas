import { motion } from 'framer-motion';
import { Trophy, MessageCircle, Lightbulb, ThumbsUp, TrendingUp, Award } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { UserReputation } from '@/lib/user-reputation';

interface ReputationCardProps {
  reputation: UserReputation;
  showBadges?: boolean;
  showStats?: boolean;
}

export const ReputationCard = ({ reputation, showBadges = true, showStats = true }: ReputationCardProps) => {
  const levelColors = {
    1: 'from-gray-400 to-gray-600',
    2: 'from-green-400 to-green-600',
    3: 'from-blue-400 to-blue-600',
    4: 'from-purple-400 to-purple-600',
    5: 'from-amber-400 to-amber-600',
    6: 'from-rose-400 to-rose-600',
    7: 'from-yellow-400 to-yellow-600',
    8: 'from-cyan-400 to-cyan-600',
    9: 'from-pink-400 to-pink-600',
    10: 'from-yellow-400 via-amber-500 to-orange-500',
  };

  const gradientClass = levelColors[reputation.level as keyof typeof levelColors] || levelColors[1];

  return (
    <GlassCard className="p-4 space-y-4">
      {/* Level Header */}
      <div className="flex items-center gap-4">
        <motion.div 
          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <span className="text-2xl">{getLevelIcon(reputation.level)}</span>
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{reputation.title}</h3>
            <Badge variant="outline" className="text-xs">
              Nível {reputation.level}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{reputation.totalPoints} pontos</span>
              {reputation.level < 10 && (
                <span>Próx: {reputation.nextLevelPoints} pts</span>
              )}
            </div>
            <Progress value={reputation.progressPercent} className="h-2" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            className="text-center p-3 rounded-lg bg-muted/30"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <p className="font-bold">{reputation.votesReceived}</p>
            <p className="text-xs text-muted-foreground">Votos</p>
          </motion.div>
          
          <motion.div 
            className="text-center p-3 rounded-lg bg-muted/30"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <MessageCircle className="w-4 h-4" />
            </div>
            <p className="font-bold">{reputation.commentsGiven}</p>
            <p className="text-xs text-muted-foreground">Comentários</p>
          </motion.div>
          
          <motion.div 
            className="text-center p-3 rounded-lg bg-muted/30"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <Lightbulb className="w-4 h-4" />
            </div>
            <p className="font-bold">{reputation.ideasCreated}</p>
            <p className="text-xs text-muted-foreground">Ideias</p>
          </motion.div>
        </div>
      )}

      {/* Badges */}
      {showBadges && reputation.badges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Award className="w-4 h-4 text-primary" />
            Conquistas ({reputation.badges.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {reputation.badges.map((badge) => (
              <motion.span
                key={badge.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                title={badge.description}
              >
                <span>{badge.icon}</span>
                <span>{badge.name}</span>
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// Helper function to get level icon
const getLevelIcon = (level: number): string => {
  const icons: Record<number, string> = {
    1: '🌱',
    2: '🌿',
    3: '⭐',
    4: '✨',
    5: '🔥',
    6: '💫',
    7: '👑',
    8: '🏆',
    9: '💎',
    10: '🌟',
  };
  return icons[level] || '🌱';
};
