import { X, Calendar, MapPin, Scale, IndianRupee, FileText, MessageCircle, Pencil, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Case } from '../types';
import clsx from 'clsx';
import { formatHearingDate } from '../utils/dateFormat';
import { CaseNotes } from './CaseNotes';


interface CaseDetailDrawerProps {
  caseData: Case;
  onClose: () => void;
  onEdit: () => void;
  onCommunicate: () => void;
  onAnalyze: () => void;
}

export function CaseDetailDrawer({
  caseData,
  onClose,
  onEdit,
  onCommunicate,
  onAnalyze,
}: CaseDetailDrawerProps) {
  const pending = Math.max(0, caseData.totalFees - caseData.feesPaid);
  const isPaid = caseData.totalFees > 0 && pending <= 0;
  const rate = caseData.totalFees > 0
    ? Math.min(100, Math.round((caseData.feesPaid / caseData.totalFees) * 100))
    : 0;
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md flex flex-col glass-panel rounded-none rounded-l-2xl border-l border-slate-700/50 shadow-2xl shadow-blue-900/30 animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 bg-slate-800/30 shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl font-bold text-slate-100 leading-snug">{caseData.title}</h2>
            <p className="text-sm text-slate-400 font-mono mt-0.5">{caseData.caseNumber}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={clsx(
              'text-xs font-semibold px-2.5 py-1 rounded-full',
              caseData.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-600/20 text-slate-400'
            )}>
              {caseData.status}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Case Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <MapPin size={15} className="text-blue-400 shrink-0" />
              <span>{caseData.court}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Calendar size={15} className="text-blue-400 shrink-0" />
              <span>Next hearing: <span className="font-medium text-slate-100">{formatHearingDate(caseData.nextHearingDate)}</span></span>
            </div>
            {caseData.clientName && (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Scale size={15} className="text-blue-400 shrink-0" />
                <span>Client: <span className="font-medium text-slate-100">{caseData.clientName}</span></span>
              </div>
            )}
          </div>

          {/* Fees */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">Fee Summary</h3>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Collected: {fmt(caseData.feesPaid)}</span>
              <span>Total: {fmt(caseData.totalFees)}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className={clsx('h-full rounded-full transition-all duration-500', isPaid ? 'bg-green-400' : 'bg-amber-400')}
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className={clsx('flex items-center gap-1.5 text-xs font-medium mt-1', isPaid ? 'text-green-400' : 'text-amber-400')}>
              {isPaid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{isPaid ? 'Fully Paid' : `${fmt(pending)} pending`}</span>
            </div>
          </div>

          {/* AI Summary */}
          {caseData.aiSummary && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={15} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">AI Summary</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                {caseData.aiSummary}
              </p>
            </div>
          )}

          {/* Notes */}
          {caseData.id && <CaseNotes caseId={caseData.id} />}
        </div>

        {/* Action footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/20 shrink-0 grid grid-cols-3 gap-2">
          <button
            onClick={onCommunicate}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
          >
            <MessageCircle size={18} />
            <span className="text-xs font-medium">WhatsApp</span>
          </button>
          <button
            onClick={onAnalyze}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition-colors cursor-pointer"
          >
            <Sparkles size={18} />
            <span className="text-xs font-medium">AI Analyze</span>
          </button>
          <button
            onClick={onEdit}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-colors cursor-pointer"
          >
            <Pencil size={18} />
            <span className="text-xs font-medium">Edit</span>
          </button>
        </div>
      </div>
    </>
  );
}
