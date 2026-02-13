import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '../../src');

const pageHtml = readFileSync(join(srcDir, 'pages/index.astro'), 'utf-8');
const layoutHtml = readFileSync(join(srcDir, 'layouts/Layout.astro'), 'utf-8');
const translationsJs = readFileSync(join(srcDir, 'i18n/translations.js'), 'utf-8');

const mainPanelStart = pageHtml.indexOf('id="main-panel"');

export const connectScreenHtml = pageHtml.slice(
  pageHtml.indexOf('id="connect-screen"'),
  mainPanelStart,
);

export const mainPanelHtml = pageHtml.slice(mainPanelStart);
export const fullPageHtml = pageHtml;
export { layoutHtml, translationsJs };
