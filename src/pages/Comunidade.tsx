import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Bell, Star, Lock, Pin, Lightbulb, MessageCircle, ThumbsUp, Users, Plus, 
  Send, ChevronDown, ChevronUp, Trophy, TrendingUp, Filter, BellRing, Check, 
  Flag, MoreHorizontal, AlertTriangle, Video, Crown, Gift, Zap, Heart
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { mockFeedPosts, mockForumIdeas, type FeedPost, type ForumIdea, type ForumComment } from '@/lib/mock-data';
import { addCommunityReport, reasonCategories, getReportedContentIds } from '@/lib/community-reports';
// Content moderation removed - inline simple check
const moderateContent = (content: string) => ({ isBlocked: false, blockedWords: [] as string[] });
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';
import { useUserReputation } from '@/hooks/use-user-reputation';
import { AdPlaceholder } from '@/components/ads/AdBanner';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { UserLevelBadge } from '@/components/reputation/UserLevelBadge';
import { LeaderboardCard } from '@/components/reputation/LeaderboardCard';
import { ReputationCard } from '@/components/reputation/ReputationCard';
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle';
import { UserHandle } from '@/components/profile/UserHandle';
import { VideoGalleryPanel } from '@/components/video/VideoGalleryPanel';

const getPostTypeConfig = (type: FeedPost['type']) => {
  switch (type) {
    case 'announcement':
      return { icon: <Bell className="w-3 h-3" />, label: 'Aviso', color: 'bg-warning/20 text-warning' };
    case 'news':
      return { icon: <Star className="w-3 h-3" />, label: 'Novidade', color: 'bg-info/20 text-info' };
    case 'exclusive':
      return { icon: <Lock className="w-3 h-3" />, label: 'VIP', color: 'bg-vip/20 text-vip' };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Agora';
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR');
};

// Helper function to get level icon
const getLevelIcon = (level: number): string => {
  const icons: Record<number, string> = {
    1: '🌱', 2: '🌿', 3: '⭐', 4: '✨', 5: '🔥',
    6: '💫', 7: '👑', 8: '🏆', 9: '💎', 10: '🌟',
  };
  return icons[level] || '🌱';
};
const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 font-bold">
          <Trophy className="w-3 h-3" />
          1º
        </span>
      );
    case 2:
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-gray-400/20 text-gray-300 font-bold">
          <Trophy className="w-3 h-3" />
          2º
        </span>
      );
    case 3:
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-700/20 text-amber-600 font-bold">
          <Trophy className="w-3 h-3" />
          3º
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-muted/50 text-muted-foreground">
          #{rank}
        </span>
      );
  }
};

// Report Dialog Component
interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'idea' | 'comment';
  contentId: string;
  contentTitle: string;
  contentAuthor: string;
  onReport: (reason: string, category: string) => void;
}

