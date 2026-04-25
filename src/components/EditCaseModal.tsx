import { useState } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { X, Save, AlertCircle, Sparkles, StickyNote } from 'lucide-react';
import type { Case } from '../types';
import { todayISO } from '../utils/dateFormat';
import { CaseNotes } from './CaseNotes';

interface FormErrors {
  title?: string;
  caseNumber?: string;
  nextHearingDate?: string;
  feesPaid?: string;
}

interface EditCaseModalProps {
  caseData: Case;
  onClose: () => void;
}

export function EditCaseModal({ caseData, onClose }: EditCaseModalProps) {
  const [formData, setFormData] = useState<Case>({ ...caseData });
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const { updateCase, loading } = useCaseStore();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title?.trim()) newErrors.title = 'Case Title is required.';
    if (!formData.caseNumber?.trim()) newErrors.caseNumber = 'Case Number is required.';
    if (!formData.nextHearingDate) {
      newErrors.nextHearingDate = 'Next Hearing Date is required.';
    } else if (formData.nextHearingDate < todayISO()) {
      newErrors.nextHearingDate = 'Hearing date cannot be in the past.';
    }
    if (formData.feesPaid > formData.totalFees) newErrors.feesPaid = 'Fees Paid cannot exceed Total Fees.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !formData.id) return;
    await updateCase(formData.id, formData);
    onClose();
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-slate-800 border rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
      hasError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-blue-500'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Case"
    >
      <div className="w-full max-w-2xl glass-panel relative p-8 shadow-2xl shadow-blue-900/20">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-100 mb-1">Edit Case</h2>
        <p className="text-slate-400 text-sm mb-4 font-mono">{caseData.caseNumber}</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'details' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save size={14} /> Details
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'notes' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <StickyNote size={14} /> Notes
          </button>
        </div>

        {activeTab === 'notes' && caseData.id && (
          <div className="mb-6">
            <CaseNotes caseId={caseData.id} />
          </div>
        )}

        {activeTab === 'details' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Case Title */}
          <div className="space-y-1">
            <label htmlFor="edit-title" className="text-sm font-medium text-slate-300">
              Case Title <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={e => { setFormData({ ...formData, title: e.target.value }); setErrors(p => ({ ...p, title: undefined })); }}
              className={inputClass(!!errors.title)}
              placeholder="e.g. Sharma vs State"
              aria-required="true"
            />
            {errors.title && <p className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.title}</p>}
          </div>

          {/* Case Number */}
          <div className="space-y-1">
            <label htmlFor="edit-casenum" className="text-sm font-medium text-slate-300">
              Case Number <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-casenum"
              type="text"
              value={formData.caseNumber}
              onChange={e => { setFormData({ ...formData, caseNumber: e.target.value }); setErrors(p => ({ ...p, caseNumber: undefined })); }}
              className={inputClass(!!errors.caseNumber)}
              placeholder="CNR / Case No"
              aria-required="true"
            />
            {errors.caseNumber && <p className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.caseNumber}</p>}
          </div>

          {/* Client Name */}
          <div className="space-y-1">
            <label htmlFor="edit-client-name" className="text-sm font-medium text-slate-300">
              Client Name
            </label>
            <input
              id="edit-client-name"
              type="text"
              value={formData.clientName || ''}
              onChange={e => setFormData({ ...formData, clientName: e.target.value })}
              className={inputClass(false)}
              placeholder="Rahul Sharma"
            />
          </div>

          {/* Client Phone */}
          <div className="space-y-1">
            <label htmlFor="edit-client-phone" className="text-sm font-medium text-slate-300">
              Client Phone (WhatsApp)
            </label>
            <input
              id="edit-client-phone"
              type="tel"
              value={formData.clientPhone || ''}
              onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
              className={inputClass(false)}
              placeholder="+91 9999999999"
            />
          </div>
          {/* Court */}
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="edit-court" className="text-sm font-medium text-slate-300">Court</label>
            <select
              id="edit-court"
              value={formData.court}
              onChange={e => setFormData({ ...formData, court: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="Supreme Court">Supreme Court</option>
              <option value="High Court">High Court</option>
              <option value="District Court">District Court</option>
              <option value="Tribunal">Tribunal</option>
            </select>
          </div>

          {/* Next Hearing Date */}
          <div className="space-y-1">
            <label htmlFor="edit-date" className="text-sm font-medium text-slate-300">
              Next Hearing Date <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-date"
              type="date"
              min={todayISO()}
              value={formData.nextHearingDate}
              onChange={e => { setFormData({ ...formData, nextHearingDate: e.target.value }); setErrors(p => ({ ...p, nextHearingDate: undefined })); }}
              className={inputClass(!!errors.nextHearingDate)}
              aria-required="true"
            />
            {errors.nextHearingDate && <p className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.nextHearingDate}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label htmlFor="edit-status" className="text-sm font-medium text-slate-300">Status</label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'closed' })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Total Fees */}
          <div className="space-y-1">
            <label htmlFor="edit-total-fees" className="text-sm font-medium text-slate-300">Total Fees (₹)</label>
            <input
              id="edit-total-fees"
              type="number"
              min="0"
              step="1"
              value={formData.totalFees}
              onChange={e => setFormData({ ...formData, totalFees: Math.max(0, Number(e.target.value)) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Fees Paid */}
          <div className="space-y-1">
            <label htmlFor="edit-fees-paid" className="text-sm font-medium text-slate-300">Fees Paid (₹)</label>
            <input
              id="edit-fees-paid"
              type="number"
              min="0"
              max={formData.totalFees}
              value={formData.feesPaid}
              onChange={e => {
                const val = Number(e.target.value);
                setFormData({ ...formData, feesPaid: val });
                setErrors(p => ({ ...p, feesPaid: val > formData.totalFees ? 'Fees Paid cannot exceed Total Fees.' : undefined }));
              }}
              className={inputClass(!!errors.feesPaid)}
            />
            {errors.feesPaid && <p className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.feesPaid}</p>}
          </div>
        </div>}

        {caseData.aiSummary && (
          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <h3 className="text-sm font-medium flex items-center space-x-2 text-slate-300 mb-3">
              <Sparkles size={16} className="text-amber-400" />
              <span>AI Case Summary</span>
            </h3>
            <div className="text-slate-400 whitespace-pre-wrap leading-relaxed text-sm format-markdown max-h-40 overflow-y-auto pr-2">
              {caseData.aiSummary}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            aria-label="Save changes"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
