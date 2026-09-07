import type { Linter } from 'eslint'

export const unicorn: Linter.Config[] = [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'unicorn/no-unused-properties': 'warn',
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/name-replacements': 'off',
      'unicorn/switch-case-braces': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/no-for-each': 'off',
      'unicorn/prefer-minimal-ternary': 'off',
      'unicorn/empty-brace-spaces': 'off',
      'unicorn/no-this-outside-of-class': 'off',
      'unicorn/single-line-block-comment-style': 'off',

      'unicorn/prefer-module': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-export-from': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-switch': 'off',
      'unicorn/prefer-object-from-entries': 'off',
      'unicorn/prefer-string-replace-all': 'off',
    }
  },
  {
    files: ['**/test/**/*.{ts,tsx}'],
    rules: {
      'unicorn/no-useless-spread': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/prefer-dom-node-append': 'off'
    }
  },
  {
    files: ['src/**/*.{tsx,jsx,module.css,svg}'],
    ignores: [
      "**/*.test.tsx",
      "**/main.tsx"
    ],
    rules: {
      'unicorn/filename-case': ['error', {
        case: 'pascalCase',
        checkDirectories: false
      }]
    }
  },
  {
    files: ['src/**/*.{ts,js}'],
    ignores: [
      "**/test/**/*.ts",
    ],
    rules: {
      'unicorn/filename-case': ['error', {
        case: 'camelCase',
        checkDirectories: false
      }]
    }
  },
  {
    files: ['tools/**/*.{ts,js}'],
    ignores: [
      "**/test/**/*.ts",
    ],
    rules: {
      'unicorn/filename-case': ['error', {
        cases: {
          'camelCase': true
          ,
          'kebabCase': true
        },
        checkDirectories: false
      }]
    }
  },
]