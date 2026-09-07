import { describe, expect, it } from 'vitest'

import { assembleLspData } from '../../../emitters/extract/assemblers/assembleLspData.ts'
import type { TokenData } from '../../../emitters/extract/assemblers/assembleTokenData.ts'

const outPath = '/generated'

function createToken(
  overrides: Partial<TokenData> = {},
): TokenData {
  return {
    infix: 'button',
    variables: [],
    ...overrides,
  }
}

describe('[EMITTERS]', () => {
  describe('assembleLspData', () => {
    it('converts valid colors to sRGB variable declarations', () => {
      const result = assembleLspData(
        [
          ['--button-color', 'oklch(70% 0.2 30)'],
        ],
        [],
        outPath,
      )

      expect(result.rgbVariables).toEqual([
        expect.stringMatching(/^--button-color: rgb\(/),
      ])
    })

    it('assembles multiple variables', () => {
      const result = assembleLspData(
        [
          ['--button-color', 'oklch(70% 0.2 30)'],
          ['--button-background', 'oklch(80% 0.1 120)'],
        ],
        [],
        outPath,
      )

      expect(result.rgbVariables).toHaveLength(2)
      expect(result.rgbVariables[0]).toMatch(
        /^--button-color: rgb\(/,
      )
      expect(result.rgbVariables[1]).toMatch(
        /^--button-background: rgb\(/,
      )
    })

    it('skips invalid color values', () => {
      const result = assembleLspData(
        [
          ['--valid', 'oklch(70% 0.2 30)'],
          ['--invalid', 'not-a-color'],
        ],
        [],
        outPath,
      )

      expect(result.rgbVariables).toHaveLength(1)
      expect(result.rgbVariables[0]).toMatch(
        /^--valid: rgb\(/,
      )
    })

    it('deduplicates identical variable declarations', () => {
      const result = assembleLspData(
        [
          ['--button-color', 'oklch(70% 0.2 30)'],
          ['--button-color', 'oklch(70% 0.2 30)'],
        ],
        [],
        outPath,
      )

      expect(result.rgbVariables).toHaveLength(1)
    })

    it('preserves distinct declarations with the same color', () => {
      const result = assembleLspData(
        [
          ['--button-color', 'oklch(70% 0.2 30)'],
          ['--button-background', 'oklch(70% 0.2 30)'],
        ],
        [],
        outPath,
      )

      expect(result.rgbVariables).toHaveLength(2)
      expect(result.rgbVariables[0]).toMatch(
        /^--button-color: rgb\(/,
      )
      expect(result.rgbVariables[1]).toMatch(
        /^--button-background: rgb\(/,
      )
    })

    it('preserves token data', () => {
      const tokens = [
        createToken(),
        createToken({ infix: 'card' }),
      ]

      const result = assembleLspData(
        [],
        tokens,
        outPath,
      )

      expect(result.tokens).toBe(tokens)
    })

    it('creates the LSP output path', () => {
      const result = assembleLspData(
        [],
        [],
        outPath,
      )

      expect(result.outputFile).toBe(
        '/generated/metadata/lsp.generated.ts',
      )
    })

    it('returns an empty collection when there are no variables', () => {
      const result = assembleLspData(
        [],
        [],
        outPath,
      )

      expect(result.rgbVariables).toEqual([])
    })
  })
})