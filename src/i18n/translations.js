/**
 * NDEXPLORER — i18n (PL / EN)
 * Simple translation system using data-i18n attributes.
 * Language preference stored in localStorage.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ndexplorer-lang';
  const DEFAULT_LANG = 'pl';

  const TRANSLATIONS = {
    pl: {
      // App
      'app.subtitle': 'Explorator logów NextDNS',
      'app.title': 'NDEXPLORER — Explorator logów NextDNS',

      // Connect screen
      'connect.button': 'Połącz z NextDNS',
      'connect.loading': 'Łączenie…',
      'connect.error': 'Błąd połączenia z API',

      // Header
      'header.readonly': 'READ-ONLY',
      'header.displayed': 'Wyświetlono:',
      'header.logs': 'logów',
      'theme.label': 'Motyw',
      'theme.toggle': 'Przełącz motyw',
      'export.open': 'Pobierz',
      'export.title': 'Eksport CSV',
      'export.close': 'Zamknij',
      'export.start': 'Pobierz',
      'export.exporting': 'Eksportowanie...',
      'export.downloading': 'Pobieranie paczki',
      'export.saving': 'Zapisywanie...',
      'export.done': 'Gotowe',
      'export.cancel': 'Anuluj',
      'export.cancelled': 'Eksport anulowany',
      'export.selectDevice': 'Wybierz jedno urządzenie',
      'export.onlyDevice': 'Eksport działa tylko dla jednego wybranego urządzenia.',
      'export.maxRange': 'Maksymalny zakres eksportu to 7 dni',
      'export.invalidRange': 'Zakres dat jest nieprawidłowy',

      // API Filters
      'filters.api': 'Filtry API:',
      'filters.from': 'Od',
      'filters.to': 'Do',
      'filters.range': 'Zakres',
      'filters.range.15m': '15m',
      'filters.range.1h': '1h',
      'filters.range.1d': '1d',
      'filters.range.3d': '3d',
      'filters.range.7d': '7d',
      'filters.status': 'Status',
      'filters.all': 'Wszystkie',
      'filters.device': 'Urządzenie',
      'filters.text': 'Tekst',
      'filters.textPlaceholder': 'np. facebook',
      'filters.search': 'Szukaj',
      'filters.searching': 'Szukam…',

      // Auto-refresh
      'autorefresh.label': 'Auto-refresh',
      'autorefresh.hint': 'Auto-refresh wymaga presetu „15m" lub „1h"',

      // Local filters
      'filters.local': 'Filtry lokalne:',
      'filters.domain': 'Domena',
      'filters.domainPlaceholder': 'np. facebook',
      'filters.tracker': 'Tracker',
      'filters.trackerPlaceholder': 'np. google',
      'filters.showTrackers': 'Pokaż trackery',

      // Log list headers
      'logs.date': 'Data',
      'logs.domain': 'Domena',
      'logs.root': 'Root',
      'logs.tracker': 'Tracker',
      'logs.protocol': 'Protokół',
      'logs.clientIp': 'IP klienta',
      'logs.status': 'Status',
      'logs.device': 'Urządzenie',

      // Log list states
      'logs.empty': 'Ustaw filtry i kliknij „Szukaj"',
      'logs.noResults': 'Brak logów dla wybranych filtrów',
      'logs.allLoaded': 'Załadowano wszystkie logi',
      'logs.fetchError': 'Błąd pobierania logów',

      // Devices
      'devices.unidentified': 'Niezidentyfikowane',

      // Scroll nav
      'scroll.top': 'Przewiń do góry',
      'scroll.bottom': 'Przewiń na dół',

      // Errors
      'error.configMissing': 'Brak konfiguracji: NEXTDNS_API_KEY lub NEXTDNS_PROFILE_ID nie ustawione w .env',
      'error.apiError': 'Błąd API NextDNS',
      'error.unknown': 'Nieznany błąd',
      'error.invalidDate': 'Nieprawidłowa data',
      'error.invalidParam': 'Nieprawidłowy parametr',

      // Toast
      'toast.close': 'Zamknij',
    },

    en: {
      // App
      'app.subtitle': 'NextDNS Log Explorer',
      'app.title': 'NDEXPLORER — NextDNS Log Explorer',

      // Connect screen
      'connect.button': 'Connect to NextDNS',
      'connect.loading': 'Connecting…',
      'connect.error': 'API connection error',

      // Header
      'header.readonly': 'READ-ONLY',
      'header.displayed': 'Displayed:',
      'header.logs': 'logs',
      'theme.label': 'Theme',
      'theme.toggle': 'Toggle theme',
      'export.open': 'Download',
      'export.title': 'Export CSV',
      'export.close': 'Close',
      'export.start': 'Download',
      'export.exporting': 'Exporting...',
      'export.downloading': 'Downloading batch',
      'export.saving': 'Saving...',
      'export.done': 'Done',
      'export.cancel': 'Cancel',
      'export.cancelled': 'Export cancelled',
      'export.selectDevice': 'Select one device',
      'export.onlyDevice': 'Export works for one selected device only.',
      'export.maxRange': 'Maximum export range is 7 days',
      'export.invalidRange': 'Date range is invalid',

      // API Filters
      'filters.api': 'API Filters:',
      'filters.from': 'From',
      'filters.to': 'To',
      'filters.range': 'Range',
      'filters.range.15m': '15m',
      'filters.range.1h': '1h',
      'filters.range.1d': '1d',
      'filters.range.3d': '3d',
      'filters.range.7d': '7d',
      'filters.status': 'Status',
      'filters.all': 'All',
      'filters.device': 'Device',
      'filters.text': 'Text',
      'filters.textPlaceholder': 'e.g. facebook',
      'filters.search': 'Search',
      'filters.searching': 'Searching…',

      // Auto-refresh
      'autorefresh.label': 'Auto-refresh',
      'autorefresh.hint': 'Auto-refresh requires the "15m" or "1h" preset',

      // Local filters
      'filters.local': 'Local Filters:',
      'filters.domain': 'Domain',
      'filters.domainPlaceholder': 'e.g. facebook',
      'filters.tracker': 'Tracker',
      'filters.trackerPlaceholder': 'e.g. google',
      'filters.showTrackers': 'Show trackers',

      // Log list headers
      'logs.date': 'Date',
      'logs.domain': 'Domain',
      'logs.root': 'Root',
      'logs.tracker': 'Tracker',
      'logs.protocol': 'Protocol',
      'logs.clientIp': 'Client IP',
      'logs.status': 'Status',
      'logs.device': 'Device',

      // Log list states
      'logs.empty': 'Set filters and click "Search"',
      'logs.noResults': 'No logs for selected filters',
      'logs.allLoaded': 'All logs loaded',
      'logs.fetchError': 'Error fetching logs',

      // Devices
      'devices.unidentified': 'Unidentified',

      // Scroll nav
      'scroll.top': 'Scroll to top',
      'scroll.bottom': 'Scroll to bottom',

      // Errors
      'error.configMissing': 'Missing config: NEXTDNS_API_KEY or NEXTDNS_PROFILE_ID not set in .env',
      'error.apiError': 'NextDNS API error',
      'error.unknown': 'Unknown error',
      'error.invalidDate': 'Invalid date',
      'error.invalidParam': 'Invalid parameter',

      // Toast
      'toast.close': 'Close',
    },
  };

  let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  if (!TRANSLATIONS[currentLang]) currentLang = DEFAULT_LANG;

  function t(key) {
    return (TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG])[key] || key;
  }

  /** Update all elements with data-i18n attributes. */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.title = t('app.title');
    document.documentElement.lang = currentLang;
    updateFlagButtons();
  }

  function updateFlagButtons() {
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      const isActive = btn.dataset.lang === currentLang;
      btn.style.opacity = isActive ? '1' : '0.5';
      btn.style.borderColor = isActive ? 'var(--accent)' : 'transparent';
    });
  }

  function setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function getLang() {
    return currentLang;
  }

  // Expose globally
  window.t = t;
  window.setLang = setLang;
  window.getLang = getLang;
  window.applyTranslations = applyTranslations;

  // Init
  applyTranslations();

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
})();
