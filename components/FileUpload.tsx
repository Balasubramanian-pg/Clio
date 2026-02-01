import React, { useCallback, useState } from 'react';
import { Upload, FileCode, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndPassFile = (file: File) => {
    if (!file.name.endsWith('.py')) {
      setError("Please upload a valid Python (.py) file.");
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-out
          backdrop-blur-sm
          ${isDragging 
            ? 'border-casper bg-chambray/20 scale-[1.02] shadow-[0_0_40px_-10px_rgba(167,194,211,0.3)]' 
            : 'border-waikawa/50 bg-cello/30 hover:border-casper/50 hover:bg-cello/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept=".py"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center justify-center space-y-5 pointer-events-none">
          <div className={`p-5 rounded-full transition-colors duration-300 ${isDragging ? 'bg-chambray/40' : 'bg-cello/80 border border-waikawa/20'}`}>
            {isDragging ? (
              <Upload className="w-10 h-10 text-merino" />
            ) : (
              <FileCode className="w-10 h-10 text-casper" />
            )}
          </div>
          <div>
            <p className="text-xl font-medium text-merino">
              {isDragging ? "Drop script to convert" : "Drag & drop your Python script"}
            </p>
            <p className="text-sm text-waikawa mt-2">
              or click to browse files
            </p>
          </div>
          <div className="text-xs font-semibold tracking-wide text-chambray bg-merino/90 px-4 py-1.5 rounded-full border border-merino">
            SUPPORTS .PY
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200 text-sm animate-in slide-in-from-top-2 backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-red-400" />
          {error}
        </div>
      )}
    </div>
  );
};