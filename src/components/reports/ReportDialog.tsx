import { useState } from 'react';
import { Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { REPORT_REASONS } from '@/lib/report-reasons';
import { validateUserText, isPersonalDataDbError } from '@/lib/content-filter';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'idea' | 'comment';
  targetId: string;
  targetTitle?: string;
  targetAuthor?: string;
  onSubmitted?: () => void;
}

const DETAIL_MAX = 200;

export const ReportDialog = ({
  open, onOpenChange, targetType, targetId, targetTitle, targetAuthor, onSubmitted,
}: ReportDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store } = useTenant();
  const [reason, setReason] = useState<string>('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setReason(''); setDetail(''); };

  const handleSubmit = async () => {
    if (!reason || !user?.id) return;

    if (reason === 'other') {
      const check = validateUserText([detail], t);
      if (!check.ok) {
        toast({ title: t('filter.blockedTitle', 'Content blocked'), description: check.message, variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    const { error } = await supabase.from('content_reports').insert({
      store_id: store?.id ?? null,
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle?.slice(0, 140) ?? null,
      target_author: targetAuthor ?? null,
      reason_code: reason,
      detail: reason === 'other' ? detail.trim().slice(0, DETAIL_MAX) || null : null,
    });
    setSaving(false);

    if (error) {
      const duplicate = error.code === '23505';
      toast({
        title: t('storefront.reportError', 'Could not report'),
        description: duplicate
          ? t('storefront.alreadyReported', 'You already reported this content.')
          : isPersonalDataDbError(error)
            ? t('filter.generic', 'Contact info and links are not allowed.')
            : error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('storefront.reportSubmitted', 'Report sent'),
      description: t('storefront.reportSubmittedDesc', 'Thanks, our team will review it.'),
    });
    reset();
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {targetType === 'idea'
              ? t('storefront.reportIdeaTitle', 'Report idea')
              : t('storefront.reportCommentTitle', 'Report comment')}
          </DialogTitle>
          <DialogDescription>{t('storefront.reportHelpText', 'Pick the reason that best describes the problem.')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {targetTitle && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t('storefront.reportedContent', 'Reported content')}</p>
              <p className="text-sm font-medium truncate">{targetTitle}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block">{t('storefront.reportReason', 'Reason')}</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-1">
              {REPORT_REASONS.map((r) => (
                <div key={r.code} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.code} id={`report-${r.code}`} />
                  <Label htmlFor={`report-${r.code}`} className="text-sm cursor-pointer font-normal">
                    {t(r.labelKey, r.fallback)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {reason === 'other' && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                {t('storefront.describeIssue', 'Short detail (optional)')}
              </Label>
              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, DETAIL_MAX))}
                placeholder={t('filter.noContactInfo', 'Do not include links, emails or phone numbers.')}
                rows={3}
                maxLength={DETAIL_MAX}
              />
              <p className="text-[11px] text-muted-foreground mt-1">{detail.length}/{DETAIL_MAX}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!reason || saving} variant="destructive" className="flex-1 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {t('storefront.reportContent', 'Report')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
