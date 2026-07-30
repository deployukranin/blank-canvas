import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { expiresAtMs, fetchTrialStatus, clockOffsetMs } from '@/lib/trial';

interface TrialCountdownProps {
  /** ISO date when the trial ends */
  expiresAt: string;
  /** Base path of the tenant admin (e.g. /myslug/admin) */
  basePath: string;
  /** Store id — enables the server-side (UTC) trial check */
  storeId?: string | null;
}

/**
 * Live trial countdown. Recomputes every minute so the remaining time
 * stays accurate without a page reload.
 *
 * The deadline is parsed as an absolute UTC instant (see `@/lib/trial`) and the
 * backend is asked for the authoritative remaining time, so a wrong/drifted
 * device clock cannot change what the user sees.
 */
export function TrialCountdown({ expiresAt, basePath, storeId }: TrialCountdownProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  // Server clock - device clock, in ms.
  const [offset, setOffset] = useState(0);
  const [serverExpiresAt, setServerExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    // Re-sync when the tab wakes up or the clock/timezone changes.
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, []);

  // Server-authoritative sync: removes any client clock drift.
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    const sync = async () => {
      const status = await fetchTrialStatus(storeId);
      if (cancelled || !status?.success) return;
      setOffset(clockOffsetMs(status.server_now));
      setServerExpiresAt(status.plan_expires_at ?? null);
      setNow(Date.now());
    };

    sync();
    // Re-sync periodically and when the tab regains focus.
    const id = setInterval(sync, 5 * 60_000);
    const onFocus = () => { if (document.visibilityState === 'visible') sync(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [storeId]);


  const { expired, isUrgent, label } = useMemo(() => {
    const end = expiresAtMs(expiresAt);
    const msLeft = end === null ? -1 : end - now;

    if (end === null || msLeft <= 0) {
      return { expired: true, isUrgent: true, label: t('admin.trial.expired') };
    }

    const hoursLeft = msLeft / 3_600_000;

    if (hoursLeft >= 24) {
      // Ceil so a freshly created 3-day trial reads "3 days", not "2".
      const days = Math.ceil(hoursLeft / 24);
      return {
        expired: false,
        isUrgent: days <= 1,
        label: t('admin.trial.daysLeft', { days }),
      };
    }

    if (hoursLeft >= 1) {
      return {
        expired: false,
        isUrgent: true,
        label: t('admin.trial.hoursLeft', { hours: Math.ceil(hoursLeft) }),
      };
    }

    return {
      expired: false,
      isUrgent: true,
      label: t('admin.trial.minutesLeft', { minutes: Math.max(1, Math.ceil(msLeft / 60_000)) }),
    };
  }, [expiresAt, now, t]);


  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
        isUrgent ? 'bg-destructive/10 border-destructive/30' : 'bg-yellow-500/10 border-yellow-500/30'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isUrgent ? (
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        ) : (
          <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
        )}
        <div className="min-w-0">
          <p className={`font-semibold text-sm break-words ${isUrgent ? 'text-destructive' : 'text-yellow-500'}`}>
            {label}
          </p>
          <p className="text-xs text-muted-foreground break-words">
            {expired ? t('admin.trial.expiredHint') : t('admin.trial.upgradeHint')}
          </p>
        </div>
      </div>
      <Link to={`${basePath}/plans`}>
        <Button size="sm" className="bg-primary hover:bg-primary/90 shrink-0">
          {t('admin.trial.upgrade')}
        </Button>
      </Link>
    </motion.div>
  );
}

export default TrialCountdown;
