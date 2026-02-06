export function HeuristicsPanel() {
  const heuristics = [
    {
      title: 'Поиск в таблицах',
      desc: 'Реквизиты ищутся только в таблицах документа',
    },
    {
      title: '2-3 колонки',
      desc: '[Название | Значение] или [№ | Название | Значение]',
    },
    {
      title: 'Один блок',
      desc: 'Все реквизиты компании — в одной таблице',
    },
    {
      title: '≥3 совпадения',
      desc: 'Таблица считается блоком реквизитов при ≥3 ключевых словах',
    },
    {
      title: 'Только пустые ячейки',
      desc: 'Заполняются только пустые ячейки, перезапись запрещена',
    },
    {
      title: 'Сохранение стиля',
      desc: 'Шрифт и форматирование копируются из соседних ячеек',
    },
    {
      title: 'Составные поля',
      desc: '"ИНН / КПП" → вставка через пробел в том же порядке',
    },
    {
      title: 'Дедупликация',
      desc: 'Если поле уже вставлено в составное — отдельное пропускается',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Как это работает
      </h2>
      <ul className="space-y-3">
        {heuristics.map((h, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium text-gray-800">{h.title}</span>
            <p className="text-gray-500 text-xs mt-0.5">{h.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
