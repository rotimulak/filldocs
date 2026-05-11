import { useState } from 'react';
import { RequisitesPanel } from './components/RequisitesPanel';
import { FillPanel } from './components/FillPanel';
import { HeuristicsPanel } from './components/HeuristicsPanel';
import { HowItWorks } from './components/landing/HowItWorks';
import { Audience } from './components/landing/Audience';
import { Benefits } from './components/landing/Benefits';
import { Comparison } from './components/landing/Comparison';
import { FAQ } from './components/landing/FAQ';
import { LandingFooter } from './components/landing/LandingFooter';
import type { Requisites } from './types';

function App() {
  const [requisites, setRequisites] = useState<Requisites | null>(null);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-transparent">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center justify-center">
          <div className="text-right pr-4">
            <h1 className="text-3xl font-bold text-gray-900">FillDocs</h1>
            <p className="text-base text-gray-500 mt-1">
              Автоматическое заполнение<br />реквизитов в документах
            </p>
          </div>
          <img src="/mascot.png?v=2" alt="FillDocs — енот-помощник" className="h-32 w-auto shrink-0" />
        </div>
      </header>

      {/* Main content - two columns */}
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

      {/* App footer */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 text-center text-sm text-gray-500">
        <p>Файлы не сохраняются на сервере. Реквизиты хранятся только в вашем браузере.</p>
      </div>

      {/* SEO-секции */}
      <HowItWorks />
      <Audience />
      <Benefits />
      <Comparison />
      <FAQ />
      <LandingFooter />
    </div>
  );
}

export default App;
