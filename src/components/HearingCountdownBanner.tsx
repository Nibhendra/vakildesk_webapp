import { useMemo, useEffect, useState } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { differenceInHours, differenceInDays, parseISO, isThisWeek } from 'date-fns';
import { Bell, X, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export function HearingCountdownBanner({ onViewCalendar }: { onViewCalendar: () => void }) {
  const { cases } = useCaseStore();
  const [dismissed, setDismissed] = useState(false);
  const [tick, setTick] = useState(0);

  // Tick every minute to refresh countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const { thisWeekCount, nextCase, hoursUntil } = useMemo(() => {
    const now = new Date();
    const activeCases = cases.filter(c => {
      if (c.status !== 'active') return false;
      const d = new Date(c.nextHearingDate);
      return !isNaN(d.getTime()) && d >= now;
    });

    // Cases this week
    const thisWeekCount = activeCases.filter(c =>
      isThisWeek(parseISO(c.nextHearingDate), { weekStartsOn: 1 })
    ).length;

    // Next upcoming case
    const sorted = [...activeCases].sort(
      (a, b) => new Date(a.nextHearingDate).getTime() - new Date(b.nextHearingDate).getTime()
    );
    const nextCase = sorted[0] ?? null;
    const hoursUntil = nextCase ? differenceInHours(parseISO(nextCase.nextHearingDate), now) : null;

    return { thisWeekCount, nextCase, hoursUntil };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases, tick]);

  if (dismissed || !nextCase) return null;

  const isUrgent = hoursUntil !== null && hoursUntil <= 48;
  const daysUntil = hoursUntil !== null ? differenceInDays(parseISO(nextCase.nextHearingDate), new Date()) : null;

  const countdownLabel = hoursUntil === 0
    ? 'Today!'
    : hoursUntil === 1
    ? 'in 1 hour'
    : hoursUntil !== null && hoursUntil < 24
    ? `in ${hoursUntil} hours`
    : daysUntil === 1
    ? 'Tomorrow'
    : `in ${daysUntil} days`;

  return (
    <div
      className={clsx(
        'mx-8 mt-6 mb-2 rounded-xl border px-5 py-3 flex items-center justify-between gap-4 transition-all',
        isUrgent
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-blue-500/10 border-blue-500/20'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={clsx(
          'shrink-0 rounded-lg p-1.5',
          isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
        )}>
          <Bell size={16} className={isUrgent ? 'animate-pulse' : ''} />
        </div>

        <div className="min-w-0">
          <span className={clsx('text-sm font-semibold', isUrgent ? 'text-red-300' : 'text-blue-300')}>
            {isUrgent ? '⚠ URGENT — ' : ''}
            Next hearing {countdownLabel}
          </span>
          <span className="text-sm theme-muted mx-2">·</span>
          <span className="text-sm text-slate-300 truncate">
            <span className="font-medium">{nextCase.title}</span>
            <span className="theme-dim"> @ {nextCase.court}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {thisWeekCount > 0 && (
          <span className="text-xs font-medium bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600/40">
            {thisWeekCount} this week
          </span>
        )}
        <button
          onClick={onViewCalendar}
          className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
        >
          View <ChevronRight size={14} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
