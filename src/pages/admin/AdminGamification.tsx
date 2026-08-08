import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, Trophy, Award, Sparkles } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';
import { loadConfig, saveConfig } from '@/lib/config-storage';
import {
  DEFAULT_GAMIFICATION_CONFIG,
  REPUTATION_EVENTS,
  REWARD_OPTIONS,
  type GamificationConfig,
  type ReputationEventType,
  type RewardId,
} from '@/lib/gamification';

const AdminGamification: React.FC = () => {
  const { t } = useTranslation();
  const { store } = useTenant();
  const storeId = store?.id ?? null;

  const [config, setConfig] = useState<GamificationConfig>(DEFAULT_GAMIFICATION_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!storeId) return;
      const raw = await loadConfig<Partial<GamificationConfig>>('gamification_config', storeId);
      if (raw) {
        setConfig({
          ...DEFAULT_GAMIFICATION_CONFIG,
          ...raw,
          points: { ...DEFAULT_GAMIFICATION_CONFIG.points, ...(raw.points || {}) },
          levels: raw.levels?.length ? raw.levels : DEFAULT_GAMIFICATION_CONFIG.levels,
          badges: raw.badges?.length ? raw.badges : DEFAULT_GAMIFICATION_CONFIG.badges,
        });
      }
      setIsLoading(false);
    };
    void load();
  }, [storeId]);

  const handleSave = async () => {
    if (!storeId) return;
    setIsSaving(true);
    try {
      const ok = await saveConfig('gamification_config', config, storeId);
      if (!ok) throw new Error('save_failed');
      toast.success(t('admin.gamification.saved', 'Gamification settings saved!'));
    } catch {
      toast.error(t('admin.gamification.saveError', 'Could not save settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  const updatePoints = (event: ReputationEventType, value: number) =>
    setConfig((c) => ({ ...c, points: { ...c.points, [event]: Math.max(0, value) } }));

  const updateLevel = (index: number, patch: Partial<GamificationConfig['levels'][number]>) =>
    setConfig((c) => ({ ...c, levels: c.levels.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));

  const toggleReward = (index: number, reward: RewardId) =>
    setConfig((c) => ({
      ...c,
      levels: c.levels.map((l, i) => {
        if (i !== index) return l;
        const has = l.rewards.includes(reward);
        return { ...l, rewards: has ? l.rewards.filter((r) => r !== reward) : [...l.rewards, reward] };
      }),
    }));

  const updateBadge = (index: number, patch: Partial<GamificationConfig['badges'][number]>) =>
    setConfig((c) => ({ ...c, badges: c.badges.map((b, i) => (i === index ? { ...b, ...patch } : b)) }));

  if (isLoading) {
    return (
      <AdminLayout title={t('admin.gamification.title', 'Gamification')}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('admin.gamification.title', 'Gamification')}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t('admin.gamification.subtitle', 'Configure points, levels, medals and the perks unlocked at each rank.')}
          </p>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 shrink-0">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save', 'Save')}
          </Button>
        </div>

        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t('admin.gamification.enabled', 'Enable gamification')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('admin.gamification.enabledDesc', 'Show reputation, levels and ranking to your members.')}
              </p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))} />
          </div>
        </GlassCard>




        {/* Levels & rewards */}
        <GlassCard className="p-5 space-y-4">
          <p className="font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            {t('admin.gamification.levels', 'Levels & unlocked perks')}
          </p>
          <div className="space-y-4">
            {config.levels.map((level, index) => (
              <div key={level.level} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-10">Lv.{level.level}</span>
                  <Input className="w-16 h-9 text-center" value={level.icon} onChange={(e) => updateLevel(index, { icon: e.target.value })} />
                  <Input className="flex-1 min-w-[120px] h-9" value={level.title} onChange={(e) => updateLevel(index, { title: e.target.value })} />
                  <Input
                    type="number"
                    min={0}
                    className="w-28 h-9"
                    value={level.minPoints}
                    onChange={(e) => updateLevel(index, { minPoints: Math.max(0, Number(e.target.value)) })}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pl-10">
                  {REWARD_OPTIONS.map((reward) => {
                    const active = level.rewards.includes(reward.id);
                    return (
                      <button
                        key={reward.id}
                        type="button"
                        onClick={() => toggleReward(index, reward.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                          active ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/[0.03] border-border/50 text-muted-foreground'
                        }`}
                      >
                        {t(reward.labelKey, reward.fallback)}
                      </button>
                    );
                  })}
                </div>
                {index < config.levels.length - 1 && <Separator className="opacity-40" />}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Badges */}
        <GlassCard className="p-5 space-y-4">
          <p className="font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            {t('admin.gamification.badges', 'Medals')}
          </p>
          <div className="space-y-3">
            {config.badges.map((badge, index) => (
              <div key={badge.id} className="flex flex-wrap items-center gap-2">
                <Switch checked={badge.enabled} onCheckedChange={(v) => updateBadge(index, { enabled: v })} />
                <Input className="w-16 h-9 text-center" value={badge.icon} onChange={(e) => updateBadge(index, { icon: e.target.value })} />
                <Input className="flex-1 min-w-[140px] h-9" value={badge.name} onChange={(e) => updateBadge(index, { name: e.target.value })} />
                <span className="text-xs text-muted-foreground">
                  {t(`admin.gamification.condition.${badge.condition.type}`, badge.condition.type.replace('_', ' '))}
                </span>
                <Input
                  type="number"
                  min={1}
                  className="w-24 h-9"
                  value={badge.condition.value}
                  onChange={(e) => updateBadge(index, { condition: { ...badge.condition, value: Math.max(1, Number(e.target.value)) } })}
                />
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGamification;
