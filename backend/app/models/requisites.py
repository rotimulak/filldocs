"""Pydantic модели для реквизитов"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any


class Requisites(BaseModel):
    """Модель реквизитов компании"""
    company_name: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    ogrn: Optional[str] = None
    address: Optional[str] = None
    postal_address: Optional[str] = None
    bank_name: Optional[str] = None
    bik: Optional[str] = None
    account: Optional[str] = None
    corr_account: Optional[str] = None
    bank_details: Optional[str] = None
    director: Optional[str] = None
    contact_person: Optional[str] = None
    founder: Optional[str] = None
    registration_certificate: Optional[str] = None

    # Паспортные данные
    passport: Optional[str] = None  # Полные паспортные данные
    passport_series: Optional[str] = None
    passport_number: Optional[str] = None
    birth_date: Optional[str] = None
    birth_place: Optional[str] = None
    passport_issued_by: Optional[str] = None
    passport_department_code: Optional[str] = None
    passport_issue_date: Optional[str] = None

    phone: Optional[str] = None
    email: Optional[str] = None  # Changed from EmailStr to allow invalid formats

    def to_flat_dict(self) -> dict:
        """Преобразование в плоский словарь для заполнения документов"""
        data = self.model_dump(exclude_none=True)
        # Автогенерация bank_details если не задано
        if not data.get("bank_details") and data.get("bank_name"):
            parts = [data.get("bank_name")]
            if data.get("account"):
                parts.append(f"р/с {data['account']}")
            if data.get("corr_account"):
                parts.append(f"к/с {data['corr_account']}")
            if data.get("bik"):
                parts.append(f"БИК {data['bik']}")
            data["bank_details"] = ", ".join(parts)
        return data


class FillRequest(BaseModel):
    """Запрос на заполнение документа"""
    template_name: str
    requisites: Requisites
    output_name: Optional[str] = None


class FillResponse(BaseModel):
    """Ответ с результатом заполнения"""
    success: bool
    output_path: str
    filled_fields: int
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
