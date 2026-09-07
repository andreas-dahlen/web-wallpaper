import { describe, expect, it, vi } from 'vitest'

import { fileSection } from '../../../diagnostics/report/sections/problems/fileSection.ts'

vi.mock('../../../../utils/string.js', () => ({
  colors: {
    muted: 'muted',
    file: 'file',
    heading: 'heading',
    value: 'value',
    error: 'error',
  },

  paint: String,
}))

describe('[DIAGNOSTICS]', () => {
  describe('fileSection', () => {
    it('creates a section for missing files', () => {
      const result = fileSection([
        '/components/Button',
      ])

      expect(result).toBeDefined()
      expect(result?.title).toContain('Missing Files')
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('creates an entry for each missing file', () => {
      const result = fileSection([
        '/components/Button',
        '/components/Card',
      ])

      expect(result?.entries).toHaveLength(2)

      const titles = result?.entries.map(
        entry => entry.title,
      ) ?? []

      expect(titles[0]).toContain(
        '/components/Button.module.css',
      )

      expect(titles[1]).toContain(
        '/components/Card.module.css',
      )
    })

    it('adds the module CSS suffix to the file path', () => {
      const result = fileSection([
        '/components/Button',
      ])

      expect(result?.entries[0].title).toContain(
        '/components/Button.module.css',
      )
    })

    it('identifies entries as files', () => {
      const result = fileSection([
        '/components/Button',
      ])

      expect(result?.entries[0].title).toContain(
        'File:',
      )
    })

    it('ignores empty file paths', () => {
      const result = fileSection([
        '',
        '/components/Button',
      ])

      expect(result?.entries).toHaveLength(1)
      expect(result?.entries[0].title).toContain(
        '/components/Button.module.css',
      )
    })

    it('returns undefined when there are no missing files', () => {
      expect(fileSection([])).toBeUndefined()
    })
  })
})