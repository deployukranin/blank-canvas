import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import SuperAdminLayout from './SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, ShieldAlert } from 'lucide-react';

type Row = {
  id: string;
  violated_directive: string | null;
  effective_directive: string | null;
  blocked_uri: string | null;
  document_uri: string | null;
  source_file: string | null;
  line_number: number | null;
  disposition: string | null;
  script_sample: string | null;
  user_agent: string | null;
  created_at: string;
};

type Period = '24h' | '7d' | '30d' | '90d' | 'all';

const PERIOD_HOURS: Record<Period, number | null> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  '90d': 24 * 90,
  all: null,
};

const SuperAdminCspReports: React.FC = () => {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [period, setPeriod] = React.useState<Period>('7d');
  const [directive, setDirective] = React.useState<string>('all');
  const [blocked, setBlocked] = React.useState('');
  const [page, setPage] = React.useState('');

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('csp_violations')
      .select('id, violated_directive, effective_directive, blocked_uri, document_uri, source_file, line_number, disposition, script_sample, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    const hours = PERIOD_HOURS[period];
    if (hours !== null) {
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      q = q.gte('created_at', since);
    }
    if (directive !== 'all') q = q.eq('violated_directive', directive);
    if (blocked.trim()) q = q.ilike('blocked_uri', `%${blocked.trim()}%`);
    if (page.trim()) q = q.ilike('document_uri', `%${page.trim()}%`);

    const { data, error } = await q;
    if (!error && data) setRows(data as Row[]);
    setLoading(false);
  }, [period, directive, blocked, page]);

  React.useEffect(() => { fetchRows(); }, [fetchRows]);

  const directives = React.useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.violated_directive && set.add(r.violated_directive));
    return Array.from(set).sort();
  }, [rows]);

  const aggByDirective = React.useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      const k = r.violated_directive || '—';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const aggByBlocked = React.useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      const k = r.blocked_uri || '—';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [rows]);

  const aggByPage = React.useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      const url = r.document_uri || '—';
      let path = url;
      try { path = new URL(url).pathname; } catch { /* keep raw */ }
      m.set(path, (m.get(path) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [rows]);

  return (
    <SuperAdminLayout title="CSP Violations">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-white/90 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Período</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                  <SelectItem value="all">Tudo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Diretiva violada</label>
              <Select value={directive} onValueChange={setDirective}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {directives.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Blocked URI contém</label>
              <Input value={blocked} onChange={(e) => setBlocked(e.target.value)} placeholder="ex: fonts.gstatic" className="bg-black/40 border-white/10 text-white/80" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Página contém</label>
              <Input value={page} onChange={(e) => setPage(e.target.value)} placeholder="ex: /admin" className="bg-black/40 border-white/10 text-white/80" />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchRows} disabled={loading} className="w-full gap-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white/50 font-normal">Total no período</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-semibold text-white">{rows.length}</p></CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white/50 font-normal">Diretivas únicas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-semibold text-white">{aggByDirective.length}</p></CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-white/50 font-normal">Blocked URIs únicos</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-semibold text-white">{new Set(rows.map((r) => r.blocked_uri)).size}</p></CardContent>
          </Card>
        </div>

        {/* Aggregations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader><CardTitle className="text-sm text-white/80">Por diretiva</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {aggByDirective.length === 0 && <p className="text-xs text-white/40">Sem dados</p>}
              {aggByDirective.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/70 truncate mr-2">{k}</span>
                  <span className="text-purple-300 font-mono">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader><CardTitle className="text-sm text-white/80">Top 10 Blocked URI</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {aggByBlocked.length === 0 && <p className="text-xs text-white/40">Sem dados</p>}
              {aggByBlocked.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/70 truncate mr-2" title={k}>{k}</span>
                  <span className="text-purple-300 font-mono">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader><CardTitle className="text-sm text-white/80">Top 10 páginas</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {aggByPage.length === 0 && <p className="text-xs text-white/40">Sem dados</p>}
              {aggByPage.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/70 truncate mr-2" title={k}>{k}</span>
                  <span className="text-purple-300 font-mono">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Raw table */}
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader><CardTitle className="text-sm text-white/80">Últimas violações ({rows.length})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-white/50 text-xs">Quando</TableHead>
                  <TableHead className="text-white/50 text-xs">Diretiva</TableHead>
                  <TableHead className="text-white/50 text-xs">Blocked URI</TableHead>
                  <TableHead className="text-white/50 text-xs">Página</TableHead>
                  <TableHead className="text-white/50 text-xs">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={5} className="text-center text-white/40 py-8">Nenhuma violação no período.</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-white/60 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-purple-300 text-xs font-mono">{r.violated_directive || '—'}</TableCell>
                    <TableCell className="text-white/80 text-xs max-w-xs truncate" title={r.blocked_uri || ''}>{r.blocked_uri || '—'}</TableCell>
                    <TableCell className="text-white/70 text-xs max-w-xs truncate" title={r.document_uri || ''}>{r.document_uri || '—'}</TableCell>
                    <TableCell className="text-white/50 text-xs max-w-xs truncate" title={r.source_file || ''}>
                      {r.source_file || '—'}{r.line_number ? `:${r.line_number}` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminCspReports;
