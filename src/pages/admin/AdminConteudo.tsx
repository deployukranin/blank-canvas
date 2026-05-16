import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pin, Megaphone, Newspaper, Star, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useFeedPosts, type FeedPostType } from '@/hooks/use-feed-posts';

const AdminConteudo: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { posts, isLoading, createPost, togglePin, deletePost } = useFeedPosts();
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState<{ title: string; content: string; type: FeedPostType; isPinned: boolean }>({
    title: '',
    content: '',
    type: 'news',
    isPinned: false,
  });

  const isBR = i18n.language?.startsWith('pt');

  const handleCreate = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setIsSubmitting(true);
    try {
      await createPost({
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        type: newPost.type,
        is_pinned: newPost.isPinned,
      });
      setNewPost({ title: '', content: '', type: 'news', isPinned: false });
      setIsCreating(false);
      toast.success(t('contentAdmin.published', 'Post published'));
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try { await deletePost(id); } catch (e: any) { toast.error(e?.message || 'Error'); }
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    try { await togglePin(id, !current); } catch (e: any) { toast.error(e?.message || 'Error'); }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Badge className="bg-blue-500/20 text-blue-400">{t('contentAdmin.announcement')}</Badge>;
      case 'news':
        return <Badge className="bg-green-500/20 text-green-400">{t('contentAdmin.news')}</Badge>;
      case 'exclusive':
        return <Badge className="bg-yellow-500/20 text-yellow-400">{t('contentAdmin.exclusiveVip')}</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-blue-400" />;
      case 'news':
        return <Newspaper className="w-5 h-5 text-green-400" />;
      case 'exclusive':
        return <Star className="w-5 h-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(isBR ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout title={t('contentAdmin.title')}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('contentAdmin.newPost')}
          </Button>
        </div>

        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4">{t('contentAdmin.createNewPost')}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('contentAdmin.postTitle')}</label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder={t('contentAdmin.postTitlePlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('contentAdmin.postContent')}</label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder={t('contentAdmin.postContentPlaceholder')}
                    rows={4}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">{t('contentAdmin.type')}</label>
                    <Select 
                      value={newPost.type} 
                      onValueChange={(v) => setNewPost({ ...newPost, type: v as FeedPostType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">{t('contentAdmin.announcement')}</SelectItem>
                        <SelectItem value="news">{t('contentAdmin.news')}</SelectItem>
                        <SelectItem value="exclusive">{t('contentAdmin.exclusiveVip')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant={newPost.isPinned ? 'default' : 'outline'}
                      onClick={() => setNewPost({ ...newPost, isPinned: !newPost.isPinned })}
                      className="gap-2"
                    >
                      <Pin className="w-4 h-4" />
                      {newPost.isPinned ? t('contentAdmin.pinned') : t('contentAdmin.pin')}
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleCreate} disabled={!newPost.title || !newPost.content}>
                    {t('contentAdmin.publish')}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      {getTypeIcon(post.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{post.title}</h3>
                        {getTypeBadge(post.type)}
                        {post.isPinned && (
                          <Badge variant="outline" className="border-primary text-primary">
                            <Pin className="w-3 h-3 mr-1" />
                            {t('contentAdmin.pinned')}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{post.content}</p>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={post.isPinned ? 'default' : 'outline'}
                      onClick={() => togglePin(post.id)}
                    >
                      <Pin className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-400/50"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {posts.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">{t('contentAdmin.noPosts')}</p>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminConteudo;
