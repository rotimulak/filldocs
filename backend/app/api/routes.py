"""API эндпоинты"""
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
import shutil
import uuid
import os

from app.models.requisites import Requisites, FillRequest, FillResponse, ExtractResponse
from app.services.docx_filler import filler
from app.services.converter import converter

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

        # Извлечение реквизитов
        result = filler.extract(docx_path)

        if not result["table_found"]:
            return ExtractResponse(
                success=False,
                requisites={},
                raw_fields=[],
                warnings=result["warnings"],
                message="Блок реквизитов не найден в документе"
            )

        return ExtractResponse(
            success=True,
            requisites=result["requisites"],
            raw_fields=result["raw_fields"],
            warnings=result["warnings"],
            message=f"Извлечено {len(result['requisites'])} полей из документа"
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


@router.post("/fill")
async def fill_document(
    file: UploadFile = File(...),
    requisites: str = Form(...)  # JSON string
):
    """
    Заполнить документ реквизитами.

    Принимает:
    - file: шаблон .doc или .docx
    - requisites: JSON строка с реквизитами

    Возвращает информацию для скачивания заполненного документа.
    """
    import json

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

        # Заполняем документ
        fill_stats = filler.fill(docx_path, output_path, requisites_data)

        total_used = sum(fill_stats["used_fields"].values())
        return {
            "success": True,
            "filled_fields": total_used,
            "used_fields": fill_stats["used_fields"],
            "unused_fields": fill_stats["unused_fields"],
            "download_url": f"/api/download/{output_name}",
            "filename": output_name,
            "message": f"Заполнено {total_used} полей"
        }

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
    return Requisites(
        company_name='ООО "Пример"',
        inn="1234567890",
        kpp="123456789",
        ogrn="1234567890123",
        address="г. Москва, ул. Примерная, д. 1",
        bank_name="ПАО Сбербанк",
        bik="044525225",
        account="40702810938000012345",
        corr_account="30101810400000000225",
        director="Иванов Иван Иванович",
        phone="+7 (495) 123-45-67",
        email="info@example.com"
    ).model_dump()
