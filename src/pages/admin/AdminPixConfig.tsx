import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePixConfig, PixKeyItem, PixMultiConfig } from '@/hooks/use-pix-config';
import { QrCode, Save, Loader2, CheckCircle2, Trash2, Eye, EyeOff, Lock, Plus, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { PixQRCode } from '@/components/payment/PixQRCode';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre', capital: 'RIO BRANCO' },
  { uf: 'AL', name: 'Alagoas', capital: 'MACEIO' },
  { uf: 'AP', name: 'Amapá', capital: 'MACAPA' },
  { uf: 'AM', name: 'Amazonas', capital: 'MANAUS' },
  { uf: 'BA', name: 'Bahia', capital: 'SALVADOR' },
  { uf: 'CE', name: 'Ceará', capital: 'FORTALEZA' },
  { uf: 'DF', name: 'Distrito Federal', capital: 'BRASILIA' },
  { uf: 'ES', name: 'Espírito Santo', capital: 'VITORIA' },
  { uf: 'GO', name: 'Goiás', capital: 'GOIANIA' },
  { uf: 'MA', name: 'Maranhão', capital: 'SAO LUIS' },
  { uf: 'MT', name: 'Mato Grosso', capital: 'CUIABA' },
  { uf: 'MS', name: 'Mato Grosso do Sul', capital: 'CAMPO GRANDE' },
  { uf: 'MG', name: 'Minas Gerais', capital: 'BELO HORIZONTE' },
  { uf: 'PA', name: 'Pará', capital: 'BELEM' },
  { uf: 'PB', name: 'Paraíba', capital: 'JOAO PESSOA' },
  { uf: 'PR', name: 'Paraná', capital: 'CURITIBA' },
  { uf: 'PE', name: 'Pernambuco', capital: 'RECIFE' },
  { uf: 'PI', name: 'Piauí', capital: 'TERESINA' },
  { uf: 'RJ', name: 'Rio de Janeiro', capital: 'RIO DE JANEIRO' },
  { uf: 'RN', name: 'Rio Grande do Norte', capital: 'NATAL' },
  { uf: 'RS', name: 'Rio Grande do Sul', capital: 'PORTO ALEGRE' },
  { uf: 'RO', name: 'Rondônia', capital: 'PORTO VELHO' },
  { uf: 'RR', name: 'Roraima', capital: 'BOA VISTA' },
  { uf: 'SC', name: 'Santa Catarina', capital: 'FLORIANOPOLIS' },
  { uf: 'SP', name: 'São Paulo', capital: 'SAO PAULO' },
  { uf: 'SE', name: 'Sergipe', capital: 'ARACAJU' },
  { uf: 'TO', name: 'Tocantins', capital: 'PALMAS' },
];

const PIX_TYPE_LABELS: Record<string, string> = {
  cpf: 'CPF', cnpj: 'CNPJ', email: 'E-mail', phone: 'Telefone', random: 'Chave Aleatória',
};

const PIX_VALIDATORS: Record<string, { example: string; placeholder: string }> = {
  cpf: { example: '123.456.789-00', placeholder: '123.456.789-00' },
  cnpj: { example: '12.345.678/0001-99', placeholder: '12.345.678/0001-99' },
  email: { example: 'usuario@dominio.com.br', placeholder: 'usuario@dominio.com.br' },
  phone: { example: '+5511998765432', placeholder: '+5511998765432' },
  random: { example: '123e4567-e89b-12d3-a456-426614174000', placeholder: '123e4567-e89b-12d3-a456-426614174000' },
};

