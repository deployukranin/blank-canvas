import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, ExternalLink, MoreVertical, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface StoreItem {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  users: number;
  orders: number;
}

const initialStores: StoreItem[] = [
  { id: '1', name: 'ASMR Luna Store', url: 'luna-asmr.lovable.app', status: 'active', users: 342, orders: 87 },
  { id: '2', name: 'Relaxing Vibes Shop', url: 'relaxing-vibes.lovable.app', status: 'active', users: 218, orders: 54 },
  { id: '3', name: 'Whisper Dreams', url: 'whisper-dreams.lovable.app', status: 'inactive', users: 64, orders: 12 },
];

const CEOLojas = () => {
  const [stores, setStores] = useState<StoreItem[]>(initialStores);
  const [newOpen, setNewOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreItem | null>(null);
  const [deleteStore, setDeleteStore] = useState<StoreItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const openNew = () => {
    setFormName('');
    setFormUrl('');
    setNewOpen(true);
  };

  const openEdit = (store: StoreItem) => {
    setFormName(store.name);
    setFormUrl(store.url);
    setEditStore(store);
  };

  const handleCreate = () => {
    if (!formName.trim()) { toast.error('Nome é obrigatório'); return; }
    const slug = formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newStore: StoreItem = {
      id: crypto.randomUUID(),
      name: formName.trim(),
      url: formUrl.trim() || `${slug}.lovable.app`,
      status: 'active',
      users: 0,
      orders: 0,
    };
    setStores(prev => [...prev, newStore]);
    setNewOpen(false);
    toast.success('Loja criada com sucesso!');
  };

  const handleEdit = () => {
    if (!editStore || !formName.trim()) return;
    setStores(prev => prev.map(s => s.id === editStore.id ? { ...s, name: formName.trim(), url: formUrl.trim() || s.url } : s));
    setEditStore(null);
    toast.success('Loja atualizada!');
  };

  const handleDelete = () => {
    if (!deleteStore) return;
    setStores(prev => prev.filter(s => s.id !== deleteStore.id));
    setDeleteStore(null);
    toast.success('Loja removida!');
  };

  const toggleStatus = (id: string) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
    toast.success('Status atualizado!');
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
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{store.users} usuários</p>
                    <p className="text-xs text-muted-foreground">{store.orders} pedidos</p>
                  </div>
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
                      <DropdownMenuItem onClick={() => toggleStatus(store.id)}>
                        {store.status === 'active'
                          ? <><PowerOff className="w-4 h-4 mr-2" /> Desativar</>
                          : <><Power className="w-4 h-4 mr-2" /> Ativar</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteStore(store)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
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
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: ASMR Dreams" />
            </div>
            <div className="space-y-2">
              <Label>URL (opcional)</Label>
              <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="minha-loja.lovable.app" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Loja</Button>
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
              <Label>URL</Label>
              <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>Cancelar</Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={!!deleteStore} onOpenChange={o => !o && setDeleteStore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Loja</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteStore?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStore(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CEOLayout>
  );
};

export default CEOLojas;
