# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FillDocs — веб-приложение для автоматического заполнения реквизитов компании в документах Word (.docx) с помощью LLM. Система без БД: реквизиты хранятся в localStorage браузера, файлы обрабатываются временно и удаляются сразу после использования.

**Версия:** v2 (LLM-based). Код v1 (regex) сохранён в ветке `v1`.

## Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload          # Dev server on :8000
PYTHONIOENCODING=utf-8 python -m pytest tests/ -v  # Run tests (44 tests)
```

### Frontend (React + Vite + Tailwind v4)
```bash
cd frontend
npm install
npm run dev                            # Dev server on :5173
npm run build                          # Production build
```

### CLI Scripts
```bash
PYTHONIOENCODING=utf-8 python scripts/inspect_docx.py "file.docx"
python scripts/fill_docx.py "template.docx" "output.docx" "requisites.json"
python scripts/convert_doc.py "file.doc"
```

## Architecture

**Three-panel UI**: Left panel extracts requisites via LLM → localStorage. Center panel fills template via LLM → download. Right panel shows info.

**Backend services**:
- `backend/app/services/llm_service.py` — LLM API (Anthropic Claude): extract requisites, generate fill instructions
- `backend/app/services/docx_text.py` — docx → text conversion, table detection
- `backend/app/services/converter.py` — .doc → .docx conversion (pywin32/LibreOffice)
- `backend/app/config.py` — Settings via pydantic-settings (.env)
- `backend/app/prompts/` — LLM prompts (extract.txt, fill.txt)

**Key algorithm (v2)**:
- Extract: docx → text → LLM → XML `<requisites><field name="...">...</field></requisites>` → dict
- Fill: find table → text + requisites XML → LLM → JSON `[{row, col, value}]` → apply to docx

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/extract-requisites` | docx → LLM → JSON requisites |
| POST | `/api/fill` | template + requisites → LLM → filled docx |
| GET | `/api/download/{filename}` | Download filled document |
| GET | `/api/templates` | List available templates |
| GET | `/api/requisites/sample` | Sample requisites structure |

## Key Files

- `backend/app/services/llm_service.py` — LLM service (Anthropic SDK, retry, XML/JSON parsing)
- `backend/app/services/docx_text.py` — docx_to_text(), find_requisites_table()
- `backend/app/prompts/extract.txt` — prompt for requisites extraction
- `backend/app/prompts/fill.txt` — prompt for fill instructions
- `backend/app/config.py` — Settings (env: FILLDOCS_LLM_API_KEY, FILLDOCS_LLM_MODEL)
- `frontend/src/types/index.ts` — Requisites = Record<string, string> (dynamic fields)
- `frontend/src/api/client.ts` — API client
- `docs/architecture.md` — system architecture
- `docs/solution.md` — algorithms and data flows

## Configuration

```bash
# backend/.env (or environment variables)
FILLDOCS_LLM_API_KEY=your-anthropic-api-key
FILLDOCS_LLM_BASE_URL=https://api.anthropic.com
FILLDOCS_LLM_MODEL=claude-sonnet-4-20250514
```

## Notes

- Windows console encoding: prefix Python commands with `PYTHONIOENCODING=utf-8`
- All uploaded files are deleted immediately after processing (no persistent storage)
- .doc files auto-convert to .docx before processing
- Requisites are dynamic dict[str, str] with Russian keys (not fixed Pydantic model)
- LLM errors (timeout, API) return HTTP 502
- Legacy v1 code (`docx_filler.py`) still used for table scoring heuristics

## Dev Server Ports

Backend и frontend используют фиксированные порты. **НИКОГДА не меняй порты** в vite.config.ts или при запуске uvicorn.

| Service | Port | Config |
|---------|------|--------|
| Backend (uvicorn) | **8000** | стандартный порт uvicorn |
| Frontend (Vite) | **5175** | `frontend/vite.config.ts` → `server.port` |
| Vite proxy → Backend | **8000** | `frontend/vite.config.ts` → `server.proxy['/api']` |

- Если порт 8000 занят — **убей старый процесс**, а не запускай на другом порту
- Если нужно перезапустить бэкенд — попроси пользователя сделать это в его терминале, не запускай фоновые процессы uvicorn
- Фоновые процессы uvicorn (run_in_background) ненадёжны на Windows — они могут завершиться до получения запроса

## Troubleshooting

### CSS/Tailwind не загружается на dev-сервере

Проект использует Tailwind v4. В `frontend/src/index.css`:
```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";
```
Файл `tailwind.config.js` в v4 не нужен.
