import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePixConfig, PixConfig } from '@/hooks/use-pix-config';
import { QrCode, Save, Loader2, CheckCircle2, Pencil, Trash2, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { PixQRCode } from '@/components/payment/PixQRCode';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave Aleatória',
};

// Validation patterns
const PIX_VALIDATORS: Record<string, { regex: RegExp; example: string; placeholder: string }> = {
  cpf: {
    regex: /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/,
    example: '123.456.789-00',
    placeholder: '123.456.789-00',
  },
  cnpj: {
    regex: /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})$/,
    example: '12.345.678/0001-99',
    placeholder: '12.345.678/0001-99',
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    example: 'usuario@dominio.com.br',
    placeholder: 'usuario@dominio.com.br',
  },
  phone: {
    regex: /^\+?\d{12,13}$/,
    example: '+5511998765432',
    placeholder: '+5511998765432',
  },
  random: {
    regex: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    example: '123e4567-e89b-12d3-a456-426614174000',
    placeholder: '123e4567-e89b-12d3-a456-426614174000',
  },
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
    if (!value.startsWith('+') && digits.length > 0) return `+${digits}`;
    return `+${digits}`;
  }
  return value;
}

function getMaxLength(type: string): number | undefined {
  if (type === 'cpf') return 14; // 123.456.789-00
  if (type === 'cnpj') return 18; // 12.345.678/0001-99
  if (type === 'phone') return 14; // +5511998765432
  if (type === 'random') return 36; // UUID
  return undefined;
}

function validatePixKey(key: string, type: string): string | null {
  const validator = PIX_VALIDATORS[type];
  if (!validator) return null;
  // Normalize for validation
  let normalized = key;
  if (type === 'cpf' || type === 'cnpj') normalized = key.replace(/[\.\-\/]/g, '');
  if (type === 'phone') normalized = key.replace(/[^+\d]/g, '');
  // Check raw digits length
  if (type === 'cpf' && normalized.length !== 11) return `CPF deve ter 11 dígitos. Ex: ${validator.example}`;
  if (type === 'cnpj' && normalized.length !== 14) return `CNPJ deve ter 14 dígitos. Ex: ${validator.example}`;
  if (type === 'phone' && !PIX_VALIDATORS.phone.regex.test(normalized)) return `Telefone inválido. Use: ${validator.example}`;
  if (type === 'email' && !PIX_VALIDATORS.email.regex.test(key)) return `E-mail inválido. Ex: ${validator.example}`;
  if (type === 'random' && !PIX_VALIDATORS.random.regex.test(key)) return `UUID inválido. Ex: ${validator.example}`;
  return null;
}

function maskPixKey(key: string, type: string): string {
  if (type === 'cpf' && key.length >= 11) {
    return `${key.slice(0, 3)}.***.***-${key.slice(-2)}`;
  }
  if (type === 'email' && key.includes('@')) {
    const [user, domain] = key.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
  }
  if (type === 'phone' && key.length >= 8) {
    return `${key.slice(0, 4)}****${key.slice(-2)}`;
  }
  if (key.length > 8) {
    return `${key.slice(0, 4)}****${key.slice(-4)}`;
  }
  return '••••••••';
}

