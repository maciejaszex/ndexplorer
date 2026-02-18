// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { MOCK_LOGS } from './utils/mocks';
import { renderLogs } from './utils/dom';
import { fullPageHtml } from './utils/helpers';

const bodyContent = fullPageHtml
  .replace(/---[\s\S]*?---/, '')
  .replace(/<\/?Layout>/g, '');

beforeEach(() => {
  document.body.innerHTML = bodyContent;
  const connectScreen = document.getElementById('connect-screen')!;
  const mainPanel = document.getElementById('main-panel')!;
  connectScreen.style.display = 'none';
  mainPanel.style.display = 'flex';
});

describe('Log screen — desktop', () => {
  it('displays all elements and can scroll page', () => {
    const logsList = document.getElementById('logs-list')!;
    renderLogs(MOCK_LOGS, logsList);

    // Header
    expect(document.querySelector('[data-i18n="header.readonly"]')).not.toBeNull();
    expect(document.getElementById('log-counter')).not.toBeNull();

    // API filters
    for (const id of ['filter-from', 'filter-to', 'filter-status', 'filter-device', 'search-btn']) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(document.querySelectorAll('.date-range-btn')).toHaveLength(4);
    expect(document.querySelectorAll('.auto-refresh-btn')).toHaveLength(3);

    // Local filters
    for (const id of ['local-filter-domain', 'local-filter-tracker-search', 'local-filter-tracker']) {
      expect(document.getElementById(id)).not.toBeNull();
    }

    // Log table columns
    for (const col of ['logs.date', 'logs.domain', 'logs.root', 'logs.tracker', 'logs.protocol', 'logs.status', 'logs.device']) {
      expect(document.querySelector(`[data-i18n="${col}"]`)).not.toBeNull();
    }

    // Rendered rows
    expect(logsList.querySelectorAll('.log-row')).toHaveLength(MOCK_LOGS.length);

    // State containers
    for (const id of ['logs-empty', 'logs-loading', 'logs-no-results', 'logs-scroll-loader', 'logs-end']) {
      expect(document.getElementById(id)).not.toBeNull();
    }

    // Page scrolls naturally — no overflow-hidden, no internal scroll
    const root = document.querySelector('.min-h-screen') as HTMLElement;
    expect(root.classList.contains('overflow-hidden')).toBe(false);
    expect(document.getElementById('logs-area')!.classList.contains('overflow-y-auto')).toBe(false);
  });
});

describe('Input clear buttons', () => {
  it('clear button empties the input and triggers input event', () => {
    // Register clear handlers (same logic as app.js)
    document.querySelectorAll('.input-clear-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById((btn as HTMLElement).dataset.clear!) as HTMLInputElement;
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });

    for (const id of ['local-filter-domain', 'local-filter-tracker-search']) {
      const input = document.getElementById(id) as HTMLInputElement;
      const clearBtn = document.querySelector(`[data-clear="${id}"]`) as HTMLButtonElement;
      expect(clearBtn).not.toBeNull();

      input.value = 'test-value';
      let inputFired = false;
      input.addEventListener('input', () => { inputFired = true; }, { once: true });

      clearBtn.click();

      expect(input.value).toBe('');
      expect(inputFired).toBe(true);
    }
  });
});

describe('Log screen — mobile', () => {
  it('displays all elements and can scroll page', () => {
    const logsList = document.getElementById('logs-list')!;
    renderLogs(MOCK_LOGS, logsList);

    // Header
    expect(document.querySelector('.mobile-header')).not.toBeNull();
    expect(document.querySelector('.mobile-header-right')).not.toBeNull();

    // API filters
    const filterForm = document.querySelector('.mobile-filters');
    expect(filterForm).not.toBeNull();
    expect(filterForm!.id).toBe('filter-form');

    // Local filters
    expect(document.querySelector('.mobile-local-filters')).not.toBeNull();
    expect(document.querySelectorAll('.mobile-local-filter-item')).toHaveLength(2);

    // Log table columns
    for (const col of ['logs.date', 'logs.domain', 'logs.root', 'logs.tracker', 'logs.protocol', 'logs.status', 'logs.device']) {
      expect(document.querySelector(`[data-i18n="${col}"]`)).not.toBeNull();
    }

    // Rendered rows
    expect(logsList.querySelectorAll('.log-row')).toHaveLength(MOCK_LOGS.length);

    // Horizontal scroll wrapper for log table
    expect(document.querySelector('.mobile-log-scroll')).not.toBeNull();
    expect(document.querySelector('.mobile-log-inner')).not.toBeNull();

    // Page scrolls naturally — no overflow-hidden, no internal scroll
    const root = document.querySelector('.min-h-screen') as HTMLElement;
    expect(root.classList.contains('overflow-hidden')).toBe(false);
    expect(document.getElementById('logs-area')!.classList.contains('overflow-y-auto')).toBe(false);
  });
});
