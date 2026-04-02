"""Тесты для LLM-сервиса"""
import json
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.services.llm_service import LLMService


@pytest.fixture
def llm_svc():
    """Создать LLMService с замоканным клиентом"""
    with patch("app.services.llm_service.settings") as mock_settings:
        mock_settings.llm_api_key = "test-key"
        mock_settings.llm_base_url = ""
        mock_settings.llm_model = "test-model"
        mock_settings.llm_temperature = 0.0
        mock_settings.llm_max_tokens = 4096
        svc = LLMService()
    return svc


def _make_response(text: str):
    """Создать мок-ответ OpenAI API"""
    message = MagicMock()
    message.content = text
    choice = MagicMock()
    choice.message = message
    response = MagicMock()
    response.choices = [choice]
    return response


class TestParseXmlResponse:
    def test_parse_xml_response_valid(self, llm_svc):
        """Парсинг валидного XML"""
        xml = """<requisites>
  <field name="ИНН">1234567890</field>
  <field name="КПП">123456789</field>
  <field name="Наименование организации">ООО "Тест"</field>
</requisites>"""
        result = llm_svc._parse_xml_response(xml)

        assert result["ИНН"] == "1234567890"
        assert result["КПП"] == "123456789"
        assert result["Наименование организации"] == 'ООО "Тест"'

    def test_parse_xml_response_with_surrounding_text(self, llm_svc):
        """Парсинг XML с текстом вокруг (как LLM может вернуть)"""
        text = """Вот извлечённые реквизиты:

<requisites>
  <field name="ИНН">9876543210</field>
</requisites>

Готово!"""
        result = llm_svc._parse_xml_response(text)
        assert result["ИНН"] == "9876543210"

    def test_parse_xml_invalid(self, llm_svc):
        """Обработка невалидного XML"""
        with pytest.raises(ValueError, match="Невалидный XML"):
            llm_svc._parse_xml_response("<requisites><broken></requisites>")

    def test_parse_xml_no_block(self, llm_svc):
        """XML-блок requisites отсутствует"""
        with pytest.raises(ValueError, match="не найден"):
            llm_svc._parse_xml_response("Просто текст без XML")

    def test_parse_xml_empty_fields_skipped(self, llm_svc):
        """Пустые поля не попадают в результат"""
        xml = """<requisites>
  <field name="ИНН">1234567890</field>
  <field name="КПП"></field>
  <field name="">значение</field>
</requisites>"""
        result = llm_svc._parse_xml_response(xml)
        assert len(result) == 1
        assert "ИНН" in result


class TestParseJsonResponse:
    def test_parse_json_valid(self, llm_svc):
        """Парсинг валидного JSON"""
        json_text = '[{"row": 1, "col": 2, "value": "test"}, {"row": 3, "col": 1, "value": "abc"}]'
        result = llm_svc._parse_json_response(json_text)
        assert len(result) == 2
        assert result[0] == {"row": 1, "col": 2, "value": "test"}

    def test_parse_json_with_code_block(self, llm_svc):
        """Парсинг JSON из блока ```json```"""
        text = """Вот инструкции:
```json
[{"row": 0, "col": 1, "value": "ООО Тест"}]
```"""
        result = llm_svc._parse_json_response(text)
        assert len(result) == 1
        assert result[0]["value"] == "ООО Тест"

    def test_parse_json_invalid(self, llm_svc):
        """Невалидный JSON"""
        with pytest.raises(ValueError, match="Невалидный JSON"):
            llm_svc._parse_json_response("[{broken json}]")

    def test_parse_json_no_array(self, llm_svc):
        """JSON не содержит массив"""
        with pytest.raises(ValueError, match="JSON-массив не найден"):
            llm_svc._parse_json_response("Просто текст")


class TestBuildPrompt:
    def test_build_extract_prompt(self, llm_svc):
        """Промпт содержит текст документа"""
        doc_text = "Тестовый документ с ИНН 1234567890"
        prompt = llm_svc._build_extract_prompt(doc_text)
        assert doc_text in prompt
        assert "реквизит" in prompt.lower()
        assert "<requisites>" in prompt

    def test_build_fill_prompt(self, llm_svc):
        """Промпт содержит текст таблицы и XML реквизитов"""
        table = "| Поле | Значение |\n| ИНН | |"
        xml = '<requisites><field name="ИНН">123</field></requisites>'
        prompt = llm_svc._build_fill_prompt(table, xml)
        assert table in prompt
        assert xml in prompt
        assert "json" in prompt.lower()


class TestExtractRequisites:
    @pytest.mark.asyncio
    async def test_extract_requisites(self, llm_svc):
        """Мок LLM API, проверка результата"""
        xml_response = """<requisites>
  <field name="ИНН">1234567890</field>
  <field name="Наименование">ООО Тест</field>
</requisites>"""
        llm_svc.client.chat.completions.create = AsyncMock(
            return_value=_make_response(xml_response)
        )

        result = await llm_svc.extract_requisites("Текст документа")

        assert result["ИНН"] == "1234567890"
        assert result["Наименование"] == "ООО Тест"
        llm_svc.client.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_extract_requisites_timeout(self, llm_svc):
        """Мок таймаута — после 3 попыток выбрасывает исключение"""
        import openai

        llm_svc.client.chat.completions.create = AsyncMock(
            side_effect=openai.APITimeoutError(request=MagicMock())
        )

        with patch("app.services.llm_service.INITIAL_BACKOFF", 0.01):
            with pytest.raises(openai.APITimeoutError):
                await llm_svc.extract_requisites("Текст документа")

        assert llm_svc.client.chat.completions.create.call_count == 3


class TestGenerateFillInstructions:
    @pytest.mark.asyncio
    async def test_generate_fill_instructions(self, llm_svc):
        """Мок LLM API для генерации инструкций"""
        json_response = '[{"row": 1, "col": 2, "value": "1234567890"}]'
        llm_svc.client.chat.completions.create = AsyncMock(
            return_value=_make_response(json_response)
        )

        result = await llm_svc.generate_fill_instructions(
            "| ИНН | |",
            '<requisites><field name="ИНН">1234567890</field></requisites>',
        )

        assert len(result) == 1
        assert result[0] == {"row": 1, "col": 2, "value": "1234567890"}
