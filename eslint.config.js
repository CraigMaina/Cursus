import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * Flat ESLint config (ESLint 9). Type-aware linting is intentionally NOT enabled here -
 * `tsc -b` in `npm run build` is the type gate; ESLint covers lint-only concerns
 * (unused vars, hooks rules). Kept lenient so it stays green and useful rather than noisy.
 */
export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'coverage', '*.config.js', 'scripts', 'supabase/functions'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.serviceworker },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      // Intentional controlled prop -> state sync in forms; a warning, not an error.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Vitest tests use node globals + relaxed rules.
    files: ['test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Node scripts (.mjs helpers, RLS/reset test harnesses) run under Node, not the browser.
    files: ['**/*.mjs', 'supabase/tests/**'],
    languageOptions: { globals: { ...globals.node } },
  },
);
