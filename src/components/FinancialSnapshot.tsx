import { IndianRupee, TrendingUp } from 'lucide-react';

interface FinancialSnapshotProps {
  totalPending: number;
}

export function FinancialSnapshot({ totalPending }: FinancialSnapshotProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 py-6 pr-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp size={80} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-2 text-slate-400 mb-2">
          <IndianRupee size={18} />
          <h2 className="font-medium uppercase tracking-wider text-sm">Total Pending Fees</h2>
        </div>
        <div className="text-4xl font-bold text-amber-500 tracking-tight">
          ₹ {totalPending.toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  );
}
