import React, { useCallback, useEffect, useState } from "react";
import {
  Loader2, MousePointerClick, Users, Store, Percent, TrendingUp,
  Copy, Link2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "./SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardData {
  ok: boolean;
  tracker: { name: string; is_active: boolean };
  totals: {
    clicks: number; unique_clicks: number; conversions: number;
    store_conversions: number; client_conversions: number; conversion_rate: number;
  };
  links: Array<{
    id: string; code: string; label: string; channel: string;
    clicks: number; unique_clicks: number; conversions: number; conversion_rate: number;
  }>;
  channels: Array<{ channel: string; clicks: number; conversions: number; conversion_rate: number }>;
  series: Array<{ date: string; clicks: number; conversions: number }>;
  signups: Array<{ type: string; email: string | null; name: string | null; occurred_at: string; channel: string; link_label: string }>;
}

interface TrackerRow { id: string; name: string; }
interface LinkRow { id: string; tracker_id: string; code: string; label: string; channel: string; destination: string; is_active: boolean; }

const CHANNELS = ["ads", "email", "dm", "organic", "influencer", "other"];
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const randCode = (n = 6) =>
  Array.from({ length: n }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 24);

const Stat = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
      <Icon className="w-4 h-4" /> {label}
    </div>
    <div className="text-2xl font-semibold text-white">{value}</div>
    {hint && <div className="text-xs text-white/40 mt-1">{hint}</div>}
  </div>
);

const TrackerDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tracker, setTracker] = useState<TrackerRow | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const loadMetrics = useCallback(async () => {
    const { data: res } = await supabase.functions.invoke("tracker-dashboard", { body: {} });
    if (res?.ok) setData(res as DashboardData);
  }, []);

  const loadLinks = useCallback(async () => {
    const { data: tr } = await supabase
      .from("trackers").select("id,name").eq("owner_user_id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle();
    if (tr) {
      setTracker(tr as TrackerRow);
      const { data: ls } = await supabase
        .from("tracker_links").select("*").eq("tracker_id", tr.id).order("created_at", { ascending: false });
      setLinks((ls as LinkRow[]) || []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadMetrics(), loadLinks()]);
      setLoading(false);
    })();
  }, [loadMetrics, loadLinks]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Tracking">
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
      </SuperAdminLayout>
    );
  }

  const maxSeries = Math.max(1, ...(data?.series || []).map((s) => Math.max(s.clicks, s.conversions)));

  return (
    <SuperAdminLayout title="Tracking">
      <div className="max-w-6xl space-y-8 text-white">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Stat icon={MousePointerClick} label="Cliques" value={String(data?.totals.clicks ?? 0)} hint={`${data?.totals.unique_clicks ?? 0} únicos`} />
          <Stat icon={TrendingUp} label="Conversões" value={String(data?.totals.conversions ?? 0)} />
          <Stat icon={Store} label="Lojas" value={String(data?.totals.store_conversions ?? 0)} />
          <Stat icon={Users} label="Clientes" value={String(data?.totals.client_conversions ?? 0)} />
          <Stat icon={Percent} label="Taxa de conversão" value={pct(data?.totals.conversion_rate ?? 0)} />
        </div>

        {/* Links management */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-white/80">Meus links de trackeamento</h2>
            <p className="text-xs text-white/40 mt-1">Crie um link por canal e compartilhe nos seus anúncios, emails ou DMs. Os links são criados e gerenciados pelo administrador da plataforma.</p>
          </div>
          <div className="space-y-2">
            {links.map((l) => {
              const url = `${origin}/t/${l.code}`;
              return (
                <div key={l.id} className="flex items-center justify-between gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-white/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{l.label} <span className="text-xs text-white/40 capitalize">· {l.channel}</span></p>
                      <p className="text-xs text-white/40 truncate">{url} → {l.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => copy(url, "Link")} className="text-white/40 hover:text-white"><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
              );
            })}
            {!links.length && <p className="text-xs text-white/30 py-2">Nenhum link ainda. Solicite ao administrador a criação dos seus links.</p>}
          </div>
        </section>

        {/* Timeseries */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
          <h2 className="text-sm font-medium text-white/70 mb-4">Últimos 30 dias</h2>
          <div className="flex items-end gap-1 h-40">
            {(data?.series || []).map((s) => (
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
                {(data?.channels || []).map((c) => (
                  <tr key={c.channel} className="border-t border-white/5">
                    <td className="px-4 py-3 capitalize">{c.channel}</td>
                    <td className="px-4 py-3 text-right">{c.clicks}</td>
                    <td className="px-4 py-3 text-right">{c.conversions}</td>
                    <td className="px-4 py-3 text-right">{pct(c.conversion_rate)}</td>
                  </tr>
                ))}
                {!(data?.channels || []).length && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40">Sem dados ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Signups */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">Cadastros ({data?.signups.length ?? 0})</h2>
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
                {(data?.signups || []).map((s, i) => (
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
                {!(data?.signups || []).length && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-white/40">Nenhum cadastro ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SuperAdminLayout>
  );
};


export default TrackerDashboard;
