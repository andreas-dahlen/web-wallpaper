import { describe, expect, it } from 'vitest'

import { analyzeTokens } from '../../../diagnostics/data/analyzers/analyzeTokens.ts'
import type { CssData } from '../../../types/compiler.types.ts'

function createCssData(
  overrides: Partial<CssData> = {},
): CssData {
  return {
    groupPath: '/tokens/button',
    cssPath: '/components/Button/Button.module.css',
    foundSelectors: [],
    usableSelectors: [],
    foundFinalVariables: [],
    declaredVariables: [],
    tokens: [],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('analyzeTokens', () => {
    it('returns no missing classes when all tokens are processed', () => {
      const cssData = createCssData({
        tokens: [
          {
            name: 'Button',
            infix: 'button',
            tokenPath: '/tokens/button.jsonc',
            processed: true,
          },
          {
            name: 'ButtonState',
            infix: 'button_$state',
            tokenPath: '/tokens/button-state.jsonc',
            processed: true,
          },
        ],
      })

      expect(analyzeTokens(cssData)).toEqual([])
    })

    it('returns unprocessed tokens as missing classes', () => {
      const cssData = createCssData({
        usableSelectors: [
          'button',
          'button_$state',
        ],
        tokens: [
          {
            name: 'Button',
            infix: 'button',
            tokenPath: '/tokens/button.jsonc',
            processed: false,
          },
          {
            name: 'ButtonState',
            infix: 'button_$state',
            tokenPath: '/tokens/button-state.jsonc',
            processed: true,
          },
        ],
      })

      expect(analyzeTokens(cssData)).toEqual([
        {
          infix: 'button',
          tokenPath: '/tokens/button.jsonc',
          usableSelectors: [
            'button',
            'button_$state',
          ],
        },
      ])
    })

    it('includes every unprocessed token', () => {
      const cssData = createCssData({
        usableSelectors: ['button'],
        tokens: [
          {
            name: 'Button',
            infix: 'button',
            tokenPath: '/tokens/button.jsonc',
            processed: false,
          },
          {
            name: 'Color',
            infix: 'color',
            tokenPath: '/tokens/color.jsonc',
            processed: false,
          },
          {
            name: 'Spacing',
            infix: 'spacing',
            tokenPath: '/tokens/spacing.jsonc',
            processed: true,
          },
        ],
      })

      expect(analyzeTokens(cssData)).toEqual([
        {
          infix: 'button',
          tokenPath: '/tokens/button.jsonc',
          usableSelectors: ['button'],
        },
        {
          infix: 'color',
          tokenPath: '/tokens/color.jsonc',
          usableSelectors: ['button'],
        },
      ])
    })

    it('returns an empty array when there are no tokens', () => {
      const cssData = createCssData()

      expect(analyzeTokens(cssData)).toEqual([])
    })
  })
})