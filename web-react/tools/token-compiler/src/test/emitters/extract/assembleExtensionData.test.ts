import { describe, expect, it } from 'vitest'

import type { TokenData } from '../../../emitters/extract/assemblers/assembleTokenData.ts'
import { assembleExtensionData } from '../../../emitters/extract/assemblers/assembleExtensionData.ts'
import type { CssVarString, ValidPrefix } from '../../../oldSharedUtils/oldSharedCompiler.types.ts'

function createToken(
  overrides: Partial<TokenData> = {},
): TokenData {
  return {
    infix: 'button',
    variables: [
      {
        cssName: 'test-color',
        key: 'color',
        allowed: ['o', 's'] as ValidPrefix[],
        values: {},
      },
    ],
    ...overrides,
  }
}

const outPath = '/generated'

describe('[EMITTERS]', () => {
  describe('assembleExtensionData', () => {
    it('preserves existing variables', () => {
      const allVariables = [
        '--existing-color',
        '--existing-radius',
      ] as CssVarString[]

      const result = assembleExtensionData(
        allVariables,
        [],
        outPath,
      )

      expect(result.variables).toEqual(allVariables)
    })

    it('adds the final variable for each token variable', () => {
      const result = assembleExtensionData(
        [],
        [createToken()],
        outPath,
      )

      expect(result.variables).toContain(
        '--final-button-test-color',
      )
    })

    it('adds variables for every allowed prefix', () => {
      const result = assembleExtensionData(
        [],
        [createToken()],
        outPath,
      )

      expect(result.variables).toEqual([
        '--final-button-test-color',
        '--o-button-test-color',
        '--s-button-test-color',
      ])
    })

    it('assembles variables from multiple tokens', () => {
      const result = assembleExtensionData(
        [],
        [
          createToken({
            infix: 'button',
            variables: [
              {
                cssName: 'test-color',
                key: 'color',
                allowed: ['o'] as ValidPrefix[],
                values: {},
              },
            ],
          }),
          createToken({
            infix: 'button_hover',
            variables: [
              {
                cssName: 'test-color',
                key: 'color',
                allowed: ['s'] as ValidPrefix[],
                values: {},
              },
            ],
          }),
        ],
        outPath,
      )

      expect(result.variables).toEqual([
        '--final-button-test-color',
        '--o-button-test-color',
        '--final-button_hover-test-color',
        '--s-button_hover-test-color',
      ])
    })

    it('deduplicates existing and generated variables', () => {
      const allVariables = [
        '--final-button-test-color',
        '--existing-color',
      ] as CssVarString[]

      const result = assembleExtensionData(
        allVariables,
        [createToken()],
        outPath,
      )

      expect(result.variables).toEqual([
        '--final-button-test-color',
        '--existing-color',
        '--o-button-test-color',
        '--s-button-test-color',
      ])
    })

    it('does not add prefix variants when none are allowed', () => {
      const result = assembleExtensionData(
        [],
        [
          createToken({
            variables: [
              {
                cssName: 'test-color',
                key: 'color',
                allowed: [],
                values: {},
              },
            ],
          }),
        ],
        outPath,
      )

      expect(result.variables).toEqual([
        '--final-button-test-color',
      ])
    })

    it('returns an empty collection when there are no variables', () => {
      const result = assembleExtensionData(
        [],
        [],
        outPath,
      )

      expect(result.variables).toEqual([])
    })

    it('creates the extension output path', () => {
      const result = assembleExtensionData(
        [],
        [],
        outPath,
      )

      expect(result.outputFile).toBe(
        '/generated/metadata/extension.generated.jsonc',
      )
    })
  })
})