function formatPixInput(value: string, type: string): string {
  const digits = value.replace(/\D/g, '');
  if (type === 'cpf') {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  if (type === 'cnpj') {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
  if (type === 'phone') {
    return `+${digits}`;
  }
  return value;
}

function getMaxLength(type: string): number | undefined {
  if (type === 'cpf') return 14;
  if (type === 'cnpj') return 18;
  if (type === 'phone') return 14;
  if (type === 'random') return 36;
  return undefined;
}

function validatePixKey(key: string, type: string): string | null {
  const v = PIX_VALIDATORS[type];
  if (!v) return null;
  let n = key;
  if (type === 'cpf' || type === 'cnpj') n = key.replace(/[\.\-\/]/g, '');
  if (type === 'phone') n = key.replace(/[^+\d]/g, '');
  if (type === 'cpf' && n.length !== 11) return `CPF deve ter 11 dígitos. Ex: ${v.example}`;
  if (type === 'cnpj' && n.length !== 14) return `CNPJ deve ter 14 dígitos. Ex: ${v.example}`;
  if (type === 'phone' && !/^\+?\d{12,13}$/.test(n)) return `Telefone inválido. Use: ${v.example}`;
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return `E-mail inválido. Ex: ${v.example}`;
  if (type === 'random' && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(key)) return `UUID inválido. Ex: ${v.example}`;
  return null;
}

function maskPixKey(key: string, type: string): string {
  if (type === 'cpf' && key.length >= 11) return `${key.slice(0, 3)}.***.***-${key.slice(-2)}`;
  if (type === 'email' && key.includes('@')) { const [u, d] = key.split('@'); return `${u.slice(0, 2)}***@${d}`; }
  if (type === 'phone' && key.length >= 8) return `${key.slice(0, 4)}****${key.slice(-2)}`;
  if (key.length > 8) return `${key.slice(0, 4)}****${key.slice(-4)}`;
  return '••••••••';
}

const EMPTY_FORM: Omit<PixKeyItem, 'id' | 'isActive'> = {
  pixKey: '', pixKeyType: 'cpf', merchantName: '', merchantState: '', merchantCity: '',
};

const AdminPixConfig: React.FC = () => {
  const { multiConfig, isLoading, saveMultiConfig } = usePixConfig();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PixKeyItem, 'id' | 'isActive'>>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const keys = multiConfig.keys;

  const handleStateChange = (uf: string) => {
    const state = BRAZILIAN_STATES.find(s => s.uf === uf);
    setForm(prev => ({ ...prev, merchantState: uf, merchantCity: state?.capital || '' }));
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Password-protected actions
  const requestPasswordFor = (action: () => Promise<void>) => {
    setPendingAction(() => action);
    setPassword('');
    setShowPasswordDialog(true);
  };

  const handleConfirmPassword = async () => {
    if (!password.trim()) { toast.error('Digite sua senha'); return; }
    setIsVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { toast.error('Sessão inválida.'); return; }
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
      if (error) { toast.error('Senha incorreta.'); return; }
      if (pendingAction) await pendingAction();
      setShowPasswordDialog(false);
      setPendingAction(null);
    } catch { toast.error('Erro ao verificar senha'); }
    finally { setIsVerifying(false); setIsSaving(false); }
  };

  // CRUD
  const handleSaveNewKey = () => {
    if (!form.pixKey.trim() || !form.merchantName.trim() || !form.merchantState) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    const err = validatePixKey(form.pixKey, form.pixKeyType);
    if (err) { toast.error(err); return; }

    requestPasswordFor(async () => {
      setIsSaving(true);
      const isFirst = keys.length === 0;
      const newKey: PixKeyItem = { id: crypto.randomUUID(), ...form, isActive: isFirst };
      await saveMultiConfig({ keys: [...keys, newKey] });
      toast.success('Chave PIX adicionada!');
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    });
  };

  const handleSaveEdit = () => {
    if (!form.pixKey.trim() || !form.merchantName.trim() || !form.merchantState) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    const err = validatePixKey(form.pixKey, form.pixKeyType);
    if (err) { toast.error(err); return; }

    requestPasswordFor(async () => {
      setIsSaving(true);
      const updated = keys.map(k => k.id === editingId ? { ...k, ...form } : k);
      await saveMultiConfig({ keys: updated });
      toast.success('Chave PIX atualizada!');
      setEditingId(null);
      setForm(EMPTY_FORM);
    });
  };

  const handleSetActive = (id: string) => {
    requestPasswordFor(async () => {
      setIsSaving(true);
      const updated = keys.map(k => ({ ...k, isActive: k.id === id }));
      await saveMultiConfig({ keys: updated });
      toast.success('Chave PIX ativada!');
    });
  };

  const handleDelete = (id: string) => {
    const key = keys.find(k => k.id === id);
    if (key?.isActive && keys.length > 1) {
      toast.error('Desative esta chave antes de removê-la, ou ative outra primeiro.');
      return;
    }
    requestPasswordFor(async () => {
      setIsSaving(true);
      await saveMultiConfig({ keys: keys.filter(k => k.id !== id) });
      toast.success('Chave PIX removida!');
    });
  };

  const startEdit = (key: PixKeyItem) => {
    setEditingId(key.id);
    setForm({ pixKey: key.pixKey, pixKeyType: key.pixKeyType, merchantName: key.merchantName, merchantState: key.merchantState, merchantCity: key.merchantCity });
    setShowAddForm(false);
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); };

  if (isLoading) {
    return (
      <AdminLayout title="Configuração PIX">
        <GlassCard className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></GlassCard>
      </AdminLayout>
    );
  }

  const previewKey = keys.find(k => k.id === previewId);

  return (
    <AdminLayout title="Configuração PIX">
      <div className="space-y-6 max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Gerencie suas chaves PIX. Apenas <strong>1 chave</strong> pode ficar ativa por vez.
            </p>
          </div>
          {!showAddForm && !editingId && (
            <Button onClick={() => { setShowAddForm(true); setForm(EMPTY_FORM); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Chave
            </Button>
          )}
        </div>

        {/* List of keys as cards */}
        {keys.length > 0 && !editingId && (
          <div className="space-y-3">
            {keys.map(key => (
              <GlassCard key={key.id} className={`p-5 transition-all ${key.isActive ? 'ring-1 ring-emerald-500/40' : 'opacity-75'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${key.isActive ? 'bg-emerald-500/15' : 'bg-muted/40'}`}>
                      <QrCode className={`w-5 h-5 ${key.isActive ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{key.merchantName}</p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {PIX_TYPE_LABELS[key.pixKeyType]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs font-mono text-muted-foreground">
                          {revealedKeys.has(key.id) ? key.pixKey : maskPixKey(key.pixKey, key.pixKeyType)}
                        </p>
                        <button onClick={() => toggleReveal(key.id)} className="text-muted-foreground hover:text-foreground">
                          {revealedKeys.has(key.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {key.isActive ? (
                      <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Ativa
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleSetActive(key.id)} className="gap-1 text-xs h-7">
                        <Circle className="w-3 h-3" />
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(key)} className="text-xs h-7 gap-1">
                    <Save className="w-3 h-3" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewId(previewId === key.id ? null : key.id)}
                    className="text-xs h-7 gap-1"
                  >
                    <QrCode className="w-3 h-3" />
                    {previewId === key.id ? 'Esconder QR' : 'QR Code'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(key.id)} className="text-xs h-7 gap-1 text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </Button>
                </div>

                {previewId === key.id && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-center text-muted-foreground mb-3">Preview (R$ 10,00)</p>
                    <PixQRCode
                      pixKey={key.pixKey}
                      merchantName={key.merchantName || 'TESTE'}
                      merchantCity={key.merchantCity || 'SAO PAULO'}
                      amount={10}
                      txId="PREVIEW"
                    />
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        {/* Empty state */}
        {keys.length === 0 && !showAddForm && (
          <GlassCard className="p-8 text-center">
            <QrCode className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma chave PIX cadastrada</p>
            <Button onClick={() => setShowAddForm(true)} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Chave PIX
            </Button>
          </GlassCard>
        )}

        {/* Add / Edit Form */}
        {(showAddForm || editingId) && (
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {editingId ? 'Editar Chave PIX' : 'Nova Chave PIX'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Será solicitada sua senha para confirmar a alteração.
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo da Chave *</label>
                <Select
                  value={form.pixKeyType}
                  onValueChange={(v) => setForm(prev => ({ ...prev, pixKeyType: v as PixKeyItem['pixKeyType'], pixKey: '' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Chave PIX *</label>
                <Input
                  placeholder={PIX_VALIDATORS[form.pixKeyType]?.placeholder || 'Digite sua chave PIX'}
                  value={form.pixKey}
                  onChange={(e) => {
                    const t = form.pixKeyType;
                    const val = (t === 'cpf' || t === 'cnpj' || t === 'phone') ? formatPixInput(e.target.value, t) : e.target.value;
                    setForm(prev => ({ ...prev, pixKey: val }));
                  }}
                  maxLength={getMaxLength(form.pixKeyType)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Ex: {PIX_VALIDATORS[form.pixKeyType]?.example}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Nome do Recebedor *</label>
                <Input
                  placeholder="Nome que aparecerá no PIX"
                  value={form.merchantName}
                  onChange={(e) => setForm(prev => ({ ...prev, merchantName: e.target.value }))}
                  maxLength={25}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Estado *</label>
                <Select value={form.merchantState} onValueChange={handleStateChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione seu estado" /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(s => (
                      <SelectItem key={s.uf} value={s.uf}>{s.uf} — {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={editingId ? handleSaveEdit : handleSaveNewKey} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Salvar Alterações' : 'Adicionar Chave'}
              </Button>
              <Button variant="outline" onClick={() => { setShowAddForm(false); cancelEdit(); }}>
                Cancelar
              </Button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Confirmar Senha
            </DialogTitle>
            <DialogDescription>
              Para segurança, confirme sua senha antes de alterar a chave PIX.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="confirm-password">Senha da conta</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmPassword()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isVerifying}>Cancelar</Button>
            <Button onClick={handleConfirmPassword} disabled={isVerifying} className="gap-2">
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPixConfig;
