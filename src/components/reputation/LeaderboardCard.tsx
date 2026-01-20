import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { UserLevelBadge } from './UserLevelBadge';
import type { UserReputation } from '@/lib/user-reputation';

interface LeaderboardCardProps {
  leaderboard: UserReputation[];
  currentUsername?: string;
  limit?: number;
}

export const LeaderboardCard = ({ leaderboard, currentUsername, limit = 5 }: LeaderboardCardProps) => {
  const displayedLeaderboard = leaderboard.slice(0, limit);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-300" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-xs text-muted-foreground font-medium w-4 text-center">{rank}</span>;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-muted/30 border-transparent';
    }
  };

  if (displayedLeaderboard.length === 0) {
    return (
      <GlassCard className="p-4 text-center">
        <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nenhum ranking ainda
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Ranking da Comunidade</h3>
      </div>

      <div className="space-y-2">
        {displayedLeaderboard.map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = user.username === currentUsername;

          return (
            <motion.div
              key={user.username}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-2 rounded-lg border ${getRankBackground(rank)} ${
                isCurrentUser ? 'ring-1 ring-primary' : ''
              }`}
            >
              <div className="w-6 flex items-center justify-center">
                {getRankIcon(rank)}
              </div>

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                    @{user.username}
                    {isCurrentUser && <span className="text-xs ml-1">(você)</span>}
                  </span>
                  <UserLevelBadge username={user.username} size="sm" />
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-sm">{user.totalPoints}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
};
