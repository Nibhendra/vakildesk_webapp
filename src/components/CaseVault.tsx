import { useEffect, useState, useMemo } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { Search, Briefcase, Trash2, Calendar, Scale, Filter, Pencil, Sparkles, MessageCircle } from 'lucide-react';
import clsx from 'clsx';
import type { Case } from '../types';
import { EditCaseModal } from './EditCaseModal';
import { AIAnalysisModal } from './AIAnalysisModal';
import { CommunicationModal } from './CommunicationModal';
import { formatHearingDate } from '../utils/dateFormat';

const COURTS = ['All', 'Supreme Court', 'High Court', 'District Court', 'Tribunal'];
const STATUSES = ['All', 'active', 'closed'];

export function CaseVault({ onAddCase }: { onAddCase: () => void }) {
  const { cases, fetchCases, deleteCase, loading } = useCaseStore();
  const [search, setSearch] = useState('');
  const [courtFilter, setCourtFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [analyzingCase, setAnalyzingCase] = useState<Case | null>(null);
  const [communicatingCase, setCommunicatingCase] = useState<Case | null>(null);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filtered = useMemo(() => {
    const filteredList = cases.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(search.toLowerCase());
      const matchCourt = courtFilter === 'All' || c.court === courtFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchSearch && matchCourt && matchStatus;
    });

    // Sort by latest date first (descending order)
    return filteredList.sort((a, b) => {
      const dateA = new Date(a.nextHearingDate || 0).getTime();
      const dateB = new Date(b.nextHearingDate || 0).getTime();
      return dateB - dateA;
    });
  }, [cases, search, courtFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this case? This action cannot be undone.')) return;
    setDeletingId(id);
    await deleteCase(id);
    setDeletingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            Case Vault
          </h2>
          <p className="text-slate-400 mt-2">All your cases in one place. Search, filter, and manage.</p>
        </div>
        <button
          onClick={onAddCase}
          aria-label="Add new case"
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all font-medium cursor-pointer"
        >
          <Briefcase size={18} />
          <span>Add Case</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or case number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-3">
          <Filter size={16} className="text-slate-400" />
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="bg-transparent text-slate-300 py-2.5 focus:outline-none text-sm cursor-pointer"
          >
            {COURTS.map((c) => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-300 py-2.5 focus:outline-none text-sm cursor-pointer"
          >
            {STATUSES.map((s) => <option key={s} value={s} className="bg-slate-800 capitalize">{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Cases', value: cases.length },
          { label: 'Active', value: cases.filter(c => c.status === 'active').length, color: 'text-green-400' },
          { label: 'Closed', value: cases.filter(c => c.status === 'closed').length, color: 'text-slate-400' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={clsx('text-2xl font-bold', stat.color || 'text-slate-100')}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-slate-800 border-dashed rounded-xl text-slate-500">
          <Scale size={40} className="mx-auto mb-3 text-slate-700" />
          No cases match your filters.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Case Title</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Case No.</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Court</th>
                <th className="text-left px-5 py-3">Next Hearing</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((c: Case) => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors group">
                  <td className="px-5 py-4 font-medium text-slate-200 max-w-[200px] truncate">{c.title}</td>
                  <td className="px-5 py-4 text-slate-400 font-mono hidden md:table-cell">{c.caseNumber}</td>
                  <td className="px-5 py-4 text-slate-300 hidden lg:table-cell">{c.court}</td>
                  <td className="px-5 py-4 text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <Calendar size={13} className="text-blue-400 shrink-0" />
                      <span>{formatHearingDate(c.nextHearingDate)}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx(
                      'text-xs font-semibold px-2.5 py-1 rounded-full',
                      c.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-600/20 text-slate-400'
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setCommunicatingCase(c)}
                        aria-label={`Communicate with ${c.clientName || 'Client'}`}
                        className="p-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer rounded-lg hover:bg-emerald-500/10"
                        title="Client Communication & Invoice"
                      >
                        <MessageCircle size={15} />
                      </button>
                      <button
                        onClick={() => setAnalyzingCase(c)}
                        aria-label={`Analyze ${c.title}`}
                        className="p-2 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer rounded-lg hover:bg-amber-500/10"
                        title="AI Document Analysis"
                      >
                        <Sparkles size={15} />
                      </button>
                      <button
                        onClick={() => setEditingCase(c)}
                        aria-label={`Edit ${c.title}`}
                        className="p-2 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer rounded-lg hover:bg-blue-500/10"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => c.id && handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        aria-label={`Delete ${c.title}`}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10"
                      >
                        {deletingId === c.id
                          ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-red-400" />
                          : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingCase && (
        <EditCaseModal
          caseData={editingCase}
          onClose={() => setEditingCase(null)}
        />
      )}

      {/* AI Analysis Modal */}
      {analyzingCase && (
        <AIAnalysisModal
          caseData={analyzingCase}
          onClose={() => setAnalyzingCase(null)}
        />
      )}

      {/* Communication Modal */}
      {communicatingCase && (
        <CommunicationModal
          caseData={communicatingCase}
          onClose={() => setCommunicatingCase(null)}
        />
      )}
    </div>
  );
}
