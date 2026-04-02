import { useState } from 'react';

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

const items = [
  {
    q: 'Какие форматы файлов поддерживаются?',
    a: 'FillDocs работает с документами Word (.doc и .docx). Файлы .doc автоматически конвертируются в .docx перед обработкой.',
  },
  {
    q: 'Где хранятся мои данные?',
    a: 'Загруженные файлы обрабатываются и немедленно удаляются с сервера. Извлечённые реквизиты сохраняются в localStorage вашего браузера — они никогда не покидают ваше устройство и не передаются третьим лицам.',
  },
  {
    q: 'Какие реквизиты ИИ может извлечь?',
    a: 'Все стандартные реквизиты компании: наименование, ИНН, КПП, ОГРН, юридический и фактический адрес, банковские реквизиты (р/с, к/с, БИК, банк), контактные данные (телефон, email), данные руководителя и любые другие поля из документа.',
  },
  {
    q: 'Подходит ли для анкет участника закупки?',
    a: 'Да. FillDocs создан в том числе для тендерной документации. Загрузите карточку предприятия, затем шаблон анкеты — ИИ сопоставит поля и заполнит таблицу. Работает с формами по 44-ФЗ и 223-ФЗ.',
  },
  {
    q: 'Что если ИИ заполнил поле неправильно?',
    a: 'FillDocs показывает отчёт: какие поля заполнены, какие пропущены. Скачайте документ, проверьте в Word и внесите правки. Рекомендуем всегда проверять результат перед отправкой.',
  },
  {
    q: 'Сколько шаблонов можно заполнить?',
    a: 'Неограниченно. Реквизиты сохраняются в браузере — загружайте столько шаблонов, сколько нужно.',
  },
  {
    q: 'Нужно ли что-то устанавливать?',
    a: 'Нет. FillDocs работает в браузере. Chrome, Firefox, Safari, Edge на любой ОС.',
  },
  {
    q: 'Чем отличается от конструкторов документов?',
    a: 'Конструкторы (Doczilla, Комбинатор, FreshDoc) работают с фиксированными шаблонами и переменными. FillDocs — наоборот: вы загружаете любой существующий Word-файл (например, от заказчика), и ИИ сам понимает структуру таблицы и заполняет ячейки. Ничего настраивать не нужно.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
          Частые вопросы
        </h2>

        <div className="divide-y divide-gray-200">
          {items.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex justify-between items-center w-full text-left py-4 gap-4"
              >
                <span className="font-medium text-gray-900">{item.q}</span>
                <svg
                  className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-45' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              {open === i && (
                <p className="text-gray-600 text-sm leading-relaxed pb-4">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={scrollToTop}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-base font-semibold transition-colors"
          >
            Начать заполнение
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Бесплатно. Без регистрации. Файлы не сохраняются на сервере.
          </p>
        </div>
      </div>
    </section>
  );
}
