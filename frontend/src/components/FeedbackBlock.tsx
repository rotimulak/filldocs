import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface FeedbackBlockProps {
  expanded?: boolean;
}

export function FeedbackBlock({ expanded = false }: FeedbackBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expanded) setIsCollapsed(false);
  }, [expanded]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError('');

    try {
      await api.sendFeedback(message.trim(), contact.trim());
      setSent(true);
      setMessage('');
      setContact('');
    } catch {
      setError('Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200 cursor-pointer hover:bg-gray-200"
      >
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Обратная связь</span>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {sent ? (
            <>
              <p className="text-sm text-green-700 text-center">Спасибо за отзыв!</p>
              <button
                onClick={() => setSent(false)}
                className="block mx-auto mt-2 text-xs text-gray-400 hover:text-gray-600"
              >
                Написать ещё
              </button>
            </>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ваше сообщение..."
                maxLength={2000}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Телефон или Telegram"
                  maxLength={200}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !message.trim()}
                  className="py-2 px-4 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {loading ? 'Отправка...' : 'Отправить'}
                </button>
              </div>

              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
