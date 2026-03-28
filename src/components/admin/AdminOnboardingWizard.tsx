import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Loader2, User, Palette, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

interface Props {
  storeId: string;
  storeName: string;
  storeDescription: string;
  storeAvatarUrl: string;
  onComplete: () => void;
}

const darkTemplates = [
  { id: 'purple', label: 'Purple', primary: '263 70% 58%', accent: '263 50% 25%', mode: 'dark' as const, tw: 'bg-purple-500' },
  { id: 'red', label: 'Red', primary: '0 72% 51%', accent: '0 50% 25%', mode: 'dark' as const, tw: 'bg-red-500' },
  { id: 'green', label: 'Green', primary: '142 71% 45%', accent: '142 50% 22%', mode: 'dark' as const, tw: 'bg-green-500' },
  { id: 'blue', label: 'Blue', primary: '217 91% 60%', accent: '217 50% 25%', mode: 'dark' as const, tw: 'bg-blue-500' },
  { id: 'pink', label: 'Pink', primary: '330 81% 60%', accent: '330 50% 25%', mode: 'dark' as const, tw: 'bg-pink-500' },
  { id: 'yellow', label: 'Yellow', primary: '45 93% 47%', accent: '45 50% 25%', mode: 'dark' as const, tw: 'bg-yellow-500' },
];

const lightTemplates = [
  { id: 'light-purple', label: 'Purple', primary: '263 70% 55%', accent: '263 40% 92%', mode: 'light' as const, tw: 'bg-purple-500' },
  { id: 'light-red', label: 'Red', primary: '0 72% 50%', accent: '0 40% 92%', mode: 'light' as const, tw: 'bg-red-500' },
  { id: 'light-green', label: 'Green', primary: '142 71% 40%', accent: '142 40% 92%', mode: 'light' as const, tw: 'bg-green-500' },
  { id: 'light-blue', label: 'Blue', primary: '217 91% 55%', accent: '217 40% 92%', mode: 'light' as const, tw: 'bg-blue-500' },
  { id: 'light-pink', label: 'Pink', primary: '330 81% 55%', accent: '330 40% 92%', mode: 'light' as const, tw: 'bg-pink-500' },
  { id: 'light-yellow', label: 'Yellow', primary: '45 93% 40%', accent: '45 40% 92%', mode: 'light' as const, tw: 'bg-yellow-500' },
];

const STEPS = [
  { icon: User, key: 'profile' },
  { icon: Palette, key: 'visual' },
  { icon: Settings, key: 'settings' },
] as const;

