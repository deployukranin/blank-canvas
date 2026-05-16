import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users, Trash2, ChevronDown, ChevronRight, Loader2, Store, Plus, X, KeyRound } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PartnerStore { id: string; name: string; slug: string | null; plan_type: string; status: string }
interface Partner {
  user_id: string;
  email: string;
  created_at: string;
  store_count: number;
  stores: PartnerStore[];
  revenue_cents: number;
}
interface AvailableStore { id: string; name: string; slug: string | null; plan_type: string; status: string }

const fmtBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const SuperAdminPartners: React.FC = () => {
  const { t } = useTranslation();
  const tp = (k: string, opts?: any) => t(`superAdmin.partners.${k}`, opts as any) as string;
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPwd, setCreatePwd] = useState('');
  const [creating, setCreating] = useState(false);

  const [assignTo, setAssignTo] = useState<string | null>(null); // partner_id receiving the store
  const [availableStores, setAvailableStores] = useState<AvailableStore[]>([]);
  const [resetFor, setResetFor] = useState<Partner | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetting, setResetting] = useState(false);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-partners', {
        body: { action: 'list' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPartners(data?.partners || []);
    } catch (e: any) {
      toast.error(e.message || tp('loadErr'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createEmail)) { toast.error(tp('invalidEmail')); return; }
    if (createPwd.length < 8) { toast.error(tp('pwdTooShort')); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-partners', {
        body: { action: 'create', email: createEmail.trim(), password: createPwd },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(tp('created'));
      setCreateOpen(false); setCreateEmail(''); setCreatePwd('');
      load();
    } catch (e: any) {
      toast.error(e.message || tp('createErr'));
    } finally { setCreating(false); }
  };

  const handleDelete = async (p: Partner) => {
    if (!confirm(`Excluir parceiro ${p.email}? Todas as lojas atribuídas serão desvinculadas.`)) return;
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-partners', {
        body: { action: 'delete', user_id: p.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Parceiro removido');
      load();
    } catch (e: any) { toast.error(e.message || 'Erro ao remover'); }
  };

  const handleResetPassword = async () => {
    if (!resetFor) return;
    if (resetPwd.length < 8) { toast.error('Senha deve ter ao menos 8 caracteres'); return; }
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-partners', {
        body: { action: 'reset_password', user_id: resetFor.user_id, password: resetPwd },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Senha redefinida');
      setResetFor(null); setResetPwd('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao resetar senha');
    } finally { setResetting(false); }
  };

  const openAssign = async (partnerId: string) => {
    setAssignTo(partnerId);
    setLoadingAvail(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-partners', {
        body: { action: 'available_stores' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAvailableStores(data?.stores || []);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar lojas');
    } finally { setLoadingAvail(false); }
  };

  const assignStore = async (storeId: string) => {
    if (!assignTo) return;
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-partners', {
        body: { action: 'assign', store_id: storeId, partner_id: assignTo },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Loja atribuída');
      setAssignTo(null);
      load();
    } catch (e: any) { toast.error(e.message || 'Erro ao atribuir'); }
  };

  const unassign = async (storeId: string) => {
    if (!confirm('Desvincular loja deste parceiro?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-partners', {
        body: { action: 'unassign', store_id: storeId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Loja desvinculada');
      load();
    } catch (e: any) { toast.error(e.message || 'Erro'); }
  };

  const totalRevenue = partners.reduce((a, p) => a + p.revenue_cents, 0);
  const totalAssigned = partners.reduce((a, p) => a + p.store_count, 0);

  return (
    <SuperAdminLayout title="Parceiros">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold">{partners.length}</p>
              <p className="text-xs text-muted-foreground">Parceiros</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{totalAssigned}</p>
              <p className="text-xs text-muted-foreground">Lojas atribuídas</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{fmtBRL(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Receita atual</p>
            </GlassCard>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <UserPlus className="w-4 h-4" /> Novo parceiro
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
        ) : partners.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum parceiro cadastrado</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {partners.map((p) => {
              const isOpen = expanded.has(p.user_id);
              return (
                <GlassCard key={p.user_id} className="overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => setExpanded((prev) => {
                        const n = new Set(prev);
                        n.has(p.user_id) ? n.delete(p.user_id) : n.add(p.user_id);
                        return n;
                      })}
                      className="shrink-0"
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.email}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {p.store_count} lojas</span>
                        <span className="text-green-400">{fmtBRL(p.revenue_cents)}/mês</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openAssign(p.user_id)} className="gap-1">
                      <Plus className="w-3 h-3" /> Atribuir loja
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setResetFor(p); setResetPwd(''); }} className="gap-1">
                      <KeyRound className="w-3 h-3" /> Senha
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-white/5">
                      {p.stores.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Nenhuma loja atribuída.</p>
                      ) : (
                        p.stores.map((s) => (
                          <div key={s.id} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                            <div className="min-w-0">
                              <p className="text-sm truncate">{s.name} <span className="text-xs text-muted-foreground">/{s.slug}</span></p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{s.plan_type}</Badge>
                                <Badge variant={s.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">{s.status}</Badge>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => unassign(s.id)} className="text-red-400 hover:text-red-300 h-7 px-2">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo parceiro</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="parceiro@exemplo.com" />
            </div>
            <div>
              <Label>Senha temporária</Label>
              <Input type="text" value={createPwd} onChange={(e) => setCreatePwd(e.target.value)} placeholder="mínimo 8 caracteres" />
              <p className="text-[11px] text-muted-foreground mt-1">O parceiro deve trocar essa senha no primeiro login.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating} className="bg-purple-600 hover:bg-purple-700">
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign store dialog */}
      <Dialog open={!!assignTo} onOpenChange={(o) => { if (!o) setAssignTo(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Atribuir loja ao parceiro</DialogTitle></DialogHeader>
          {loadingAvail ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
          ) : availableStores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma loja disponível (todas já têm parceiro).</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {availableStores.map((s) => (
                <button key={s.id} onClick={() => assignStore(s.id)} className="w-full text-left px-3 py-2 rounded hover:bg-accent flex items-center justify-between">
                  <span className="truncate">{s.name} <span className="text-xs text-muted-foreground">/{s.slug}</span></span>
                  <Badge variant="outline" className="text-[10px]">{s.plan_type}</Badge>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Reset password dialog */}
      <Dialog open={!!resetFor} onOpenChange={(o) => { if (!o) { setResetFor(null); setResetPwd(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Parceiro: <span className="text-foreground">{resetFor?.email}</span></p>
            <div>
              <Label>Nova senha</Label>
              <Input type="text" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} placeholder="mínimo 8 caracteres" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetFor(null); setResetPwd(''); }}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resetting} className="bg-purple-600 hover:bg-purple-700">
              {resetting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Redefinir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SuperAdminLayout>
  );
};

export default SuperAdminPartners;
