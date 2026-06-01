import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // happy-dom gives us document/window for rendering & filtering tests.
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      // Coverage targets the framework-agnostic business logic in src/lib.
      // Astro pages/layouts and the thin DOM controller (app.js) are exercised
      // via the structural/connect tests but excluded from coverage thresholds.
      include: ['src/lib/**/*.ts'],
      reporter: ['text', 'text-summary', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
