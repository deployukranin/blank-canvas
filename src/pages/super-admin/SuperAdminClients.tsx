import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Store, Users, Search, Mail, Copy, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
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
interface StoreRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_type: string;
  owner_email: string | null;
  client_count: number;
}
interface StoreClientsState {
  clients: ClientRow[];
  page: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
}

const PAGE_SIZE = 50;

const SuperAdminClients: React.FC = () => {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [clientState, setClientState] = useState<Record<string, StoreClientsState>>({});

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke('super-admin-list-clients', {
        body: { mode: 'stores' },
      });
      if (error) throw error;
      if (resp?.error) throw new Error(resp.error);
      setStores((resp?.stores as StoreRow[]) || []);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStores(); }, [loadStores]);

  const loadClients = useCallback(async (storeId: string, page: number, append: boolean) => {
    setClientState((prev) => ({
      ...prev,
      [storeId]: {
        clients: prev[storeId]?.clients || [],
        page: prev[storeId]?.page || 0,
        total: prev[storeId]?.total || 0,
        hasMore: prev[storeId]?.hasMore || false,
        loading: true,
      },
    }));
    try {
      const { data: resp, error } = await supabase.functions.invoke('super-admin-list-clients', {
        body: { mode: 'clients', store_id: storeId, page, page_size: PAGE_SIZE },
      });
      if (error) throw error;
      if (resp?.error) throw new Error(resp.error);
      setClientState((prev) => {
        const existing = prev[storeId]?.clients || [];
        const incoming = (resp?.clients as ClientRow[]) || [];
        return {
          ...prev,
          [storeId]: {
            clients: append ? [...existing, ...incoming] : incoming,
            page: resp?.page || page,
            total: resp?.total || 0,
            hasMore: !!resp?.has_more,
            loading: false,
          },
        };
      });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar clientes');
      setClientState((prev) => ({
        ...prev,
        [storeId]: { ...(prev[storeId] || { clients: [], page: 0, total: 0, hasMore: false }), loading: false },
      }));
    }
  }, []);

  const toggle = (storeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
        if (!clientState[storeId]) loadClients(storeId, 1, false);
      }
      return next;
    });
  };

  const [copyingStore, setCopyingStore] = useState<string | null>(null);
  const [copyProgress, setCopyProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [copyFilter, setCopyFilter] = useState<'active' | 'all' | 'banned'>('active');

  const filterLabel = copyFilter === 'active' ? 'ativos' : copyFilter === 'banned' ? 'banidos' : 'todos';

  const copyAllEmails = async (store: StoreRow) => {
    if (store.client_count === 0) {
      toast.info('Loja sem clientes');
      return;
    }
    setCopyingStore(store.id);
    setCopyProgress({ loaded: 0, total: store.client_count });
    const toastId = toast.loading(`Carregando 0/${store.client_count} emails (${filterLabel})...`);
    try {
      const all: string[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const { data: resp, error } = await supabase.functions.invoke('super-admin-list-clients', {
          body: { mode: 'clients', store_id: store.id, page, page_size: 200 },
        });
        if (error) throw error;
        if (resp?.error) throw new Error(resp.error);
        const incoming = (resp?.clients as ClientRow[]) || [];
        for (const c of incoming) {
          if (!c.email || c.email === '(desconhecido)') continue;
          if (copyFilter === 'active' && c.banned) continue;
          if (copyFilter === 'banned' && !c.banned) continue;
          all.push(c.email);
        }
        hasMore = !!resp?.has_more;
        page++;
        setCopyProgress({ loaded: all.length, total: resp?.total || store.client_count });
        toast.loading(`Carregando ${all.length}/${resp?.total || store.client_count} emails (${filterLabel})...`, { id: toastId });
        if (page > 500) break;
      }
      if (!all.length) {
        toast.error(`Nenhum email ${filterLabel} disponível`, { id: toastId });
        return;
      }
      await navigator.clipboard.writeText(all.join(', '));
      toast.success(`${all.length} email(s) ${filterLabel} copiado(s)`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao copiar emails', { id: toastId });
    } finally {
      setCopyingStore(null);
      setCopyProgress(null);
    }
  };

  const filteredStores = useMemo(() => {
    if (!search) return stores;
    const q = search.toLowerCase();
    return stores.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.slug?.toLowerCase().includes(q) ||
      s.owner_email?.toLowerCase().includes(q),
    );
  }, [stores, search]);

  const totalClients = stores.reduce((a, s) => a + s.client_count, 0);

  return (
    <SuperAdminLayout title="Clientes por Loja">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold">{stores.length}</p>
            <p className="text-xs text-muted-foreground">Lojas</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{totalClients}</p>
            <p className="text-xs text-muted-foreground">Clientes totais</p>
          </GlassCard>
          <GlassCard className="p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-green-400">
              {stores.filter((s) => s.client_count > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Lojas com clientes</p>
          </GlassCard>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por loja, slug ou email do dono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 rounded-md border border-input p-1 bg-background" title="Filtro do botão 'Copiar todos'">
            {([
              { v: 'active', l: 'Ativos' },
              { v: 'all', l: 'Todos' },
              { v: 'banned', l: 'Banidos' },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setCopyFilter(opt.v)}
                className={`px-3 h-8 text-xs rounded transition ${
                  copyFilter === opt.v
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando lojas...
          </p>
        ) : filteredStores.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma loja encontrada</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredStores.map((s) => {
              const isOpen = expanded.has(s.id);
              const state = clientState[s.id];
              const emails = state?.clients.map((c) => c.email) || [];
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
                          <Users className="w-3 h-3" /> {s.client_count} clientes
                        </span>
                        {s.owner_email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" /> dono: {s.owner_email}
                          </span>
                        )}
                      </div>
                    </div>
                    {s.client_count > 0 && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-disabled={copyingStore === s.id}
                        onClick={(e) => { e.stopPropagation(); if (copyingStore !== s.id) copyAllEmails(s); }}
                        className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-md text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        {copyingStore === s.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {copyProgress ? `${copyProgress.loaded}/${copyProgress.total}` : 'Carregando...'}
                          </>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copiar {filterLabel} ({s.client_count})</>
                        )}
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {!state || state.loading && state.clients.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Carregando clientes...
                        </p>
                      ) : state.clients.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
                      ) : (
                        <>
                          {state.clients.map((c) => (
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
                          ))}
                          <div className="p-3 flex items-center justify-between gap-2 bg-white/[0.02]">
                            <p className="text-xs text-muted-foreground">
                              {state.clients.length} de {state.total}
                            </p>
                            {state.hasMore && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={state.loading}
                                onClick={() => loadClients(s.id, state.page + 1, true)}
                              >
                                {state.loading ? (
                                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Carregando</>
                                ) : (
                                  <>Carregar mais {Math.min(PAGE_SIZE, state.total - state.clients.length)}</>
                                )}
                              </Button>
                            )}
                          </div>
                        </>
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
