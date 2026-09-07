import { describe, expect, it, vi } from 'vitest'

import { invalidVarSection } from '../../../diagnostics/report/sections/problems/invalidVarSection.ts'
import type { InvalidVarDeclaration } from '../../../types/diagnostics.types.ts'

vi.mock('../../../../utils/string.js', () => ({
  colors: {
    error: 'error',
    value: 'value',
    symbol: 'symbol',
    subHeading: 'subHeading',
    heading: 'heading',
  },

  paint: String,
}))

function createInvalidVariable(
  overrides: Partial<InvalidVarDeclaration> = {},
): InvalidVarDeclaration {
  return {
    name: 'button',
    infix: 'button',
    invalid: ['--s-button-background'],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('invalidVarSection', () => {
    it('creates a section for invalid declarations', () => {
      const result = invalidVarSection([
        createInvalidVariable(),
      ])

      expect(result).toBeDefined()
      expect(result?.title).toContain(
        'Invalid Variable Declarations',
      )
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('identifies the component', () => {
      const result = invalidVarSection([
        createInvalidVariable({
          name: 'button',
          infix: 'button',
        }),
      ])

      expect(result?.entries[0].title).toContain(
        'Component:',
      )
      expect(result?.entries[0].title).toContain(
        'button',
      )
    })

    it('combines component name and infix when they differ', () => {
      const result = invalidVarSection([
        createInvalidVariable({
          name: 'surface',
          infix: 'button',
        }),
      ])

      expect(result?.entries[0].title).toContain(
        'surface-button',
      )
    })

    it('reports the number of invalid declarations', () => {
      const result = invalidVarSection([
        createInvalidVariable({
          invalid: [
            '--s-button-background',
            '--p-button-background',
            '--f-button-background',
          ]
        })
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('Invalid declarations:') &&
        line.includes('(3)'),
      )).toBe(true)
    })

    it('includes each invalid declaration', () => {
      const invalid = [
        '--s-button-background',
        '--p-button-background',
      ] satisfies InvalidVarDeclaration['invalid']

      const result = invalidVarSection([
        createInvalidVariable({
          invalid,
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      for (const variable of invalid) {
        expect(
          lines.some(line => line.includes(variable)),
        ).toBe(true)
      }
    })

    it('creates entries for multiple components', () => {
      const result = invalidVarSection([
        createInvalidVariable({
          name: 'button',
          infix: 'button',
        }),
        createInvalidVariable({
          name: 'surface',
          infix: 'surface',
          invalid: ['--p-surface-radius'],
        }),
      ])

      expect(result?.entries).toHaveLength(2)

      const titles = result?.entries.map(
        entry => entry.title,
      ) ?? []

      expect(titles[0]).toContain('button')
      expect(titles[1]).toContain('surface')
    })

    it('handles a component with no invalid declarations', () => {
      const result = invalidVarSection([
        createInvalidVariable({
          invalid: [],
        }),
      ])

      expect(result).toBeDefined()
      expect(result?.entries).toHaveLength(1)
      expect(result?.entries[0].lines).toEqual([])
    })

    it('returns undefined for empty input', () => {
      expect(invalidVarSection([])).toBeUndefined()
    })
  })
})