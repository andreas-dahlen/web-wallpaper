import { describe, expect, it } from 'vitest'

import { analyzeSelectors } from '../../../diagnostics/data/analyzers/analyzeSelectors.ts'
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
  describe('analyzeSelectors', () => {
    it('returns undefined when all selectors are usable', () => {
      const cssData = createCssData({
        foundSelectors: [
          'button',
          'button_$state',
        ],
        usableSelectors: [
          'button',
          'button_$state',
        ],
      })

      expect(analyzeSelectors(cssData)).toBeUndefined()
    })

    it('returns unusable selectors', () => {
      const cssData = createCssData({
        foundSelectors: [
          'button',
          'invalid-selector',
          'button_$state',
        ],
        usableSelectors: [
          'button',
          'button_$state',
        ],
      })

      expect(analyzeSelectors(cssData)).toEqual({
        cssPath: '/components/Button/Button.module.css',
        unusableSelectors: [
          'invalid-selector',
        ],
      })
    })

    it('preserves the order of found selectors', () => {
      const cssData = createCssData({
        foundSelectors: [
          'first',
          'second',
          'third',
        ],
        usableSelectors: [
          'second',
        ],
      })

      expect(
        analyzeSelectors(cssData)?.unusableSelectors,
      ).toEqual([
        'first',
        'third',
      ])
    })

    it('returns all selectors when none are usable', () => {
      const cssData = createCssData({
        foundSelectors: [
          'button',
          'active',
          'disabled',
        ],
        usableSelectors: [],
      })

      expect(analyzeSelectors(cssData)).toEqual({
        cssPath: '/components/Button/Button.module.css',
        unusableSelectors: [
          'button',
          'active',
          'disabled',
        ],
      })
    })
  })
})