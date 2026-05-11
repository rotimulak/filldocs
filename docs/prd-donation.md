# PRD: Донат после скачивания документа

**Статус:** Draft
**Дата:** 2026-05-11
**Ветка:** feat/donation

---

## 1. Проблема

Пользователь получает результат (заполненный документ) бесплатно. Нет механизма монетизации. Нужен ненавязчивый способ принять благодарность / донат.

## 2. Решение

После успешного заполнения документа, рядом с кнопкой "Скачать документ" показываем блок доната:

```
┌─────────────────────────────────────────┐
│  [ Скачать документ           ]  (green)│
│                                         │
│            Спасибо!                     │
│                                         │
│   [ 100 ] рублей  [ Поблагодарить ]    │
│                                         │
│   Оплачивая, вы принимаете условия      │
│   оферты и политики конфиденциальности  │
└─────────────────────────────────────────┘
```

- Кнопка "Скачать документ" работает как раньше, без ограничений
- Под ней — текст "Спасибо!" (жирный, крупный)
- Поле ввода суммы с предзаполненным значением `100`
- Лейбл "рублей" справа от поля
- Кнопка "Поблагодарить" — инициирует платеж
- Ссылки на оферту и политику конфиденциальности внизу блока

## 3. Пользовательский флоу

1. Пользователь заполняет документ -> видит результат + кнопку скачивания
2. Скачивание работает как раньше (бесплатно, без блокировок)
3. Пользователь вводит сумму (по умолчанию 100) и нажимает "Поблагодарить"
4. Frontend вызывает `POST /api/donate` с суммой
5. Backend создает платеж в ЮКассе, возвращает `confirmation_url`
6. Frontend открывает `confirmation_url` в новой вкладке (redirect на ЮКассу)
7. Пользователь оплачивает на странице ЮКассы (карта, СБП, ЮMoney и т.д.)
8. ЮКасса редиректит обратно на `return_url` (страница "Спасибо за поддержку!")
9. ЮКасса отправляет webhook -> backend подтверждает платеж

## 4. Технический дизайн

### 4.1. Frontend

**Файл:** `frontend/src/components/FillPanel.tsx`

В блоке `state.status === 'success'` (после FillReport, перед/после кнопки скачивания) добавить компонент `DonationBlock`:

```
DonationBlock:
  - state: amount (number, default 100)
  - state: loading (boolean)
  - "Спасибо!" — заголовок (font-bold, text-lg)
  - input[type=number, min=10, step=10] — поле суммы
  - "рублей" — лейбл
  - button "Поблагодарить" — вызывает api.createDonation(amount)
  - При клике: loading=true, POST /api/donate, открыть confirmation_url в window.open()
  - Ссылки на /legal/oferta и /legal/privacy
```

**Файл:** `frontend/src/api/client.ts`

```typescript
async createDonation(amount: number): Promise<{ confirmation_url: string }> {
  const res = await fetch(`${API_BASE}/donate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new ApiError('Ошибка создания платежа', res.status);
  return res.json();
}
```

### 4.2. Backend

**Новый файл:** `backend/app/services/payment_service.py`

Сервис для работы с ЮКассой (адаптация из `d:\Sources\pays\backend\src\payments\providers\yookassa\provider.py`):

```python
from yookassa import Configuration, Payment
import uuid

class PaymentService:
    def __init__(self, shop_id: str, secret_key: str, return_url: str):
        Configuration.account_id = shop_id
        Configuration.secret_key = secret_key
        self.return_url = return_url

    def create_donation(self, amount: int) -> str:
        """Создает платеж, возвращает confirmation_url."""
        payment = Payment.create({
            "amount": {"value": f"{amount}.00", "currency": "RUB"},
            "confirmation": {"type": "redirect", "return_url": self.return_url},
            "capture": True,
            "description": f"Благодарность FillDocs — {amount} руб.",
            "metadata": {"type": "donation"}
        }, uuid.uuid4())
        return payment.confirmation.confirmation_url
```

**Новый эндпоинт в** `backend/app/api/routes.py`:

```
POST /api/donate
  Body: { "amount": 100 }
  Валидация: amount >= 10, amount <= 15000, целое число
  Response: { "confirmation_url": "https://yookassa.ru/..." }
  Errors: 400 (невалидная сумма), 502 (ошибка ЮКассы)
```

**Webhook эндпоинт** (для подтверждения платежа):

```
POST /api/webhook/yookassa
  - Проверка IP (whitelist ЮКассы: 185.71.76.0/27, 185.71.77.0/27, 77.75.153.0/25, 77.75.154.128/25)
  - Парсинг event: payment.succeeded
  - Верификация через Payment.find_one(payment_id)
  - Логирование (файл или stdout — БД нет)
  - Response: HTTP 200
