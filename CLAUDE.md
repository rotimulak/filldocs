# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FillDocs — веб-приложение для автоматического заполнения реквизитов компании в документах Word (.docx). Система без БД: реквизиты хранятся в localStorage браузера, файлы обрабатываются временно и удаляются сразу после использования.

## Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload          # Dev server on :8000
```

### Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev                            # Dev server on :5173
npm run build                          # Production build
```

### CLI Scripts
```bash
# Inspect docx structure
PYTHONIOENCODING=utf-8 python scripts/inspect_docx.py "file.docx"

# Fill document from JSON
python scripts/fill_docx.py "template.docx" "output.docx" "requisites.json"

# Convert .doc to .docx (Windows only)
python scripts/convert_doc.py "file.doc"
```

## Architecture

**Two-panel UI**: Left panel extracts requisites from document → localStorage. Right panel fills template with requisites → download.

**Backend services**:
- `backend/app/services/docx_filler.py` — fills docx tables by matching labels to JSON fields via `LABEL_MAPPING`
- `backend/app/services/converter.py` — converts .doc→.docx using pywin32 (Windows) or LibreOffice

**Key algorithm**: Iterates tables, finds label text in column 1 (or 2), writes value to column 2 (or 3). Labels matched via partial string search against `DEFAULT_LABEL_MAPPING`.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/extract-requisites` | Parse requisites from uploaded doc |
| POST | `/api/fill` | Fill template with requisites JSON |
| GET | `/api/download/{filename}` | Download filled document |
| GET | `/api/templates` | List available templates |

## Key Files

- `backend/app/services/docx_filler.py:DEFAULT_LABEL_MAPPING` — mapping of Russian labels to JSON field names
- `backend/app/models/requisites.py:Requisites` — Pydantic model for company requisites
- `frontend/src/api/client.ts` — API client for all endpoints
- `docs/TASK.md` — UI specification
- `docs/architecture.md` — system architecture

## Notes

- Windows console encoding issues: prefix Python commands with `PYTHONIOENCODING=utf-8`
- All uploaded files are deleted immediately after processing (no persistent storage)
- .doc files auto-convert to .docx before processing

## Troubleshooting

### CSS/Tailwind не загружается на dev-сервере

**Симптомы**: Страница отображается без стилей, Tailwind-классы не работают.

**Причина**: Несовместимость синтаксиса Tailwind v3 и v4. Проект использует Tailwind v4, где изменился формат конфигурации.

**Решение**: В `frontend/src/index.css` использовать синтаксис v4:
```css
/* Tailwind v4 (правильно) */
@import "tailwindcss";
@plugin "@tailwindcss/forms";

/* Tailwind v3 (устаревший) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Файл `tailwind.config.js` в v4 не нужен — конфигурация задаётся через `@theme` в CSS.
