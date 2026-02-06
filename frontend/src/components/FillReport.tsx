// Названия полей на русском
const FIELD_LABELS: Record<string, string> = {
  company_name: 'Наименование компании',
  inn: 'ИНН',
  kpp: 'КПП',
  ogrn: 'ОГРН',
  address: 'Юридический адрес',
  postal_address: 'Почтовый адрес',
  bank_name: 'Наименование банка',
  bik: 'БИК',
  account: 'Расчётный счёт',
  corr_account: 'Корр. счёт',
  bank_details: 'Банковские реквизиты',
  director: 'Руководитель',
  contact_person: 'Контактное лицо',
  founder: 'Учредитель',
  registration_certificate: 'Свидетельство о регистрации',
  passport: 'Паспортные данные',
  passport_series: 'Серия паспорта',
  passport_number: 'Номер паспорта',
  birth_date: 'Дата рождения',
  birth_place: 'Место рождения',
  passport_issued_by: 'Кем выдан',
  passport_department_code: 'Код подразделения',
  passport_issue_date: 'Дата выдачи',
  phone: 'Телефон',
  email: 'Email',
};

interface FillReportProps {
  usedFields: Record<string, number>;
  unusedFields: string[];
  filename: string;
}

export function FillReport({ usedFields, unusedFields, filename }: FillReportProps) {
  const usedEntries = Object.entries(usedFields);
  const totalUsed = usedEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Результат заполнения</h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* File info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{filename}</span>
        </div>

        {/* Used fields */}
        {usedEntries.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                Использовано ({totalUsed} {getInsertionWord(totalUsed)}):
              </span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-6">
              {usedEntries.map(([field, count]) => (
                <li key={field} className="flex justify-between">
                  <span>{FIELD_LABELS[field] || field}</span>
                  <span className="text-gray-400">{count > 1 ? `x${count}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unused fields */}
        {unusedFields.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              <span className="text-sm font-medium text-gray-500">
                Не использовано:
              </span>
            </div>
            <ul className="text-sm text-gray-400 space-y-1 ml-6">
              {unusedFields.map((field) => (
                <li key={field}>{FIELD_LABELS[field] || field}</li>
              ))}
            </ul>
          </div>
        )}

        {/* No fields used warning */}
        {usedEntries.length === 0 && (
          <div className="flex items-center gap-2 text-amber-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">Ни одно поле не было вставлено в документ</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getInsertionWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'вставок';
  }
  if (lastDigit === 1) {
    return 'вставка';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'вставки';
  }
  return 'вставок';
}
