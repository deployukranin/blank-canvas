import React, { useEffect, useState, useCallback } from 'react';
import { Store, Users, Search, Mail, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ClientRow {
  user_id: string;
  email: string;
  joined_at: string;
  banned: boolean;
}
interface StoreClients {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_type: string;
  owner_email: string | null;
  clients: ClientRow[];
}

const SuperAdminClients: React.FC = () => {
  const [data, setData] = useState<StoreClients[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke('super-admin-list-clients', { body: {} });
      if (error) throw error;
      if (resp?.error) throw new Error(resp.error);
      setData((resp?.stores as StoreClients[]) || []);
      // expand all by default
      setExpanded(new Set((resp?.stores || []).map((s: StoreClients) => s.id)));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyAll = (emails: string[]) => {
    if (!emails.length) return;
    navigator.clipboard.writeText(emails.join(', '));
    toast.success(`${emails.length} email(s) copiado(s)`);
  };

  const filtered = data
    .map((s) => {
      if (!search) return s;
      const q = search.toLowerCase();
      const matchStore = s.name.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q);
      const matchedClients = s.clients.filter((c) => c.email.toLowerCase().includes(q));
      if (matchStore) return s;
      if (matchedClients.length) return { ...s, clients: matchedClients };
      return null;
    })
    .filter(Boolean) as StoreClients[];

  const totalClients = data.reduce((a, s) => a + s.clients.length, 0);

  return (
    <SuperAdminLayout title="Clientes por Loja">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold">{data.length}</p>
            <p className="text-xs text-muted-foreground">Lojas</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{totalClients}</p>
            <p className="text-xs text-muted-foreground">Clientes totais</p>
          </GlassCard>
          <GlassCard className="p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-green-400">
              {data.filter((s) => s.clients.length > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Lojas com clientes</p>
          </GlassCard>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por loja, slug ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum resultado</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const isOpen = expanded.has(s.id);
              const emails = s.clients.map((c) => c.email);
              return (
                <GlassCard key={s.id} className="overflow-hidden">
                  <button
                    onClick={() => toggle(s.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{s.name}</h4>
                        {s.slug && <span className="text-xs text-muted-foreground">/{s.slug}</span>}
                        <Badge variant="outline" className="text-[10px]">{s.plan_type}</Badge>
                        <Badge
                          variant={s.status === 'active' ? 'default' : 'destructive'}
                          className="text-[10px]"
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {s.clients.length} clientes
                        </span>
                        {s.owner_email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" /> dono: {s.owner_email}
                          </span>
                        )}
                      </div>
                    </div>
                    {s.clients.length > 0 && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); copyAll(emails); }}
                        className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-md text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copiar emails
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {s.clients.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
                      ) : (
                        s.clients.map((c) => (
                          <div key={c.user_id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.02]">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{c.email}</p>
                              <p className="text-[11px] text-muted-foreground">
                                desde {new Date(c.joined_at).toLocaleDateString('pt-BR')}
                                {c.banned && <span className="ml-2 text-red-400">banido</span>}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(c.email);
                                toast.success('Email copiado');
                              }}
                            >
                              <Copy className="w-3 h-3" />
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
    </SuperAdminLayout>
  );
};

export default SuperAdminClients;
