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
      <p className="text-gray-500 text-xs mt-4">&copy; 2025&ndash;{new Date().getFullYear()} FillDocs</p>
    </footer>
  );
}
