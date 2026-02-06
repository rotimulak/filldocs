import { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { JsonPreview } from './JsonPreview';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { api, ApiError } from '../api/client';
import type { Requisites, StoredRequisites } from '../types';
import { STORAGE_KEY } from '../types';

interface RequisitesPanelProps {
  onRequisitesChange: (req: Requisites | null) => void;
}

type PanelState =
  | { status: 'empty' }
  | { status: 'loading'; filename: string }
  | { status: 'success'; data: Requisites; source: 'file' | 'storage'; filename: string; warnings: string[] }
  | { status: 'error'; message: string };

export function RequisitesPanel({ onRequisitesChange }: RequisitesPanelProps) {
  const [stored, setStored, clearStored] = useLocalStorage<StoredRequisites | null>(
    STORAGE_KEY,
    null
  );
  const [state, setState] = useState<PanelState>({ status: 'empty' });

  // При монтировании — загрузить из localStorage
  useEffect(() => {
    if (stored) {
      setState({
        status: 'success',
        data: stored.requisites,
        source: 'storage',
        filename: stored.extractedFrom,
        warnings: [],
      });
      onRequisitesChange(stored.requisites);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Обработка файла
  const handleFile = async (file: File) => {
    setState({ status: 'loading', filename: file.name });

    try {
      const result = await api.extractRequisites(file);

      if (!result.success) {
        setState({
          status: 'error',
          message: result.message || 'Не удалось извлечь реквизиты',
        });
        onRequisitesChange(null);
        return;
      }

      const newStored: StoredRequisites = {
        requisites: result.requisites,
        extractedFrom: file.name,
        extractedAt: new Date().toISOString(),
      };

      setStored(newStored);
      setState({
        status: 'success',
        data: result.requisites,
        source: 'file',
        filename: file.name,
        warnings: result.warnings || [],
      });
      onRequisitesChange(result.requisites);
    } catch (e) {
      const message = e instanceof ApiError ? e.detail || e.message : 'Ошибка извлечения реквизитов';
      setState({ status: 'error', message });
      onRequisitesChange(null);
    }
  };

  // Очистка
  const handleClear = () => {
    clearStored();
    setState({ status: 'empty' });
    onRequisitesChange(null);
  };

  // Сброс ошибки
  const handleRetry = () => {
    setState({ status: 'empty' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Реквизиты компании</h2>
        {state.status === 'success' && (
          <button
            onClick={handleClear}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* DropZone всегда видна */}
        <DropZone
          onFile={handleFile}
          accept=".doc,.docx"
          loading={state.status === 'loading'}
          label="Загрузите документ с реквизитами"
          sublabel="Перетащите файл или нажмите для выбора"
          selectedFile={state.status === 'success' ? state.filename : null}
        />

        {/* Error state */}
        {state.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-700">{state.message}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success state */}
        {state.status === 'success' && (
          <>
            {/* Warnings */}
            {state.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-yellow-700">Предупреждения:</p>
                    <ul className="text-xs text-yellow-600 mt-1 list-disc list-inside">
                      {state.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Status badge */}
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700">
                {state.source === 'file' ? 'Сохранено в браузере' : 'Загружено из памяти'}
              </span>
            </div>

            {/* JSON Preview */}
            <div className="flex-1 min-h-0 overflow-auto">
              <JsonPreview
                data={state.data as unknown as Record<string, unknown>}
                title={`Реквизиты (${Object.keys(state.data).filter(k => state.data[k as keyof Requisites]).length} полей)`}
                collapsible
              />
            </div>
          </>
        )}

        {/* Empty state info */}
        {state.status === 'empty' && (
          <div className="text-sm text-gray-500 space-y-2">
            <p>Загрузите документ с реквизитами компании (договор, анкету, карточку).</p>
            <p>Система найдёт таблицу с реквизитами и извлечёт данные автоматически.</p>
          </div>
        )}
      </div>
    </div>
  );
}
