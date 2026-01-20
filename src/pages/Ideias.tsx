import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ThumbsUp, Flag, Send, AlertCircle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockVideoIdeas, type VideoIdea } from '@/lib/mock-data';
import { onContentReport, trackEvent } from '@/lib/integrations';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const IdeiasPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<VideoIdea[]>(mockVideoIdeas);
  const [newIdea, setNewIdea] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const handleVote = async (ideaId: string) => {
    if (!isAuthenticated) {
      setAuthMessage('Faça login para votar nas ideias');
      setShowAuthModal(true);
      return;
    }

    setIdeas(prev =>
      prev.map(idea =>
        idea.id === ideaId
          ? { ...idea, votes: idea.hasVoted ? idea.votes - 1 : idea.votes + 1, hasVoted: !idea.hasVoted }
          : idea
      )
    );

    trackEvent('idea_vote', { ideaId, userId: user?.id });
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newIdea.title.trim() || !newIdea.description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e a descrição da ideia',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const idea: VideoIdea = {
      id: `idea-${Date.now()}`,
      title: newIdea.title,
      description: newIdea.description,
      votes: 0,
      status: 'active',
      authorName: user?.username || 'Anônimo',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setIdeas(prev => [idea, ...prev]);
    setNewIdea({ title: '', description: '' });
    setIsSubmitting(false);

    trackEvent('idea_submitted', { ideaId: idea.id });

    toast({
      title: 'Ideia enviada! 🎉',
      description: 'Sua sugestão foi publicada',
    });
  };

  const handleReport = async (ideaId: string) => {
    if (!reportReason.trim()) {
      toast({
        title: 'Motivo necessário',
        description: 'Descreva o motivo da denúncia',
        variant: 'destructive',
      });
      return;
    }

    await onContentReport({
      contentId: ideaId,
      contentType: 'idea',
      reason: reportReason,
      reporterId: user?.id,
    });

    toast({
      title: 'Denúncia enviada',
      description: 'Obrigado pelo feedback',
    });
    setReportingId(null);
    setReportReason('');
  };

  const sortedIdeas = [...ideas]
    .filter(idea => idea.status === 'active')
    .sort((a, b) => b.votes - a.votes);

  return (
    <MobileLayout title="Ideias de Vídeos">
      <div className="px-4 py-6 space-y-4">
        {/* Submit Form */}
        <GlassCard className="p-4">
          <form onSubmit={handleSubmitIdea} className="space-y-3">
            <Input
              placeholder="Título da ideia..."
              value={newIdea.title}
              onChange={e => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
              className="glass border-white/10"
              maxLength={100}
            />
            <Textarea
              placeholder="Descreva sua ideia..."
              value={newIdea.description}
              onChange={e => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
              className="glass border-white/10 min-h-[80px]"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Ideia'}
            </Button>
          </form>
        </GlassCard>

        {/* Ideas List */}
        <div className="space-y-3">
          <AnimatePresence>
            {sortedIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(idea.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        idea.hasVoted
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-white/5 text-muted-foreground'
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${idea.hasVoted ? 'fill-current' : ''}`} />
                      <span className="font-bold text-sm">{idea.votes}</span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{idea.title}</h4>
                      <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{idea.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{idea.authorName}</span>
                        <span>•</span>
                        <span>{new Date(idea.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {isAuthenticated && (
                      <button
                        onClick={() => setReportingId(idea.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors self-start"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authMessage}
      />

      {/* Report Dialog */}
      <Dialog open={!!reportingId} onOpenChange={() => setReportingId(null)}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Denunciar Ideia
            </DialogTitle>
            <DialogDescription>
              Descreva o motivo da denúncia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="glass border-white/10"
            />
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setReportingId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => reportingId && handleReport(reportingId)}
              >
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default IdeiasPage;
