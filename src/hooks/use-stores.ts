import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StoreItem {
  id: string;
  name: string;
  url: string;
  slug: string | null;
  status: 'active' | 'inactive';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useStores() {
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StoreItem[];
    },
  });

  const createStore = useMutation({
    mutationFn: async (store: { name: string; url: string; slug?: string }) => {
      const { data, error } = await supabase
        .from('stores')
        .insert({ name: store.name, url: store.url, slug: store.slug || null } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Loja criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar loja'),
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; url?: string; status?: string; slug?: string }) => {
      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Loja atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar loja'),
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Loja removida!');
    },
    onError: () => toast.error('Erro ao remover loja'),
  });

  return { stores, isLoading, createStore, updateStore, deleteStore };
}
