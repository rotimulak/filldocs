import { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { FillReport } from './FillReport';
import { DonationBlock } from './DonationBlock';
import { FeedbackBlock } from './FeedbackBlock';
import { api, ApiError } from '../api/client';
import type { Requisites, FillResponse } from '../types';

interface FillPanelProps {
  requisites: Requisites | null;
}

type PanelState =
  | { status: 'disabled' }
  | { status: 'ready' }
  | { status: 'loading'; filename: string }
  | { status: 'success'; response: FillResponse; filename: string }
  | { status: 'error'; message: string };

export function FillPanel({ requisites }: FillPanelProps) {
  const [state, setState] = useState<PanelState>(
    requisites ? { status: 'ready' } : { status: 'disabled' }
  );

  // Обновление при изменении реквизитов
  useEffect(() => {
    if (!requisites) {
      setState({ status: 'disabled' });
    } else if (state.status === 'disabled') {
      setState({ status: 'ready' });
    }
  }, [requisites]); // eslint-disable-line react-hooks/exhaustive-deps

  // Обработка файла
  const handleFile = async (file: File) => {
    if (!requisites) return;

    setState({ status: 'loading', filename: file.name });

    try {
      const result = await api.fillDocument(file, requisites);

      if (!result.success) {
        setState({
          status: 'error',
          message: result.message || 'Не удалось заполнить документ',
        });
        return;
      }

      console.log('Fill response:', JSON.stringify(result, null, 2));

      setState({
        status: 'success',
        response: result,
        filename: file.name,
      });
    } catch (e) {
      const message = e instanceof ApiError ? e.detail || e.message : 'Ошибка заполнения документа';
      setState({ status: 'error', message });
    }
  };

  // Скачивание
  const handleDownload = async () => {
    if (state.status !== 'success') return;

    try {
      await api.downloadFile(state.response.filename);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  // Сброс для новой загрузки
  const handleReset = () => {
    setState(requisites ? { status: 'ready' } : { status: 'disabled' });
  };

  // Сброс ошибки
  const handleRetry = () => {
    setState(requisites ? { status: 'ready' } : { status: 'disabled' });
  };

  const isDisabled = state.status === 'disabled';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Заполнение документа</h2>
        {state.status === 'success' && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Загрузить другой
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* DropZone */}
        <DropZone
          onFile={handleFile}
          accept=".doc,.docx"
          disabled={isDisabled}
          loading={state.status === 'loading'}
          label={isDisabled ? 'Сначала загрузите реквизиты' : 'Загрузите шаблон для заполнения'}
          sublabel={isDisabled ? 'Используйте левую панель' : 'Перетащите файл или нажмите для выбора'}
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
            <FillReport
              filledFields={state.response.filled_fields}
              totalInstructions={state.response.total_instructions}
              filledDetails={state.response.filled_details}
              emptyCells={state.response.empty_cells}
              skippedCount={state.response.skipped_count}
            />

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Скачать документ
            </button>

            <DonationBlock />
          </>
        )}

        {/* Disabled state info */}
        {state.status === 'disabled' && (
          <div className="text-sm text-gray-500 space-y-2">
            <p>Для заполнения шаблона сначала загрузите документ с реквизитами в левой панели.</p>
          </div>
        )}

        {/* Ready state info */}
        {state.status === 'ready' && (
          <div className="text-sm text-gray-500 space-y-2">
            <p>Загрузите шаблон документа для автоматического заполнения реквизитами.</p>
            <p>Поддерживаются форматы .doc и .docx</p>
          </div>
        )}

        {/* Feedback - always visible */}
        <FeedbackBlock />
      </div>
    </div>
  );
}
