import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, AlertTriangle, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { bugCategoryLabel } from '@/lib/report-reasons';

type BugStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';

interface BugRow {
  id: string;
  store_id: string | null;
  user_id: string | null;
  category: string;
  severity: string;
  description: string | null;
  route: string | null;
  user_agent: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const STATUSES: BugStatus[] = ['open', 'in_review', 'resolved', 'dismissed'];

const SuperAdminBugs: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<BugRow[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | BugStatus>('all');
  const [query, setQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      toast({ title: t('bugs.loadError', 'Could not load bug reports'), description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const list = (data || []) as BugRow[];
    setRows(list);

    const ids = [...new Set(list.map(r => r.store_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: stores } = await supabase.from('stores').select('id, name').in('id', ids);
      setStoreNames(Object.fromEntries((stores || []).map(s => [s.id, s.name])));
    }
    setLoading(false);
  }, [t, toast]);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, patch: Partial<Pick<BugRow, 'status' | 'admin_note'>>) => {
    const { error } = await supabase.from('bug_reports').update(patch).eq('id', id);
    if (error) {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
      return;
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return [r.description, r.route, r.category, storeNames[r.store_id || '']]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }, [rows, filter, query, storeNames]);

  const counts = useMemo(() => ({
    open: rows.filter(r => r.status === 'open').length,
    in_review: rows.filter(r => r.status === 'in_review').length,
    resolved: rows.filter(r => r.status === 'resolved').length,
    dismissed: rows.filter(r => r.status === 'dismissed').length,
  }), [rows]);

  const statusLabel = (s: string) => t(`bugs.status.${s}`, s);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      open: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
      in_review: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
      resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
      dismissed: 'bg-white/5 text-white/50 border-white/10',
    };
    return <Badge className={`border ${map[s] || map.dismissed}`}>{statusLabel(s)}</Badge>;
  };

  const severityBadge = (s: string) => {
    const map: Record<string, string> = {
      high: 'bg-red-500/15 text-red-300 border-red-500/25',
      medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
      low: 'bg-white/5 text-white/60 border-white/10',
    };
    return <Badge className={`border ${map[s] || map.low}`}>{t(`bugs.sev.${s}`, s)}</Badge>;
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString(i18n.language?.startsWith('pt') ? 'pt-BR' : i18n.language?.startsWith('es') ? 'es' : 'en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <SuperAdminLayout title={t('bugs.pageTitle', 'Bug reports')}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([['open', AlertTriangle], ['in_review', Bug], ['resolved', CheckCircle2], ['dismissed', XCircle]] as const).map(([key, Icon]) => (
            <GlassCard key={key} className="p-4">
              <Icon className="w-5 h-5 mb-2 text-white/60" />
              <p className="text-2xl font-bold text-white">{counts[key]}</p>
              <p className="text-xs text-white/50">{statusLabel(key)}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
              {t('common.all', 'All')}
            </Button>
            {STATUSES.map(s => (
              <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>
                {statusLabel(s)}
              </Button>
            ))}
          </div>
          <div className="lg:ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.search', 'Search')}
              className="h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 w-full lg:w-64"
            />
          </div>
        </GlassCard>

        {loading && (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>
        )}

        {!loading && filtered.length === 0 && (
          <GlassCard className="p-10 text-center">
            <Bug className="w-8 h-8 mx-auto mb-3 text-white/30" />
            <p className="text-white/50">{t('bugs.empty', 'No bug reports yet')}</p>
          </GlassCard>
        )}

        <div className="space-y-3">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
              <GlassCard className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline">{bugCategoryLabel(r.category, t)}</Badge>
                      {severityBadge(r.severity)}
                      {statusBadge(r.status)}
                      {r.store_id && (
                        <span className="text-xs text-white/40">{storeNames[r.store_id] || r.store_id.slice(0, 8)}</span>
                      )}
                    </div>
                    {r.description && <p className="text-sm text-white/80 mb-2 whitespace-pre-wrap break-words">{r.description}</p>}
                    <p className="text-xs text-white/40 break-all">
                      {r.route} • {fmt(r.created_at)}
                    </p>
                    <div className="mt-3">
                      <Textarea
                        rows={2}
                        placeholder={t('bugs.adminNote', 'Internal note')}
                        value={noteDraft[r.id] ?? r.admin_note ?? ''}
                        onChange={(e) => setNoteDraft(prev => ({ ...prev, [r.id]: e.target.value }))}
                        onBlur={() => {
                          const value = noteDraft[r.id];
                          if (value !== undefined && value !== (r.admin_note ?? '')) update(r.id, { admin_note: value });
                        }}
                        className="bg-white/5 border-white/10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2 flex-wrap">
                    {STATUSES.filter(s => s !== r.status).map(s => (
                      <Button key={s} size="sm" variant="outline" onClick={() => update(r.id, { status: s })}>
                        {statusLabel(s)}
                      </Button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBugs;
