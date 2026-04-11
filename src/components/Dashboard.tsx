import { useEffect, useMemo } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { FinancialSnapshot } from './FinancialSnapshot';
import { Calendar, MapPin, Scale, Plus } from 'lucide-react';
import { differenceInHours, parseISO } from 'date-fns';
import clsx from 'clsx';
import type { Case } from '../types';

export function Dashboard({ onAddCase }: { onAddCase: () => void }) {
  const { cases, fetchCases, loading } = useCaseStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const totalPending = useMemo(() => {
    return cases.reduce((acc, curr) => acc + (curr.totalFees - curr.feesPaid), 0);
  }, [cases]);

  // Group and sort cases
  const groupedCases = useMemo(() => {
    const activeCases = cases.filter(c => c.status === 'active');
    
    // Sort all cases by nearest date first
    activeCases.sort((a, b) => new Date(a.nextHearingDate).getTime() - new Date(b.nextHearingDate).getTime());

    // Group by court
    const groups = activeCases.reduce((acc, curr) => {
      const court = curr.court || 'Other';
      if (!acc[court]) acc[court] = [];
      acc[court].push(curr);
      return acc;
    }, {} as Record<string, Case[]>);

    return groups;
  }, [cases]);

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }


  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">Dashboard</h2>
          <p className="text-slate-400 mt-2">Manage your active cases and review pending tasks.</p>
        </div>
        <button 
          onClick={onAddCase}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all font-medium"
        >
          <Plus size={20} />
          <span>Add New Case</span>
        </button>
      </div>

      <div className="mb-10">
        <FinancialSnapshot totalPending={totalPending} />
      </div>

      <div className="space-y-10">
        {Object.entries(groupedCases).map(([court, courtCases]) => (
          <div key={court}>
            <div className="flex items-center space-x-3 mb-4">
              <Scale className="text-amber-500" size={24} />
              <h3 className="text-xl font-semibold text-slate-200">{court} Cases</h3>
              <span className="bg-slate-800 text-sm py-1 px-3 rounded-full text-slate-400">{courtCases.length}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courtCases.map((caseItem) => {
                const hoursUntil = differenceInHours(parseISO(caseItem.nextHearingDate), new Date());
                const isUrgent = hoursUntil >= 0 && hoursUntil <= 48;

                return (
                  <div 
                    key={caseItem.id} 
                    className={clsx(
                      "glass-panel p-5 relative transition-all hover:scale-[1.02]",
                      isUrgent ? "border-red-500/50 shadow-red-500/10" : ""
                    )}
                  >
                    {isUrgent && (
                      <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-red-400 animate-pulse">
                        URGENT
                      </div>
                    )}
                    
                    <h4 className="font-bold text-lg text-slate-100 mb-1 truncate">{caseItem.title}</h4>
                    <p className="text-sm text-slate-400 font-mono mb-4">{caseItem.caseNumber}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-slate-300">
                        <Calendar size={16} className="mr-2 text-blue-400" />
                        <span>{new Date(caseItem.nextHearingDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-300">
                        <MapPin size={16} className="mr-2 text-blue-400" />
                        <span className="truncate">{caseItem.court}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedCases).length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
            <Scale size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">No active cases found. Add your first case to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