const AdminPixConfig: React.FC = () => {
  const { config, isLoading, saveConfig } = usePixConfig();

  const [form, setForm] = useState<PixConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showKeyFull, setShowKeyFull] = useState(false);

  // Password confirmation
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingForm, setPendingForm] = useState<PixConfig | null>(null);

  const hasExistingKey = Boolean(config.pixKey);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleStateChange = (uf: string) => {
    const state = BRAZILIAN_STATES.find(s => s.uf === uf);
    setForm(prev => ({
      ...prev,
      merchantState: uf,
      merchantCity: state?.capital || '',
    }));
  };

  const handleRequestSave = () => {
    if (!form.pixKey.trim() || !form.merchantName.trim() || !form.merchantState) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const validationError = validatePixKey(form.pixKey, form.pixKeyType);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setPendingForm({ ...form });
    setPassword('');
    setShowPasswordDialog(true);
  };

  const handleConfirmWithPassword = async () => {
    if (!password.trim()) {
      toast.error('Digite sua senha');
      return;
    }

    setIsVerifying(true);
    try {
      // Re-authenticate with current session email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Sessão inválida. Faça login novamente.');
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (authError) {
        toast.error('Senha incorreta. Tente novamente.');
        return;
      }

      // Password verified — proceed to save
      if (pendingForm) {
        setIsSaving(true);
        await saveConfig(pendingForm);
        toast.success('Chave PIX salva com sucesso!');
        setIsEditing(false);
        setShowPasswordDialog(false);
        setPendingForm(null);
      }
    } catch {
      toast.error('Erro ao verificar senha');
    } finally {
      setIsVerifying(false);
      setIsSaving(false);
    }
  };

  const handleRemoveKey = () => {
    setPendingForm({
      pixKey: '',
      pixKeyType: 'cpf',
      merchantName: '',
      merchantState: '',
      merchantCity: '',
    });
    setPassword('');
    setShowPasswordDialog(true);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Configuração PIX">
        <GlassCard className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </GlassCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configuração PIX">
      <div className="space-y-6 max-w-2xl">

        {/* Active PIX Card */}
        {hasExistingKey && !isEditing && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Chave PIX</h2>
                  <p className="text-sm text-muted-foreground">Pagamento via PIX configurado</p>
                </div>
              </div>
              <Badge variant="outline" className="gap-1.5 border-emerald-500/50 text-emerald-400 bg-emerald-500/10 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ativo
              </Badge>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</p>
                  <p className="text-sm font-medium">{PIX_TYPE_LABELS[config.pixKeyType] || config.pixKeyType}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Estado</p>
                  <p className="text-sm font-medium">{config.merchantState}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Chave</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-medium">
                    {showKeyFull ? config.pixKey : maskPixKey(config.pixKey, config.pixKeyType)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowKeyFull(!showKeyFull)}
                  >
                    {showKeyFull ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Recebedor</p>
                <p className="text-sm font-medium">{config.merchantName}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                <QrCode className="w-4 h-4" />
                {showPreview ? 'Esconder QR' : 'Preview QR'}
              </Button>
              <Button variant="ghost" onClick={handleRemoveKey} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Form — shown when no key or editing */}
        {(!hasExistingKey || isEditing) && (
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {hasExistingKey ? 'Editar Chave PIX' : 'Adicionar Chave PIX'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure sua chave PIX para receber pagamentos. Será solicitada sua senha para confirmar.
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo da Chave *</label>
                <Select
                  value={form.pixKeyType}
                  onValueChange={(v) => setForm(prev => ({ ...prev, pixKeyType: v as PixConfig['pixKeyType'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  placeholder="Digite sua chave PIX"
                  value={form.pixKey}
                  onChange={(e) => setForm(prev => ({ ...prev, pixKey: e.target.value }))}
                />
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(s => (
                      <SelectItem key={s.uf} value={s.uf}>
                        {s.uf} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleRequestSave} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Chave PIX
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={() => { setIsEditing(false); setForm(config); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </GlassCard>
        )}

        {/* QR Preview */}
        {showPreview && config.pixKey && (
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-center">Preview (R$ 10,00 de exemplo)</h3>
            <PixQRCode
              pixKey={config.pixKey}
              merchantName={config.merchantName || 'TESTE'}
              merchantCity={config.merchantCity || 'SAO PAULO'}
              amount={10}
              txId="PREVIEW"
            />
          </GlassCard>
        )}
      </div>

      {/* Password Confirmation Dialog */}
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
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmWithPassword()}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isVerifying}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmWithPassword} disabled={isVerifying} className="gap-2">
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
