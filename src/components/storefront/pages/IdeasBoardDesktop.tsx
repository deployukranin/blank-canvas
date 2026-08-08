import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Flag, Send, Loader2, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface IdeaItem {
  id: string;
  title: string;
  description: string;
  votes: number;
  hasVoted: boolean;
  authorName?: string | null;
  created_at: string;
}

interface IdeasBoardDesktopProps {
  ideas: IdeaItem[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  newIdea: { title: string; description: string };
  onChangeIdea: (value: { title: string; description: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onVote: (id: string) => void;
  onReport: (id: string) => void;
  locale: string;
}

/**
 * Desktop-only "Obsidian Cinematic" ideas board: sticky composer rail on the left,
 * scrolling suggestion feed on the right, ambient primary glows behind.
 */
export const IdeasBoardDesktop = ({
  ideas, isLoading, isAuthenticated, isSubmitting, newIdea,
  onChangeIdea, onSubmit, onVote, onReport, locale,
}: IdeasBoardDesktopProps) => {
  const { t } = useTranslation();

  return (
    <div className="relative">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-32 -right-24 w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-[30%] h-[30%] rounded-full bg-primary/[0.07] blur-[100px]" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Composer rail */}
        <aside className="lg:col-span-4">
          <div className="sticky top-28">
            <h1 className="text-4xl font-display font-extrabold tracking-tight mb-2 text-foreground">
              {t('storefront.submitIdea')}
            </h1>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              {t('storefront.ideasIntro', 'Help shape the next video. The community votes on the best suggestions.')}
            </p>

            <form
              onSubmit={onSubmit}
              className="bg-foreground/[0.03] border border-border/60 backdrop-blur-xl p-6 rounded-3xl shadow-2xl space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 ml-1">
                  {t('storefront.ideaTitle')}
                </label>
                <Input
                  value={newIdea.title}
                  maxLength={100}
                  onChange={(e) => onChangeIdea({ ...newIdea, title: e.target.value })}
                  placeholder={t('storefront.ideaTitle')}
                  className="bg-foreground/[0.04] border-border/60 rounded-xl px-4 py-6 focus-visible:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 ml-1">
                  {t('storefront.describeIdea')}
                </label>
                <Textarea
                  rows={4}
                  value={newIdea.description}
                  maxLength={500}
                  onChange={(e) => onChangeIdea({ ...newIdea, description: e.target.value })}
                  placeholder={t('storefront.describeIdea')}
                  className="bg-foreground/[0.04] border-border/60 rounded-xl px-4 py-3 resize-none focus-visible:ring-primary/50"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-xl font-bold shadow-[0_0_32px_-8px_hsl(var(--primary)/0.7)] active:scale-[0.98] transition-transform"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isSubmitting ? t('storefront.submitting') : t('storefront.submitIdea')}
              </Button>
            </form>
          </div>
        </aside>

        {/* Feed */}
        <main className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold border-b-2 border-primary pb-1 text-foreground">
              {t('storefront.trending', 'Trending')}
            </span>
            <span className="text-xs text-muted-foreground">
              {ideas.length} {t('nav.ideas')}
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (
            <AnimatePresence>
              {ideas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex gap-6 items-start rounded-3xl p-6 border border-border/60 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all duration-300"
                >
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onVote(idea.id)}
                      aria-label="vote"
                      className={`p-3 rounded-2xl border transition-all group-hover:scale-105 ${
                        idea.hasVoted
                          ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.9)]'
                          : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-primary/15 hover:text-primary'
                      }`}
                    >
                      <ThumbsUp className={`w-6 h-6 ${idea.hasVoted ? 'fill-current' : ''}`} />
                    </button>
                    <span className={`font-bold text-lg ${idea.hasVoted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {idea.votes}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                        {t('nav.ideas')}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {idea.authorName || t('usersAdmin.user')} • {new Date(idea.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {idea.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{idea.description}</p>
                  </div>

                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => onReport(idea.id)}
                      aria-label="report"
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors self-start"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!isLoading && (
            <div className="border-2 border-dashed border-border/40 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                <Lightbulb className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="font-bold text-foreground mb-1">
                {ideas.length === 0
                  ? t('storefront.noIdeasYet')
                  : t('storefront.endOfList', 'End of the line')}
              </h4>
              <p className="text-muted-foreground text-sm max-w-xs">
                {t('storefront.ideasEmptyDesc', 'Be the first to suggest something fresh using the form on the left.')}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default IdeasBoardDesktop;