const AdminOnboardingWizard: React.FC<Props> = ({ storeId, storeName, storeDescription, storeAvatarUrl, onComplete }) => {
  const { t } = useTranslation();
  const { updateColors, config, setConfig } = useWhiteLabel();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Profile
  const [name, setName] = useState(storeName || '');
  const [description, setDescription] = useState(storeDescription || '');
  const [avatarUrl, setAvatarUrl] = useState(storeAvatarUrl || '');

  // Step 2 — Visual
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    const all = [...darkTemplates, ...lightTemplates];
    return all.find(t => t.primary === config.colors.primary && t.mode === (config.colors.mode || 'dark')) || darkTemplates[0];
  });
  const [heroGreeting, setHeroGreeting] = useState(config.heroGreeting || '');
  const [heroSubtitle, setHeroSubtitle] = useState(config.heroSubtitle || '');

  // Step 3 — Settings
  const [enableVip, setEnableVip] = useState(true);
  const [enableCustoms, setEnableCustoms] = useState(true);
  const [enableCommunity, setEnableCommunity] = useState(true);

  const progress = ((step + 1) / STEPS.length) * 100;

  const saveStep = async () => {
    setSaving(true);
    try {
      if (step === 0) {
        // Save store profile
        const { error } = await supabase.from('stores').update({
          name: name.trim(),
          description: description.trim(),
          avatar_url: avatarUrl.trim() || null,
        }).eq('id', storeId);
        if (error) throw error;
      } else if (step === 1) {
        // Apply color template
        updateColors({
          primary: selectedTemplate.primary,
          accent: selectedTemplate.accent,
          background: selectedTemplate.mode === 'light' ? '0 0% 98%' : '0 0% 4%',
          mode: selectedTemplate.mode,
        });
        // Save hero text
        setConfig({ ...config, heroGreeting, heroSubtitle });
      } else if (step === 2) {
        // Save platform settings via config
        const navTabs = config.navigationTabs.map(tab => {
          if (tab.id === 'vip') return { ...tab, enabled: enableVip };
          if (tab.id === 'customs') return { ...tab, enabled: enableCustoms };
          if (tab.id === 'comunidade') return { ...tab, enabled: enableCommunity };
          return tab;
        });
        setConfig({ ...config, navigationTabs: navTabs });

        // Mark onboarding as completed
        const { error } = await supabase.from('stores').update({ onboarding_completed: true }).eq('id', storeId);
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      toast.error(t('onboarding.saveError'));
      setSaving(false);
      return;
    }
    setSaving(false);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      toast.success(t('onboarding.complete'));
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1">
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, hsl(330 81% 60%), hsl(263 70% 58%))' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step indicators */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < step;
          const isCurrent = i === step;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isDone ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-transparent' :
                isCurrent ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 bg-white/5'
              }`}>
                {isDone ? <Check className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${isCurrent ? 'text-purple-400' : 'text-white/30'}`} />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 ${isDone ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <motion.div
        className="w-full max-w-lg mx-4 rounded-2xl border border-white/10 p-8"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 1 — Profile */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('onboarding.profileTitle')}</h2>
                  <p className="text-sm text-white/50 mt-1">{t('onboarding.profileDesc')}</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">{t('onboarding.storeName')}</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder={t('onboarding.storeNamePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">{t('onboarding.storeDescription')}</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none" placeholder={t('onboarding.storeDescPlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">{t('onboarding.avatarUrl')}</Label>
                    <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="https://..." />
                    {avatarUrl && (
                      <div className="flex justify-center pt-2">
                        <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Visual Identity */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('onboarding.visualTitle')}</h2>
                  <p className="text-sm text-white/50 mt-1">{t('onboarding.visualDesc')}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Dark</p>
                  <div className="grid grid-cols-6 gap-2">
                    {darkTemplates.map(tmpl => (
                      <button key={tmpl.id} onClick={() => setSelectedTemplate(tmpl)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${selectedTemplate.id === tmpl.id ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-white/10 hover:border-white/20'}`}>
                        <div className={`w-8 h-8 rounded-full ${tmpl.tw} shadow-lg`}>
                          {selectedTemplate.id === tmpl.id && <div className="w-full h-full rounded-full flex items-center justify-center bg-black/30"><Check className="w-4 h-4 text-white" /></div>}
                        </div>
                        <span className="text-[10px] text-white/60">{tmpl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Light</p>
                  <div className="grid grid-cols-6 gap-2">
                    {lightTemplates.map(tmpl => (
                      <button key={tmpl.id} onClick={() => setSelectedTemplate(tmpl)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${selectedTemplate.id === tmpl.id ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-white/10 hover:border-white/20'}`}>
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center">
                          <div className={`w-5 h-5 rounded-full ${tmpl.tw}`}>
                            {selectedTemplate.id === tmpl.id && <div className="w-full h-full rounded-full flex items-center justify-center bg-black/20"><Check className="w-3 h-3 text-white" /></div>}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/60">{tmpl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/70 text-xs">{t('onboarding.heroTitle')}</Label>
                    <Input value={heroGreeting} onChange={e => setHeroGreeting(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm h-9 placeholder:text-white/30" placeholder="Welcome! 🤍" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-xs">{t('onboarding.heroSubtitle')}</Label>
                    <Input value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm h-9 placeholder:text-white/30" placeholder="Relax with quality content" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Platform Settings */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('onboarding.settingsTitle')}</h2>
                  <p className="text-sm text-white/50 mt-1">{t('onboarding.settingsDesc')}</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: t('onboarding.enableVip'), desc: t('onboarding.enableVipDesc'), checked: enableVip, set: setEnableVip },
                    { label: t('onboarding.enableCustoms'), desc: t('onboarding.enableCustomsDesc'), checked: enableCustoms, set: setEnableCustoms },
                    { label: t('onboarding.enableCommunity'), desc: t('onboarding.enableCommunityDesc'), checked: enableCommunity, set: setEnableCommunity },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                      </div>
                      <Switch checked={item.checked} onCheckedChange={item.set} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={saveStep}
            disabled={saving || (step === 0 && !name.trim())}
            className="gap-2 px-6"
            style={{ background: 'linear-gradient(135deg, hsl(330 81% 60%), hsl(263 70% 58%))' }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{t('common.loading')}</>
            ) : step === STEPS.length - 1 ? (
              <><Check className="w-4 h-4" />{t('onboarding.finish')}</>
            ) : (
              <><span>{t('onboarding.next')}</span><ChevronRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOnboardingWizard;
