import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ThumbsUp, Trash2, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoIdea {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'active' | 'pending' | 'reported' | 'removed';
  user_id: string | null;
  created_at: string;
}

const AdminIdeias: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'reported' | 'removed'>('all');

  const isBR = i18n.language?.startsWith('pt');

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setIdeas((data || []).map(idea => ({
        ...idea,
        status: idea.status as VideoIdea['status'],
      })));
    } catch (err) {
      console.error('Error fetching ideas:', err);
      toast({
        title: t('ideasAdmin.loadError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(search.toLowerCase()) ||
                         idea.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || idea.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = async (id: string, newStatus: 'active' | 'pending' | 'removed' | 'reported') => {
    try {
      const { error } = await supabase
        .from('video_ideas')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, status: newStatus } : idea
      ));

      toast({
        title: t('ideasAdmin.statusUpdated'),
        description: newStatus === 'active' ? t('ideasAdmin.approved') : newStatus === 'removed' ? t('ideasAdmin.removed2') : t('ideasAdmin.marked'),
      });
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: t('ideasAdmin.updateError'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('video_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIdeas(ideas.filter(idea => idea.id !== id));

      toast({
        title: t('ideasAdmin.ideaDeleted'),
      });
    } catch (err) {
      console.error('Error deleting idea:', err);
      toast({
        title: t('ideasAdmin.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400">{t('ideasAdmin.active')}</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/20 text-blue-400">{t('ideasAdmin.pending', 'Pending')}</Badge>;
      case 'reported':
        return <Badge className="bg-yellow-500/20 text-yellow-400">{t('ideasAdmin.reported')}</Badge>;
      case 'removed':
        return <Badge className="bg-red-500/20 text-red-400">{t('ideasAdmin.removed')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title={t('ideasAdmin.title')}>
      <div className="space-y-6">
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('ideasAdmin.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'pending', 'reported', 'removed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {t(`ideasAdmin.${f}`)}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchIdeas}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </GlassCard>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {filteredIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{idea.title}</h3>
                        {getStatusBadge(idea.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {idea.votes} {t('ideasAdmin.votes')}
                        </span>
                        <span>{new Date(idea.created_at).toLocaleDateString(isBR ? 'pt-BR' : 'en-US')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {idea.status !== 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleStatusChange(idea.id, 'active')}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {t('ideasAdmin.approve')}
                        </Button>
                      )}
                      {idea.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleStatusChange(idea.id, 'removed')}
                        >
                          {t('ideasAdmin.hide')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                        onClick={() => handleDelete(idea.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('ideasAdmin.deleteBtn')}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredIdeas.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">{t('ideasAdmin.noIdeas')}</p>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminIdeias;
