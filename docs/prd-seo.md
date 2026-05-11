# PRD: SEO-оптимизация FillDocs

**Статус:** Draft
**Дата:** 2026-05-11
**Автор:** Claude + rotimulak

---

## 1. Контекст и проблема

FillDocs — веб-приложение для автоматического заполнения реквизитов в документах Word. Приложение работает, приносит пользу, но **абсолютно невидимо для поисковых систем**.

### 1.1. Текущее состояние (аудит)

| Категория | Статус | Проблема |
|-----------|--------|----------|
| `<title>` | КРИТИЧНО | `<title>frontend</title>` — дефолт Vite |
| `<meta description>` | ОТСУТСТВУЕТ | Нет описания страницы |
| `lang` атрибут | НЕВЕРНЫЙ | `lang="en"` вместо `lang="ru"` |
| Open Graph теги | ОТСУТСТВУЮТ | При шеринге в соцсетях/мессенджерах — пустая карточка |
| Twitter Card | ОТСУТСТВУЕТ | Нет превью в Twitter/X |
| Favicon | ПЛОХО | Дефолтный `vite.svg` |
| `robots.txt` | ОТСУТСТВУЕТ | Поисковики не знают правил индексации |
| `sitemap.xml` | ОТСУТСТВУЕТ | Поисковики не знают структуры сайта |
| Canonical URL | ОТСУТСТВУЕТ | Риск дублей страниц |
| Structured Data (JSON-LD) | ОТСУТСТВУЕТ | Нет расширенных сниппетов в выдаче |
| SSR / Prerendering | НЕТ | SPA — поисковики видят пустой `<div id="root">` |
| Лендинг / контентные страницы | НЕТ | Только SPA-интерфейс, нет текстового контента |
| Аналитика | НЕТ | Umami упомянут в privacy policy, но не подключен |
| Nginx SEO-заголовки | НЕТ | Нет gzip, cache headers, security headers |
| Юридические страницы | ЧАСТИЧНО | `oferta.html` и `privacy.html` есть, но без OG/schema |
| Производительность (Core Web Vitals) | НЕ ИЗМЕРЕНА | Нет данных по LCP, CLS, INP |

### 1.2. Что это значит

- **Яндекс и Google не индексируют SPA** — видят пустой HTML с `<title>frontend</title>`
- **Шеринг ссылки в Telegram/VK/WhatsApp** — показывает пустую карточку без превью
- **Пользователи не находят FillDocs** по запросам типа "заполнить реквизиты в документе автоматически"
- **Нет возможности отслеживать** трафик, поведение, конверсии

---

## 2. Цели

1. **Индексация** — Яндекс и Google корректно индексируют FillDocs
2. **Сниппет** — в выдаче показывается осмысленный title + description
3. **Шеринг** — при отправке ссылки в мессенджер появляется красивая карточка с превью
4. **Контент** — есть хотя бы одна текстовая страница, объясняющая что такое FillDocs
5. **Аналитика** — можно видеть трафик и источники
6. **Core Web Vitals** — LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms

---

## 3. Решение: 7 фаз

Фазы упорядочены по приоритету и зависимостям. Техническая база (фазы 1-3) — обязательный фундамент. Контент и аналитика (фазы 4-7) — итеративно.

---

### Фаза 1: Базовый HTML и мета-теги (КРИТИЧНО)

**Цель:** Поисковики и мессенджеры видят корректную информацию о странице.

#### 1.1. Исправить `frontend/index.html`

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Title & Description -->
    <title>FillDocs — автозаполнение реквизитов в документах</title>
    <meta name="description" content="Загрузите документ Word с реквизитами компании — FillDocs автоматически заполнит шаблон договора, счёта или акта. Бесплатно, без регистрации." />

    <!-- Canonical -->
    <link rel="canonical" href="https://filldocs.ru/" />

    <!-- Open Graph (VK, Telegram, WhatsApp) -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://filldocs.ru/" />
    <meta property="og:title" content="FillDocs — автозаполнение реквизитов в документах" />
    <meta property="og:description" content="Загрузите документ Word с реквизитами компании — FillDocs автоматически заполнит шаблон договора, счёта или акта." />
    <meta property="og:image" content="https://filldocs.ru/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="FillDocs" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="FillDocs — автозаполнение реквизитов в документах" />
    <meta name="twitter:description" content="Загрузите документ Word с реквизитами компании — FillDocs автоматически заполнит шаблон." />
    <meta name="twitter:image" content="https://filldocs.ru/og-image.png" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <!-- Theme -->
    <meta name="theme-color" content="#2563eb" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### 1.2. Создать OG-картинку

