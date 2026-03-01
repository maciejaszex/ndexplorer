// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectScreenHtml as html, fullPageHtml, translationsJs } from './utils/helpers';

const bodyContent = fullPageHtml
  .replace(/---[\s\S]*?---/, '')
  .replace(/<\/?Layout>/g, '');

const __dirname = dirname(fileURLToPath(import.meta.url));
const appJs = readFileSync(join(__dirname, '../src/scripts/app.js'), 'utf-8');

beforeEach(() => {
  document.body.innerHTML = bodyContent;
  document.body.insertAdjacentHTML(
    'beforeend',
    '<div id="toast-container"></div><button id="scroll-top-btn"></button><button id="scroll-bottom-btn"></button>',
  );
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Connect screen', () => {
  it('has PL and EN flag buttons', () => {
    expect(html).toContain('data-lang="pl"');
    expect(html).toContain('data-lang="en"');
  });

  it('has connect button with spinner and i18n', () => {
    expect(html).toContain('id="connect-btn"');
    expect(html).toContain('id="connect-btn-spinner"');
    expect(html).toContain('data-i18n="connect.button"');
  });

  it('has app subtitle and GitHub link', () => {
    expect(html).toContain('data-i18n="app.subtitle"');
    expect(html).toContain('https://github.com/maciejaszex/ndexplorer');
  });

  it('connect screen is visible and main panel is hidden by default', () => {
    // connect-screen has no display:none
    expect(fullPageHtml).toMatch(/id="connect-screen"[^>]*class="[^"]*flex/);
    expect(fullPageHtml).not.toMatch(/id="connect-screen"[^>]*display:\s*none/);
    // main-panel starts hidden
    expect(fullPageHtml).toMatch(/id="main-panel"[^>]*style="display:\s*none;?"/);
  });

  it('spinner is hidden and button is enabled before user action', () => {
    // spinner has display:none inline
    expect(html).toMatch(/id="connect-btn-spinner"[^>]*display:\s*none/);
    // button has no "disabled" attribute
    expect(html).not.toMatch(/id="connect-btn"[^>]*disabled/);
  });

  it('connect button loads devices and switches to main panel', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        data: [
          { id: 'dev-1', name: 'MacBook' },
          { id: '__UNIDENTIFIED__' },
        ],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    // Execute browser scripts in the same order as Layout.astro
    new Function(translationsJs)();
    new Function(appJs)();

    const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
    const connectScreen = document.getElementById('connect-screen') as HTMLDivElement;
    const mainPanel = document.getElementById('main-panel') as HTMLDivElement;
    const filterDevice = document.getElementById('filter-device') as HTMLSelectElement;

    connectBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith('/api/devices');
    expect(connectScreen.style.display).toBe('none');
    expect(mainPanel.style.display).toBe('');
    expect(filterDevice.querySelector('option[value="dev-1"]')?.textContent).toBe('MacBook');
    expect(filterDevice.querySelector('option[value="__UNIDENTIFIED__"]')).not.toBeNull();
  });
});
