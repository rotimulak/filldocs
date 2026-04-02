"""Тесты для /api/extract-requisites endpoint (LLM-подход)"""
import io
from pathlib import Path
from unittest.mock import patch, AsyncMock, MagicMock

import openai
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

FAKE_DOCX_CONTENT = b"PK\x03\x04fake-docx-content"


def _upload(content: bytes = FAKE_DOCX_CONTENT, filename: str = "test.docx"):
    return client.post(
        "/api/extract-requisites",
        files={"file": (filename, io.BytesIO(content), "application/octet-stream")},
    )


class TestExtractSuccess:
    """LLM возвращает валидные реквизиты"""

    @patch("app.api.routes.llm_service")
    @patch("app.api.routes.docx_to_text", return_value="Текст документа с реквизитами")
    def test_extract_returns_requisites(self, mock_docx_to_text, mock_llm):
        mock_llm.extract_requisites = AsyncMock(
            return_value={"ИНН": "1234567890", "Наименование": "ООО Тест"}
        )

        resp = _upload()
        assert resp.status_code == 200

        data = resp.json()
        assert data["success"] is True
        assert data["requisites"] == {"ИНН": "1234567890", "Наименование": "ООО Тест"}
        assert len(data["raw_fields"]) == 2
        assert data["message"] == "Извлечено 2 полей из документа"

    @patch("app.api.routes.llm_service")
    @patch("app.api.routes.docx_to_text", return_value="Пустой документ")
    def test_extract_empty_result(self, mock_docx_to_text, mock_llm):
        mock_llm.extract_requisites = AsyncMock(return_value={})

        resp = _upload()
        assert resp.status_code == 200

        data = resp.json()
        assert data["success"] is False
        assert data["requisites"] == {}
        assert len(data["warnings"]) > 0

    @patch("app.api.routes.llm_service")
    @patch("app.api.routes.docx_to_text", return_value="Текст")
    def test_raw_fields_structure(self, mock_docx_to_text, mock_llm):
        mock_llm.extract_requisites = AsyncMock(
            return_value={"БИК": "044525225"}
        )

        resp = _upload()
        data = resp.json()
        field = data["raw_fields"][0]
        assert field["label"] == "БИК"
        assert field["value"] == "044525225"
        assert field["matched_key"] is None


class TestExtractInvalidFile:
    """Невалидные файлы"""

    def test_invalid_extension_txt(self):
        resp = _upload(b"plain text", filename="readme.txt")
        assert resp.status_code == 400

    def test_invalid_extension_pdf(self):
        resp = _upload(b"%PDF-1.4", filename="doc.pdf")
        assert resp.status_code == 400

    def test_file_too_large(self):
        large = b"x" * (10 * 1024 * 1024 + 1)
        resp = _upload(large, filename="huge.docx")
        assert resp.status_code == 400


class TestExtractLLMErrors:
    """Ошибки LLM → HTTP 502"""

    @patch("app.api.routes.llm_service")
    @patch("app.api.routes.docx_to_text", return_value="Текст")
    def test_llm_invalid_xml(self, mock_docx_to_text, mock_llm):
        mock_llm.extract_requisites = AsyncMock(
            side_effect=ValueError("Невалидный XML от LLM")
        )

        resp = _upload()
        assert resp.status_code == 502
        assert "Ошибка разбора ответа LLM" in resp.json()["detail"]

    @patch("app.api.routes.llm_service")
    @patch("app.api.routes.docx_to_text", return_value="Текст")
    def test_llm_timeout(self, mock_docx_to_text, mock_llm):
        mock_llm.extract_requisites = AsyncMock(
            side_effect=openai.APITimeoutError(request=MagicMock())
        )

        resp = _upload()
        assert resp.status_code == 502
        assert "Таймаут" in resp.json()["detail"]

    @patch("app.api.routes.llm_service")
    @patch("app.api.routes.docx_to_text", return_value="Текст")
    def test_llm_api_error(self, mock_docx_to_text, mock_llm):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.headers = {}
        mock_llm.extract_requisites = AsyncMock(
            side_effect=openai.APIStatusError(
                message="Internal Server Error",
                response=mock_response,
                body=None,
            )
        )

        resp = _upload()
        assert resp.status_code == 502

    @patch("app.api.routes.llm_service")
    @patch("app.api.routes.docx_to_text", return_value="Текст")
    def test_llm_connection_error(self, mock_docx_to_text, mock_llm):
        mock_llm.extract_requisites = AsyncMock(
            side_effect=openai.APIConnectionError(request=MagicMock())
        )

        resp = _upload()
        assert resp.status_code == 502
        assert "соединения" in resp.json()["detail"]
