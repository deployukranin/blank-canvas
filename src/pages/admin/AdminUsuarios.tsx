import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Crown, User, Mail, Calendar } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  created_at: string;
  isVIP: boolean;
}

const AdminUsuarios: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'regular'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch active VIP subscriptions
      const { data: vipSubs, error: vipError } = await supabase
        .from('vip_subscriptions')
        .select('user_id')
        .eq('status', 'active');

      if (vipError) throw vipError;

      const vipUserIds = new Set(vipSubs?.map(s => s.user_id) || []);

      const usersWithVIP = (profiles || []).map(profile => ({
        ...profile,
        isVIP: vipUserIds.has(profile.user_id),
      }));

      setUsers(usersWithVIP);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const displayName = user.display_name || user.handle || 'Usuário';
    const matchesSearch = displayName.toLowerCase().includes(search.toLowerCase()) ||
                         (user.handle || '').toLowerCase().includes(search.toLowerCase());
    let matchesFilter = true;
    if (filter === 'vip') matchesFilter = user.isVIP;
    if (filter === 'regular') matchesFilter = !user.isVIP;
    return matchesSearch && matchesFilter;
  });

  const toggleVIP = async (userId: string, currentlyVIP: boolean) => {
    try {
      if (currentlyVIP) {
        // Cancel VIP
        const { error } = await supabase
          .from('vip_subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('status', 'active');

        if (error) throw error;
        toast.success('VIP cancelado');
      } else {
        // Add VIP (30 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error } = await supabase
          .from('vip_subscriptions')
          .insert({
            user_id: userId,
            status: 'active',
            plan_type: 'monthly',
            price_cents: 0, // Dado pelo admin
            expires_at: expiresAt.toISOString(),
          });

        if (error) throw error;
        toast.success('VIP ativado por 30 dias');
      }

      // Refresh list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling VIP:', error);
      toast.error('Erro ao alterar VIP');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gerenciar Usuários">
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </GlassCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gerenciar Usuários">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 text-center">
            <User className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Crown className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-xl font-bold">{users.filter(u => u.isVIP).length}</p>
            <p className="text-xs text-muted-foreground">VIP</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou @handle..."
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
        <div className="space-y-4">
          {filteredUsers.map((user, index) => {
            const displayName = user.display_name || user.handle || 'Usuário';
            return (
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
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{displayName}</h3>
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
                            Desde {formatDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col lg:items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={user.isVIP ? 'default' : 'outline'}
                          className={user.isVIP ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                          onClick={() => toggleVIP(user.user_id, user.isVIP)}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          {user.isVIP ? 'VIP' : 'Tornar VIP'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsuarios;
