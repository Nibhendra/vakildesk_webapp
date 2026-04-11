import { useState } from 'react';
import { SmartDropZone } from './SmartDropZone';
import { useCaseStore } from '../store/useCaseStore';
import { X, Save } from 'lucide-react';
import type { Case } from '../types';

export function AddCaseModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1); // 1: OCR Upload, 2: Form Review
  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    caseNumber: '',
    court: 'District Court',
    nextHearingDate: '',
    totalFees: 0,
    feesPaid: 0,
    status: 'active'
  });

  const { addCase, loading } = useCaseStore();

  const handleDataParsed = (data: { title: string; caseNumber: string; date: string }) => {
    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
      caseNumber: data.caseNumber || prev.caseNumber,
      nextHearingDate: data.date || prev.nextHearingDate
    }));
    setStep(2);
  };

  const handleSave = async () => {
    try {
      await addCase(formData as Omit<Case, 'id' | 'userId'>);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-panel relative p-8 shadow-2xl shadow-blue-900/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          {step === 1 ? 'Add New Case' : 'Review Case Details'}
        </h2>

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-slate-400">Use our AI OCR to automatically extract the case details from a document, or skip to enter manually.</p>
            <SmartDropZone onDataParsed={handleDataParsed} />
            <button 
              onClick={() => setStep(2)}
              className="w-full py-3 text-slate-300 hover:text-slate-100 underline decoration-slate-600 underline-offset-4"
            >
              Skip and Enter Manually
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Case Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. John vs State"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Case Number</label>
                <input 
                  type="text" 
                  value={formData.caseNumber} 
                  onChange={e => setFormData({ ...formData, caseNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="CNR / Case No"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">Court</label>
                <select 
                  value={formData.court} 
                  onChange={e => setFormData({ ...formData, court: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Supreme Court">Supreme Court</option>
                  <option value="High Court">High Court</option>
                  <option value="District Court">District Court</option>
                  <option value="Tribunal">Tribunal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Next Hearing (YYYY-MM-DD)</label>
                <input 
                  type="date" 
                  value={formData.nextHearingDate} 
                  onChange={e => setFormData({ ...formData, nextHearingDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'closed' })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Total Fees (₹)</label>
                <input 
                  type="number" 
                  value={formData.totalFees} 
                  onChange={e => setFormData({ ...formData, totalFees: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Fees Paid (₹)</label>
                <input 
                  type="number" 
                  value={formData.feesPaid} 
                  onChange={e => setFormData({ ...formData, feesPaid: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-700">
              <button 
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all font-medium disabled:opacity-50"
              >
                <Save size={18} />
                <span>{loading ? 'Saving...' : 'Save Case'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
