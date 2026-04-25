import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Sparkles, UploadCloud, Loader2, Save, FileText } from 'lucide-react';
import type { Case } from '../types';
import { useCaseStore } from '../store/useCaseStore';
import { ocrService } from '../services/ocrService';
import { compressDocumentForOCR } from '../utils/fileUtils';

interface AIAnalysisModalProps {
  caseData: Case;
  onClose: () => void;
}

export function AIAnalysisModal({ caseData, onClose }: AIAnalysisModalProps) {
  const { updateCase } = useCaseStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>(caseData.aiSummary || '');
  const [isSaving, setIsSaving] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    setLoading(true);
    setError(null);
    setSummary('');

    try {
      const compressedBase64 = await compressDocumentForOCR(file);
      const result = await ocrService.summarizeLegalDocument(compressedBase64);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during file process');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  const handleSave = async () => {
    if (!summary || !caseData.id) return;
    setIsSaving(true);
    try {
      await updateCase(caseData.id, { aiSummary: summary });
      onClose();
    } catch (err) {
      setError('Failed to save summary to vault.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl glass-panel relative p-8 shadow-2xl shadow-blue-900/20 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <Sparkles className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">AI Document Analysis</h2>
            <p className="text-slate-400">Case: {caseData.title}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {!summary && !loading && (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-4">
                <UploadCloud className="text-slate-400" size={48} />
                <div>
                  <p className="text-lg font-medium text-slate-200">Upload Legal Document</p>
                  <p className="text-sm text-slate-400 mt-1">Drag & drop image (FIR, Petition, Order) here</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="border border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 bg-slate-800/30">
              <Loader2 className="animate-spin text-blue-500" size={48} />
              <div className="text-center">
                <p className="text-slate-200 font-medium text-lg">AI is analyzing document...</p>
                <p className="text-slate-400 text-sm mt-2">Extracting key facts, sections, and parties involved.</p>
                <p className="text-slate-500 text-xs mt-1">(Takes about 10-20 seconds)</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {summary && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center space-x-2 text-slate-200">
                  <FileText size={18} className="text-amber-400" />
                  <span>AI Generated Summary</span>
                </h3>
                <button 
                  onClick={() => setSummary('')}
                  className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer"
                >
                  Analyze another document
                </button>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 shadow-inner overflow-x-auto">
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm format-markdown">
                  {summary}
                </div>
              </div>
            </div>
          )}
        </div>

        {summary && !loading && (
          <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end space-x-3 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{isSaving ? 'Saving...' : 'Save to Case Vault'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
