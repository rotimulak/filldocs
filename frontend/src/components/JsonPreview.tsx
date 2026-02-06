import React, { useState } from 'react';

interface JsonPreviewProps {
  data: Record<string, unknown>;
  title?: string;
  collapsible?: boolean;
}

export function JsonPreview({ data, title, collapsible = false }: JsonPreviewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const renderValue = (value: unknown, indent: number = 0): React.ReactNode => {
    const indentStyle = { paddingLeft: `${indent * 16}px` };

    if (value === null) {
      return <span className="text-gray-400">null</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-green-600">"{value}"</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600">{value.toString()}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500">[]</span>;
      }
      return (
        <span>
          [
          {value.map((item, index) => (
            <div key={index} style={{ paddingLeft: '16px' }}>
              {renderValue(item, indent + 1)}
              {index < value.length - 1 && ','}
            </div>
          ))}
          ]
        </span>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        return <span className="text-gray-500">{'{}'}</span>;
      }
      return (
        <span>
          {'{'}
          {entries.map(([key, val], index) => (
            <div key={key} style={indentStyle}>
              <span className="text-amber-700">"{key}"</span>
              <span className="text-gray-600">: </span>
              {renderValue(val, indent + 1)}
              {index < entries.length - 1 && ','}
            </div>
          ))}
          {'}'}
        </span>
      );
    }

    return <span className="text-gray-600">{String(value)}</span>;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          {title && <span className="text-sm font-medium text-gray-700">{title}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Скопировано
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Копировать
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {renderValue(data)}
          </pre>
        </div>
      )}
    </div>
  );
}
