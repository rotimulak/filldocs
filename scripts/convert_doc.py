"""
Конвертация .doc файлов в .docx

Варианты:
1. Windows + MS Word: через COM API (pywin32)
2. Любая ОС: через LibreOffice в headless режиме
"""
import subprocess
import sys
from pathlib import Path


def convert_with_word(doc_path: str, docx_path: str = None) -> str:
    """
    Конвертация через MS Word COM API (только Windows).
    Требует: pip install pywin32
    """
    try:
        import win32com.client
    except ImportError:
        raise ImportError("Установите pywin32: pip install pywin32")

    doc_path = Path(doc_path).resolve()
    if docx_path is None:
        docx_path = doc_path.with_suffix('.docx')
    else:
        docx_path = Path(docx_path).resolve()

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False

    try:
        doc = word.Documents.Open(str(doc_path))
        # 16 = wdFormatXMLDocument (.docx)
        doc.SaveAs2(str(docx_path), FileFormat=16)
        doc.Close()
        print(f"Сконвертировано: {doc_path} -> {docx_path}")
        return str(docx_path)
    finally:
        word.Quit()


def convert_with_libreoffice(doc_path: str, output_dir: str = None) -> str:
    """
    Конвертация через LibreOffice (кроссплатформенно).
    Требует установленный LibreOffice.
    """
    doc_path = Path(doc_path).resolve()
    if output_dir is None:
        output_dir = doc_path.parent

    # Пути к LibreOffice на разных ОС
    libreoffice_paths = [
        "soffice",  # если в PATH
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "/usr/bin/soffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ]

    soffice = None
    for path in libreoffice_paths:
        try:
            subprocess.run([path, "--version"], capture_output=True, check=True)
            soffice = path
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue

    if soffice is None:
        raise FileNotFoundError("LibreOffice не найден")

    cmd = [
        soffice,
        "--headless",
        "--convert-to", "docx",
        "--outdir", str(output_dir),
        str(doc_path)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Ошибка конвертации: {result.stderr}")

    docx_path = Path(output_dir) / doc_path.with_suffix('.docx').name
    print(f"Сконвертировано: {doc_path} -> {docx_path}")
    return str(docx_path)


def convert(doc_path: str, docx_path: str = None, method: str = "auto") -> str:
    """
    Универсальная функция конвертации.
    method: "word", "libreoffice", или "auto"
    """
    if method == "auto":
        # На Windows пробуем сначала Word
        if sys.platform == "win32":
            try:
                return convert_with_word(doc_path, docx_path)
            except (ImportError, Exception):
                pass
        return convert_with_libreoffice(doc_path, Path(docx_path).parent if docx_path else None)

    elif method == "word":
        return convert_with_word(doc_path, docx_path)

    elif method == "libreoffice":
        return convert_with_libreoffice(doc_path, Path(docx_path).parent if docx_path else None)

    else:
        raise ValueError(f"Неизвестный метод: {method}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python convert_doc.py <файл.doc> [файл.docx]")
        sys.exit(1)

    doc_file = sys.argv[1]
    docx_file = sys.argv[2] if len(sys.argv) > 2 else None

    convert(doc_file, docx_file)
