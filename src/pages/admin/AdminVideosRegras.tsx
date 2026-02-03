import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ShieldCheck, ShieldX, Eye } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getVideoConfig,
  saveVideoConfig,
  type VideoConfig,
} from '@/lib/video-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AdminVideosRegras = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setConfig(getVideoConfig());
  }, []);

  const handleSave = () => {
    if (!config) return;
    setIsSaving(true);
    
    setTimeout(() => {
      saveVideoConfig(config);
      toast({
        title: 'Regras salvas!',
        description: 'As alterações foram aplicadas com sucesso.',
      });
      setIsSaving(false);
    }, 500);
  };

  const addRule = (type: 'allowed' | 'notAllowed') => {
    if (!config) return;
    const newRules = { ...config.rules };
    newRules[type] = [...newRules[type], 'Nova regra'];
    setConfig({ ...config, rules: newRules });
  };

  const updateRule = (type: 'allowed' | 'notAllowed', index: number, value: string) => {
    if (!config) return;
    const newRules = { ...config.rules };
    newRules[type][index] = value;
    setConfig({ ...config, rules: newRules });
  };

  const removeRule = (type: 'allowed' | 'notAllowed', index: number) => {
    if (!config) return;
    const newRules = { ...config.rules };
    newRules[type] = newRules[type].filter((_, i) => i !== index);
    setConfig({ ...config, rules: newRules });
  };

  if (!config) {
    return (
      <AdminLayout title="Regras">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Regras">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Configure o que pode e o que não pode nos vídeos
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Allowed Rules */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              O que PODE
            </h3>
            <Button size="sm" variant="outline" onClick={() => addRule('allowed')}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {config.rules.allowed.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={rule}
                  onChange={e => updateRule('allowed', index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeRule('allowed', index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {config.rules.allowed.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">
                Nenhuma regra "permitido" cadastrada
              </p>
            )}
          </div>
        </GlassCard>

        {/* Not Allowed Rules */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-red-500" />
              O que NÃO PODE
            </h3>
            <Button size="sm" variant="outline" onClick={() => addRule('notAllowed')}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {config.rules.notAllowed.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={rule}
                  onChange={e => updateRule('notAllowed', index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeRule('notAllowed', index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {config.rules.notAllowed.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">
                Nenhuma regra "proibido" cadastrada
              </p>
            )}
          </div>
        </GlassCard>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualização das Regras</DialogTitle>
              <DialogDescription>
                Como os usuários verão as regras na página de vídeos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  O que pode
                </h4>
                <ul className="space-y-1">
                  {config.rules.allowed.map((rule, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                  <ShieldX className="w-5 h-5" />
                  O que NÃO pode
                </h4>
                <ul className="space-y-1">
                  {config.rules.notAllowed.map((rule, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-red-500">✕</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminVideosRegras;
