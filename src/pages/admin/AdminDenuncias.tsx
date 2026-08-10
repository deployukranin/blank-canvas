import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Trash2, Users, MessageCircle, Lightbulb, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { reportReasonLabel } from '@/lib/report-reasons';

type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

interface ContentReportRow {
  id: string;
  store_id: string | null;
  target_type: string;
  target_id: string;
  target_title: string | null;
  target_author: string | null;
  reason_code: string;
  detail: string | null;
  status: string;
  created_at: string;
}

const STATUSES: ReportStatus[] = ['pending', 'reviewed', 'dismissed', 'action_taken'];

const AdminDenuncias: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { store } = useTenant();
  const { toast } = useToast();
  const [reports, setReports] = useState<ContentReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('content_reports')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
    }
    setReports((data || []) as ContentReportRow[]);
    setLoading(false);
  }, [store?.id, t, toast]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: ReportStatus) => {
    const { error } = await supabase.from('content_reports').update({ status }).eq('id', id);
    if (error) {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
      return;
    }
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  const filtered = useMemo(
    () => reports.filter(r => filter === 'all' || r.status === filter),
    [reports, filter],
  );

  const statusLabels: Record<string, string> = {
    pending: t('reports.pending', 'Pending'),
    reviewed: t('reports.reviewed', 'Reviewed'),
    dismissed: t('reports.dismissed', 'Dismissed'),
    action_taken: t('reports.actionTaken', 'Action Taken'),
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      reviewed: 'bg-blue-500/20 text-blue-400',
      dismissed: 'bg-muted text-muted-foreground',
      action_taken: 'bg-green-500/20 text-green-400',
    };
    return <Badge className={map[status] || map.dismissed}>{statusLabels[status] || status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const loc = i18n.language?.startsWith('pt') ? 'pt-BR' : i18n.language?.startsWith('es') ? 'es' : 'en-US';
    return new Date(dateString).toLocaleString(loc, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout title={t('reports.title', 'Manage Reports')}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{statusLabels.pending}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-xl font-bold">{reports.length}</p>
            <p className="text-xs text-muted-foreground">{t('superAdmin.total', 'Total')}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-400 mb-2" />
            <p className="text-xl font-bold">{reports.filter(r => r.status === 'action_taken').length}</p>
            <p className="text-xs text-muted-foreground">{statusLabels.action_taken}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-xl font-bold">{reports.filter(r => r.status === 'dismissed').length}</p>
            <p className="text-xs text-muted-foreground">{statusLabels.dismissed}</p>
          </GlassCard>
        </div>

        <GlassCard className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
              {t('common.all', 'All')}
            </Button>
            {STATUSES.map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                {statusLabels[f]}
              </Button>
            ))}
          </div>
        </GlassCard>

        {loading && (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        )}

        <div className="space-y-4">
          {filtered.map((report, index) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.3) }}>
              <GlassCard className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {report.target_type === 'idea'
                        ? <Lightbulb className="w-4 h-4 text-accent" />
                        : <MessageCircle className="w-4 h-4 text-blue-400" />}
                      <Badge variant="outline">
                        {report.target_type === 'idea' ? t('reports.idea', 'Idea') : t('reports.comment', 'Comment')}
                      </Badge>
                      {getStatusBadge(report.status)}
                    </div>
                    {report.target_title && <h3 className="font-semibold mb-2 break-words">"{report.target_title}"</h3>}
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-2">
                      <p className="text-sm">
                        <span className="font-medium text-red-400">{t('reports.reason', 'Reason')}:</span>{' '}
                        {reportReasonLabel(report.reason_code, t)}
                        {report.detail ? ` — ${report.detail}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {report.target_author ? `${t('reports.author', 'Author')}: ${report.target_author} • ` : ''}
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => setStatus(report.id, 'action_taken')}>
                          <Trash2 className="w-4 h-4 mr-1" />{t('reports.remove', 'Remove')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(report.id, 'reviewed')}>
                          <CheckCircle className="w-4 h-4 mr-1" />{statusLabels.reviewed}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(report.id, 'dismissed')}>
                          <XCircle className="w-4 h-4 mr-1" />{t('reports.dismiss', 'Dismiss')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{t('reports.noReports', 'No reports found')}</p>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDenuncias;
