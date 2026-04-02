"""Pydantic модели для реквизитов"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class FilledCell(BaseModel):
    """Одна заполненная ячейка"""
    label: str            # метка строки (из соседней ячейки таблицы)
    value: str            # вставленное значение
    requisite_key: Optional[str] = None  # ключ реквизита-источника


class EmptyCell(BaseModel):
    """Ячейка, которая осталась пустой"""
    label: str            # метка строки


class FillResponse(BaseModel):
    """Ответ с результатом заполнения"""
    success: bool
    filled_fields: int
    total_instructions: int
    filled_details: List[FilledCell] = []
    empty_cells: List[EmptyCell] = []
    skipped_count: int = 0
    download_url: str
    filename: str
    message: str


class RawField(BaseModel):
    """Сырое поле из документа"""
    label: str
    value: str
    matched_key: Optional[str] = None


class ExtractResponse(BaseModel):
    """Ответ с извлечёнными реквизитами"""
    success: bool
    requisites: Dict[str, Any]
    raw_fields: List[RawField]
    warnings: List[str] = []
    message: str
