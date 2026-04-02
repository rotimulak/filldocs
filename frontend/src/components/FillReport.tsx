import { useState } from 'react';
import type { FilledCell, EmptyCell } from '../types';

interface FillReportProps {
  filledFields: number;
  totalInstructions: number;
  filledDetails: FilledCell[];
  emptyCells: EmptyCell[];
  skippedCount: number;
}

export function FillReport({
  filledFields,
  totalInstructions,
  filledDetails,
  emptyCells,
  skippedCount,
}: FillReportProps) {
  const [expanded, setExpanded] = useState(false);

  const details = filledDetails ?? [];
  const empties = emptyCells ?? [];
  const hasDetails = details.length > 0 || empties.length > 0;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Clickable header — like JsonPreview */}
      <div
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200 ${hasDetails ? 'cursor-pointer hover:bg-gray-200' : ''}`}
      >
        <div className="flex items-center gap-2">
          {hasDetails && (
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <span className="text-sm font-medium text-gray-700">Результат</span>
        </div>
        <div className="flex items-center gap-1.5">
          {filledFields > 0 ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span className="text-sm text-gray-600">
            <strong>{filledFields}</strong> из <strong>{totalInstructions}</strong> {getCellWord(totalInstructions)}
            {skippedCount > 0 && (
              <span className="text-gray-400 ml-1">({skippedCount} пропущено)</span>
            )}
          </span>
        </div>
      </div>

      {/* Collapsible detail */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Empty cells first */}
          {empties.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Остались пустыми</span>
              </div>
              <div className="space-y-1">
                {empties.map((cell, i) => (
                  <div key={i} className="text-xs text-gray-400 bg-gray-50 rounded px-2.5 py-1.5 truncate" title={cell.label}>
                    {cell.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filled cells */}
          {details.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Заполненные поля</span>
              </div>
              <div className="space-y-1">
                {details.map((cell, i) => (
                  <div key={i} className="text-sm bg-green-50 rounded px-2.5 py-1.5 space-y-0.5">
                    <div className="text-gray-900 break-words"><span className="font-medium">Поле:</span> {cell.label}</div>
                    <div className="text-blue-600 break-words"><span className="font-medium">Реквизит:</span> {cell.requisite_key || '—'}</div>
                    <div className="text-green-600 break-words"><span className="font-medium">Значение:</span> {cell.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getCellWord(count: number): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return 'полей';
  if (last === 1) return 'поле';
  if (last >= 2 && last <= 4) return 'поля';
  return 'полей';
}
