import React, { useEffect, useState } from "react";
import { Plus, Copy, Trash2, ExternalLink, Loader2, Link2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "./SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Tracker {
  id: string; name: string; dashboard_token: string; is_active: boolean; created_at: string; email?: string | null;
}
interface TrackerLink {
  id: string; tracker_id: string; code: string; label: string; channel: string; destination: string; is_active: boolean;
}

const CHANNELS = ["ads", "email", "dm", "organic", "influencer", "other"];

const SuperAdminTracking: React.FC = () => {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [links, setLinks] = useState<TrackerLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const call = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("super-admin-trackers", {
      body: { action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const load = async () => {
    try {
      const data = await call("list");
      setTrackers(data.trackers || []);
      setLinks(data.links || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createTracker = async () => {
    if (newName.trim().length < 2) { toast.error("Informe um nome"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { toast.error("Email inválido"); return; }
    if (newPassword.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres"); return; }
    setCreating(true);
    try {
      await call("create_tracker", { name: newName.trim(), email: newEmail.trim(), password: newPassword });
      setNewName(""); setNewEmail(""); setNewPassword("");
      toast.success("Tracker criado");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setCreating(false);
    }
  };

  const deleteTracker = async (id: string) => {
    if (!confirm("Excluir este tracker e todos os seus dados?")) return;
    try {
      await call("delete_tracker", { id });
      toast.success("Excluído");
      await load();
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

  const toggleTracker = async (t: Tracker) => {
    try {
      await call("update_tracker", { id: t.id, is_active: !t.is_active });
      await load();
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

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

  return (
    <SuperAdminLayout title="Tracking">
      <div className="max-w-4xl space-y-6">
        <p className="text-white/50 text-sm">
          Crie admins de tráfego isolados. Cada um faz login com email e senha em <span className="text-white/70">/admin-master/login</span> e vê apenas o próprio dashboard de trackeamento.
        </p>

        {/* Create tracker */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <p className="text-sm font-medium text-white/80">Novo admin de tráfego</p>
          <div className="grid sm:grid-cols-3 gap-2">
            <Input
              placeholder="Nome (ex: João Ads)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white/5 border-white/10"
            />
            <Input
              type="email"
              placeholder="Email de login"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-white/5 border-white/10"
            />
            <Input
              type="text"
              placeholder="Senha (mín. 6)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>
          <Button onClick={createTracker} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar tracker
          </Button>
        </div>

        {!trackers.length && (
          <div className="text-center py-12 text-white/40 border border-white/10 rounded-2xl">
            Nenhum tracker ainda. Crie o primeiro acima.
          </div>
        )}

        {trackers.map((t) => {
          const tLinks = links.filter((l) => l.tracker_id === t.id);
          const dashUrl = `${origin}/track/${t.dashboard_token}`;
          const isOpen = expanded === t.id;
          return (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="p-4 flex items-center justify-between gap-3">
                <button onClick={() => setExpanded(isOpen ? null : t.id)} className="flex items-center gap-2 text-left flex-1">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
                  <div>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{tLinks.length} link(s)</p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copy(dashUrl, "Dashboard")} className="gap-1.5 text-xs text-white/60">
                    <Copy className="w-3.5 h-3.5" /> Dashboard
                  </Button>
                  <a href={dashUrl} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="text-white/40 hover:text-white"><ExternalLink className="w-4 h-4" /></Button>
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => toggleTracker(t)} className={`text-xs ${t.is_active ? "text-emerald-400" : "text-white/40"}`}>
                    {t.is_active ? "Ativo" : "Inativo"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteTracker(t.id)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-white/5 p-4 space-y-3">
                  <LinkCreator trackerId={t.id} onCreated={load} call={call} />
                  <div className="space-y-2">
                    {tLinks.map((l) => {
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
                            <Button variant="ghost" size="icon" onClick={async () => { await call("delete_link", { id: l.id }); load(); }} className="text-red-400/50 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      );
                    })}
                    {!tLinks.length && <p className="text-xs text-white/30 py-2">Nenhum link. Crie um acima.</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SuperAdminLayout>
  );
};

const LinkCreator: React.FC<{ trackerId: string; onCreated: () => void; call: (a: string, p?: any) => Promise<any> }> = ({ trackerId, onCreated, call }) => {
  const [label, setLabel] = useState("");
  const [channel, setChannel] = useState("ads");
  const [destination, setDestination] = useState("/");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (label.trim().length < 2) { toast.error("Informe um rótulo"); return; }
    setBusy(true);
    try {
      await call("create_link", { tracker_id: trackerId, label: label.trim(), channel, destination: destination.trim() || "/" });
      setLabel("");
      onCreated();
      toast.success("Link criado");
    } catch (e: any) { toast.error(e.message || "Erro"); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input placeholder="Rótulo (ex: Campanha Black Friday)" value={label} onChange={(e) => setLabel(e.target.value)} className="bg-white/5 border-white/10 text-sm" />
      <select value={channel} onChange={(e) => setChannel(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-3 text-sm text-white h-10 capitalize">
        {CHANNELS.map((c) => <option key={c} value={c} className="bg-[#0a0a0a] capitalize">{c}</option>)}
      </select>
      <Input placeholder="Destino (ex: / ou /loja)" value={destination} onChange={(e) => setDestination(e.target.value)} className="bg-white/5 border-white/10 text-sm sm:w-40" />
      <Button onClick={create} disabled={busy} size="sm" className="gap-1.5 shrink-0">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Link
      </Button>
    </div>
  );
};

export default SuperAdminTracking;
