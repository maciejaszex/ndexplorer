import { describe, it, expect } from 'vitest';
import { mainPanelHtml as html, layoutHtml, translationsJs } from './utils/helpers';

describe('Main panel — header', () => {
  it('has branding, GitHub link, READ-ONLY badge, flags and log counter', () => {
    expect(html).toContain('NDEXPLORER');
    expect(html).toContain('https://github.com/maciejaszex/ndexplorer');
    expect(html).toContain('data-i18n="header.readonly"');
    expect(html).toContain('data-lang="pl"');
    expect(html).toContain('data-lang="en"');
    expect(html).toContain('id="log-counter"');
    expect(html).toContain('id="log-count"');
  });
});

describe('Main panel — API filters', () => {
  it('has datetime-local date inputs and preset buttons (1h, 24h, 3d)', () => {
    expect(html).toContain('id="filter-from"');
    expect(html).toContain('id="filter-to"');
    expect(html).toMatch(/type="datetime-local"[^>]*id="filter-from"/);
    expect(html).toMatch(/type="datetime-local"[^>]*id="filter-to"/);
    for (const r of ['1h', '24h', '3d']) {
      expect(html).toContain(`data-range="${r}"`);
    }
  });

  it('has status filter with all options', () => {
    expect(html).toContain('id="filter-status"');
    for (const s of ['default', 'blocked', 'allowed', 'error']) {
      expect(html).toContain(`value="${s}"`);
    }
  });

  it('has device filter and search button with spinner', () => {
    expect(html).toContain('id="filter-device"');
    expect(html).toContain('id="search-btn"');
    expect(html).toContain('id="search-btn-spinner"');
    expect(html).toMatch(/id="search-btn-spinner"[^>]*display:\s*none/);
  });

  it('has 3 auto-refresh buttons, all disabled, with hint', () => {
    for (const s of ['30', '60', '300']) {
      expect(html).toContain(`data-refresh="${s}"`);
    }
    const matches = html.match(/auto-refresh-btn[^>]*disabled/g);
    expect(matches).toHaveLength(3);
    expect(html).toContain('id="ar-preset-hint"');
    expect(html).toContain('data-i18n="autorefresh.hint"');
  });
});

describe('Main panel — local filters', () => {
  it('has domain search, tracker search and show-trackers toggle (on by default)', () => {
    expect(html).toContain('id="local-filter-domain"');
    expect(html).toContain('id="local-filter-tracker-search"');
    expect(html).toMatch(/id="local-filter-tracker"[^>]*checked/);
    expect(html).toContain('data-i18n-placeholder="filters.domainPlaceholder"');
    expect(html).toContain('data-i18n-placeholder="filters.trackerPlaceholder"');
  });
});

describe('Main panel — log list area', () => {
  it('has all state containers (empty, loading, no-results, list, scroll-loader, end)', () => {
    for (const id of ['logs-empty', 'logs-loading', 'logs-no-results', 'logs-list', 'logs-scroll-loader', 'logs-end']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('all loaders/states except empty are hidden by default', () => {
    expect(html).toMatch(/id="logs-loading"[^>]*display:\s*none/);
    expect(html).toMatch(/id="logs-no-results"[^>]*display:\s*none/);
    expect(html).toMatch(/id="logs-scroll-loader"[^>]*display:\s*none/);
    expect(html).toMatch(/id="logs-end"[^>]*display:\s*none/);
    // logs-empty is visible (no display:none)
    expect(html).not.toMatch(/id="logs-empty"[^>]*display:\s*none/);
  });
});

describe('Layout — global elements', () => {
  it('has toast container, scroll buttons and noindex meta', () => {
    expect(layoutHtml).toContain('id="toast-container"');
    expect(layoutHtml).toContain('id="scroll-top-btn"');
    expect(layoutHtml).toContain('id="scroll-bottom-btn"');
    expect(layoutHtml).toContain('noindex, nofollow');
  });

  it('loads translations.js before app.js', () => {
    const i18nIdx = layoutHtml.indexOf('translations.js');
    const appIdx = layoutHtml.indexOf('app.js');
    expect(i18nIdx).toBeGreaterThan(-1);
    expect(appIdx).toBeGreaterThan(i18nIdx);
  });
});

describe('i18n — translation keys parity', () => {
  it('PL and EN have the same set of keys', () => {
    // Extract key lists from translations.js source
    const plBlock = translationsJs.slice(
      translationsJs.indexOf('pl: {'),
      translationsJs.indexOf('en: {'),
    );
    const enBlock = translationsJs.slice(translationsJs.indexOf('en: {'));

    const extractKeys = (block: string) =>
      [...block.matchAll(/'([a-z][a-zA-Z.]+)':/g)].map((m) => m[1]).sort();

    const plKeys = extractKeys(plBlock);
    const enKeys = extractKeys(enBlock);

    expect(plKeys.length).toBeGreaterThan(0);
    expect(plKeys).toEqual(enKeys);
  });
});
