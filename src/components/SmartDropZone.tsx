import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { ocrService } from '../services/ocrService';
import { compressDocumentForOCR } from '../utils/fileUtils';

interface SmartDropZoneProps {
  onDataParsed: (data: {
    title: string;
    caseNumber: string;
    date: string;
    court: string;
    clientName: string;
    advocateName: string;
  }) => void;
}

const hasOcrKey = !!import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;

export function SmartDropZone({ onDataParsed }: SmartDropZoneProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    setLoading(true);
    setError(null);

    try {
      // Step 1: Compress image to reduce payload size
      const compressedBase64 = await compressDocumentForOCR(file);
      // Step 2: Single Gemini Vision call → returns structured JSON directly
      const data = await ocrService.extractCaseData(compressedBase64);
      onDataParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onDataParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false,
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        loading
          ? 'border-blue-500/50 bg-blue-500/5 cursor-wait'
          : isDragActive
          ? 'border-blue-500 bg-blue-500/10 cursor-copy'
          : 'border-slate-700 hover:border-slate-500 bg-slate-800/30 cursor-pointer'
      }`}
    >
      <input {...getInputProps()} />

      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <div>
            <p className="text-slate-200 font-medium">AI is reading your document...</p>
            <p className="text-slate-500 text-xs mt-1">Takes 5–20 seconds. Auto-retrying if server is busy.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="text-slate-400" size={48} />
          <div>
            <p className="text-lg font-medium text-slate-200">Drag &amp; drop case document</p>
            <p className="text-sm text-slate-400 mt-1">or click to select file (Images only)</p>
          </div>
          {hasOcrKey ? (
            <div className="flex items-center space-x-2 text-xs text-amber-500 mt-4 bg-amber-500/10 px-3 py-1 rounded-full">
              <FileText size={14} />
              <span>Gemini Vision Active</span>
            </div>
          ) : (
            <p className="text-red-400 text-xs mt-4 text-center leading-relaxed">
              No API key configured. Add{' '}
              <code className="bg-slate-700 px-1 rounded">VITE_GOOGLE_GEMINI_API_KEY</code> to .env
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
