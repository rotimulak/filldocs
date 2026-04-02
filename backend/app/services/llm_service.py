"""Сервис для взаимодействия с LLM API (OpenAI-compatible)"""
import json
import logging
import xml.etree.ElementTree as ET
from pathlib import Path

import openai

from app.config import settings

logger = logging.getLogger(__name__)

# Загрузка промптов из файлов
_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def _load_prompt(filename: str) -> str:
    """Загрузить промпт из файла"""
    prompt_path = _PROMPTS_DIR / filename
    return prompt_path.read_text(encoding="utf-8")


_EXTRACT_PROMPT_TEMPLATE = _load_prompt("extract.txt")
_FILL_PROMPT_TEMPLATE = _load_prompt("fill.txt")

# Retry configuration
MAX_RETRIES = 3
INITIAL_BACKOFF = 1.0  # seconds
BACKOFF_MULTIPLIER = 2.0


class LLMService:
    """Сервис для взаимодействия с LLM API (OpenAI-compatible)"""

    def __init__(self):
        kwargs: dict = {}
        if settings.llm_api_key:
            kwargs["api_key"] = settings.llm_api_key
        if settings.llm_base_url:
            kwargs["base_url"] = settings.llm_base_url
        self.client = openai.AsyncOpenAI(**kwargs)
        self.model = settings.llm_model
        self.temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens

    async def _call_llm(self, prompt: str) -> str:
        """
        Вызов LLM API с retry и exponential backoff.
        Возвращает текст ответа.
        """
        import asyncio

        last_error: Exception | None = None
        backoff = INITIAL_BACKOFF

        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    messages=[{"role": "user", "content": prompt}],
                )
                # Extract text from response
                content = response.choices[0].message.content or ""
                return content

            except openai.APITimeoutError as e:
                last_error = e
                logger.warning(
                    "LLM API timeout (attempt %d/%d): %s",
                    attempt + 1,
                    MAX_RETRIES,
                    str(e),
                )
            except openai.APIStatusError as e:
                last_error = e
                # Don't retry on client errors (4xx) except 429 (rate limit)
                if e.status_code < 500 and e.status_code != 429:
                    raise
                logger.warning(
                    "LLM API error %d (attempt %d/%d): %s",
                    e.status_code,
                    attempt + 1,
                    MAX_RETRIES,
                    str(e),
                )
            except openai.APIConnectionError as e:
                last_error = e
                logger.warning(
                    "LLM API connection error (attempt %d/%d): %s",
                    attempt + 1,
                    MAX_RETRIES,
                    str(e),
                )

            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(backoff)
                backoff *= BACKOFF_MULTIPLIER

        raise last_error  # type: ignore[misc]

    async def extract_requisites(self, document_text: str) -> dict[str, str]:
        """
        Извлечь реквизиты из текста документа.
        Отправляет текст в LLM с промптом.
        Возвращает dict: {название_поля_рус: значение}
        """
        prompt = self._build_extract_prompt(document_text)
        response_text = await self._call_llm(prompt)
        return self._parse_xml_response(response_text)

    async def generate_fill_instructions(
        self, table_text: str, requisites_xml: str
    ) -> list[dict]:
        """
        Сгенерировать инструкции заполнения таблицы.
        Вход: текст таблицы + XML реквизитов
        Выход: список инструкций [{row: int, col: int, value: str}, ...]
        """
        prompt = self._build_fill_prompt(table_text, requisites_xml)
        response_text = await self._call_llm(prompt)
        return self._parse_json_response(response_text)

    def _build_extract_prompt(self, document_text: str) -> str:
        """Построить промпт для извлечения реквизитов"""
        return _EXTRACT_PROMPT_TEMPLATE.format(document_text=document_text)

    def _build_fill_prompt(self, table_text: str, requisites_xml: str) -> str:
        """Построить промпт для заполнения"""
        return _FILL_PROMPT_TEMPLATE.format(
            table_text=table_text, requisites_xml=requisites_xml
        )

    def _parse_xml_response(self, xml_text: str) -> dict[str, str]:
        """
        Парсинг XML-ответа LLM в dict.
        Ожидаемый формат:
        <requisites>
          <field name="Название">значение</field>
          ...
        </requisites>
        """
        xml_block = self._extract_xml_block(xml_text)

        try:
            root = ET.fromstring(xml_block)
        except ET.ParseError as e:
            logger.error("Failed to parse XML response: %s\nResponse: %s", e, xml_text)
            raise ValueError(f"Невалидный XML от LLM: {e}") from e

        result: dict[str, str] = {}
        for field in root.findall("field"):
            name = field.get("name", "").strip()
            value = (field.text or "").strip()
            if name and value:
                result[name] = value

        return result

    def _extract_xml_block(self, text: str) -> str:
        """Извлечь XML-блок <requisites>...</requisites> из текста"""
        start_tag = "<requisites>"
        end_tag = "</requisites>"

        start_idx = text.find(start_tag)
        end_idx = text.find(end_tag)

        if start_idx == -1 or end_idx == -1:
            raise ValueError(
                "XML-блок <requisites> не найден в ответе LLM"
            )

        return text[start_idx : end_idx + len(end_tag)]

    def _parse_json_response(self, json_text: str) -> list[dict]:
        """
        Парсинг JSON-ответа LLM со списком инструкций заполнения.
        Ожидаемый формат: [{row: int, col: int, value: str}, ...]
        """
        json_block = self._extract_json_block(json_text)

        try:
            instructions = json.loads(json_block)
        except json.JSONDecodeError as e:
            logger.error(
                "Failed to parse JSON response: %s\nResponse: %s", e, json_text
            )
            raise ValueError(f"Невалидный JSON от LLM: {e}") from e

        if not isinstance(instructions, list):
            raise ValueError("Ожидался JSON-массив инструкций")

        validated: list[dict] = []
        for item in instructions:
            if not isinstance(item, dict):
                continue
            if "row" in item and "col" in item and "value" in item:
                validated.append(
                    {
                        "row": int(item["row"]),
                        "col": int(item["col"]),
                        "value": str(item["value"]),
                    }
                )

        return validated

    def _extract_json_block(self, text: str) -> str:
        """Извлечь JSON-массив из текста ответа LLM"""
        if "```json" in text:
            start = text.find("```json") + len("```json")
            end = text.find("```", start)
            if end != -1:
                return text[start:end].strip()

        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1:
            return text[start : end + 1]

        raise ValueError("JSON-массив не найден в ответе LLM")


# Singleton instance
llm_service = LLMService()
