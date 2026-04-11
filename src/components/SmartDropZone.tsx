import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { ocrService } from '../services/ocrService';

interface SmartDropZoneProps {
  onDataParsed: (data: { title: string; caseNumber: string; date: string }) => void;
}

export function SmartDropZone({ onDataParsed }: SmartDropZoneProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const text = await ocrService.extractTextFromImage(base64);
          const parsedData = ocrService.parseTextToCaseData(text);
          onDataParsed(parsedData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to process document');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('An error occurred during file process');
      setLoading(false);
    }
  }, [onDataParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
      }`}
    >
      <input {...getInputProps()} />
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-slate-300">Extracting details with Smart OCR...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="text-slate-400" size={48} />
          <div>
            <p className="text-lg font-medium text-slate-200">Drag & drop case document</p>
            <p className="text-sm text-slate-400 mt-1">or click to select file (Images only)</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-amber-500 mt-4 bg-amber-500/10 px-3 py-1 rounded-full">
            <FileText size={14} />
            <span>Smart Read Active</span>
          </div>
        </div>
      )}
      {error && (
        <p className="text-red-400 text-sm mt-4">{error}</p>
      )}
    </div>
  );
}
