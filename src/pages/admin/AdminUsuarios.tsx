import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Crown, User, Mail, Calendar } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockAdminUsers, AdminUser } from '@/lib/admin-mock-data';

const AdminUsuarios: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>(mockAdminUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'regular'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase());
    let matchesFilter = true;
    if (filter === 'vip') matchesFilter = user.isVIP;
    if (filter === 'regular') matchesFilter = !user.isVIP;
    return matchesSearch && matchesFilter;
  });

  const toggleVIP = (id: string) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, isVIP: !user.isVIP } : user
    ));
  };

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
                placeholder="Buscar por nome ou email..."
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
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{user.username}</h3>
                        {user.isAdmin && (
                          <Badge className="bg-red-500/20 text-red-400">Admin</Badge>
                        )}
                        {user.isVIP && !user.isAdmin && (
                          <Badge className="bg-yellow-500/20 text-yellow-400">VIP</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Desde {user.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:items-end gap-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {user.totalOrders} pedidos
                      </span>
                      <span className="font-medium text-green-400">
                        R$ {user.totalSpent.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={user.isVIP ? 'default' : 'outline'}
                        className={user.isVIP ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                        onClick={() => toggleVIP(user.id)}
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        {user.isVIP ? 'VIP' : 'Tornar VIP'}
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
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
