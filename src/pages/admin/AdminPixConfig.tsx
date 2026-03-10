import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePixConfig, PixConfig } from '@/hooks/use-pix-config';
import { QrCode, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PixQRCode } from '@/components/payment/PixQRCode';

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

const AdminPixConfig: React.FC = () => {
  const { config, isLoading, saveConfig } = usePixConfig();
  const [form, setForm] = useState<PixConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleSave = async () => {
    if (!form.pixKey.trim() || !form.merchantName.trim() || !form.merchantState) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setIsSaving(true);
    try {
      await saveConfig(form);
      toast.success('Configuração PIX salva!');
    } catch {
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
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
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Chave PIX</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure sua chave PIX para receber pagamentos. O QR Code será gerado automaticamente para cada pedido.
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
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </Button>
            {form.pixKey && (
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                <QrCode className="w-4 h-4" />
                {showPreview ? 'Esconder Preview' : 'Preview QR Code'}
              </Button>
            )}
          </div>
        </GlassCard>

        {showPreview && form.pixKey && (
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-center">Preview (R$ 10,00 de exemplo)</h3>
            <PixQRCode
              pixKey={form.pixKey}
              merchantName={form.merchantName || 'TESTE'}
              merchantCity={form.merchantCity || 'SAO PAULO'}
              amount={10}
              txId="PREVIEW"
            />
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPixConfig;