**Файл:** `frontend/public/og-image.png` (1200x630px)

Содержание:
- Логотип FillDocs
- Текст: "Автозаполнение реквизитов в документах Word"
- Визуал: стрелка из документа с реквизитами → заполненный шаблон
- Брендовые цвета (синий `#2563eb` + белый)

Можно создать в Figma, Canva или программно (например, `@vercel/og`).

#### 1.3. Создать favicon

Заменить дефолтный `vite.svg` на брендированный:
- `favicon.svg` — SVG иконка (для современных браузеров)
- `favicon-32.png` — 32x32 PNG (fallback)
- `apple-touch-icon.png` — 180x180 PNG (iOS)

Можно использовать букву "F" или стилизованный документ.

#### 1.4. Задачи

- [ ] Обновить `frontend/index.html` (title, meta, OG, favicon)
- [ ] Исправить `lang="en"` → `lang="ru"`
- [ ] Создать OG-картинку 1200x630
- [ ] Создать favicon (SVG + PNG + Apple Touch)
- [ ] Удалить `vite.svg` из public

---

### Фаза 2: Технический SEO (robots, sitemap, headers)

**Цель:** Поисковые роботы могут корректно обходить и индексировать сайт.

#### 2.1. robots.txt

**Файл:** `frontend/public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://filldocs.ru/sitemap.xml
```

#### 2.2. sitemap.xml

**Файл:** `frontend/public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://filldocs.ru/</loc>
    <lastmod>2026-05-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://filldocs.ru/legal/oferta.html</loc>
    <lastmod>2026-05-11</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://filldocs.ru/legal/privacy.html</loc>
    <lastmod>2026-05-11</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

При добавлении новых страниц (лендинг, блог) — обновлять sitemap.

#### 2.3. Nginx: заголовки, gzip, кэширование

**Файл:** `deploy/nginx-host.conf` — расширить:

```nginx
server {
    listen 80;
    server_name filldocs.ru www.filldocs.ru;

    # Редирект www → без www
    if ($host = www.filldocs.ru) {
        return 301 https://filldocs.ru$request_uri;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 256;

    # Статика: длинный кэш (Vite добавляет хэш в имена файлов)
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        proxy_pass http://127.0.0.1:4000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

#### 2.4. Задачи

- [ ] Создать `frontend/public/robots.txt`
- [ ] Создать `frontend/public/sitemap.xml`
- [ ] Обновить `deploy/nginx-host.conf` (www-редирект, gzip, кэш, security headers)
- [ ] Настроить HTTPS через certbot (если ещё не настроен)
- [ ] Проверить www → filldocs.ru редирект

---

### Фаза 3: Structured Data (JSON-LD)

**Цель:** Расширенные сниппеты в поисковой выдаче, понимание сущностей поисковиками.

#### 3.1. Organization schema

Добавить в `<head>` файла `index.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "FillDocs",
  "url": "https://filldocs.ru",
  "description": "Автоматическое заполнение реквизитов компании в документах Word с помощью ИИ",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "RUB"
  },
  "author": {
    "@type": "Person",
    "name": "Алексей Белоусов"
  },
  "inLanguage": "ru",
  "browserRequirements": "Requires JavaScript",
  "softwareHelp": {
    "@type": "CreativeWork",
    "url": "https://filldocs.ru/"
  }
}
</script>
```

#### 3.2. FAQ schema (если появится FAQ-секция)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Как работает FillDocs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Загрузите документ с реквизитами компании (карточку компании, выписку ЕГРЮЛ). Затем загрузите шаблон документа (договор, счёт, акт). FillDocs с помощью ИИ найдёт и заполнит все поля реквизитов автоматически."
      }
    },
    {
      "@type": "Question",
      "name": "Это бесплатно?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Да, FillDocs полностью бесплатен. После заполнения документа можно оставить добровольный донат."
      }
    },
    {
      "@type": "Question",
      "name": "Безопасно ли загружать документы?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Да. Файлы удаляются сразу после обработки и не сохраняются на сервере. Реквизиты хранятся только в вашем браузере (localStorage)."
      }
    }
  ]
}
</script>
```

#### 3.3. Задачи

- [ ] Добавить WebApplication JSON-LD в `index.html`
- [ ] Подготовить FAQ JSON-LD (добавить когда появится FAQ-секция на странице)
- [ ] Валидировать через Google Rich Results Test
- [ ] Валидировать через Яндекс.Вебмастер → Валидатор микроразметки

---

### Фаза 4: Контент и лендинг

**Цель:** Дать поисковикам текстовый контент для индексации. SPA-интерфейс инструмента — это не контент.

#### 4.1. Проблема SPA

Сейчас весь контент рендерится на клиенте (React). Поисковые роботы (особенно Яндекс) видят:
```html
<title>frontend</title>
<div id="root"></div>
```

**Два варианта решения:**

**Вариант A: Prerendering (рекомендуется)**

Использовать `vite-plugin-prerender` или `vite-ssg` для генерации статического HTML при билде. Подходит для SPA с фиксированным набором страниц.

```bash
npm install -D vite-plugin-prerender
```

```typescript
// vite.config.ts
import prerender from 'vite-plugin-prerender'

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: ['/'],
      renderer: new PuppeteerRenderer()
    })
  ],
})
```

**Плюсы:** Минимальные изменения, SPA остаётся как есть.
**Минусы:** Нужен Puppeteer при билде, контент всё равно динамический.

**Вариант B: Отдельный лендинг (альтернатива)**

Создать статическую HTML-страницу `frontend/public/index-landing.html` с полным контентом, и показывать её по `/` для ботов через nginx. SPA доступен по `/app`.

**Плюсы:** Полный контроль над контентом для ботов.
**Минусы:** Две точки входа, сложнее поддерживать.

**Рекомендация:** Вариант A (prerendering) для MVP, с переходом на SSR (Astro/Next.js) если появятся дополнительные контентные страницы.

#### 4.2. Noscript fallback

Добавить в `index.html` внутрь `<div id="root">`:

```html
<div id="root">
  <noscript>
    <h1>FillDocs — автозаполнение реквизитов в документах</h1>
    <p>Для работы приложения необходим JavaScript.</p>
    <p>FillDocs автоматически заполняет реквизиты компании в документах Word (.docx) с помощью ИИ. Загрузите документ с реквизитами и шаблон — получите заполненный документ за секунды.</p>
  </noscript>
