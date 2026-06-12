import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, MousePointerClick, Users, Store, Percent, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardData {
  ok: boolean;
  tracker: { name: string; is_active: boolean };
  totals: {
    clicks: number;
    unique_clicks: number;
    conversions: number;
    store_conversions: number;
    client_conversions: number;
    conversion_rate: number;
  };
  links: Array<{
    id: string; code: string; label: string; channel: string;
    clicks: number; unique_clicks: number; conversions: number; conversion_rate: number;
  }>;
  channels: Array<{ channel: string; clicks: number; conversions: number; conversion_rate: number }>;
  series: Array<{ date: string; clicks: number; conversions: number }>;
  signups: Array<{ type: string; email: string | null; name: string | null; occurred_at: string; channel: string; link_label: string }>;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const Stat = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
      <Icon className="w-4 h-4" /> {label}
    </div>
    <div className="text-2xl font-semibold text-white">{value}</div>
    {hint && <div className="text-xs text-white/40 mt-1">{hint}</div>}
  </div>
);

const TrackDashboard = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: res, error: err } = await supabase.functions.invoke("tracker-dashboard", {
          body: { token },
        });
        if (err) throw err;
        if (!res?.ok) throw new Error(res?.error || "not found");
        setData(res as DashboardData);
      } catch (e: any) {
        setError(e.message || "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Dashboard não encontrado</h1>
          <p className="text-white/50 text-sm">Verifique o link de acesso.</p>
        </div>
      </div>
    );
  }

  const maxSeries = Math.max(1, ...data.series.map((s) => Math.max(s.clicks, s.conversions)));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Dashboard de Tracking</p>
            <h1 className="text-xl font-semibold">{data.tracker.name}</h1>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full border ${data.tracker.is_active ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-white/20 text-white/50"}`}>
            {data.tracker.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Stat icon={MousePointerClick} label="Cliques" value={String(data.totals.clicks)} hint={`${data.totals.unique_clicks} únicos`} />
          <Stat icon={TrendingUp} label="Conversões" value={String(data.totals.conversions)} />
          <Stat icon={Store} label="Lojas" value={String(data.totals.store_conversions)} />
          <Stat icon={Users} label="Clientes" value={String(data.totals.client_conversions)} />
          <Stat icon={Percent} label="Taxa de conversão" value={pct(data.totals.conversion_rate)} />
        </div>

        {/* Timeseries */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
          <h2 className="text-sm font-medium text-white/70 mb-4">Últimos 30 dias</h2>
          <div className="flex items-end gap-1 h-40">
            {data.series.map((s) => (
              <div key={s.date} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                <div className="w-full bg-white/15 rounded-sm" style={{ height: `${(s.clicks / maxSeries) * 100}%` }} />
                <div className="w-full bg-emerald-500/60 rounded-sm" style={{ height: `${(s.conversions / maxSeries) * 100}%` }} />
                <div className="absolute -top-8 hidden group-hover:block bg-black border border-white/10 rounded px-2 py-1 text-[10px] whitespace-nowrap z-10">
                  {fmtDate(s.date)} · {s.clicks} cliques · {s.conversions} conv
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-white/40">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white/15 rounded-sm inline-block" /> Cliques</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500/60 rounded-sm inline-block" /> Conversões</span>
          </div>
        </section>

        {/* Channels */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">Por canal</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Canal</th>
                  <th className="text-right px-4 py-3">Cliques</th>
                  <th className="text-right px-4 py-3">Conversões</th>
                  <th className="text-right px-4 py-3">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((c) => (
                  <tr key={c.channel} className="border-t border-white/5">
                    <td className="px-4 py-3 capitalize">{c.channel}</td>
                    <td className="px-4 py-3 text-right">{c.clicks}</td>
                    <td className="px-4 py-3 text-right">{c.conversions}</td>
                    <td className="px-4 py-3 text-right">{pct(c.conversion_rate)}</td>
                  </tr>
                ))}
                {!data.channels.length && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40">Sem dados ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Links */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">Por link</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Link</th>
                  <th className="text-left px-4 py-3">Canal</th>
                  <th className="text-right px-4 py-3">Cliques</th>
                  <th className="text-right px-4 py-3">Únicos</th>
                  <th className="text-right px-4 py-3">Conv.</th>
                  <th className="text-right px-4 py-3">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {data.links.map((l) => (
                  <tr key={l.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{l.label}</td>
                    <td className="px-4 py-3 capitalize text-white/60">{l.channel}</td>
                    <td className="px-4 py-3 text-right">{l.clicks}</td>
                    <td className="px-4 py-3 text-right">{l.unique_clicks}</td>
                    <td className="px-4 py-3 text-right">{l.conversions}</td>
                    <td className="px-4 py-3 text-right">{pct(l.conversion_rate)}</td>
                  </tr>
                ))}
                {!data.links.length && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-white/40">Nenhum link criado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Signups */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">Cadastros ({data.signups.length})</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Canal</th>
                  <th className="text-right px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.signups.map((s, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.type === "store_signup" ? "bg-purple-500/15 text-purple-300" : "bg-sky-500/15 text-sky-300"}`}>
                        {s.type === "store_signup" ? "Loja" : "Cliente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/80">{s.name || "—"}</td>
                    <td className="px-4 py-3 text-white/60">{s.email || "—"}</td>
                    <td className="px-4 py-3 capitalize text-white/60">{s.channel}</td>
                    <td className="px-4 py-3 text-right text-white/50">{fmtDate(s.occurred_at)}</td>
                  </tr>
                ))}
                {!data.signups.length && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-white/40">Nenhum cadastro ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TrackDashboard;
