import { describe, expect, it, vi } from 'vitest'

import { variableSection } from '../../../diagnostics/report/sections/problems/variableSection.ts'
import type { VariableMismatch } from '../../../types/diagnostics.types.ts'

vi.mock('../../../../utils/string', () => ({
  colors: {
    error: 'error',
    file: 'file',
    value: 'value',
    symbol: 'symbol',
    variable: 'variable',
    subHeading: 'subHeading',
    heading: 'heading',
  },

  paint: String,
}))

function createVariableMismatch(
  overrides: Partial<VariableMismatch> = {},
): VariableMismatch {
  return {
    name: 'button',
    infix: 'button',
    missing: [],
    unused: [],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('variableSection', () => {
    it('creates a section for variable mismatches', () => {
      const result = variableSection([
        createVariableMismatch({
          unused: ['--s-button-color'],
        }),
      ])

      expect(result).toBeDefined()
      expect(result?.title).toContain('Variable Mismatches')
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('creates an entry for each variable mismatch', () => {
      const result = variableSection([
        createVariableMismatch({
          name: 'button',
          infix: 'button',
          unused: ['--s-button-color'],
        }),
        createVariableMismatch({
          name: 'surface',
          infix: 'surface',
          missing: ['--final-surface-color'],
        }),
      ])

      expect(result?.entries).toHaveLength(2)
    })

    it('uses the infix as the component name when name and infix match', () => {
      const result = variableSection([
        createVariableMismatch({
          name: 'button',
          infix: 'button',
          unused: ['--s-button-color'],
        }),
      ])

      expect(result?.entries[0].title).toContain(
        'Component: button',
      )
    })

    it('combines name and infix when they differ', () => {
      const result = variableSection([
        createVariableMismatch({
          name: 'surface',
          infix: 'button',
          unused: ['--s-button-color'],
        }),
      ])

      expect(result?.entries[0].title).toContain(
        'Component: surface-button',
      )
    })

    it('reports unused variables', () => {
      const result = variableSection([
        createVariableMismatch({
          unused: [
            '--s-button-color',
            '--s-button-radius',
          ],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('Unused in:') &&
        line.includes('CSS') &&
        line.includes('(2)'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('--s-button-color'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('--s-button-radius'),
      )).toBe(true)
    })

    it('reports missing variables', () => {
      const result = variableSection([
        createVariableMismatch({
          missing: [
            '--final-button-color',
            '--final-button-radius',
          ],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('Missing in:') &&
        line.includes('JSON') &&
        line.includes('(2)'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('--final-button-color'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('--final-button-radius'),
      )).toBe(true)
    })

    it('reports unused and missing variables together', () => {
      const result = variableSection([
        createVariableMismatch({
          unused: ['--s-button-color'],
          missing: ['--final-button-radius'],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('Unused in:'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('Missing in:'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('--s-button-color'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('--final-button-radius'),
      )).toBe(true)
    })

    it('creates an entry even when both mismatch lists are empty', () => {
      const result = variableSection([
        createVariableMismatch(),
      ])

      expect(result).toBeDefined()
      expect(result?.entries).toHaveLength(1)
      expect(result?.entries[0].lines).toEqual([])
    })

    it('reports the number of variable mismatches in the section title', () => {
      const result = variableSection([
        createVariableMismatch({
          name: 'button',
          infix: 'button',
          unused: ['--s-button-color'],
        }),
        createVariableMismatch({
          name: 'surface',
          infix: 'surface',
          missing: ['--final-surface-color'],
        }),
      ])

      expect(result?.title).toContain('(2)')
    })

    it('returns undefined for empty input', () => {
      expect(variableSection([])).toBeUndefined()
    })
  })
})