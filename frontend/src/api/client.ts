import type { ExtractResponse, FillResponse, Requisites } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `HTTP error ${response.status}`,
      response.status,
      errorData.detail
    );
  }
  return response.json();
}

export const api = {
  /**
   * Извлечь реквизиты из загруженного документа
   */
  async extractRequisites(file: File): Promise<ExtractResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/extract-requisites`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<ExtractResponse>(res);
  },

  /**
   * Заполнить документ реквизитами
   */
  async fillDocument(file: File, requisites: Requisites): Promise<FillResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requisites', JSON.stringify(requisites));

    const res = await fetch(`${API_BASE}/fill`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<FillResponse>(res);
  },

  /**
   * Скачать заполненный документ
   */
  async downloadFile(filename: string): Promise<void> {
    const res = await fetch(`${API_BASE}/download/${filename}`);

    if (!res.ok) {
      throw new ApiError('Файл не найден', res.status);
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Получить список шаблонов на сервере
   */
  async getTemplates(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/templates`);
    const data = await handleResponse<{ templates: string[] }>(res);
    return data.templates;
  },

  /**
   * Создать платёж-донат
   */
  async createDonation(amount: number): Promise<{ confirmation_url: string }> {
    const res = await fetch(`${API_BASE}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    return handleResponse<{ confirmation_url: string }>(res);
  },

  /**
   * Отправить обратную связь
   */
  async sendFeedback(message: string, contact: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, contact }),
    });

    return handleResponse<{ ok: boolean }>(res);
  },

  /**
   * Получить пример структуры реквизитов
   */
  async getSampleRequisites(): Promise<Requisites> {
    const res = await fetch(`${API_BASE}/requisites/sample`);
    return handleResponse<Requisites>(res);
  },
};
