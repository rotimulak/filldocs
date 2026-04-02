const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

const steps = [
  {
    num: '01',
    title: 'Загрузите документ с реквизитами',
    text: 'Карточка предприятия, выписка из ЕГРЮЛ или любой .doc/.docx файл с данными вашей компании.',
  },
  {
    num: '02',
    title: 'Загрузите шаблон для заполнения',
    text: 'Анкета участника закупки, договор, опросный лист — любой шаблон Word с таблицей реквизитов.',
  },
  {
    num: '03',
    title: 'Скачайте заполненный документ',
    text: 'ИИ автоматически заполнит все поля. Проверьте результат и скачайте готовый файл.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
          Как это работает
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative text-center md:text-left">
              <div className="text-5xl font-bold text-blue-100">{step.num}</div>
              <h3 className="text-lg font-semibold text-gray-900 mt-2">{step.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{step.text}</p>

              {/* Arrow between steps (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 -right-4 text-gray-300 text-2xl">
                  &rarr;
                </div>
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
        </div>
      </div>
    </section>
  );
}
