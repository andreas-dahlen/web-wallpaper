import { describe, expect, it, vi } from 'vitest'

import { headerSection } from '../../../diagnostics/report/sections/verbose/headerSection.ts'

vi.mock('../../../../utils/string.js', () => ({
  colors: {
    heading: 'heading',
    value: 'value',
    subHeading: 'subHeading',
  },
  paint: String,
}))

describe('[DIAGNOSTICS]', () => {
  describe('headerSection', () => {
    it('returns a report section with a separator title', () => {
      const result = headerSection(1)

      expect(result.title).toBe(
        '─────────────────────────────────────────────',
      )
      expect(result.entries).toHaveLength(1)
    })

    it('reports an update when one module is processed', () => {
      const result = headerSection(1)

      const entry = result.entries[0]

      expect(entry.title).toContain('[DesignTokens]')
      expect(entry.title).toContain('Update complete!')
    })

    it('reports an initialization when multiple modules are processed', () => {
      const result = headerSection(2)

      const entry = result.entries[0]

      expect(entry.title).toContain('[DesignTokens]')
      expect(entry.title).toContain('Initialization complete!')
    })

    it('reports the processed module count', () => {
      const result = headerSection(7)

      const lines = result.entries[0].lines ?? []

      expect(lines).toHaveLength(1)
      expect(lines[0]).toContain('Processed Modules:')
      expect(lines[0]).toContain('7')
    })

    it('uses update mode for zero processed modules', () => {
      const result = headerSection(0)

      expect(result.entries[0].title).toContain(
        'Update complete!',
      )
      expect(result.entries[0].title).not.toContain(
        'Initialization complete!',
      )
    })

    it('uses initialization mode only when more than one module is processed', () => {
      const result = headerSection(2)

      expect(result.entries[0].title).toContain(
        'Initialization complete!',
      )

      const single = headerSection(1)

      expect(single.entries[0].title).not.toContain(
        'Initialization complete!',
      )
    })
  })
})