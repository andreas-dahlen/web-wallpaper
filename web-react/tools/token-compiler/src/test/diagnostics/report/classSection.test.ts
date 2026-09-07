import { describe, expect, it, vi } from 'vitest'

import { classSection } from '../../../diagnostics/report/sections/problems/classSection.ts'
import type { MissingClass } from '../../../types/diagnostics.types.ts'

vi.mock('../../../../utils/string.js', () => ({
  colors: {
    muted: 'muted',
    file: 'file',
    subHeading: 'subHeading',
    value: 'value',
    symbol: 'symbol',
    reset: 'reset',
    error: 'error',
    heading: 'heading',
  },

  paint: String,
  formatLogPath: (value: string) => value,
}))

function createMissingClass(
  overrides: Partial<MissingClass> = {},
): MissingClass {
  return {
    infix: 'button',
    tokenPath: '/tokens/button/default.jsonc',
    usableSelectors: ['button', 'card'],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('classSection', () => {
    it('creates a section for missing classes', () => {
      const result = classSection([
        createMissingClass(),
      ])

      expect(result).toBeDefined()
      expect(result?.entries).toHaveLength(1)
    })

    it('identifies the missing class in the entry title', () => {
      const result = classSection([
        createMissingClass({
          infix: 'button',
        }),
      ])

      expect(result?.entries[0].title).toContain(
        '.button',
      )
      expect(result?.entries[0].title).toContain(
        'Expected:',
      )
    })

    it('includes the token file path', () => {
      const result = classSection([
        createMissingClass({
          tokenPath: '/tokens/button/default.jsonc',
        }),
      ])

      expect(result?.entries[0].lines).toContain(
        'File: /tokens/button/default.jsonc',
      )
    })

    it('includes the number of available selectors', () => {
      const result = classSection([
        createMissingClass({
          usableSelectors: ['button', 'card', 'input'],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('Available selectors (3)'),
      )).toBe(true)
    })

    it('includes all available selectors', () => {
      const result = classSection([
        createMissingClass({
          usableSelectors: ['button', 'card', 'input'],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      const selectorLine = lines.find(line =>
        line.includes('button') &&
        line.includes('card') &&
        line.includes('input'),
      )

      expect(selectorLine).toBeDefined()
    })

    it('does not include a file line when the token path is empty', () => {
      const result = classSection([
        createMissingClass({
          tokenPath: '',
        }),
      ])

      expect(result?.entries[0].lines).not.toContain(
        expect.stringContaining('File:'),
      )
    })

    it('does not create an entry when no selectors are usable', () => {
      const result = classSection([
        createMissingClass({
          usableSelectors: [],
        }),
      ])

      expect(result).toBeUndefined()
    })

    it('returns undefined for empty input', () => {
      expect(classSection([])).toBeUndefined()
    })

    it('creates entries for multiple missing classes', () => {
      const result = classSection([
        createMissingClass({
          infix: 'button',
        }),
        createMissingClass({
          infix: 'surface',
          tokenPath: '/tokens/surface/default.jsonc',
          usableSelectors: ['surface'],
        }),
      ])

      expect(result?.entries).toHaveLength(2)

      const titles = result?.entries.map(
        entry => entry.title,
      ) ?? []

      expect(titles[0]).toContain('.button')
      expect(titles[1]).toContain('.surface')
    })

    it('reports the number of generated entries in the section title', () => {
      const result = classSection([
        createMissingClass({
          infix: 'button',
        }),
        createMissingClass({
          infix: 'surface',
          usableSelectors: ['surface'],
        }),
      ])

      expect(result?.title).toContain(
        'Missing Css Classes',
      )
      expect(result?.title).toContain('(2)')
    })
  })
})