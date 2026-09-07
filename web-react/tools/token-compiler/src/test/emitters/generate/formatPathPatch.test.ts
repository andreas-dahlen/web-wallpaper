import { describe, expect, it } from 'vitest'

import type { GroupMetadata } from '../../../emitters/extract/assemblers/assembleMetadata.ts'
import { formatPathPatches } from '../../../emitters/generate/format/formatPathPatches.ts'

function createGroup(
  overrides: Partial<GroupMetadata> = {},
): GroupMetadata {
  return {
    name: 'button',
    groupPath: '/tokens/button',
    tokenFiles: [
      '/tokens/button/default.jsonc',
      '/tokens/button/hover.jsonc',
    ],
    cssFile: '/components/Button/Button.module.css',
    outputFile: '/generated/metadata/metadata.generated.jsonc',
    ...overrides,
  }
}

describe('[EMITTER]', () => {
  describe('formatPathPatches', () => {
    it('returns no patches when there is no metadata', () => {
      expect(formatPathPatches([])).toEqual([])
    })

    it('creates a JSONC patch pointing to the CSS file', () => {
      const [result] = formatPathPatches([
        createGroup({
          tokenFiles: ['/tokens/button/default.jsonc'],
        }),
      ])

      expect(result).toEqual({
        outputFile: '/tokens/button/default.jsonc',
        content:
          '// file://wsl.localhost/Ubuntu/components/Button/Button.module.css',
      })
    })

    it('creates a CSS patch containing all token files', () => {
      const results = formatPathPatches([
        createGroup(),
      ])

      const result = results.find(
        file => file.outputFile === '/components/Button/Button.module.css',
      )

      expect(result).toEqual({
        outputFile: '/components/Button/Button.module.css',
        content:
          '/* \n' +
          'file://wsl.localhost/Ubuntu/tokens/button/default.jsonc\n' +
          'file://wsl.localhost/Ubuntu/tokens/button/hover.jsonc\n' +
          '*/',
      })
    })

    it('creates one JSONC patch for each JSONC token file', () => {
      const results = formatPathPatches([
        createGroup(),
      ])

      expect(
        results.filter(file => file.outputFile.endsWith('.jsonc')),
      ).toHaveLength(2)
    })

    it('ignores token files that are not JSONC', () => {
      const results = formatPathPatches([
        createGroup({
          tokenFiles: [
            '/tokens/button/default.jsonc',
            '/tokens/button/legacy.json',
            '/tokens/button/readme.txt',
          ],
        }),
      ])

      expect(
        results.map(file => file.outputFile),
      ).toEqual([
        '/tokens/button/default.jsonc',
        '/components/Button/Button.module.css',
      ])
    })

    it('does not create a CSS patch for a non-CSS file', () => {
      const results = formatPathPatches([
        createGroup({
          cssFile: '/components/Button/Button.module',
        }),
      ])

      expect(
        results.some(
          file => file.outputFile === '/components/Button/Button.module',
        ),
      ).toBe(false)

      expect(
        results.some(
          file => file.outputFile === '/tokens/button/default.jsonc',
        ),
      ).toBe(true)
    })

    it('creates patches for multiple groups', () => {
      const results = formatPathPatches([
        createGroup(),
        createGroup({
          name: 'surface',
          groupPath: '/tokens/surface',
          tokenFiles: [
            '/tokens/surface/default.jsonc',
          ],
          cssFile: '/components/Surface/Surface.module.css',
        }),
      ])

      expect(results.map(file => file.outputFile)).toEqual([
        '/tokens/button/default.jsonc',
        '/tokens/button/hover.jsonc',
        '/components/Button/Button.module.css',
        '/tokens/surface/default.jsonc',
        '/components/Surface/Surface.module.css',
      ])
    })
  })
})