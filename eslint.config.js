import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import stylistic from '@stylistic/eslint-plugin';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    },
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        URLSearchParams: 'readonly',
        t: 'readonly',
        setLang: 'readonly',
        getLang: 'readonly',
        applyTranslations: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/', '.astro/', 'node_modules/'],
  },
];
