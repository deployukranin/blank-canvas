import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  Database, 
  CreditCard, 
  HeadphonesIcon, 
  Package,
  Save,
  TestTube,
  CheckCircle2,
  XCircle,
  Loader2,
  Percent,
  Eye,
  EyeOff
} from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSecret?: boolean;
}

const TokenInput = ({ label, value, onChange, placeholder, isSecret = true }: TokenInputProps) => {
  const [showValue, setShowValue] = useState(false);

  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="relative mt-2">
        <Input
          type={isSecret && !showValue ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

const CEOIntegracoes = () => {
  const { config, updateToken, testConnection } = useWhiteLabel();
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleTest = async (tokenKey: 'supabase' | 'openpix' | 'support' | 'accountStock') => {
    setTestingConnection(tokenKey);
    const result = await testConnection(tokenKey);
    setConnectionResults(prev => ({ ...prev, [tokenKey]: result }));
    setTestingConnection(null);
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleSave = () => {
    toast.success('Configurações de integrações salvas!');
  };

  return (
    <CEOLayout title="Integrações Externas">
      <div className="space-y-8 max-w-4xl">
        {/* Supabase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Supabase</h3>
                  <p className="text-sm text-muted-foreground">Banco de dados e autenticação</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.supabase.enabled}
                onCheckedChange={(checked) => updateToken('supabase', { enabled: checked })}
              />
            </div>

            {config.tokens.supabase.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <TokenInput
                  label="URL do Projeto"
                  value={config.tokens.supabase.url}
                  onChange={(value) => updateToken('supabase', { url: value })}
                  placeholder="https://xxx.supabase.co"
                  isSecret={false}
                />
                <TokenInput
                  label="Anon Key"
                  value={config.tokens.supabase.anonKey}
                  onChange={(value) => updateToken('supabase', { anonKey: value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('supabase')}
                    disabled={testingConnection === 'supabase'}
                    className="gap-2"
                  >
                    {testingConnection === 'supabase' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.supabase && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.supabase.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.supabase.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.supabase.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* OpenPix/Woovi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">OpenPix / Woovi</h3>
                  <p className="text-sm text-muted-foreground">Gateway de pagamentos PIX</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.openpix.enabled}
                onCheckedChange={(checked) => updateToken('openpix', { enabled: checked })}
              />
            </div>

            {config.tokens.openpix.enabled && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TokenInput
                    label="App ID"
                    value={config.tokens.openpix.appId}
                    onChange={(value) => updateToken('openpix', { appId: value })}
                    placeholder="Seu App ID"
                  />
                  <TokenInput
                    label="Secret Key"
                    value={config.tokens.openpix.secretKey}
                    onChange={(value) => updateToken('openpix', { secretKey: value })}
                    placeholder="Sua Secret Key"
                  />
                </div>

                {/* Split Configuration */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">Split de Pagamentos</span>
                    </div>
                    <Switch
                      checked={config.tokens.openpix.splitConfig.enabled}
                      onCheckedChange={(checked) => 
                        updateToken('openpix', { 
                          splitConfig: { ...config.tokens.openpix.splitConfig, enabled: checked } 
                        })
                      }
                    />
                  </div>

                  {config.tokens.openpix.splitConfig.enabled && (
                    <div className="space-y-4 pt-4 border-t border-blue-500/20">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Dono da Plataforma</span>
                          <span className="font-mono font-bold text-blue-400">
                            {config.tokens.openpix.splitConfig.ownerPercentage}%
                          </span>
                        </div>
                        <Slider
                          value={[config.tokens.openpix.splitConfig.ownerPercentage]}
                          onValueChange={([value]) => 
                            updateToken('openpix', { 
                              splitConfig: { 
                                ...config.tokens.openpix.splitConfig, 
                                ownerPercentage: value,
                                influencerPercentage: 100 - value
                              } 
                            })
                          }
                          max={100}
                          step={1}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Influencer</span>
                          <span className="font-mono font-bold text-amber-400">
                            {config.tokens.openpix.splitConfig.influencerPercentage}%
                          </span>
                        </div>
                        <Slider
                          value={[config.tokens.openpix.splitConfig.influencerPercentage]}
                          onValueChange={([value]) => 
                            updateToken('openpix', { 
                              splitConfig: { 
                                ...config.tokens.openpix.splitConfig, 
                                influencerPercentage: value,
                                ownerPercentage: 100 - value
                              } 
                            })
                          }
                          max={100}
                          step={1}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Exemplo: Em uma venda de R$100, o dono recebe R${config.tokens.openpix.splitConfig.ownerPercentage} 
                        e o influencer recebe R${config.tokens.openpix.splitConfig.influencerPercentage}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('openpix')}
                    disabled={testingConnection === 'openpix'}
                    className="gap-2"
                  >
                    {testingConnection === 'openpix' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.openpix && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.openpix.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.openpix.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.openpix.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <HeadphonesIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Suporte Externo</h3>
                  <p className="text-sm text-muted-foreground">Sistema de tickets e atendimento</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.support.enabled}
                onCheckedChange={(checked) => updateToken('support', { enabled: checked })}
              />
            </div>

            {config.tokens.support.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <TokenInput
                  label="Token de Acesso"
                  value={config.tokens.support.token}
                  onChange={(value) => updateToken('support', { token: value })}
                  placeholder="Seu token de API"
                />
                <TokenInput
                  label="Webhook URL"
                  value={config.tokens.support.webhookUrl}
                  onChange={(value) => updateToken('support', { webhookUrl: value })}
                  placeholder="https://..."
                  isSecret={false}
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('support')}
                    disabled={testingConnection === 'support'}
                    className="gap-2"
                  >
                    {testingConnection === 'support' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.support && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.support.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.support.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.support.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Account Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Estoque de Contas</h3>
                  <p className="text-sm text-muted-foreground">Gerenciamento de contas da loja</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.accountStock.enabled}
                onCheckedChange={(checked) => updateToken('accountStock', { enabled: checked })}
              />
            </div>

            {config.tokens.accountStock.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <TokenInput
                  label="URL da API"
                  value={config.tokens.accountStock.apiUrl}
                  onChange={(value) => updateToken('accountStock', { apiUrl: value })}
                  placeholder="https://api.seuservidor.com/v1"
                  isSecret={false}
                />
                <TokenInput
                  label="API Key"
                  value={config.tokens.accountStock.apiKey}
                  onChange={(value) => updateToken('accountStock', { apiKey: value })}
                  placeholder="Sua API Key"
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('accountStock')}
                    disabled={testingConnection === 'accountStock'}
                    className="gap-2"
                  >
                    {testingConnection === 'accountStock' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.accountStock && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.accountStock.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.accountStock.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.accountStock.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <Button onClick={handleSave} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
            <Save className="w-4 h-4" />
            Salvar Todas as Integrações
          </Button>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEOIntegracoes;
