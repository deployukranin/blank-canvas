import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

export type FeedPostType = 'announcement' | 'news' | 'exclusive';

export interface FeedPostRow {
  id: string;
  store_id: string | null;
  type: FeedPostType;
  title: string;
  content: string;
  is_pinned: boolean;
  author_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeedPosts() {
  const { store } = useTenant();
  const { user } = useAuth();
  const storeId = store?.id ?? null;
  const [posts, setPosts] = useState<FeedPostRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      let q = supabase
        .from('feed_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (storeId) q = q.eq('store_id', storeId);
      else q = q.is('store_id', null);
      const { data, error } = await q;
      if (error) throw error;
      setPosts((data || []) as FeedPostRow[]);
    } catch (e) {
      console.error('feed_posts load error', e);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async (input: { title: string; content: string; type: FeedPostType; is_pinned: boolean; }) => {
    const { data, error } = await supabase
      .from('feed_posts')
      .insert({ ...input, store_id: storeId, author_user_id: user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    setPosts((prev) => [data as FeedPostRow, ...prev]);
    return data as FeedPostRow;
  };

  const togglePin = async (id: string, next: boolean) => {
    const { error } = await supabase.from('feed_posts').update({ is_pinned: next }).eq('id', id);
    if (error) throw error;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, is_pinned: next } : p)));
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('feed_posts').delete().eq('id', id);
    if (error) throw error;
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return { posts, isLoading, refetch: fetchPosts, createPost, togglePin, deletePost };
}