```

**Страница возврата:**

```
GET /api/donate/success — статическая HTML-страница "Спасибо за поддержку!"
  (или фронтенд-роут /donate/success)
```

### 4.3. Конфигурация

**Файл:** `backend/app/config.py` — добавить поля:

```python
# Payment (YooKassa)
FILLDOCS_YOOKASSA_SHOP_ID: str = ""
FILLDOCS_YOOKASSA_SECRET_KEY: str = ""
FILLDOCS_YOOKASSA_RETURN_URL: str = "https://filldocs.ru/donate/success"
```

**Файл:** `backend/.env` — добавить (значения НЕ коммитятся):

```bash
FILLDOCS_YOOKASSA_SHOP_ID=      # Shop ID из личного кабинета ЮКассы
FILLDOCS_YOOKASSA_SECRET_KEY=   # Секретный ключ из ЮКассы -> Настройки -> Ключи API
FILLDOCS_YOOKASSA_RETURN_URL=https://filldocs.ru/donate/success
```

**Где получить ключи:**
- https://yookassa.ru -> Личный кабинет -> Настройки -> Ключи API
- Тестовый режим: те же URL, но тестовые ключи (отдельный shop)
- Тестовая карта: `1111 1111 1111 1026`

### 4.4. Зависимости

**Backend:** добавить в `requirements.txt`:
```
yookassa>=3.0.0
```

### 4.5. Webhook настройка в ЮКассе

В личном кабинете ЮКассы -> Настройки -> HTTP-уведомления:
- URL: `https://filldocs.ru/api/webhook/yookassa`
- События: `payment.succeeded`

## 5. Юридические документы

Адаптировать из проекта `d:\Sources\pays\legal\`:

### 5.1. Публичная оферта
- **Источник:** `d:\Sources\pays\legal\oferta.txt`
- **Адаптация:** заменить HHHelper -> FillDocs, hhhelper.ru -> filldocs.ru
- **Суть:** информационная услуга (автозаполнение документов), оплата = донат/благодарность
- **Предмет:** добровольная оплата за использование сервиса автозаполнения реквизитов
- **Возврат:** полный возврат по обращению к @rotimulak (за вычетом комиссии платежной системы)
- **Размещение:** `frontend/public/legal/oferta.html` или отдельный роут

### 5.2. Политика конфиденциальности
- **Источник:** `d:\Sources\pays\legal\privacy-policy.md`
- **Адаптация:** заменить HHHelper -> FillDocs, убрать Telegram/HH.ru специфику
- **Собираемые данные FillDocs:**
  - Никаких персональных данных не собирается напрямую
  - Файлы удаляются сразу после обработки
  - Реквизиты хранятся в localStorage браузера (не на сервере)
  - При оплате: данные обрабатывает ЮКасса (мы не видим данные карты)
  - Umami-аналитика (без cookies, без персональных данных)
- **Размещение:** `frontend/public/legal/privacy.html` или отдельный роут

### 5.3. Реквизиты оператора (из pays)
- Белоусов Алексей Николаевич, самозанятый
- ИНН: 631625760179
- Контакт: @rotimulak (Telegram)

## 6. Что НЕ нужно

- БД для хранения платежей (FillDocs без БД; логи в stdout достаточно)
- Подписки, тарифы, токены — только разовый донат
- Блокировка скачивания до оплаты — скачивание всегда бесплатно
- Регистрация/авторизация пользователей

## 7. Структура файлов (новые/измененные)

```
backend/
  app/
    config.py                    # +3 env vars (YOOKASSA_*)
    api/routes.py                # +POST /api/donate, +POST /api/webhook/yookassa, +GET /api/donate/success
    services/payment_service.py  # NEW — YooKassa integration
  requirements.txt               # +yookassa
  .env                           # +FILLDOCS_YOOKASSA_* (не коммитить)

frontend/
  src/
    components/
      DonationBlock.tsx          # NEW — UI блок доната
      FillPanel.tsx              # подключить DonationBlock
    api/client.ts                # +createDonation()
  public/
    legal/
      oferta.html                # NEW — публичная оферта
      privacy.html               # NEW — политика конфиденциальности
```

## 8. Тест-план

1. [ ] Кнопка "Скачать документ" работает как раньше (без изменений)
2. [ ] Блок доната отображается только после успешного заполнения
3. [ ] Поле суммы: предзаполнено 100, принимает числа >= 10
4. [ ] "Поблагодарить" -> открывает ЮКассу в новой вкладке
5. [ ] На странице ЮКассы можно оплатить тестовой картой
6. [ ] После оплаты — редирект на страницу "Спасибо"
7. [ ] Webhook приходит и логируется
8. [ ] Ссылки на оферту и политику конфиденциальности открываются
9. [ ] При недоступности ЮКассы — корректная ошибка, скачивание не блокируется
