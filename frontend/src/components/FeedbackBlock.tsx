import { useState } from 'react';
import { api } from '../api/client';

export function FeedbackBlock() {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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

  if (sent) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 mt-2">
        <p className="text-sm text-green-700 text-center">Спасибо за отзыв!</p>
        <button
          onClick={() => setSent(false)}
          className="block mx-auto mt-2 text-xs text-gray-400 hover:text-gray-600"
        >
          Написать ещё
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-2">
      <p className="text-sm font-semibold text-gray-900 mb-3">Обратная связь</p>

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
    </div>
  );
}
