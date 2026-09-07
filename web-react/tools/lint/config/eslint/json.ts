import type { Linter } from 'eslint'

import jsonSchemaValidator from 'eslint-plugin-json-schema-validator'

export const json: Linter.Config[] = [
  ...jsonSchemaValidator.configs.base,
  {
    files: ['src/styleTokens/tokens/**/*.{json,jsonc}'],
    plugins: {
      'json-schema-validator': jsonSchemaValidator,
    },
    rules: {
      'json-schema-validator/no-invalid': [
        'error',
        {
          schemas: [
            {
              fileMatch: ['src/styleTokens/tokens/**/*.{json,jsonc}'],
              schema: './src/styleTokens/generated/metadata/token.schema.json'
            }
          ]
        }
      ]
    }
  }
]
