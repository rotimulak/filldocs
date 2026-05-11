"""API эндпоинты"""
import json
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, Field
import shutil
import uuid
import os

import openai
from docx import Document

from app.models.requisites import FillResponse, ExtractResponse, RawField, FilledCell, EmptyCell
from app.services.converter import converter
from app.services.docx_text import docx_to_text, find_requisites_table, docx_tables_to_text
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


def requisites_to_xml(requisites: dict[str, str]) -> str:
    """Конвертировать dict реквизитов в XML для LLM"""
    parts = ['<requisites>']
    for name, value in requisites.items():
        parts.append(f'  <field name="{name}">{value}</field>')
    parts.append('</requisites>')
    return '\n'.join(parts)


router = APIRouter()

# Пути к папкам данных
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
TEMPLATES_DIR = DATA_DIR / "templates"
OUTPUT_DIR = DATA_DIR / "output"
REQUISITES_DIR = DATA_DIR / "requisites"
TEMP_DIR = DATA_DIR / "temp"

# Создание директорий при запуске
for dir_path in [TEMPLATES_DIR, OUTPUT_DIR, REQUISITES_DIR, TEMP_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Допустимые расширения и максимальный размер файла
ALLOWED_EXTENSIONS = {".doc", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def cleanup_file(path: Path):
    """Удаление файла (для background tasks)"""
    try:
        if path.exists():
            os.remove(path)
    except Exception:
        pass


@router.get("/templates")
async def list_templates():
    """Список доступных шаблонов"""
    templates = []
    for ext in ["*.docx", "*.doc"]:
        templates.extend([f.name for f in TEMPLATES_DIR.glob(ext)])
    return {"templates": templates}


@router.post("/extract-requisites", response_model=ExtractResponse)
async def extract_requisites(file: UploadFile = File(...)):
    """
    Извлечь реквизиты из загруженного документа.

    Принимает .doc или .docx файл, извлекает реквизиты из таблицы.
    Файл удаляется сразу после обработки.
    """
    # Валидация расширения
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Недопустимый формат файла. Допустимы: {', '.join(ALLOWED_EXTENSIONS)}")

    # Валидация размера (читаем в память для проверки)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Файл слишком большой. Максимум: {MAX_FILE_SIZE // 1024 // 1024} МБ")

    # Сохранение временного файла
    temp_filename = f"{uuid.uuid4().hex}{ext}"
    temp_path = TEMP_DIR / temp_filename

    try:
        with open(temp_path, "wb") as f:
            f.write(content)

        # Конвертация .doc в .docx если нужно
        docx_path = temp_path
        converted_path = None
        if ext == ".doc":
            try:
                converted_path = converter.convert(temp_path)
                docx_path = converted_path
            except Exception as e:
                raise HTTPException(500, f"Ошибка конвертации .doc: {str(e)}")

        # Извлечение текста из документа
        document_text = docx_to_text(docx_path)

        # Извлечение реквизитов через LLM
        try:
            requisites = await llm_service.extract_requisites(document_text)
        except ValueError as e:
            raise HTTPException(502, f"Ошибка разбора ответа LLM: {e}")
        except openai.APITimeoutError as e:
            raise HTTPException(502, f"Таймаут LLM API: {e}")
        except openai.APIStatusError as e:
            raise HTTPException(502, f"Ошибка LLM API ({e.status_code}): {e}")
        except openai.APIConnectionError as e:
            raise HTTPException(502, f"Ошибка соединения с LLM API: {e}")

        raw_fields = [
            RawField(label=key, value=value, matched_key=None)
            for key, value in requisites.items()
        ]

        if not requisites:
            return ExtractResponse(
                success=False,
                requisites={},
                raw_fields=[],
                warnings=["LLM не нашёл реквизитов в документе"],
                message="Реквизиты не найдены в документе"
            )

        return ExtractResponse(
            success=True,
            requisites=requisites,
            raw_fields=raw_fields,
            warnings=[],
            message=f"Извлечено {len(requisites)} полей из документа"
        )

    finally:
        # Очистка временных файлов
        if temp_path.exists():
            os.remove(temp_path)
        if converted_path and converted_path.exists():
            os.remove(converted_path)


@router.post("/templates/upload")
async def upload_template(file: UploadFile = File(...)):
    """Загрузка нового шаблона"""
    if not file.filename.endswith(('.docx', '.doc')):
        raise HTTPException(400, "Только .doc и .docx файлы")

    dest = TEMPLATES_DIR / file.filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"message": f"Шаблон {file.filename} загружен", "path": str(dest)}


@router.post("/fill", response_model=FillResponse)
async def fill_document(
    file: UploadFile = File(...),
    requisites: str = Form(...)  # JSON string
):
    """
    Заполнить документ реквизитами через LLM.

    Принимает:
    - file: шаблон .doc или .docx
    - requisites: JSON строка с реквизитами

    Поток: загрузка -> поиск таблицы -> LLM генерирует инструкции -> применение к docx -> скачивание.
    """
    # Валидация расширения
    filename = file.filename or "template"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Недопустимый формат файла. Допустимы: {', '.join(ALLOWED_EXTENSIONS)}")

    # Парсинг реквизитов
    if not requisites:
        raise HTTPException(400, "Не переданы реквизиты (requisites)")

    try:
        requisites_data = json.loads(requisites)
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"Некорректный JSON реквизитов: {str(e)}")

    # Валидация размера
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Файл слишком большой. Максимум: {MAX_FILE_SIZE // 1024 // 1024} МБ")

    # Сохранение временного файла
    temp_filename = f"{uuid.uuid4().hex}{ext}"
    temp_path = TEMP_DIR / temp_filename

    try:
        with open(temp_path, "wb") as f:
            f.write(content)

        # Конвертация .doc в .docx если нужно
        docx_path = temp_path
        converted_path = None
        if ext == ".doc":
            try:
                converted_path = converter.convert(temp_path)
                docx_path = converted_path
            except Exception as e:
                raise HTTPException(500, f"Ошибка конвертации .doc: {str(e)}")

        # Генерируем имя выходного файла
        base_name = Path(filename).stem
        output_name = f"{base_name}_filled_{uuid.uuid4().hex[:8]}.docx"
        output_path = OUTPUT_DIR / output_name

        # Найти таблицу с реквизитами
        table_info = find_requisites_table(docx_path)
        if not table_info:
            # Fallback: взять все таблицы
            tables = docx_tables_to_text(docx_path)
            if tables:
                table_info = tables[0]

        if not table_info:
            raise HTTPException(400, "Таблица для заполнения не найдена")

        # Конвертировать реквизиты в XML
        requisites_xml = requisites_to_xml(requisites_data)

        # DEBUG: вывести таблицу, которую видит LLM
        logger.warning("=== TABLE TEXT FOR LLM ===\n%s", table_info["text"])
        logger.warning("=== CELLS MATRIX ===")
        for r_idx, row_cells in enumerate(table_info.get("cells", [])):
            logger.warning("  Row %d: %s", r_idx, row_cells)

        # Получить инструкции от LLM
        try:
            instructions = await llm_service.generate_fill_instructions(
                table_info["text"], requisites_xml
            )
        except ValueError as e:
            raise HTTPException(502, f"Ошибка разбора ответа LLM: {e}")
        except openai.APITimeoutError as e:
            raise HTTPException(502, f"Таймаут LLM API: {e}")
        except openai.APIStatusError as e:
            raise HTTPException(502, f"Ошибка LLM API ({e.status_code}): {e}")
        except openai.APIConnectionError as e:
            raise HTTPException(502, f"Ошибка соединения с LLM API: {e}")

        logger.warning("=== LLM INSTRUCTIONS ===\n%s", json.dumps(instructions, ensure_ascii=False, indent=2))

        # Применить инструкции к docx
        doc = Document(str(docx_path))
        table = doc.tables[table_info["index"]]
        cells_matrix = table_info.get("cells", [])

        # Обратный индекс: значение -> ключ реквизита
        value_to_key: dict[str, str] = {v: k for k, v in requisites_data.items() if v}

        filled_count = 0
        skipped_count = 0
        filled_details: list[FilledCell] = []
        filled_rows: set[int] = set()

        for instr in instructions:
            row_idx, col_idx, value = instr["row"], instr["col"], instr["value"]
            if row_idx < len(table.rows) and col_idx < len(table.rows[row_idx].cells):
                table.rows[row_idx].cells[col_idx].text = value
                filled_count += 1
                filled_rows.add(row_idx)

                # Метка — ячейка слева от заполненной
                label = ""
                if row_idx < len(cells_matrix) and col_idx > 0:
                    row_cells = cells_matrix[row_idx]
                    label = row_cells[col_idx - 1].strip() if col_idx - 1 < len(row_cells) else ""
                # Усекаем длинные метки
                label = label[:120] if label else f"ячейка ({row_idx},{col_idx})"

                # Ищем ключ реквизита по значению
                req_key = value_to_key.get(value)

                filled_details.append(FilledCell(label=label, value=value, requisite_key=req_key))
            else:
                skipped_count += 1
                logger.warning(
                    "Skipping out-of-bounds instruction: row=%d, col=%d (table: %d rows)",
                    row_idx, col_idx, len(table.rows),
                )

        # Определяем колонку значений по большинству инструкций
        empty_cells: list[EmptyCell] = []
        total_fields = filled_count  # минимум — сколько заполнили
        if cells_matrix and instructions:
            col_votes = [instr["col"] for instr in instructions if instr["row"] < len(table.rows)]
            value_col = max(set(col_votes), key=col_votes.count) if col_votes else 1
            label_col = value_col - 1 if value_col > 0 else 0

            # Считаем все строки с меткой (= все поля таблицы), пропуская заголовок (row 0)
            total_fields = 0
            for r_idx, row_cells in enumerate(cells_matrix):
                if r_idx == 0:
                    continue  # заголовок таблицы
                if label_col < len(row_cells) and row_cells[label_col].strip():
                    total_fields += 1
                    # Незаполненные строки с пустым значением
                    if r_idx not in filled_rows and value_col < len(row_cells) and not row_cells[value_col].strip():
                        empty_cells.append(EmptyCell(label=row_cells[label_col].strip()[:120]))

        doc.save(str(output_path))

        response = FillResponse(
            success=True,
            filled_fields=filled_count,
            total_instructions=total_fields,
            filled_details=filled_details,
            empty_cells=empty_cells,
            skipped_count=skipped_count,
            download_url=f"/api/download/{output_name}",
            filename=output_name,
            message=f"Заполнено {filled_count} ячеек",
        )
        dumped = response.model_dump()
        logger.warning("FILL RESPONSE DUMP: keys=%s, filled_details_count=%d", list(dumped.keys()), len(dumped.get("filled_details", [])))
        return dumped

    finally:
        # Очистка временных файлов (шаблон)
        if temp_path.exists():
            os.remove(temp_path)
        if converted_path and converted_path.exists():
            os.remove(converted_path)


@router.get("/download/{filename}")
async def download_file(filename: str, background_tasks: BackgroundTasks):
    """
    Скачать заполненный документ.

    Файл удаляется после скачивания (через background task).
    """
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "Файл не найден")

    # Удаление файла после скачивания
    background_tasks.add_task(cleanup_file, file_path)

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


