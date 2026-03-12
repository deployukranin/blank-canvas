import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, ExternalLink, MoreVertical, Pencil, Trash2, Power, PowerOff, Loader2, Link2, UserCog } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useStores, type StoreItem } from '@/hooks/use-stores';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CEOLojas = () => {
  const { stores, isLoading, createStore, updateStore, deleteStore } = useStores();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null);
  const [adminTarget, setAdminTarget] = useState<StoreItem | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSlug, setFormSlug] = useState('');

  // Fetch store admins for the selected store
  const { data: storeAdmins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['store-admins', adminTarget?.id],
    queryFn: async () => {
      if (!adminTarget) return [];
      const { data, error } = await supabase
        .from('store_admins')
        .select('*, profiles(display_name, handle)')
        .eq('store_id', adminTarget.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!adminTarget,
  });

  const addAdmin = useMutation({
    mutationFn: async ({ storeId, email }: { storeId: string; email: string }) => {
      // Find user by email in profiles or auth - we need to look up via a different approach
      // Since we can't query auth.users, we look for profile with matching email
      // Actually, let's use a simpler approach: search by the user's auth email
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .limit(100);

      if (profileErr) throw profileErr;

      // We need to find the user by email - check auth
      // Since profiles don't have email, we'll need the user to provide the user_id
      // For now let's try to sign in check - actually, let's just use the edge function approach
      // Simpler: the CEO provides the email, we look it up
      
      // Alternative: search in admin_credentials or try a direct approach
      // Let's use a pragmatic approach - the CEO enters the user UUID or email
      // For email, we can't query auth.users from client. Let's accept user_id directly.
      
      // Check if input looks like UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(email);
      
      let userId = email;
      
      if (!isUuid) {
        // Try to find by handle
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('handle', email.replace('@', ''))
          .maybeSingle();
        
        if (profile) {
          userId = profile.user_id;
        } else {
          throw new Error('Usuário não encontrado. Use o handle ou ID do usuário.');
        }
      }

      // Ensure user has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' } as any);
      }

      // Create store_admin assignment
      const { error } = await supabase
        .from('store_admins')
        .insert({ store_id: storeId, user_id: userId } as any);

      if (error) {
        if (error.code === '23505') throw new Error('Este usuário já é admin desta loja.');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-admins', adminTarget?.id] });
      toast.success('Admin vinculado à loja!');
      setAdminEmail('');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao vincular admin'),
  });

  const removeAdmin = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('store_admins').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-admins', adminTarget?.id] });
      toast.success('Admin removido da loja!');
    },
    onError: () => toast.error('Erro ao remover admin'),
  });

  const openNew = () => {
    setFormName('');
    setFormUrl('');
    setFormSlug('');
    setNewOpen(true);
  };

  const openEdit = (store: StoreItem) => {
    setFormName(store.name);
    setFormUrl(store.url);
    setFormSlug((store as any).slug || '');
    setEditStore(store);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleCreate = () => {
    if (!formName.trim()) return;
    const slug = formSlug.trim() || generateSlug(formName);
    createStore.mutate({
      name: formName.trim(),
      url: formUrl.trim() || `${slug}.lovable.app`,
      slug,
    });
    setNewOpen(false);
  };

  const handleEdit = () => {
    if (!editStore || !formName.trim()) return;
    const slug = formSlug.trim() || generateSlug(formName);
    updateStore.mutate({
      id: editStore.id,
      name: formName.trim(),
      url: formUrl.trim() || editStore.url,
      slug,
    });
    setEditStore(null);
  };

  const copyRegistrationLink = (store: StoreItem) => {
    const slug = (store as any).slug;
    if (!slug) {
      toast.error('Esta loja não tem um slug definido. Edite a loja para adicionar.');
      return;
    }
    const link = `${window.location.origin}/loja/${slug}/auth`;
    navigator.clipboard.writeText(link);
    toast.success('Link de cadastro copiado!');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteStore.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleStatus = (store: StoreItem) => {
    updateStore.mutate({
      id: store.id,
      status: store.status === 'active' ? 'inactive' : 'active',
    });
  };

  return (
    <CEOLayout title="Minhas Lojas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Gerencie todas as suas lojas criadas na plataforma.</p>
          <Button className="gap-2" size="sm" onClick={openNew}>
            <Plus className="w-4 h-4" /> Nova Loja
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : stores.length === 0 ? (
          <GlassCard className="text-center py-12">
            <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma loja criada ainda</p>
            <Button className="mt-4 gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" /> Criar Primeira Loja
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {stores.map((store, i) => (
              <motion.div key={store.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Store className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{store.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {store.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      store.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
                    }`}>
                      {store.status === 'active' ? 'Ativa' : 'Inativa'}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(store)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(store)}>
                          {store.status === 'active'
                            ? <><PowerOff className="w-4 h-4 mr-2" /> Desativar</>
                            : <><Power className="w-4 h-4 mr-2" /> Ativar</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyRegistrationLink(store)}>
                          <Link2 className="w-4 h-4 mr-2" /> Link de Cadastro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdminTarget(store)}>
                          <UserCog className="w-4 h-4 mr-2" /> Gerenciar Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(store)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Nova Loja */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Loja</DialogTitle>
            <DialogDescription>Preencha os dados para criar uma nova loja.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da loja</Label>
              <Input value={formName} onChange={e => { setFormName(e.target.value); if (!formSlug) setFormSlug(generateSlug(e.target.value)); }} placeholder="Ex: ASMR Dreams" />
            </div>
            <div className="space-y-2">
              <Label>Slug (identificador único)</Label>
              <Input value={formSlug} onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="asmr-dreams" />
              <p className="text-xs text-muted-foreground">Usado no link de cadastro: /loja/{formSlug || 'slug'}/auth</p>
            </div>
            <div className="space-y-2">
              <Label>URL (opcional)</Label>
              <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="minha-loja.lovable.app" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createStore.isPending}>
              {createStore.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Loja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={!!editStore} onOpenChange={o => !o && setEditStore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
            <DialogDescription>Atualize os dados da loja.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da loja</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={formSlug} onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
              <p className="text-xs text-muted-foreground">Link: /loja/{formSlug || 'slug'}/auth</p>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={updateStore.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Admin */}
      <Dialog open={!!adminTarget} onOpenChange={o => !o && setAdminTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Admin — {adminTarget?.name}</DialogTitle>
            <DialogDescription>Vincule ou remova admins desta loja.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="Handle do usuário (ex: joao) ou UUID"
                className="flex-1"
              />
              <Button
                size="sm"
                disabled={!adminEmail.trim() || addAdmin.isPending}
                onClick={() => adminTarget && addAdmin.mutate({ storeId: adminTarget.id, email: adminEmail.trim() })}
              >
                {addAdmin.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vincular'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Admins vinculados</Label>
              {adminsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : storeAdmins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum admin vinculado</p>
              ) : (
                storeAdmins.map((sa: any) => (
                  <div key={sa.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        {sa.profiles?.display_name || sa.profiles?.handle || sa.user_id.slice(0, 8) + '...'}
                      </p>
                      <p className="text-xs text-muted-foreground">ID: {sa.user_id.slice(0, 12)}...</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeAdmin.mutate(sa.id)}
                      disabled={removeAdmin.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminTarget(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Loja</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteStore.isPending}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CEOLayout>
  );
};

export default CEOLojas;
