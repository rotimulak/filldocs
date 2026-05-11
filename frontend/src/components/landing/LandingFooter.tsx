export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-center py-10 px-4">
      <div className="text-white font-bold text-lg">FillDocs</div>
      <p className="text-gray-400 text-sm mt-1">
        Автоматическое заполнение реквизитов в документах с помощью ИИ
      </p>
      <p className="text-gray-500 text-xs mt-4">
        Файлы не сохраняются на сервере. Реквизиты хранятся только в вашем браузере.
      </p>
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <a href="/legal/oferta.html" target="_blank" className="text-gray-400 hover:text-gray-300 underline">
          Публичная оферта
        </a>
        <a href="/legal/privacy.html" target="_blank" className="text-gray-400 hover:text-gray-300 underline">
          Политика конфиденциальности
        </a>
      </div>
      <p className="text-gray-600 text-xs mt-4">
        ИП Белоусов А.Н. &middot; ИНН 631625760179
      </p>
      <p className="text-gray-600 text-xs mt-1">&copy; 2025&ndash;{new Date().getFullYear()} FillDocs</p>
    </footer>
  );
}
