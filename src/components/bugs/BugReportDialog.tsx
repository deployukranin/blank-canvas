import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug, Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { BUG_CATEGORIES, BUG_SEVERITIES } from '@/lib/report-reasons';
import { validateUserText, isPersonalDataDbError } from '@/lib/content-filter';
import { cn } from '@/lib/utils';

const DESC_MAX = 400;

interface BugReportDialogProps {
  /** Style of the trigger button */
  variant?: 'sidebar' | 'ghost';
  className?: string;
}

/**
 * User-facing bug report. Submissions are only visible to the platform
 * super admin at /admin-master/bugs — never inside the store admin panel.
 */
export const BugReportDialog = ({ variant = 'sidebar', className }: BugReportDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { store } = useTenant();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated) return null;

  const submit = async () => {
    if (!category || !user?.id) return;

    const check = validateUserText([description], t);
    if (!check.ok) {
      toast({ title: t('filter.blockedTitle', 'Content blocked'), description: check.message, variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('bug_reports').insert({
      store_id: store?.id ?? null,
      user_id: user.id,
      category,
      severity,
      description: description.trim().slice(0, DESC_MAX) || null,
      route: location.pathname,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
    });
    setSaving(false);

    if (error) {
      toast({
        title: t('bugs.errorTitle', 'Could not send'),
        description: isPersonalDataDbError(error)
          ? t('filter.generic', 'Contact info and links are not allowed.')
          : error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: t('bugs.sentTitle', 'Bug reported'), description: t('bugs.sentDesc', 'Thanks! Our team was notified.') });
    setCategory(''); setSeverity('medium'); setDescription('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            variant === 'sidebar'
              ? 'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm border border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all'
              : 'flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors',
            className,
          )}
        >
          <Bug className="w-[18px] h-[18px]" />
          {t('bugs.reportBug', 'Report a bug')}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            {t('bugs.reportBug', 'Report a bug')}
          </DialogTitle>
          <DialogDescription>{t('bugs.dialogDesc', 'Pick what went wrong. The page and device info are attached automatically.')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium mb-2 block">{t('bugs.category', 'What happened?')}</Label>
            <RadioGroup value={category} onValueChange={setCategory} className="space-y-1">
              {BUG_CATEGORIES.map((c) => (
                <div key={c.code} className="flex items-center space-x-2">
                  <RadioGroupItem value={c.code} id={`bug-${c.code}`} />
                  <Label htmlFor={`bug-${c.code}`} className="text-sm cursor-pointer font-normal">
                    {t(c.labelKey, c.fallback)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">{t('bugs.severity', 'Severity')}</Label>
            <div className="flex gap-2">
              {BUG_SEVERITIES.map((s) => (
                <Button
                  key={s.code}
                  type="button"
                  size="sm"
                  variant={severity === s.code ? 'default' : 'outline'}
                  onClick={() => setSeverity(s.code)}
                  className="flex-1"
                >
                  {t(s.labelKey, s.fallback)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">{t('bugs.description', 'Details (optional)')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
              placeholder={t('filter.noContactInfo', 'Do not include links, emails or phone numbers.')}
              rows={3}
              maxLength={DESC_MAX}
            />
            <p className="text-[11px] text-muted-foreground mt-1">{description.length}/{DESC_MAX}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button className="flex-1 gap-2" disabled={!category || saving} onClick={submit}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t('bugs.send', 'Send')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportDialog;
