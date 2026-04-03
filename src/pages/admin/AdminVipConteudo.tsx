import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Crown, Save, Loader2, Play, FileText, Image, Music, Edit2, Upload, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadVipMedia, deleteVipMedia } from '@/lib/external-storage';

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

const acceptByType: Record<string, string> = {
  video: 'video/*',
  audio: 'audio/*',
  image: 'image/*',
  post: 'image/*,video/*,audio/*',
};

const AdminVipConteudo = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState<VipContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VipContentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isAdultContent, setIsAdultContent] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<string>('post');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

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

  // Load adult content setting
  useEffect(() => {
    if (!storeId) return;
    const loadAdultSetting = async () => {
      const { data } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'vip_adult_content')
        .eq('store_id', storeId)
        .maybeSingle();
      if (data?.config_value) {
        setIsAdultContent((data.config_value as any).enabled === true);
      }
    };
    loadAdultSetting();
  }, [storeId]);

  const handleToggleAdultContent = async (checked: boolean) => {
    if (!storeId) return;
    setIsAdultContent(checked);
    const { data: existing } = await supabase
      .from('app_configurations')
      .select('id')
      .eq('config_key', 'vip_adult_content')
      .eq('store_id', storeId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('app_configurations')
        .update({ config_value: { enabled: checked } })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('app_configurations')
        .insert({ config_key: 'vip_adult_content', store_id: storeId, config_value: { enabled: checked } });
    }
    toast({ title: checked ? t('vipAdmin.adultEnabled') : t('vipAdmin.adultDisabled') });
  };

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
    setUploadedFileName('');
    setEditingItem(null);
    setShowForm(false);
  };

  const openEdit = (item: VipContentItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormType(item.content_type);
    setFormMediaUrl(item.media_url || '');
    setUploadedFileName('');
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storeId) return;

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo de 100MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadVipMedia(file, storeId);
      setFormMediaUrl(url);
      setUploadedFileName(file.name);
      toast({ title: 'Upload concluído!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = () => {
    setFormMediaUrl('');
    setUploadedFileName('');
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({ title: 'Preencha título e conteúdo', variant: 'destructive' });
      return;
    }
    if (!storeId) {
      toast({ title: 'Loja não encontrada', variant: 'destructive' });
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
        toast({ title: 'Conteúdo atualizado!' });
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
        toast({ title: 'Conteúdo publicado!' });
      }
      resetForm();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: VipContentItem) => {
    // Try to delete media from external storage
    if (item.media_url) {
      try {
        await deleteVipMedia(item.media_url);
      } catch (e) {
        console.warn('Could not delete external media:', e);
      }
    }

    const { error } = await supabase.from('vip_content').delete().eq('id', item.id);
    if (error) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' });
    } else {
      setContent(prev => prev.filter(c => c.id !== item.id));
      toast({ title: 'Conteúdo deletado' });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Conteúdo VIP">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Conteúdo VIP">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Gerencie conteúdo exclusivo para seus assinantes VIP
          </p>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Conteúdo
          </Button>
        </div>

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
                      <p className="text-xs text-primary mt-2 truncate">📎 Mídia anexada</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item)}>
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
              <p className="text-muted-foreground mb-4">Nenhum conteúdo VIP ainda</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Conteúdo
              </Button>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptByType[formType] || '*/*'}
        onChange={handleFileUpload}
      />

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              {editingItem ? 'Editar Conteúdo VIP' : 'Novo Conteúdo VIP'}
            </DialogTitle>
            <DialogDescription>
              Este conteúdo será visível apenas para assinantes VIP ativos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título</label>
              <Input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Título do conteúdo..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo</label>
              <Select value={formType} onValueChange={(val) => { setFormType(val); setFormMediaUrl(''); setUploadedFileName(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">📝 Post</SelectItem>
                  <SelectItem value="video">🎥 Vídeo</SelectItem>
                  <SelectItem value="audio">🎵 Áudio</SelectItem>
                  <SelectItem value="image">🖼️ Imagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Conteúdo</label>
              <Textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Escreva seu conteúdo exclusivo..."
                className="min-h-[100px]"
              />
            </div>

            {/* Media upload section */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mídia</label>
              
              {formMediaUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFileName || 'Mídia anexada'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{formMediaUrl}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={handleRemoveMedia} className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Fazer upload de arquivo</>
                    )}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  <Input
                    value={formMediaUrl}
                    onChange={e => setFormMediaUrl(e.target.value)}
                    placeholder="Cole uma URL de mídia..."
                    disabled={isUploading}
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-1.5">
                Upload direto (até 100MB) ou cole um link externo
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving || isUploading}>
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {editingItem ? 'Atualizar' : 'Publicar'}</>
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
