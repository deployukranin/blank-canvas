import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Crown, Save, Loader2, Play, FileText, Image, Music, Edit2, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VipContentItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
  media_url: string | null;
  store_id: string | null;
  created_at: string;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  post: <FileText className="w-4 h-4" />,
  video: <Play className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
};

const contentTypeLabels: Record<string, string> = {
  post: 'Post',
  video: 'Video',
  audio: 'Audio',
  image: 'Image',
};

const AdminVipConteudo = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [content, setContent] = useState<VipContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VipContentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<string>('post');
  const [formMediaUrl, setFormMediaUrl] = useState('');

  // Get creator's store_id
  useEffect(() => {
    const getStoreId = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data) setStoreId(data.store_id);
    };
    getStoreId();
  }, [session?.user?.id]);

  // Load VIP content
  useEffect(() => {
    if (!storeId) return;
    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vip_content')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading VIP content:', error);
      } else {
        setContent((data || []) as VipContentItem[]);
      }
      setIsLoading(false);
    };
    load();
  }, [storeId]);

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormType('post');
    setFormMediaUrl('');
    setEditingItem(null);
    setShowForm(false);
  };

  const openEdit = (item: VipContentItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormType(item.content_type);
    setFormMediaUrl(item.media_url || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({ title: 'Fill in title and content', variant: 'destructive' });
      return;
    }
    if (!storeId) {
      toast({ title: 'Store not found', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('vip_content')
          .update({
            title: formTitle.trim(),
            content: formContent.trim(),
            content_type: formType,
            media_url: formMediaUrl.trim() || null,
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        setContent(prev => prev.map(c =>
          c.id === editingItem.id
            ? { ...c, title: formTitle.trim(), content: formContent.trim(), content_type: formType, media_url: formMediaUrl.trim() || null }
            : c
        ));
        toast({ title: 'Content updated!' });
      } else {
        const { data, error } = await supabase
          .from('vip_content')
          .insert({
            title: formTitle.trim(),
            content: formContent.trim(),
            content_type: formType,
            media_url: formMediaUrl.trim() || null,
            store_id: storeId,
            created_by: session?.user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        setContent(prev => [data as VipContentItem, ...prev]);
        toast({ title: 'Content published!' });
      }
      resetForm();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({ title: 'Error saving content', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('vip_content').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting', variant: 'destructive' });
    } else {
      setContent(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Content deleted' });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="VIP Content">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="VIP Content">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage exclusive content for your VIP subscribers
          </p>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Content
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['post', 'video', 'audio', 'image'].map(type => {
            const count = content.filter(c => c.content_type === type).length;
            return (
              <GlassCard key={type} className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  {contentTypeIcons[type]}
                  <span className="text-xs capitalize">{contentTypeLabels[type]}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Content List */}
        <div className="space-y-3">
          {content.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="gap-1 text-xs">
                        {contentTypeIcons[item.content_type]}
                        {contentTypeLabels[item.content_type] || item.content_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.content}</p>
                    {item.media_url && (
                      <p className="text-xs text-primary mt-2 truncate">📎 {item.media_url}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {content.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No VIP content yet</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Content
              </Button>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              {editingItem ? 'Edit VIP Content' : 'New VIP Content'}
            </DialogTitle>
            <DialogDescription>
              This content will only be visible to active VIP subscribers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Content title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">📝 Post</SelectItem>
                  <SelectItem value="video">🎥 Video</SelectItem>
                  <SelectItem value="audio">🎵 Audio</SelectItem>
                  <SelectItem value="image">🖼️ Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Content</label>
              <Textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Write your exclusive content..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Media URL (optional)</label>
              <Input
                value={formMediaUrl}
                onChange={e => setFormMediaUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or media link"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link to video, audio, or image file
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {editingItem ? 'Update' : 'Publish'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVipConteudo;