@router.post("/convert")
async def convert_doc(file: UploadFile = File(...)):
    """Конвертировать .doc в .docx"""
    if not file.filename.endswith('.doc'):
        raise HTTPException(400, "Только .doc файлы")

    # Сохраняем временный файл
    temp_doc = TEMPLATES_DIR / file.filename
    with open(temp_doc, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Конвертируем
    docx_path = converter.convert(temp_doc)

    return {
        "message": "Конвертация завершена",
        "original": file.filename,
        "converted": docx_path.name
    }


@router.get("/requisites/sample")
async def get_sample_requisites():
    """Пример структуры реквизитов"""
    return {
        "Наименование компании": 'ООО "Пример"',
        "ИНН": "1234567890",
        "КПП": "123456789",
        "Юридический адрес": "г. Москва, ул. Примерная, д. 1",
        "Банк": "ПАО Сбербанк",
        "БИК": "044525225",
        "Расчётный счёт": "40702810938000012345",
        "Руководитель": "Иванов Иван Иванович",
    }


# --- Donation (YooKassa) ---


class DonateRequest(BaseModel):
    amount: int = Field(ge=10, le=15000, description="Сумма доната в рублях")


@router.post("/donate")
async def create_donation(body: DonateRequest):
    """Создать платёж-донат через ЮКассу."""
    from app.services.payment_service import create_donation
    from app.config import settings

    if not settings.yookassa_shop_id or not settings.yookassa_secret_key:
        raise HTTPException(503, "Платежи временно недоступны")

    try:
        confirmation_url = create_donation(body.amount)
    except Exception as e:
        logger.error("YooKassa payment creation failed: %s", e)
        raise HTTPException(502, "Ошибка создания платежа")

    return {"confirmation_url": confirmation_url}


DONATE_SUCCESS_HTML = """<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Спасибо за поддержку — FillDocs</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           display: flex; justify-content: center; align-items: center;
           min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
    .card { text-align: center; padding: 3rem 2rem; background: white;
            border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 420px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; line-height: 1.6; }
    a { color: #2563eb; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Спасибо за поддержку!</h1>
    <p>Ваша благодарность помогает нам развивать FillDocs.</p>
    <p><a href="/">Вернуться к сервису</a></p>
  </div>
</body>
</html>"""


@router.get("/donate/success", response_class=HTMLResponse)
async def donate_success():
    """Страница после успешного доната."""
    return DONATE_SUCCESS_HTML


# --- Feedback ---


class FeedbackRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    contact: str = Field(default="", max_length=200)


@router.post("/feedback")
async def send_feedback(body: FeedbackRequest):
    """Отправить обратную связь на email."""
    import smtplib
    from email.mime.text import MIMEText
    from app.config import settings

    if not settings.smtp_host or not settings.smtp_user:
        raise HTTPException(503, "Отправка сообщений временно недоступна")

    subject = "FillDocs: обратная связь"
    text = f"Сообщение:\n{body.message}\n\nКонтакт: {body.contact or 'не указан'}"
    msg = MIMEText(text, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_user
    msg["To"] = settings.feedback_to

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, settings.feedback_to, msg.as_string())
    except Exception as e:
        logger.error("Failed to send feedback email: %s", e)
        raise HTTPException(502, "Не удалось отправить сообщение")

    return {"ok": True}
