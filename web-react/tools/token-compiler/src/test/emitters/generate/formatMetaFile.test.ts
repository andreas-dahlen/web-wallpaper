import { describe, expect, it } from 'vitest'

import { formatMetaFile } from '../../../emitters/generate/format/formatMetaFile.ts'
import type { GroupMetadata } from '../../../emitters/extract/assemblers/assembleMetadata.ts'

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
    outputFile:
      '/generated/metadata/metadata.generated.jsonc',
    ...overrides,
  }
}

describe('[EMITTER]', () => {
  describe('formatMetaFile', () => {
    it('returns the generated metadata file path', () => {
      const group = createGroup()

      const result = formatMetaFile([group])

      expect(result.outputFile)
        .toBe(group.outputFile)
    })

    it('formats group metadata', () => {
      const result = formatMetaFile([
        createGroup(),
      ])

      const content = JSON.parse(result.content)

      expect(content.groups).toEqual({
        button: {
          cssPath: '/components/Button/Button.module.css',
          tokenPaths: [
            '/tokens/button/default.jsonc',
            '/tokens/button/hover.jsonc',
          ],
        },
      })
    })

    it('creates a reverse file lookup', () => {
      const result = formatMetaFile([
        createGroup(),
      ])

      const content = JSON.parse(result.content)

      expect(content.files).toEqual({
        '/components/Button/Button.module.css': 'button',
        '/tokens/button/default.jsonc': 'button',
        '/tokens/button/hover.jsonc': 'button',
      })
    })

    it('formats multiple groups', () => {
      const result = formatMetaFile([
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

      const content = JSON.parse(result.content)

      expect(content.groups).toEqual({
        button: {
          cssPath: '/components/Button/Button.module.css',
          tokenPaths: [
            '/tokens/button/default.jsonc',
            '/tokens/button/hover.jsonc',
          ],
        },
        surface: {
          cssPath: '/components/Surface/Surface.module.css',
          tokenPaths: [
            '/tokens/surface/default.jsonc',
          ],
        },
      })

      expect(content.files).toEqual({
        '/components/Button/Button.module.css': 'button',
        '/tokens/button/default.jsonc': 'button',
        '/tokens/button/hover.jsonc': 'button',
        '/components/Surface/Surface.module.css': 'surface',
        '/tokens/surface/default.jsonc': 'surface',
      })
    })

    it('produces pretty-printed JSON', () => {
      const result = formatMetaFile([
        createGroup(),
      ])

      expect(result.content).toContain('\n  "groups":')
      expect(result.content).toContain('\n  "files":')
    })
  })
})