import { defineConfig } from 'oxlint'

import { boundarySettings } from './tools/lint/config/boundaries/settings.ts'
import { appBoundaries, compilerBoundaries } from './tools/lint/config/boundaries/wrappers/oxlint.ts'
import { ignores } from './tools/lint/config/globalIgnores.ts'
import { unusedVars } from './tools/lint/config/oxlint/unusedVars.ts'
import { jsPlugins } from './tools/lint/config/oxlint/plugins.ts'
export default defineConfig({
  ignorePatterns: ignores,

  // jsPlugins,
  settings: {
    ...boundarySettings,
    custom: {
      rootDir: '.',
    },
  },

  jsPlugins,

  overrides: [
    appBoundaries,
    compilerBoundaries,
    unusedVars,
  ],

  plugins: [
    'eslint',
    'typescript',
    'unicorn',
    'oxc',
    'react',
    'import'
  ],

  rules: {
    'test-api/no-test-only-api': 'error',
    'internal-imports/no-internal-import-extensions': 'error',
    'react/static-components': 'error',
    'react/use-memo': 'error',
    'react/preserve-manual-memoization': 'error',
    'react/incompatible-library': 'error',
    'react/immutability': 'error',
    'react/globals': 'error',
    'react/refs': 'error',
    'react/set-state-in-effect': 'error',
    'react/error-boundaries': 'error',
    'react/purity': 'error',
    'react/set-state-in-render': 'error',

    'import/extensions': [
      'error',
      'always',
      {
        js: 'never',
        jsx: 'never',
        ignorePackages: true,
        checkTypeImports: true,
      }
    ]
  }
})
