import { describe, expect, it, vi } from 'vitest'

import { tokenSection } from '../../../diagnostics/report/sections/verbose/tokenSection.ts'
import type { FileStatus } from '../../../types/diagnostics.types.ts'

vi.mock('../../../../utils/string', () => ({
  colors: {
    muted: 'muted',
    file: 'file',
    subHeading: 'subHeading',
    success: 'success',
    heading: 'heading',
    value: 'value',
  },
  paint: String,
  formatLogPath: (path: string) => {
    const marker = '/generated/'
    const index = path.indexOf(marker)

    return index === -1
      ? path
      : path.slice(index + marker.length)
  },
}))

function createFileStatus(
  overrides: Partial<FileStatus> = {},
): FileStatus {
  return {
    written: [],
    skipped: [],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('tokenSection', () => {
    it('creates a section when files were written', () => {
      const result = tokenSection(
        createFileStatus({
          written: ['tokens/button.token.ts'],
        }),
      )

      expect(result).toBeDefined()
      expect(result?.title).toContain('Token files')
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('creates a section when files were skipped', () => {
      const result = tokenSection(
        createFileStatus({
          skipped: ['tokens/button.token.ts'],
        }),
      )

      expect(result).toBeDefined()
      expect(result?.title).toContain('Token files')
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('reports written files in a written entry', () => {
      const result = tokenSection(
        createFileStatus({
          written: [
            'tokens/button.token.ts',
            'tokens/card.token.ts',
          ],
        }),
      )

      const entry = result?.entries.find(
        entry => entry.title.includes('written'),
      )

      expect(entry).toBeDefined()
      expect(entry?.lines).toHaveLength(2)

      expect(entry?.lines?.some(line =>
        line.includes('tokens/button.token.ts'),
      )).toBe(true)

      expect(entry?.lines?.some(line =>
        line.includes('tokens/card.token.ts'),
      )).toBe(true)
    })

    it('reports skipped files in a skipped entry', () => {
      const result = tokenSection(
        createFileStatus({
          skipped: [
            'tokens/button.token.ts',
            'tokens/card.token.ts',
          ],
        }),
      )

      const entry = result?.entries.find(
        entry => entry.title.includes('skipped'),
      )

      expect(entry).toBeDefined()
      expect(entry?.lines).toHaveLength(2)

      expect(entry?.lines?.some(line =>
        line.includes('tokens/button.token.ts'),
      )).toBe(true)

      expect(entry?.lines?.some(line =>
        line.includes('tokens/card.token.ts'),
      )).toBe(true)
    })

    it('creates separate entries for written and skipped files', () => {
      const result = tokenSection(
        createFileStatus({
          written: ['tokens/button.token.ts'],
          skipped: ['tokens/card.token.ts'],
        }),
      )

      expect(result?.entries).toHaveLength(2)

      expect(
        result?.entries.some(entry =>
          entry.title.includes('written'),
        ),
      ).toBe(true)

      expect(
        result?.entries.some(entry =>
          entry.title.includes('skipped'),
        ),
      ).toBe(true)
    })

    it('reports the total number of files in the section title', () => {
      const result = tokenSection(
        createFileStatus({
          written: [
            'tokens/button.token.ts',
            'tokens/card.token.ts',
          ],
          skipped: [
            'tokens/surface.token.ts',
          ],
        }),
      )

      expect(result?.title).toContain('(3)')
    })

    it('does not create a written entry when no files were written', () => {
      const result = tokenSection(
        createFileStatus({
          skipped: ['tokens/button.token.ts'],
        }),
      )

      expect(
        result?.entries.some(entry =>
          entry.title.includes('written'),
        ),
      ).toBe(false)
    })

    it('does not create a skipped entry when no files were skipped', () => {
      const result = tokenSection(
        createFileStatus({
          written: ['tokens/button.token.ts'],
        }),
      )

      expect(
        result?.entries.some(entry =>
          entry.title.includes('skipped'),
        ),
      ).toBe(false)
    })

    it('returns disabled message when there are no files', () => {
      const result = tokenSection(createFileStatus())
      expect(result.title).toBeDefined()
    })
  })
})