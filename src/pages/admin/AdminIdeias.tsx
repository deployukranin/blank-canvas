import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ThumbsUp, Flag, Trash2, CheckCircle, Lightbulb } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { type VideoIdea } from '@/lib/mock-data';

const AdminIdeias: React.FC = () => {
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'reported' | 'removed'>('all');

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(search.toLowerCase()) ||
                         idea.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || idea.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = (id: string, newStatus: 'active' | 'removed' | 'reported') => {
    setIdeas(ideas.map(idea => 
      idea.id === id ? { ...idea, status: newStatus } : idea
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400">Ativa</Badge>;
      case 'reported':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Denunciada</Badge>;
      case 'removed':
        return <Badge className="bg-red-500/20 text-red-400">Removida</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Gerenciar Ideias">
      <div className="space-y-6">
        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ideias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'reported', 'removed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : f === 'reported' ? 'Denunciadas' : 'Removidas'}
                </Button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Ideas List */}
        {filteredIdeas.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma ideia ainda</h3>
            <p className="text-sm text-muted-foreground">
              As ideias dos usuários aparecerão aqui.
            </p>
          </GlassCard>
        ) : (
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
                          {idea.votes} votos
                        </span>
                        <span>Por: {idea.authorName}</span>
                        <span>{idea.createdAt}</span>
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
                          Aprovar
                        </Button>
                      )}
                      {idea.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-yellow-400 border-yellow-400/50"
                          onClick={() => handleStatusChange(idea.id, 'reported')}
                        >
                          <Flag className="w-4 h-4" />
                          Marcar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-400 border-red-400/50"
                        onClick={() => handleStatusChange(idea.id, 'removed')}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminIdeias;
