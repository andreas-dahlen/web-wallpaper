import { describe, expect, it } from 'vitest'
import path from 'node:path'

import { assemblePresetData } from '../../../emitters/extract/assemblers/assemblePresetData.ts'
import type { CssData } from '../../../types/compiler.types.ts'

function createCssData(
  overrides: Partial<CssData> = {},
): CssData {
  return {
    groupPath: '/tokens/button',
    cssPath: '/components/Button/Button.module.css',
    foundSelectors: [],
    usableSelectors: ['primary'],
    foundFinalVariables: [],
    declaredVariables: [],
    tokens: [],
    ...overrides,
  }
}

const outDir = '/generated'

describe('[EMITTERS]', () => {
  describe('assemblePresetData', () => {
    it('builds preset names from the group name', () => {
      const result = assemblePresetData(
        createCssData({
          groupPath: '/tokens/button',
        }),
        outDir,
      )

      expect(result).toMatchObject({
        presetName: 'buttonPreset',
        typeName: 'ButtonPreset',
      })
    })

    it('builds the generated preset file path', () => {
      const result = assemblePresetData(
        createCssData({
          groupPath: '/tokens/button',
        }),
        outDir,
      )

      expect(result?.outputFile).toBe(
        '/generated/presets/button.preset.ts',
      )
    })

    it('creates a relative CSS import path', () => {
      const generatedDir = path.join(
        outDir,
        'presets',
      )

      const cssPath = path.resolve(
        './src/components/Button/Button.module.css',
      )

      const result = assemblePresetData(
        createCssData({ cssPath }),
        outDir,
      )

      expect(result?.cssImport).toBe(
        path.relative(generatedDir, cssPath),
      )
    })

    it('normalizes Windows path separators in the CSS import', () => {
      const result = assemblePresetData(
        createCssData({
          cssPath: String.raw`C:\project\src\components\Button\Button.module.css`,
        }),
        outDir,
      )

      expect(result?.cssImport).not.toContain('\\')
    })

    it('filters non-preset selectors', () => {
      const result = assemblePresetData(
        createCssData({
          groupPath: '/tokens/button',
          usableSelectors: [
            'button',
            'button_$state',
            'active',
            'focusUtil',
          ],
        }),
        outDir,
      )

      expect(result?.selectors).toEqual([
        'button_$state',
        'active',
      ])
    })

    it('returns null when no preset selectors remain', () => {
      const result = assemblePresetData(
        createCssData({
          groupPath: '/tokens/svg',
          usableSelectors: [
            'svg',
            'focusUtil',
            'debugUtil',
          ],
        }),
        outDir,
      )

      expect(result).toBeNull()
    })

    it('preserves the CSS path in the generated import', () => {
      const result = assemblePresetData(
        createCssData({
          cssPath: '/components/Layout/Layout.module.css',
        }),
        outDir,
      )

      expect(result?.cssImport).toContain(
        'Layout/Layout.module.css',
      )
    })
  })
})