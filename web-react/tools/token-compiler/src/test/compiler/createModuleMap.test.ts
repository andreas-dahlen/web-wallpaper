import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createModuleMap } from '../../compiler/discovery/createModuleMap.ts'

function createTempDir() {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), 'module-map-test-')
  )
}

function createFile(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, '')
}

describe('[COMPILER]', () => {
  describe('createModuleMap', () => {
    it('maps token groups to matching css modules', () => {
      const root = createTempDir()

      const buttonCssPath = path.join(
        root,
        'src',
        'components',
        'button',
        'Button.module.css',
      )

      const sliderCssPath = path.join(
        root,
        'src',
        'components',
        'slider',
        'Slider.module.css',
      )

      createFile(buttonCssPath)
      createFile(sliderCssPath)

      const buttonGroupPath = path.join(
        root,
        'tokens',
        'button',
      )

      const sliderGroupPath = path.join(
        root,
        'tokens',
        'slider',
      )

      const result = createModuleMap(
        root,
        [
          buttonGroupPath,
          sliderGroupPath,
        ],
      )

      expect(result).toEqual(
        new Map([
          [buttonGroupPath, buttonCssPath],
          [sliderGroupPath, sliderCssPath],
        ])
      )
    })

    it('ignores css modules without matching token groups', () => {
      const root = createTempDir()

      const buttonCssPath = path.join(
        root,
        'src',
        'components',
        'button',
        'Button.module.css',
      )

      createFile(buttonCssPath)

      createFile(
        path.join(
          root,
          'src',
          'components',
          'unused',
          'Unused.module.css',
        )
      )

      const buttonGroupPath = path.join(
        root,
        'tokens',
        'button',
      )

      const result = createModuleMap(
        root,
        [buttonGroupPath],
      )

      expect(result).toEqual(
        new Map([
          [buttonGroupPath, buttonCssPath],
        ])
      )
    })

    it('matches css module names case insensitively', () => {
      const root = createTempDir()

      const cssPath = path.join(
        root,
        'src',
        'Button',
        'BUTTON.module.css',
      )

      createFile(cssPath)

      const groupPath = path.join(
        root,
        'tokens',
        'button',
      )

      const result = createModuleMap(
        root,
        [groupPath],
      )

      expect(result.get(groupPath)).toBe(cssPath)
    })

    it('ignores non-module css files', () => {
      const root = createTempDir()

      createFile(
        path.join(
          root,
          'src',
          'button',
          'Button.css',
        )
      )

      const groupPath = path.join(
        root,
        'tokens',
        'button',
      )

      const result = createModuleMap(
        root,
        [groupPath],
      )

      expect(result).toEqual(new Map())
    })

    it('returns an empty map when no group paths are provided', () => {
      const root = createTempDir()

      createFile(
        path.join(
          root,
          'src',
          'button',
          'Button.module.css',
        )
      )

      const result = createModuleMap(root, [])

      expect(result).toEqual(new Map())
    })
  })
})