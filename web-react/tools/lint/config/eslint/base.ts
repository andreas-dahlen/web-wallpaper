import { defineConfig } from 'eslint/config'

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unicorn from 'eslint-plugin-unicorn'

export default defineConfig({
  files: ['**/*.{ts,tsx}'],

  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
    unicorn.configs.recommended,
  ],

  rules: {
    "react-hooks/static-components": "off",
    'react-hooks/use-memo': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
    'react-hooks/incompatible-library': 'off',
    'react-hooks/immutability': 'off',
    'react-hooks/globals': 'off',
    'react-hooks/refs': 'off',
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/error-boundaries': 'off',
    'react-hooks/purity': 'off',
    'react-hooks/set-state-in-render': 'off',
    //temporary!
    // 'react-hooks/unsupported-syntax': 'off',
    // 'react-hooks/config': 'off',
    // 'react-hooks/gating': 'off',
  },

  languageOptions: {
    ecmaVersion: 2023,
    globals: globals.browser,
  },
})