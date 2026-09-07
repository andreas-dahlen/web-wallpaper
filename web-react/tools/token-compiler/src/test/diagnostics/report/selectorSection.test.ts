import { describe, expect, it, vi } from 'vitest'

import { selectorSection } from '../../../diagnostics/report/sections/problems/selectorSection.ts'
import type { UnusableSelector } from '../../../types/diagnostics.types.ts'

vi.mock('../../../../utils/string', () => ({
  colors: {
    subHeading: 'subHeading',
    value: 'value',
    symbol: 'symbol',
    reset: 'reset',
    muted: 'muted',
    file: 'file',
    heading: 'heading',
  },

  paint: String,
  formatLogPath: (value: string) => value,
}))

function createUnusableSelector(
  overrides: Partial<UnusableSelector> = {},
): UnusableSelector {
  return {
    cssPath: '/components/Button/Button.module.css',
    unusableSelectors: ['button', 'card'],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('selectorSection', () => {
    it('creates a section for unusable selectors', () => {
      const result = selectorSection([
        createUnusableSelector(),
      ])

      expect(result).toBeDefined()
      expect(result?.title).toContain(
        'Unusable Preset Selectors',
      )
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('creates an entry for each affected file', () => {
      const result = selectorSection([
        createUnusableSelector({
          cssPath: '/components/Button/Button.module.css',
        }),
        createUnusableSelector({
          cssPath: '/components/Card/Card.module.css',
        }),
      ])

      expect(result?.entries).toHaveLength(2)

      const titles = result?.entries.map(
        entry => entry.title,
      ) ?? []

      expect(titles[0]).toContain(
        '/components/Button/Button.module.css',
      )

      expect(titles[1]).toContain(
        '/components/Card/Card.module.css',
      )
    })

    it('includes the unusable selector count', () => {
      const result = selectorSection([
        createUnusableSelector({
          unusableSelectors: [
            'button',
            'card',
            'input',
          ],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('Selectors') &&
        line.includes('(3)'),
      )).toBe(true)
    })

    it('includes all unusable selector names', () => {
      const selectors = [
        'button',
        'card',
        'input',
      ]

      const result = selectorSection([
        createUnusableSelector({
          unusableSelectors: selectors,
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      const selectorLine = lines.find(
        line => line.includes('button'),
      )

      expect(selectorLine).toBeDefined()

      for (const selector of selectors) {
        expect(selectorLine).toContain(selector)
      }
    })

    it('does not create an entry when there are no unusable selectors', () => {
      const result = selectorSection([
        createUnusableSelector({
          unusableSelectors: [],
        }),
      ])

      expect(result).toBeUndefined()
    })

    it('ignores empty selector groups while keeping valid groups', () => {
      const result = selectorSection([
        createUnusableSelector({
          cssPath: '/components/Empty/Empty.module.css',
          unusableSelectors: [],
        }),
        createUnusableSelector({
          cssPath: '/components/Button/Button.module.css',
          unusableSelectors: ['button'],
        }),
      ])

      expect(result?.entries).toHaveLength(1)
      expect(result?.entries[0].title).toContain(
        '/components/Button/Button.module.css',
      )
    })

    it('reports the number of generated entries in the section title', () => {
      const result = selectorSection([
        createUnusableSelector({
          cssPath: '/components/Button/Button.module.css',
          unusableSelectors: ['button'],
        }),
        createUnusableSelector({
          cssPath: '/components/Card/Card.module.css',
          unusableSelectors: ['card'],
        }),
      ])

      expect(result?.title).toContain('(2)')
    })

    it('returns undefined for empty input', () => {
      expect(selectorSection([])).toBeUndefined()
    })
  })
})