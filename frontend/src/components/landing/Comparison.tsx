const oldWay = [
  'Копируете ИНН, КПП, адреса из одного файла в другой вручную',
  'Ищете, в какую ячейку таблицы что вставить',
  'Тратите 30+ минут на один документ',
  'Допускаете опечатки и пропускаете поля',
  'Повторяете всё заново для каждого нового шаблона',
];

const newWay = [
  'Загрузили файл — ИИ извлёк все реквизиты сам',
  'ИИ сам находит нужные ячейки в таблице',
  'Готовый документ за 30 секунд',
  'Точная подстановка данных без ошибок',
  'Один раз извлёк — заполняй сколько угодно шаблонов',
];

export function Comparison() {
  return (
    <section className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old way */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wide mb-4">
              Как обычно
            </h3>
            <ul className="space-y-3">
              {oldWay.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-gray-500">
                  <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* New way */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-4">
              С FillDocs
            </h3>
            <ul className="space-y-3">
              {newWay.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-gray-700">
                  <svg className="w-5 h-5 shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
