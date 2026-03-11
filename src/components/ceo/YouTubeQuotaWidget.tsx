import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, ChevronDown, Info } from 'lucide-react';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

export function YouTubeQuotaWidget() {
  const { config } = useWhiteLabel();
  const [expanded, setExpanded] = useState(false);

  const storeIntegrations = config.youtube?.storeIntegrations ?? {};

  const uniqueChannels = useMemo(() => {
    const ids = new Set<string>();
    Object.values(storeIntegrations).forEach((integration: any) => {
      integration.channels?.forEach((ch: any) => {
        const id = ch.channelId?.trim();
        if (id) ids.add(id);
      });
    });
    return ids.size;
  }, [storeIntegrations]);

  const DAILY_LIMIT = 10_000;
  const UNITS_PER_FETCH = 4;
  const CACHE_TTL_HOURS = 6;
  const FETCHES_PER_DAY = Math.ceil(24 / CACHE_TTL_HOURS);

  const dailyUsage = uniqueChannels * UNITS_PER_FETCH * FETCHES_PER_DAY;
  const percentage = Math.min((dailyUsage / DAILY_LIMIT) * 100, 100);

  const getColor = () => {
    if (percentage >= 80) return 'text-red-400';
    if (percentage >= 50) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getBarColor = () => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="px-3 mt-4">
      <div className="rounded-xl border border-amber-600/20 bg-amber-950/30 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-amber-500/10 transition-colors text-left"
        >
          <Gauge className={`w-4 h-4 shrink-0 ${getColor()}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-amber-100/80">
              Cota API YouTube
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 rounded-full bg-amber-900/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor()}`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
              <span className={`text-[10px] font-mono font-semibold ${getColor()}`}>
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-amber-500/50 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2.5 border-t border-amber-600/15 pt-2.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg bg-amber-900/30 p-2">
                    <p className="text-[9px] uppercase tracking-wider text-amber-500/60">
                      Canais
                    </p>
                    <p className="text-sm font-bold text-amber-100">{uniqueChannels}</p>
                  </div>
                  <div className="rounded-lg bg-amber-900/30 p-2">
                    <p className="text-[9px] uppercase tracking-wider text-amber-500/60">
                      Cotas/dia
                    </p>
                    <p className="text-sm font-bold text-amber-100">
                      {dailyUsage.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] text-amber-300/60">
                  <div className="flex justify-between">
                    <span>Limite</span>
                    <span className="font-mono">{DAILY_LIMIT.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Por fetch</span>
                    <span className="font-mono">~{UNITS_PER_FETCH} un.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache</span>
                    <span className="font-mono">{CACHE_TTL_HOURS}h ({FETCHES_PER_DAY}x/dia)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restantes</span>
                    <span className="font-mono font-semibold text-amber-100">
                      {Math.max(
                        0,
                        Math.floor(
                          (DAILY_LIMIT - dailyUsage) / (UNITS_PER_FETCH * FETCHES_PER_DAY)
                        )
                      )} canais
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/15 p-1.5">
                  <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-300/70 leading-relaxed">
                    Reset diário às 00:00 PT.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
