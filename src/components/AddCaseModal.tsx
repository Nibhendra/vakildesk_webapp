import { useState } from 'react';
import { SmartDropZone } from './SmartDropZone';
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

export function AddCaseModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    caseNumber: '',
    court: 'District Court',
    nextHearingDate: '',
    totalFees: 0,
    feesPaid: 0,
    status: 'active',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { addCase, loading } = useCaseStore();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title?.trim()) {
      newErrors.title = 'Case Title is required.';
    }
    if (!formData.caseNumber?.trim()) {
      newErrors.caseNumber = 'Case Number is required.';
    }
    if (!formData.nextHearingDate) {
      newErrors.nextHearingDate = 'Next Hearing Date is required.';
    } else if (formData.nextHearingDate < todayISO()) {
      newErrors.nextHearingDate = 'Hearing date cannot be in the past.';
    }
    if ((formData.totalFees ?? 0) < 0) {
      // clamp — handled by min="0" on input, but guard here too
      setFormData(prev => ({ ...prev, totalFees: 0 }));
    }
    if ((formData.feesPaid ?? 0) < 0) {
      setFormData(prev => ({ ...prev, feesPaid: 0 }));
    }
    if ((formData.feesPaid ?? 0) > (formData.totalFees ?? 0)) {
      newErrors.feesPaid = 'Fees Paid cannot exceed Total Fees.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDataParsed = (data: { title: string; caseNumber: string; date: string }) => {
    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
      caseNumber: data.caseNumber || prev.caseNumber,
      nextHearingDate: data.date || prev.nextHearingDate,
    }));
    setErrors({});
    setStep(2);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await addCase(formData as Omit<Case, 'id' | 'userId'>);
      onClose();
    } catch (e) {
      console.error(e);
    }
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
      aria-label="Add New Case"
    >
      <div className="w-full max-w-2xl glass-panel relative p-8 shadow-2xl shadow-blue-900/20">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          {step === 1 ? 'Add New Case' : 'Review Case Details'}
        </h2>

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-slate-400">
              Use our AI OCR to automatically extract case details from a document, or skip to enter manually.
            </p>
            <SmartDropZone onDataParsed={handleDataParsed} />
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 text-slate-300 hover:text-slate-100 underline decoration-slate-600 underline-offset-4 cursor-pointer"
            >
              Skip and Enter Manually
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Case Title */}
              <div className="space-y-1">
                <label htmlFor="case-title" className="text-sm font-medium text-slate-300">
                  Case Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="case-title"
                  type="text"
                  value={formData.title}
                  onChange={e => { setFormData({ ...formData, title: e.target.value }); setErrors(prev => ({ ...prev, title: undefined })); }}
                  className={inputClass(!!errors.title)}
                  placeholder="e.g. Sharma vs State"
                  aria-required="true"
                  aria-describedby={errors.title ? 'title-error' : undefined}
                />
                {errors.title && (
                  <p id="title-error" className="flex items-center gap-1 text-xs text-red-400 mt-1">
                    <AlertCircle size={12} /> {errors.title}
                  </p>
                )}
              </div>

              {/* Case Number */}
              <div className="space-y-1">
                <label htmlFor="case-number" className="text-sm font-medium text-slate-300">
                  Case Number <span className="text-red-400">*</span>
                </label>
                <input
                  id="case-number"
                  type="text"
                  value={formData.caseNumber}
                  onChange={e => { setFormData({ ...formData, caseNumber: e.target.value }); setErrors(prev => ({ ...prev, caseNumber: undefined })); }}
                  className={inputClass(!!errors.caseNumber)}
                  placeholder="CNR / Case No"
                  aria-required="true"
                  aria-describedby={errors.caseNumber ? 'casenum-error' : undefined}
                />
                {errors.caseNumber && (
                  <p id="casenum-error" className="flex items-center gap-1 text-xs text-red-400 mt-1">
                    <AlertCircle size={12} /> {errors.caseNumber}
                  </p>
                )}
              </div>

              {/* Court */}
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="court" className="text-sm font-medium text-slate-300">Court</label>
                <select
                  id="court"
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
                <label htmlFor="hearing-date" className="text-sm font-medium text-slate-300">
                  Next Hearing Date <span className="text-red-400">*</span>
                </label>
                <input
                  id="hearing-date"
                  type="date"
                  min={todayISO()}
                  value={formData.nextHearingDate}
                  onChange={e => { setFormData({ ...formData, nextHearingDate: e.target.value }); setErrors(prev => ({ ...prev, nextHearingDate: undefined })); }}
                  className={inputClass(!!errors.nextHearingDate)}
                  aria-required="true"
                  aria-describedby={errors.nextHearingDate ? 'date-error' : undefined}
                />
                {errors.nextHearingDate && (
                  <p id="date-error" className="flex items-center gap-1 text-xs text-red-400 mt-1">
                    <AlertCircle size={12} /> {errors.nextHearingDate}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label htmlFor="status" className="text-sm font-medium text-slate-300">Status</label>
                <select
                  id="status"
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
                <label htmlFor="total-fees" className="text-sm font-medium text-slate-300">Total Fees (₹)</label>
                <input
                  id="total-fees"
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
                <label htmlFor="fees-paid" className="text-sm font-medium text-slate-300">Fees Paid (₹)</label>
                <input
                  id="fees-paid"
                  type="number"
                  min="0"
                  max={formData.totalFees}
                  value={formData.feesPaid}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, feesPaid: val });
                    if (val > (formData.totalFees ?? 0)) {
                      setErrors(prev => ({ ...prev, feesPaid: 'Fees Paid cannot exceed Total Fees.' }));
                    } else {
                      setErrors(prev => ({ ...prev, feesPaid: undefined }));
                    }
                  }}
                  className={inputClass(!!errors.feesPaid)}
                />
                {errors.feesPaid && (
                  <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                    <AlertCircle size={12} /> {errors.feesPaid}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-700">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                aria-label="Save case to vault"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all font-medium disabled:opacity-50 cursor-pointer"
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
