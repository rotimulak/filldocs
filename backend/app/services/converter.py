"""Сервис конвертации doc → docx"""
import subprocess
import sys
from pathlib import Path


class DocConverter:
    """Конвертер doc файлов в docx"""

    def convert_with_word(self, doc_path: Path, docx_path: Path = None) -> Path:
        """Конвертация через MS Word COM API (только Windows)"""
        try:
            import win32com.client
        except ImportError:
            raise ImportError("Установите pywin32: pip install pywin32")

        doc_path = doc_path.resolve()
        if docx_path is None:
            docx_path = doc_path.with_suffix('.docx')
        else:
            docx_path = docx_path.resolve()

        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False

        try:
            doc = word.Documents.Open(str(doc_path))
            doc.SaveAs2(str(docx_path), FileFormat=16)
            doc.Close()
            return docx_path
        finally:
            word.Quit()

    def convert_with_libreoffice(self, doc_path: Path, output_dir: Path = None) -> Path:
        """Конвертация через LibreOffice (кроссплатформенно)"""
        doc_path = doc_path.resolve()
        if output_dir is None:
            output_dir = doc_path.parent

        libreoffice_paths = [
            "soffice",
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

        return output_dir / doc_path.with_suffix('.docx').name

    def convert(self, doc_path: Path, docx_path: Path = None, method: str = "auto") -> Path:
        """Универсальная конвертация"""
        doc_path = Path(doc_path)

        if method == "auto":
            if sys.platform == "win32":
                try:
                    return self.convert_with_word(doc_path, docx_path)
                except (ImportError, Exception):
                    pass
            output_dir = docx_path.parent if docx_path else None
            return self.convert_with_libreoffice(doc_path, output_dir)

        elif method == "word":
            return self.convert_with_word(doc_path, docx_path)

        elif method == "libreoffice":
            output_dir = docx_path.parent if docx_path else None
            return self.convert_with_libreoffice(doc_path, output_dir)

        raise ValueError(f"Неизвестный метод: {method}")


# Singleton instance
converter = DocConverter()
