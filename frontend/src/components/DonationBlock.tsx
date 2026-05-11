import { useState } from 'react';
import { api } from '../api/client';

export function DonationBlock() {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDonate = async () => {
    if (amount < 10 || amount > 15000) return;
    setLoading(true);
    setError('');

    // Open blank window synchronously to avoid popup blocker
    const paymentWindow = window.open('about:blank', '_blank');

    try {
      const { confirmation_url } = await api.createDonation(amount);
      if (paymentWindow) {
        paymentWindow.location.href = confirmation_url;
      } else {
        window.location.href = confirmation_url;
      }
    } catch {
      paymentWindow?.close();
      setError('Не удалось создать платёж');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-2">
      <p className="text-lg font-bold text-center text-gray-900 mb-3">Спасибо!</p>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={10}
          step={10}
          value={amount}
          max={15000}
          onChange={(e) => setAmount(Math.min(15000, Math.max(10, parseInt(e.target.value) || 10)))}
          className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600">рублей</span>
        <button
          onClick={handleDonate}
          disabled={loading || amount < 10 || amount > 15000}
          className="flex-1 py-2 px-4 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Создание...' : 'Поблагодарить'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Оплачивая, вы принимаете условия{' '}
        <a href="/legal/oferta.html" target="_blank" className="underline hover:text-gray-600">оферты</a>
        {' '}и{' '}
        <a href="/legal/privacy.html" target="_blank" className="underline hover:text-gray-600">политики конфиденциальности</a>
      </p>
    </div>
  );
}