</div>
```

#### 4.3. Семантический HTML в App.tsx

Текущий `App.tsx` уже использует `<header>`, `<main>`, `<footer>` — это хорошо. Улучшения:

```tsx
// Добавить aria-label и более описательный footer
<footer className="...">
  <p>Файлы не сохраняются на сервере. Реквизиты хранятся только в вашем браузере.</p>
  <nav aria-label="Юридическая информация">
    <a href="/legal/oferta.html">Оферта</a>
    <a href="/legal/privacy.html">Политика конфиденциальности</a>
  </nav>
</footer>
```

#### 4.4. Задачи

- [ ] Добавить `<noscript>` fallback в `index.html`
- [ ] Добавить ссылки на оферту/privacy в footer `App.tsx`
- [ ] Исследовать `vite-plugin-prerender` для статической генерации
- [ ] (Опционально) Создать контентную landing page с описанием сервиса

---

### Фаза 5: Оптимизация юридических страниц

**Цель:** Юридические страницы тоже участвуют в SEO-профиле сайта.

#### 5.1. Обновить `oferta.html` и `privacy.html`

Добавить в обе страницы:
- `<meta name="description" content="...">`
- `<link rel="canonical" href="https://filldocs.ru/legal/oferta.html">`
- OG-теги (минимальные)
- Ссылку обратно на главную (`<a href="/">← FillDocs</a>`)
- Навигационную крошку (breadcrumb)

#### 5.2. Breadcrumb JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "FillDocs", "item": "https://filldocs.ru/" },
    { "@type": "ListItem", "position": 2, "name": "Оферта", "item": "https://filldocs.ru/legal/oferta.html" }
  ]
}
</script>
```

#### 5.3. Задачи

