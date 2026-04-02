import { useState } from 'react';
import { RequisitesPanel } from './components/RequisitesPanel';
import { FillPanel } from './components/FillPanel';
import { HeuristicsPanel } from './components/HeuristicsPanel';
import type { Requisites } from './types';

function App() {
  const [requisites, setRequisites] = useState<Requisites | null>(null);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">FillDocs</h1>
          <p className="text-sm text-gray-500">
            Автоматическое заполнение реквизитов в документах
          </p>
        </div>
      </header>

      {/* Main content - three columns */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая панель - Реквизиты */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[500px]">
            <RequisitesPanel onRequisitesChange={setRequisites} />
          </div>

          {/* Центральная панель - Заполнение */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[500px]">
            <FillPanel requisites={requisites} />
          </div>

          {/* Правая панель - Эвристики (скрыта) */}
          <div className="hidden">
            <HeuristicsPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-4 py-4 text-center text-sm text-gray-500">
        <p>Файлы не сохраняются на сервере. Реквизиты хранятся только в вашем браузере.</p>
      </footer>
    </div>
  );
}

export default App;
