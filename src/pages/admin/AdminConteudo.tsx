import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Pin, Megaphone, Newspaper, Star } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type FeedPost } from '@/lib/mock-data';

const AdminConteudo: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'news' as FeedPost['type'],
    isPinned: false
  });

  const handleCreate = () => {
    const post: FeedPost = {
      id: Date.now().toString(),
      ...newPost,
      createdAt: new Date().toISOString(),
      authorUsername: 'luna_asmr',
      authorAvatar: '🌙'
    };
    setPosts([post, ...posts]);
    setNewPost({ title: '', content: '', type: 'news', isPinned: false });
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  const togglePin = (id: string) => {
    setPosts(posts.map(post => 
      post.id === id ? { ...post, isPinned: !post.isPinned } : post
    ));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Badge className="bg-blue-500/20 text-blue-400">Aviso</Badge>;
      case 'news':
        return <Badge className="bg-green-500/20 text-green-400">Novidade</Badge>;
      case 'exclusive':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Exclusivo</Badge>;
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
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout title="Gerenciar Conteúdo">
      <div className="space-y-6">
        {/* Create Button */}
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Post
          </Button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4">Criar Novo Post</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="Título do post..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Escreva o conteúdo do post..."
                    rows={4}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Tipo</label>
                    <Select 
                      value={newPost.type} 
                      onValueChange={(v) => setNewPost({ ...newPost, type: v as FeedPost['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Aviso</SelectItem>
                        <SelectItem value="news">Novidade</SelectItem>
                        <SelectItem value="exclusive">Exclusivo VIP</SelectItem>
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
                      {newPost.isPinned ? 'Fixado' : 'Fixar'}
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={!newPost.title || !newPost.content}>
                    Publicar
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Posts List */}
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
                            Fixado
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
            <p className="text-muted-foreground">Nenhum post encontrado</p>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminConteudo;
