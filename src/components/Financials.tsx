import { useEffect, useMemo } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { IndianRupee, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export function Financials() {
  const { cases, fetchCases, loading } = useCaseStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const stats = useMemo(() => {
    const activeCases = cases.filter(c => c.status === 'active');
    const totalFees = cases.reduce((acc, c) => acc + c.totalFees, 0);
    const totalPaid = cases.reduce((acc, c) => acc + Math.min(c.feesPaid, c.totalFees), 0);
    const totalPending = Math.max(0, totalFees - totalPaid);
    const collectionRate = totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 0;
    // Fully paid = has fees AND feesPaid >= totalFees
    const fullyPaid = cases.filter(c => c.totalFees > 0 && c.feesPaid >= c.totalFees);
    // Pending = active, has fees, not fully paid
    const pendingCases = activeCases.filter(c => c.totalFees > 0 && c.feesPaid < c.totalFees);
    return { totalFees, totalPaid, totalPending, collectionRate, pendingCases, fullyPaid };
  }, [cases]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
          Financials
        </h2>
        <p className="text-slate-400 mt-2">Track fees, pending dues, and collection rates across all cases.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Billed',
            value: fmt(stats.totalFees),
            icon: IndianRupee,
            color: 'from-blue-600/20 to-blue-900/10 border-blue-500/20',
            iconColor: 'text-blue-400',
          },
          {
            label: 'Total Collected',
            value: fmt(stats.totalPaid),
            icon: TrendingUp,
            color: 'from-green-600/20 to-green-900/10 border-green-500/20',
            iconColor: 'text-green-400',
          },
          {
            label: 'Total Pending',
            value: fmt(stats.totalPending),
            icon: TrendingDown,
            color: 'from-amber-600/20 to-amber-900/10 border-amber-500/20',
            iconColor: 'text-amber-400',
          },
          {
            label: 'Collection Rate',
            value: `${stats.collectionRate}%`,
            icon: CheckCircle2,
            color: 'from-purple-600/20 to-purple-900/10 border-purple-500/20',
            iconColor: 'text-purple-400',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={clsx(
                'bg-gradient-to-br border rounded-xl p-5 relative overflow-hidden',
                card.color
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                </div>
                <Icon size={22} className={card.iconColor} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Collection Rate Bar */}
      <div className="glass-panel p-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <p className="text-slate-300 font-medium">Overall Collection Progress</p>
          <span className="text-sm text-slate-400">{stats.collectionRate}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full transition-all duration-700"
            style={{ width: `${stats.collectionRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>₹0</span>
          <span>{fmt(stats.totalFees)}</span>
        </div>
      </div>

      {/* Per-Case Fee Breakdown */}
      <div className="glass-panel overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200">Per-Case Fee Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-700/30">
          {cases.map((c) => {
            const pending = Math.max(0, c.totalFees - c.feesPaid);
            const rate = c.totalFees > 0 ? Math.min(100, Math.round((c.feesPaid / c.totalFees) * 100)) : 0;
            const isPaid = c.totalFees > 0 && pending <= 0;
            return (
              <div key={c.id} className="px-6 py-4 hover:bg-slate-700/10 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-slate-200 truncate max-w-xs">{c.title}</p>
                    <p className="text-xs text-slate-500 font-mono">{c.caseNumber}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {isPaid ? (
                      <span className="flex items-center space-x-1 text-green-400 text-sm font-medium">
                        <CheckCircle2 size={14} />
                        <span>Paid in Full</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-amber-400 text-sm font-medium">
                        <AlertCircle size={14} />
                        <span>{fmt(pending)} Pending</span>
                      </span>
                    )}
                    <p className="text-xs text-slate-500 text-right mt-0.5">
                      {fmt(c.feesPaid)} / {fmt(c.totalFees)}
                    </p>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all',
                      isPaid ? 'bg-green-400' : 'bg-amber-400'
                    )}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle2 size={18} className="text-green-400" />
            <h4 className="font-semibold text-slate-200">Fully Paid Cases</h4>
          </div>
          {stats.fullyPaid.length === 0 ? (
            <p className="text-slate-500 text-sm">No fully paid cases yet.</p>
          ) : (
            <ul className="space-y-1">
              {stats.fullyPaid.map(c => (
                <li key={c.id} className="text-sm text-slate-300 flex justify-between">
                  <span className="truncate">{c.title}</span>
                  <span className="text-green-400 ml-2 shrink-0">{fmt(c.totalFees)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle size={18} className="text-amber-400" />
            <h4 className="font-semibold text-slate-200">Pending Dues</h4>
          </div>
          {stats.pendingCases.length === 0 ? (
            <p className="text-slate-500 text-sm">All fees collected!</p>
          ) : (
            <ul className="space-y-1">
              {stats.pendingCases.map(c => (
                <li key={c.id} className="text-sm text-slate-300 flex justify-between">
                  <span className="truncate">{c.title}</span>
                  <span className="text-amber-400 ml-2 shrink-0">{fmt(c.totalFees - c.feesPaid)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
