import type { OxlintOverride } from 'oxlint'

export const unusedVars: OxlintOverride = {
  files: ['**/*.{ts,tsx}'],

  rules: {
    'eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
}