const ReportDialog = ({ isOpen, onClose, contentType, contentTitle, onReport }: ReportDialogProps) => {
  const [category, setCategory] = useState<string>('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (category) {
      onReport(reason || reasonCategories.find(r => r.value === category)?.label || '', category);
      setCategory('');
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Denunciar {contentType === 'idea' ? 'Ideia' : 'Comentário'}
          </DialogTitle>
          <DialogDescription>
            Ajude a manter a comunidade saudável reportando conteúdo inapropriado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Conteúdo:</p>
            <p className="text-sm font-medium truncate">{contentTitle}</p>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Motivo da denúncia</Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              {reasonCategories.map((cat) => (
                <div key={cat.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={cat.value} id={cat.value} />
                  <Label htmlFor={cat.value} className="text-sm cursor-pointer">{cat.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {category === 'other' && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Descreva o problema</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique por que esse conteúdo é inapropriado..."
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!category}
              className="flex-1 bg-red-500 hover:bg-red-600 gap-2"
            >
              <Flag className="w-4 h-4" />
              Denunciar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AvisoCard = ({ post, index }: { post: FeedPost; index: number }) => {
  const typeConfig = getPostTypeConfig(post.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard className={`p-4 relative ${post.isPinned ? 'ring-1 ring-primary/50' : ''}`}>
        {post.isPinned && (
          <div className="absolute -top-2 left-4">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
              <Pin className="w-3 h-3" />
              Fixado
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sm">{post.authorAvatar || '👤'}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <UserHandle 
                userId={post.authorId} 
                username={post.authorUsername} 
                className="font-semibold text-sm" 
              />
              <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${typeConfig.color}`}>
                {typeConfig.icon}
                {typeConfig.label}
              </span>
            </div>

            <h4 className="font-semibold text-sm mb-1">{post.title}</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">{post.content}</p>

            {post.type === 'exclusive' && (
              <div className="mt-3 p-3 rounded-lg bg-vip/5 border border-vip/20 text-center">
                <Lock className="w-4 h-4 mx-auto mb-1 text-vip" />
                <p className="text-xs text-vip">Conteúdo exclusivo VIP</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

interface IdeiaCardProps {
  idea: ForumIdea;
  index: number;
  rank: number;
  onVote: (id: string) => void;
  onAddComment: (id: string, content: string) => void;
  onReportIdea: (idea: ForumIdea) => void;
  onReportComment: (comment: ForumComment, ideaTitle: string) => void;
  votedIdeas: string[];
}

const IdeiaCard = ({ idea, index, rank, onVote, onAddComment, onReportIdea, onReportComment, votedIdeas }: IdeiaCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const hasVoted = votedIdeas.includes(idea.id);

  // Get author reputation for level badge
  const authorUsername = idea.authorUsername;

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(idea.id, newComment);
      setNewComment('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard className={`p-4 ${rank <= 3 ? 'ring-1 ring-amber-500/30' : ''}`}>
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sm">{idea.authorAvatar || '👤'}</span>
            </div>
            {getRankBadge(rank)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <UserHandle 
                  userId={idea.authorId} 
                  username={idea.authorUsername} 
                  className="font-semibold text-sm" 
                />
                <UserLevelBadge username={authorUsername} size="sm" />
                <span className="text-xs text-muted-foreground">{formatDate(idea.createdAt)}</span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-accent/20 text-accent">
                  <Lightbulb className="w-3 h-3" />
                  Ideia
                </span>
              </div>
              
              {/* Menu de opções */}
              {user && user.username !== idea.authorUsername && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onReportIdea(idea)}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Denunciar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <h4 className="font-semibold text-sm mb-1">{idea.title}</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">{idea.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
              <button
                onClick={() => onVote(idea.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  hasVoted ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-primary' : ''}`} />
                <span className="font-bold">{idea.votes}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{idea.comments?.length || 0}</span>
                {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-border/50 space-y-3"
                >
                  {idea.comments && idea.comments.length > 0 ? (
                    <div className="space-y-2">
                      {idea.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 p-2 rounded-lg bg-muted/30 group">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">{comment.authorAvatar || '👤'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <UserHandle 
                                  userId={comment.authorId} 
                                  username={comment.authorUsername} 
                                  className="font-medium text-xs" 
                                />
                                <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                              </div>
                              {user && user.username !== comment.authorUsername && (
                                <button 
                                  onClick={() => onReportComment(comment, idea.title)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                                  title="Denunciar comentário"
                                >
                                  <Flag className="w-3 h-3 text-red-400" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">Nenhum comentário ainda</p>
                  )}

                  {user && (
                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Adicione um comentário..."
                        className="text-xs h-8"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                      />
                      <Button size="sm" onClick={handleSubmitComment} disabled={!newComment.trim()} className="h-8 px-3">
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: { id: string; type: string; fromUsername: string; fromAvatar?: string; ideaTitle: string; message: string; createdAt: string; read: boolean };
  onMarkAsRead: (id: string) => void;
}) => (
  <div 
    className={`p-3 rounded-lg border ${notification.read ? 'bg-muted/20 border-border/30' : 'bg-accent/10 border-accent/30'}`}
    onClick={() => !notification.read && onMarkAsRead(notification.id)}
  >
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
        <span className="text-xs">{notification.fromAvatar || '💬'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs">
          <span className="font-semibold">@{notification.fromUsername}</span> {/* TODO: Add userId to notifications */}
          {' '}{notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">"{notification.ideaTitle}"</p>
        <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
      )}
    </div>
  </div>
);

const ComunidadePage = () => {
  const { config } = useWhiteLabel();
  const videosTabEnabled = config.community.videosTabEnabled;

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const initialTab = (() => {
    if (!videosTabEnabled) {
      return tabParam === 'ideias' ? 'ideias' : 'avisos';
    }
    return tabParam || 'videos';
  })();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [ideas, setIdeas] = useState<ForumIdea[]>(mockForumIdeas);
  const [votedIdeas, setVotedIdeas] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '' });
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');
  const [myIdeasOnly, setMyIdeasOnly] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    if (!videosTabEnabled && activeTab === 'videos') {
      setActiveTab('avisos');
    }
  }, [videosTabEnabled, activeTab]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', activeTab);
      return next;
    }, { replace: true });
  }, [activeTab, setSearchParams]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'idea' | 'comment';
    id: string;
    title: string;
    author: string;
  } | null>(null);

  const { user, requireAuth } = useAuth();
  const { toast } = useToast();
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead } = useCommunityNotifications();
  const { reputation, leaderboard, addPoints } = useUserReputation(user?.username);
  const { notifyVote, notifyComment, permission } = usePushNotifications();

  // Get reported content IDs to filter them out
  const reportedIds = useMemo(() => getReportedContentIds(), []);

  // Sort and filter ideas
  const sortedIdeas = useMemo(() => {
    let filtered = [...ideas].filter(idea => !reportedIds.includes(idea.id));
    
    if (myIdeasOnly && user) {
      filtered = filtered.filter(idea => idea.authorUsername === user.username);
    }
    
    if (sortBy === 'votes') {
      filtered.sort((a, b) => b.votes - a.votes);
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filtered;
  }, [ideas, sortBy, myIdeasOnly, user, reportedIds]);

  // Create ranking map based on votes
  const rankingMap = useMemo(() => {
    const sortedByVotes = [...ideas].filter(idea => !reportedIds.includes(idea.id)).sort((a, b) => b.votes - a.votes);
    const map = new Map<string, number>();
    sortedByVotes.forEach((idea, index) => {
      map.set(idea.id, index + 1);
    });
    return map;
  }, [ideas, reportedIds]);

  const handleVote = (ideaId: string) => {
    if (!user) {
      requireAuth(() => handleVote(ideaId));
      return;
    }

    const idea = ideas.find(i => i.id === ideaId);
    
    if (votedIdeas.includes(ideaId)) {
      setVotedIdeas(prev => prev.filter(id => id !== ideaId));
      setIdeas(prev => prev.map(idea =>
        idea.id === ideaId ? { ...idea, votes: idea.votes - 1 } : idea
      ));
    } else {
      setVotedIdeas(prev => [...prev, ideaId]);
      setIdeas(prev => prev.map(idea =>
        idea.id === ideaId ? { ...idea, votes: idea.votes + 1 } : idea
      ));

      if (idea && idea.authorUsername !== user.username) {
        // Add notification
        addNotification({
          type: 'vote',
          ideaId,
          ideaTitle: idea.title,
          fromUsername: user.username || 'user',
          fromAvatar: '👍',
          message: 'votou na sua ideia',
        });

        // Send push notification to idea author
        notifyVote(idea.title, user.username || 'user');
      }
    }
  };

  const handleAddComment = (ideaId: string, content: string) => {
    if (!user) {
      requireAuth(() => handleAddComment(ideaId, content));
      return;
    }

    // Check for blocked content
    const moderation = moderateContent(content);
    if (moderation.isBlocked) {
      toast({
        title: 'Conteúdo não permitido',
        description: `Seu comentário contém palavras não permitidas: ${moderation.blockedWords.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    const idea = ideas.find(i => i.id === ideaId);
    
    const newComment: ForumComment = {
      id: `c-${Date.now()}`,
      ideaId,
      content,
      authorUsername: user.username || 'user',
      authorAvatar: '👤',
      createdAt: new Date().toISOString(),
    };

    setIdeas(prev => prev.map(idea =>
      idea.id === ideaId
        ? {
            ...idea,
            comments: [...(idea.comments || []), newComment],
            commentsCount: (idea.commentsCount || 0) + 1,
          }
        : idea
    ));

    // Add reputation points for commenting
    addPoints('comment_given', ideaId);

    if (idea && idea.authorUsername !== user.username) {
      addNotification({
        type: 'comment',
        ideaId,
        ideaTitle: idea.title,
        fromUsername: user.username || 'user',
        fromAvatar: '💬',
        message: 'comentou na sua ideia',
      });

      // Send push notification to idea author
      notifyComment(idea.title, user.username || 'user');
    }

    toast({
      title: 'Comentário adicionado!',
      description: 'Seu comentário foi publicado.',
    });
  };

  const handleReportIdea = (idea: ForumIdea) => {
    if (!user) {
      requireAuth(() => handleReportIdea(idea));
      return;
    }
    setReportTarget({
      type: 'idea',
      id: idea.id,
      title: idea.title,
      author: idea.authorUsername,
    });
    setReportDialogOpen(true);
  };

  const handleReportComment = (comment: ForumComment, ideaTitle: string) => {
    if (!user) {
      requireAuth(() => handleReportComment(comment, ideaTitle));
      return;
    }
    setReportTarget({
      type: 'comment',
      id: comment.id,
      title: comment.content.slice(0, 50) + (comment.content.length > 50 ? '...' : ''),
      author: comment.authorUsername,
    });
    setReportDialogOpen(true);
  };

  const handleSubmitReport = (reason: string, category: string) => {
    if (!user || !reportTarget) return;

    try {
      addCommunityReport({
        type: reportTarget.type,
        contentId: reportTarget.id,
        contentTitle: reportTarget.title,
        contentAuthor: reportTarget.author,
        reason,
        reasonCategory: category as 'spam' | 'inappropriate' | 'harassment' | 'other',
        reporterUsername: user.username || 'user',
      });

      toast({
        title: 'Denúncia enviada',
        description: 'Sua denúncia será analisada pela nossa equipe. Obrigado por ajudar a manter a comunidade saudável.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível enviar a denúncia',
        variant: 'destructive',
      });
    }

    setReportTarget(null);
  };

  const handleCreateIdea = () => {
    if (!user) {
      requireAuth(() => setIsCreateOpen(true));
      return;
    }

    if (!newIdea.title.trim() || !newIdea.description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e a descrição da ideia.',
        variant: 'destructive',
      });
      return;
    }

    // Check for blocked content in title and description
    const titleModeration = moderateContent(newIdea.title);
    const descModeration = moderateContent(newIdea.description);
    
    if (titleModeration.isBlocked || descModeration.isBlocked) {
      const blockedWords = [...titleModeration.blockedWords, ...descModeration.blockedWords];
      toast({
        title: 'Conteúdo não permitido',
        description: `Sua ideia contém palavras não permitidas: ${[...new Set(blockedWords)].join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    const idea: ForumIdea = {
      id: `idea-${Date.now()}`,
      title: newIdea.title,
      description: newIdea.description,
      votes: 0,
      authorUsername: user.username || 'user',
      authorAvatar: '💡',
      createdAt: new Date().toISOString(),
      commentsCount: 0,
      comments: [],
    };

    setIdeas(prev => [idea, ...prev]);
    setNewIdea({ title: '', description: '' });
    setIsCreateOpen(false);

    // Add reputation points for creating an idea
    addPoints('idea_created', idea.id);

    toast({
      title: 'Ideia criada!',
      description: 'Sua ideia foi publicada na comunidade.',
    });
  };

  return (
    <MobileLayout title="Comunidade" hideHeader>
      <div className="px-4 py-6">
        {/* Header do fórum */}
        <div className="flex items-center justify-end mb-4">

          <div className="flex items-center gap-2">
            {/* Push Notification Toggle */}
            {user && permission !== 'granted' && (
              <PushNotificationToggle variant="button" />
            )}

            {/* Ranking Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowRanking(true)}
              className="relative"
            >
              <Trophy className="w-5 h-5" />
            </Button>

            {/* Notifications Bell */}
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <BellRing className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                        <Check className="w-3 h-3 mr-1" />
                        Marcar todas
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 10).map(notif => (
                        <NotificationItem 
                          key={notif.id} 
                          notification={notif} 
                          onMarkAsRead={markAsRead}
                        />
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma notificação ainda
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* User Reputation Preview */}
        {user && reputation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <GlassCard className="p-3 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-lg">{getLevelIcon(reputation.level)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{reputation.title}</span>
                    <Badge variant="outline" className="text-xs">Lv.{reputation.level}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{reputation.totalPoints} pts</span>
                    <span>•</span>
                    <span>{reputation.badges.length} conquistas</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowRanking(true)}
                  className="text-xs"
                >
                  Ver ranking
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 bg-card/50 backdrop-blur-sm">
            {videosTabEnabled && (
              <TabsTrigger value="videos" className="flex-1 gap-2">
                <Video className="w-4 h-4" />
                {config.community.videosTabLabel}
              </TabsTrigger>
            )}
            <TabsTrigger value="avisos" className="flex-1 gap-2">
              <Bell className="w-4 h-4" />
              {config.community.avisosTabLabel}
            </TabsTrigger>
            <TabsTrigger value="ideias" className="flex-1 gap-2">
              <Lightbulb className="w-4 h-4" />
              {config.community.ideiasTabLabel}
            </TabsTrigger>
          </TabsList>

          {videosTabEnabled && (
            <TabsContent value="videos" className="mt-0">
              <VideoGalleryPanel className="space-y-4" />
              <AdPlaceholder format="horizontal" className="my-4" />
            </TabsContent>
          )}

          <TabsContent value="avisos" className="space-y-4 mt-0">
            {mockFeedPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <AvisoCard post={post} index={index} />
                {index === 1 && <AdPlaceholder format="horizontal" className="my-4" />}
              </React.Fragment>
            ))}
          </TabsContent>
          <TabsContent value="ideias" className="space-y-4 mt-0">
            {/* Create Idea Button */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2" variant="outline">
                  <Plus className="w-4 h-4" />
                  Compartilhar uma ideia
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    Nova Ideia
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Título</label>
                    <Input
                      value={newIdea.title}
                      onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                      placeholder="Ex: ASMR de chuva com..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                    <Textarea
                      value={newIdea.description}
                      onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                      placeholder="Descreva sua ideia em detalhes..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateIdea} className="flex-1 gap-2">
                      <Send className="w-4 h-4" />
                      Publicar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Filters and Sorting */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'votes' | 'recent')}>
                <SelectTrigger className="w-auto h-8 text-xs gap-2">
                  {sortBy === 'votes' ? <TrendingUp className="w-3 h-3" /> : <Filter className="w-3 h-3" />}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="votes">
                    <span className="flex items-center gap-2">
                      <Trophy className="w-3 h-3" />
                      Mais Votadas
                    </span>
                  </SelectItem>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      Mais Recentes
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {user && (
                <Button
                  variant={myIdeasOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMyIdeasOnly(!myIdeasOnly)}
                  className="h-8 text-xs"
                >
                  {myIdeasOnly ? 'Todas' : 'Minhas Ideias'}
                </Button>
              )}

              <Badge variant="secondary" className="text-xs">
                {sortedIdeas.length} {sortedIdeas.length === 1 ? 'ideia' : 'ideias'}
              </Badge>
            </div>

            {/* Top 3 Highlight */}
            {sortBy === 'votes' && !myIdeasOnly && sortedIdeas.length >= 3 && (
              <GlassCard className="p-3 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Ranking das Ideias</span>
                </div>
                <div className="space-y-1.5">
                  {sortedIdeas.slice(0, 3).map((idea, idx) => (
                    <div key={idea.id} className="flex items-center gap-2 text-xs">
                      {getRankBadge(idx + 1)}
                      <span className="flex-1 truncate">{idea.title}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {idea.votes}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            <AdPlaceholder format="horizontal" className="my-4" />

            {sortedIdeas.map((idea, index) => (
              <IdeiaCard
                key={idea.id}
                idea={idea}
                index={index}
                rank={rankingMap.get(idea.id) || 0}
                onVote={handleVote}
                onAddComment={handleAddComment}
                onReportIdea={handleReportIdea}
                onReportComment={handleReportComment}
                votedIdeas={votedIdeas}
              />
            ))}

            {sortedIdeas.length === 0 && (
              <GlassCard className="p-8 text-center">
                <Lightbulb className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {myIdeasOnly ? 'Você ainda não criou nenhuma ideia' : 'Nenhuma ideia encontrada'}
                </p>
              </GlassCard>
            )}
          </TabsContent>

        </Tabs>
      </div>

      {/* Report Dialog */}
      {reportTarget && (
        <ReportDialog
          isOpen={reportDialogOpen}
          onClose={() => {
            setReportDialogOpen(false);
            setReportTarget(null);
          }}
          contentType={reportTarget.type}
          contentId={reportTarget.id}
          contentTitle={reportTarget.title}
          contentAuthor={reportTarget.author}
          onReport={handleSubmitReport}
        />
      )}

      {/* Ranking Dialog */}
      <Dialog open={showRanking} onOpenChange={setShowRanking}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Ranking da Comunidade
            </DialogTitle>
            <DialogDescription>
              Veja sua posição e as maiores contribuições da comunidade
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* User's reputation card if logged in */}
            {user && reputation && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Sua Reputação</h3>
                <ReputationCard 
                  reputation={reputation} 
                  showBadges={true} 
                  showStats={true} 
                />
              </div>
            )}
            
            {/* Full leaderboard */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Top 15 da Comunidade</h3>
              <LeaderboardCard 
                leaderboard={leaderboard} 
                currentUsername={user?.username}
                limit={15}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default ComunidadePage;
