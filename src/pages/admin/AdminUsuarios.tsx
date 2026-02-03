import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Crown, User, Mail, Calendar } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  user_id: string;
  display_name: string | null;
  handle: string | null;
  created_at: string;
  isVIP: boolean;
}

const AdminUsuarios: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'regular'>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, handle, created_at');

        // Fetch active VIP subscriptions
        const { data: vipSubs } = await supabase
          .from('vip_subscriptions')
          .select('user_id')
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString());

        const vipUserIds = new Set(vipSubs?.map(s => s.user_id) || []);

        setUsers((profiles || []).map(p => ({
          ...p,
          isVIP: vipUserIds.has(p.user_id),
        })));
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const name = user.display_name || user.handle || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    let matchesFilter = true;
    if (filter === 'vip') matchesFilter = user.isVIP;
    if (filter === 'regular') matchesFilter = !user.isVIP;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout title="Gerenciar Usuários">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 text-center">
            <User className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-xl font-bold">{loading ? '...' : users.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Crown className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-xl font-bold">{loading ? '...' : users.filter(u => u.isVIP).length}</p>
            <p className="text-xs text-muted-foreground">VIP</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'vip', 'regular'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Todos' : f === 'vip' ? 'VIP' : 'Regular'}
                </Button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Users List */}
        {loading ? (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">Carregando usuários...</p>
          </GlassCard>
        ) : filteredUsers.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {(user.display_name || user.handle || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{user.display_name || user.handle || 'Usuário'}</h3>
                          {user.isVIP && (
                            <Badge className="bg-yellow-500/20 text-yellow-400">VIP</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {user.handle && (
                            <span className="flex items-center gap-1">
                              @{user.handle}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
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

export default AdminUsuarios;
