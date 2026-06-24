// i18n.js - Localization module for Civitai Gallery Parser

const I18N = {
  _currentLang: 'en',
  _listeners: [],

  strings: {
    en: {
      // Popup
      popup_title: 'Gallery parser',
      popup_author: 'Gallery parser',
      popup_description: 'Open a user gallery and click scan.',
      popup_main_label: 'Gallery parser',
      popup_header_title: 'Gallery parser',
      popup_system_console: 'System Console',
      popup_terminal_ready: 'Terminal ready...',
      terminal_pages_set: 'Page count set to: {count}',
      terminal_lang_switched: 'Language switched to: {lang}',
      terminal_lang_en: 'English',
      terminal_lang_ru: 'Russian',
      terminal_scan_init: 'Initiating scan... Limit: {pages} pages.',
      terminal_connecting: 'Connecting to content script...',
      terminal_error_no_tab: 'Error: No active tab found.',
      terminal_tab_found: 'Active tab identified: {id}',
      terminal_signal_sent: 'Scan signal dispatched to background worker.',
      terminal_refining: 'Refining',
      terminal_waiting: 'Waiting for page interaction response...',
      popup_pages_label: 'Pages:',
      popup_found_label: 'Images Found',
      popup_scan_btn: 'Scan',
      popup_scan_btn_title: 'Scan current page',
      popup_initializing: 'Initializing...',
      popup_connecting: 'Connecting...',
      popup_scanning: 'Scanning...',
      popup_scan_running: 'Scan running. Please keep this window open.',
      popup_scan_failed: 'Failed to start scan.',
      popup_no_tab: 'Error: No active tab found.',
      popup_not_civitai: 'Error: Please open Civitai.com first.',
      popup_connect_error: 'Connection error. Reload page and try again.',
      popup_script_error: 'Error: Could not connect to page. Try reloading the page.',
      popup_checking_login: 'Checking login...',
      popup_logged_in: 'Logged In',
      popup_not_logged_in: 'Not Logged In',
      popup_guest: 'Guest (NSFW might be hidden)',
      popup_processing: 'Processing {count} candidates...',
      popup_parsing_meta: 'Parsing metadata...',
      popup_scan_warning: 'Keep the Civitai user gallery tab active and visible during scanning. Switching tabs or minimizing the browser may cause images to be missed due to lazy loading.',

      // Content script overlay
      content_initializing: 'Initializing...',
      content_found: 'Found: {count}',
      content_stop: 'Stop',
      content_stopping: 'Stopping...',
      content_stopping_scan: 'Stopping scan...',
      content_scanning_step: 'Scanning... Page {current}/{total}',
      content_returning: 'Returning to top...',
      content_scan_complete: 'Scan complete!',
      content_stopped: 'Scan stopped by user.',

      // Results page
      results_title: 'Gallery:',
      results_loading: 'Loading...',
      results_image: 'image',
      results_images: 'images',
      results_total: '{count} total',
      results_no_images: 'No images found matching criteria.',
      results_filter_all_title: 'All',
      results_filter_new_title: 'New',
      results_filter_changed_title: 'Changed',
      results_filter_removed_title: 'Removed',
      results_filter_zero_title: 'Zero reactions',
      results_export_title: 'Export to Excel (.xlsx)',
      results_import_title: 'Import from Excel (.xlsx)',
      results_close_title: 'Close this tab',
      results_scroll_top_title: 'Scroll to Top',
      results_toggle_reactions_title: 'Reactions',
      results_export_success: 'Export successful!',
      results_export_no_lib: 'Excel library not loaded.',
      results_import_success: 'Imported {count} items from Excel.',
      results_import_no_data: 'No data found in the file.',
      results_import_error: 'Error reading Excel file: {error}',
      results_excel_lib_error: 'Excel library failed to load. Export/Import is disabled.',
      results_downloaded: 'Downloaded!',
      results_prompt_copied: 'Prompt copied!',
      results_copy_prompt_title: 'Copy Prompt',
      results_prompt_title: 'Generation Prompt',

      // Statuses
      status_new: 'new',
      status_changed: 'changed',
      status_removed: 'removed',
      status_unchanged: 'unchanged',

      // Alt texts
      alt_no_prompt: 'No prompt',
      alt_imported: 'Imported',
      alt_background: 'Background',
      alt_likes: 'Likes',
      alt_hearts: 'Hearts',
      alt_laughs: 'Laughs',
      alt_cries: 'Cries',
      alt_civitai_image: 'Civitai Image'
    },
    ru: {
      // Popup
      popup_title: 'Парсер галереи',
      popup_author: 'Парсер галереи',
      popup_description: 'Откройте галерею пользователя и нажмите скан.',
      popup_main_label: 'Парсер галереи',
      popup_header_title: 'Парсер галереи',
      popup_system_console: 'Системная консоль',
      popup_terminal_ready: 'Терминал готов...',
      terminal_pages_set: 'Количество страниц: {count}',
      terminal_lang_switched: 'Язык переключен на: {lang}',
      terminal_lang_en: 'Английский',
      terminal_lang_ru: 'Русский',
      terminal_scan_init: 'Запуск сканирования... Лимит: {pages} стр.',
      terminal_connecting: 'Подключение к скрипту страницы...',
      terminal_error_no_tab: 'Ошибка: Активная вкладка не найдена.',
      terminal_tab_found: 'Активная вкладка определена: {id}',
      terminal_signal_sent: 'Сигнал передан в фоновый процесс.',
      terminal_refining: 'Уточняю',
      terminal_waiting: 'Ожидание ответа от страницы...',
      popup_pages_label: 'Страниц:',
      popup_found_label: 'Изображений Найдено',
      popup_scan_btn: 'Скан',
      popup_scan_btn_title: 'Поиск на текущей странице',
      popup_initializing: 'Инициализация...',
      popup_connecting: 'Подключение...',
      popup_scanning: 'Поищем...',
      popup_scan_running: 'Поиск запущен. Не закрывайте это окно.',
      popup_scan_failed: 'Не удалось запустить поиск.',
      popup_no_tab: 'Ошибка: Активная вкладка не найдена.',
      popup_not_civitai: 'Ошибка: Сначала откройте Civitai.com.',
      popup_connect_error: 'Ошибка подключения. Перезагрузите страницу и попробуйте снова.',
      popup_script_error: 'Ошибка: Не удалось подключиться к странице. Попробуйте перезагрузить.',
      popup_checking_login: 'Проверка входа...',
      popup_logged_in: 'Авторизован',
      popup_not_logged_in: 'Нет Авторизации',
      popup_guest: 'Гость (NSFW может быть скрыт)',
      popup_processing: 'Обработка {count} кандидатов...',
      popup_parsing_meta: 'Парсинг метаданных...',
      popup_scan_warning: 'Оставайтесь на вкладке галереи во время поиска. Переключение или сворачивание браузера приводит к пропуску изображений.',

      // Content script overlay
      content_initializing: 'Инициализация...',
      content_found: 'Найдено: {count}',
      content_stop: 'Стоп',
      content_stopping: 'Остановка...',
      content_stopping_scan: 'Остановка поиска...',
      content_scanning_step: 'Сканирование... Стр. {current}/{total}',
      content_returning: 'Возврат наверх...',
      content_scan_complete: 'Поиск завершен!',
      content_stopped: 'Поиск остановлен пользователем.',

      // Results page
      results_title: 'Галерея:',
      results_loading: 'Загрузка...',
      results_image: 'картинка',
      results_images: 'картинок',
      results_total: '{count} всего',
      results_of: 'из',
      results_no_images: 'Изображения, соответствующие критериям, не найдены.',
      results_filter_all_title: 'Все',
      results_filter_new_title: 'Новые',
      results_filter_changed_title: 'Изменённые',
      results_filter_removed_title: 'Удалённые',
      results_filter_zero_title: 'Без реакций',
      results_export_title: 'Экспорт в Excel (.xlsx)',
      results_import_title: 'Импорт из Excel (.xlsx)',
      results_close_title: 'Закрыть вкладку',
      results_scroll_top_title: 'Наверх',
      results_toggle_reactions_title: 'Реакции',
      results_export_success: 'Экспорт выполнен!',
      results_export_no_lib: 'Библиотека Excel не загружена.',
      results_import_success: 'Импортировано {count} элементов из Excel.',
      results_import_no_data: 'Данные в файле не найдены.',
      results_import_error: 'Ошибка чтения Excel файла: {error}',
      results_excel_lib_error: 'Ошибка загрузки библиотеки Excel. Экспорт/Импорт отключены.',
      results_downloaded: 'Скачано!',
      results_prompt_copied: 'Промпт скопирован!',
      results_copy_prompt_title: 'Копировать промпт',
      results_prompt_title: 'Описание генерации',

      // Statuses
      status_new: 'новый',
      status_changed: 'изменён',
      status_removed: 'удалён',
      status_unchanged: 'без изменений',

      // Alt texts
      alt_no_prompt: 'Без описания',
      alt_imported: 'Импортированное',
      alt_background: 'Фоновое',
      alt_likes: 'Лайки',
      alt_hearts: 'Сердца',
      alt_laughs: 'Смех',
      alt_cries: 'Плач',
      alt_civitai_image: 'Изображение Civitai'
    }
  },

  async init() {
    try {
      const result = await chrome.storage.local.get('civitai_parser_lang')
      if (result.civitai_parser_lang) {
        this._currentLang = result.civitai_parser_lang
      }
    } catch (e) {
      console.error(e) // Default to 'en' if storage not available
    }
    return this._currentLang
  },

  get lang() {
    return this._currentLang
  },

  async setLang(lang) {
    if (lang !== 'en' && lang !== 'ru') return
    this._currentLang = lang
    try {
      await chrome.storage.local.set({ 'civitai_parser_lang': lang })
    } catch (e) { console.error(e) }
    this._listeners.forEach(fn => fn(lang))
  },

  t(key, params) {
    const str = (this.strings[this._currentLang] && this.strings[this._currentLang][key])
      || (this.strings['en'] && this.strings['en'][key])
      || key
    if (!params) return str
    return str.replace(/\{(\w+)\}/g, (match, p) => params[p] !== undefined ? params[p] : match)
  },

  onChange(fn) {
    this._listeners.push(fn)
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.I18N = I18N
}
