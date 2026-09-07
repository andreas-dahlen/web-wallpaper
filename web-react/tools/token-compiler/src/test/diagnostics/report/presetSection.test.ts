import { describe, expect, it, vi } from 'vitest'

import { presetSection } from '../../../diagnostics/report/sections/verbose/presetSection.ts'
import type { FileStatus } from '../../../types/diagnostics.types.ts'

vi.mock('../../../../utils/string.js', () => ({
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
  describe('presetSection', () => {
    it('creates a section when files were written', () => {
      const result = presetSection(
        createFileStatus({
          written: [
            '/src/shared/generated/presets/button.preset.ts',
          ],
        }),
      )

      expect(result).toBeDefined()
      expect(result?.title).toContain('Preset files')
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('creates a section when files were skipped', () => {
      const result = presetSection(
        createFileStatus({
          skipped: [
            '/src/shared/generated/presets/button.preset.ts',
          ],
        }),
      )

      expect(result).toBeDefined()
      expect(result?.title).toContain('Preset files')
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('reports formatted written file paths', () => {
      const result = presetSection(
        createFileStatus({
          written: [
            '/src/shared/generated/presets/button.preset.ts',
            '/src/shared/generated/presets/card.preset.ts',
          ],
        }),
      )

      const entry = result?.entries.find(
        entry => entry.title.includes('written'),
      )

      expect(entry).toBeDefined()
      expect(entry?.lines).toHaveLength(2)

      expect(entry?.lines?.some(line =>
        line.includes('presets/button.preset.ts'),
      )).toBe(true)

      expect(entry?.lines?.some(line =>
        line.includes('presets/card.preset.ts'),
      )).toBe(true)
    })

    it('reports formatted skipped file paths', () => {
      const result = presetSection(
        createFileStatus({
          skipped: [
            '/src/shared/generated/presets/button.preset.ts',
            '/src/shared/generated/presets/card.preset.ts',
          ],
        }),
      )

      const entry = result?.entries.find(
        entry => entry.title.includes('skipped'),
      )

      expect(entry).toBeDefined()
      expect(entry?.lines).toHaveLength(2)

      expect(entry?.lines?.some(line =>
        line.includes('presets/button.preset.ts'),
      )).toBe(true)

      expect(entry?.lines?.some(line =>
        line.includes('presets/card.preset.ts'),
      )).toBe(true)
    })

    it('creates separate entries for written and skipped files', () => {
      const result = presetSection(
        createFileStatus({
          written: [
            '/src/shared/generated/presets/button.preset.ts',
          ],
          skipped: [
            '/src/shared/generated/presets/card.preset.ts',
          ],
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
      const result = presetSection(
        createFileStatus({
          written: [
            '/src/shared/generated/presets/button.preset.ts',
            '/src/shared/generated/presets/card.preset.ts',
          ],
          skipped: [
            '/src/shared/generated/presets/surface.preset.ts',
          ],
        }),
      )

      expect(result?.title).toContain('(3)')
    })

    it('does not create a written entry when no files were written', () => {
      const result = presetSection(
        createFileStatus({
          skipped: [
            '/src/shared/generated/presets/button.preset.ts',
          ],
        }),
      )

      expect(
        result?.entries.some(entry =>
          entry.title.includes('written'),
        ),
      ).toBe(false)
    })

    it('does not create a skipped entry when no files were skipped', () => {
      const result = presetSection(
        createFileStatus({
          written: [
            '/src/shared/generated/presets/button.preset.ts',
          ],
        }),
      )

      expect(
        result?.entries.some(entry =>
          entry.title.includes('skipped'),
        ),
      ).toBe(false)
    })

    it('returns undefined when there are no files', () => {
      const result = presetSection(createFileStatus())
      expect(result.title).toBeDefined()
    })
  })
})