- [ ] Обновить `oferta.html` — добавить description, canonical, OG, breadcrumb, ссылку на главную
- [ ] Обновить `privacy.html` — то же самое
- [ ] Добавить BreadcrumbList JSON-LD

---

### Фаза 6: Аналитика и мониторинг

**Цель:** Измерять результат SEO-работы, видеть трафик и поведение.

#### 6.1. Подключить Umami (self-hosted)

Umami уже упомянут в privacy policy. Нужно реально подключить.

```html
<!-- frontend/index.html -->
<script defer src="https://analytics.filldocs.ru/script.js"
        data-website-id="YOUR-WEBSITE-ID"></script>
```

**Плюсы Umami:** GDPR/152-ФЗ compliant, без cookies, self-hosted, open source.

#### 6.2. Подключить Яндекс.Вебмастер

- Зарегистрировать `filldocs.ru` в [Яндекс.Вебмастер](https://webmaster.yandex.ru/)
- Подтвердить через meta-тег или DNS
- Отправить sitemap.xml
- Мониторить индексацию

```html
<!-- Подтверждение Яндекс.Вебмастер -->
<meta name="yandex-verification" content="YOUR_CODE" />
```

#### 6.3. Google Search Console

- Зарегистрировать `filldocs.ru` в [Google Search Console](https://search.google.com/search-console/)
- Подтвердить через meta-тег или DNS
- Отправить sitemap.xml

```html
<meta name="google-site-verification" content="YOUR_CODE" />
```

#### 6.4. Core Web Vitals мониторинг

Добавить в React:

```typescript
// frontend/src/vitals.ts
import { onCLS, onINP, onLCP } from 'web-vitals';

function sendToAnalytics(metric: { name: string; value: number }) {
  // Отправка в Umami custom event
  if (window.umami) {
    window.umami.track(metric.name, { value: Math.round(metric.value) });
  }
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
```

```bash
npm install web-vitals
```

#### 6.5. Задачи

- [ ] Развернуть Umami на VPS (Docker)
- [ ] Подключить Umami-скрипт в `index.html`
- [ ] Зарегистрировать сайт в Яндекс.Вебмастер
- [ ] Зарегистрировать сайт в Google Search Console
- [ ] Отправить sitemap в оба сервиса
- [ ] Добавить `web-vitals` для мониторинга Core Web Vitals
- [ ] (Опционально) Подключить Яндекс.Метрику для вебвизора

---

### Фаза 7: Продвижение и внешние сигналы

**Цель:** Внешние ссылки и присутствие в каталогах.

#### 7.1. Контент-маркетинг

- Написать статью "Как автоматически заполнить реквизиты в договоре" на VC.ru / Habr
- Опубликовать проект на Product Hunt (русскоязычные аналоги: Startpack, Spark)
- Упомянуть в тематических Telegram-каналах про автоматизацию бизнеса

#### 7.2. Ключевые запросы (семантическое ядро)

| Запрос | Тип intent | Частотность |
|--------|-----------|-------------|
| заполнить реквизиты в документе автоматически | транзакционный | средняя |
| автозаполнение реквизитов | транзакционный | низкая |
| заполнить шаблон договора онлайн | транзакционный | средняя |
| заполнить карточку предприятия | транзакционный | средняя |
| подставить реквизиты в договор | транзакционный | низкая |
| реквизиты компании заполнить | информационный | средняя |
| сервис заполнения документов | коммерческий | низкая |
| filldocs | навигационный | — |

**Рекомендация:** Оптимизировать title/description под 2-3 основных запроса. Остальные покрывать через контентные страницы (если появятся).

#### 7.3. Задачи

- [ ] Определить финальное семантическое ядро (Яндекс.Wordstat + Google Keyword Planner)
- [ ] Написать и опубликовать статью на VC.ru / Habr
- [ ] Зарегистрировать в каталогах SaaS-инструментов
- [ ] (Опционально) Завести Telegram-канал FillDocs

---

## 4. Приоритизация

| Фаза | Приоритет | Сложность | Влияние на SEO |
|------|-----------|-----------|----------------|
| 1. HTML и мета-теги | P0 — must have | Низкая (1-2 часа) | Критическое |
| 2. robots.txt + sitemap | P0 — must have | Низкая (30 мин) | Высокое |
| 3. Structured Data | P1 — should have | Низкая (1 час) | Среднее |
| 4. Контент и prerender | P1 — should have | Средняя (4-8 часов) | Высокое |
| 5. Юридические страницы | P2 — nice to have | Низкая (1 час) | Низкое |
| 6. Аналитика | P1 — should have | Средняя (2-4 часа) | Необходимо для измерения |
| 7. Внешние сигналы | P2 — nice to have | Высокая (ongoing) | Высокое (долгосрочно) |

---

## 5. Структура файлов (новые/измененные)

```
frontend/
  index.html                          # ИЗМЕНЁН — title, meta, OG, favicon, JSON-LD, noscript
  public/
    robots.txt                        # NEW
    sitemap.xml                       # NEW
    og-image.png                      # NEW — 1200x630 OG-картинка
    favicon.svg                       # NEW — SVG favicon
    favicon-32.png                    # NEW — PNG favicon 32x32
    apple-touch-icon.png              # NEW — Apple Touch Icon 180x180
    legal/
      oferta.html                     # ИЗМЕНЁН — +meta, +OG, +breadcrumb, +ссылка на главную
      privacy.html                    # ИЗМЕНЁН — +meta, +OG, +breadcrumb, +ссылка на главную
  src/
    App.tsx                           # ИЗМЕНЁН — footer links, aria-labels
    vitals.ts                         # NEW — Core Web Vitals reporting
    main.tsx                          # ИЗМЕНЁН — import vitals
  package.json                        # ИЗМЕНЁН — +web-vitals

deploy/
  nginx-host.conf                     # ИЗМЕНЁН — gzip, cache, security headers, www redirect
```

---

## 6. Метрики успеха

| Метрика | Текущее | Цель (через 1 мес.) | Цель (через 3 мес.) |
|---------|---------|---------------------|---------------------|
| Индексация в Яндексе | 0 страниц | ≥ 3 страницы | ≥ 5 страниц |
| Индексация в Google | 0 страниц | ≥ 3 страницы | ≥ 5 страниц |
| OG-превью при шеринге | Нет | Работает | Работает |
| Organic трафик (Umami) | Неизвестно | Baseline | +50% от baseline |
| Core Web Vitals (LCP) | Не измерен | ≤ 2.5s | ≤ 2.0s |
| Позиция по "заполнить реквизиты в документе" | Не в индексе | Top 50 | Top 20 |

---

## 7. Что НЕ нужно

- **Переезд на Next.js / Astro** — overkill для одностраничного SPA-инструмента на текущем этапе
- **React Helmet** — для SPA с одной страницей достаточно статических мета-тегов в `index.html`
- **Блог** — не нужен на MVP, достаточно одной страницы + внешних публикаций
- **Платная реклама** — фокус на органическом трафике
- **Многоязычность (i18n)** — аудитория русскоязычная, `lang="ru"` достаточно
- **AMP-страницы** — устаревший формат, не нужен

---

## 8. Риски

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Яндекс не рендерит SPA | Высокая | Prerendering (фаза 4) или noscript fallback |
| OG-картинка не подхватывается мессенджерами | Средняя | Проверить через Telegram Bot @WebpageBot, VK debugger |
| Core Web Vitals ухудшатся от аналитики | Низкая | Umami — легковесный скрипт (<1KB), defer loading |
| Конкуренция по ключевым запросам | Высокая | Нишевые long-tail запросы, уникальный функционал |

---

## 9. Тест-план

1. [ ] `<title>` отображается корректно в табе браузера
2. [ ] `site:filldocs.ru` в Яндексе/Google показывает страницы (через 2-4 недели)
3. [ ] Отправка ссылки `filldocs.ru` в Telegram — показывает карточку с картинкой и описанием
4. [ ] Отправка в VK — аналогично
5. [ ] `robots.txt` доступен по `https://filldocs.ru/robots.txt`
6. [ ] `sitemap.xml` доступен и валиден (xmlsitemapvalidator.com)
7. [ ] JSON-LD валиден (Google Rich Results Test)
8. [ ] Lighthouse SEO score ≥ 90
9. [ ] PageSpeed Insights — все Core Web Vitals зелёные
10. [ ] Nginx возвращает gzip для CSS/JS
11. [ ] `www.filldocs.ru` редиректит на `filldocs.ru`
12. [ ] Umami отображает визиты
