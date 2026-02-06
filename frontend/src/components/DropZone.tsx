import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Spinner } from './Spinner';

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  sublabel?: string;
  selectedFile?: string | null;
}

export function DropZone({
  onFile,
  accept = '.doc,.docx',
  disabled = false,
  loading = false,
  label = 'Перетащите файл сюда',
  sublabel = 'или нажмите для выбора',
  selectedFile = null,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !loading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || loading) return;

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFile(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFile(file);
    }
    // Сброс input для повторного выбора того же файла
    e.target.value = '';
  };

  const validateFile = (file: File): boolean => {
    const allowedExtensions = accept.split(',').map((ext) => ext.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(fileExtension);
  };

  const getStateClasses = () => {
    if (disabled) {
      return 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50';
    }
    if (loading) {
      return 'border-blue-300 bg-blue-50 cursor-wait';
    }
    if (isDragOver) {
      return 'border-blue-500 bg-blue-50 cursor-pointer';
    }
    return 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer';
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${getStateClasses()}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || loading}
      />

      {loading ? (
        <Spinner size="lg" text="Обработка файла..." />
      ) : selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">{selectedFile}</span>
          <span className="text-xs text-gray-500">Нажмите для выбора другого файла</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-500">{sublabel}</span>
          <span className="text-xs text-gray-400 mt-1">
            Поддерживаемые форматы: {accept}
          </span>
        </div>
      )}
    </div>
  );
}
