import { useState } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { X, Save, AlertCircle } from 'lucide-react';
import type { Case } from '../types';
import { todayISO } from '../utils/dateFormat';

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
        <p className="text-slate-400 text-sm mb-6 font-mono">{caseData.caseNumber}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

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
