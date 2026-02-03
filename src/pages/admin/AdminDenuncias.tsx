import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Eye, Trash2, Users, MessageCircle, Lightbulb } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAdminReports, AdminReport } from '@/lib/admin-mock-data';
import { getCommunityReports, updateReportStatus, type CommunityReport } from '@/lib/community-reports';

const AdminDenuncias: React.FC = () => {
  const [reports, setReports] = useState<AdminReport[]>(mockAdminReports);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed' | 'action_taken'>('all');
  const [activeTab, setActiveTab] = useState('community');

  useEffect(() => {
    setCommunityReports(getCommunityReports());
  }, []);

  const filteredReports = reports.filter(report => filter === 'all' || report.status === filter);
  const filteredCommunityReports = communityReports.filter(report => filter === 'all' || report.status === filter);

  const handleStatusChange = (id: string, newStatus: AdminReport['status']) => {
    setReports(reports.map(report => report.id === id ? { ...report, status: newStatus } : report));
  };

  const handleCommunityStatusChange = (id: string, newStatus: CommunityReport['status']) => {
    updateReportStatus(id, newStatus);
    setCommunityReports(prev => prev.map(report => report.id === id ? { ...report, status: newStatus } : report));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
      case 'reviewed': return <Badge className="bg-blue-500/20 text-blue-400">Revisado</Badge>;
      case 'dismissed': return <Badge className="bg-muted text-muted-foreground">Descartado</Badge>;
      case 'action_taken': return <Badge className="bg-green-500/20 text-green-400">Ação Tomada</Badge>;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pendingCommunityCount = communityReports.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout title="Gerenciar Denúncias">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-xl font-bold">{pendingCommunityCount}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-xl font-bold">{communityReports.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-400 mb-2" />
            <p className="text-xl font-bold">{communityReports.filter(r => r.status === 'action_taken').length}</p>
            <p className="text-xs text-muted-foreground">Ação Tomada</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-xl font-bold">{communityReports.filter(r => r.status === 'dismissed').length}</p>
            <p className="text-xs text-muted-foreground">Descartados</p>
          </GlassCard>
        </div>

        <GlassCard className="p-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'reviewed', 'dismissed', 'action_taken'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : f === 'reviewed' ? 'Revisadas' : f === 'dismissed' ? 'Descartadas' : 'Ação Tomada'}
              </Button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          {filteredCommunityReports.map((report, index) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <GlassCard className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {report.type === 'idea' ? <Lightbulb className="w-4 h-4 text-accent" /> : <MessageCircle className="w-4 h-4 text-blue-400" />}
                      <Badge variant="outline">{report.type === 'idea' ? 'Ideia' : 'Comentário'}</Badge>
                      {getStatusBadge(report.status)}
                    </div>
                    <h3 className="font-semibold mb-2">"{report.contentTitle}"</h3>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-2">
                      <p className="text-sm"><span className="font-medium text-red-400">Motivo:</span> {report.reason}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Autor: @{report.contentAuthor} • Por: @{report.reporterUsername} • {formatDate(report.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleCommunityStatusChange(report.id, 'action_taken')}><Trash2 className="w-4 h-4 mr-1" />Remover</Button>
                        <Button size="sm" variant="outline" onClick={() => handleCommunityStatusChange(report.id, 'dismissed')}><XCircle className="w-4 h-4 mr-1" />Descartar</Button>
                      </>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {filteredCommunityReports.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma denúncia encontrada</p>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDenuncias;
