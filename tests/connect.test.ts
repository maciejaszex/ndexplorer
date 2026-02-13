import { describe, it, expect } from 'vitest';
import { connectScreenHtml as html, fullPageHtml } from './utils/helpers';

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
});
