import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { findCssModulePath } from '../../compiler/discovery/findCssModulePath.ts'

const tmpRoot = path.join(
  os.tmpdir(),
  'find-css-module-tests',
)

function createCssModule(relativePath: string) {
  const fullPath = path.join(tmpRoot, relativePath)

  fs.mkdirSync(path.dirname(fullPath), {
    recursive: true,
  })

  fs.writeFileSync(fullPath, '')

  return fullPath
}

afterEach(() => {
  fs.rmSync(tmpRoot, {
    recursive: true,
    force: true,
  })
})

describe('[COMPILER]', () => {
  describe('findCssModulePath', () => {
    it('finds a matching css module', () => {
      const file = createCssModule('Button.module.css')

      expect(
        findCssModulePath(tmpRoot, '/tokens/button')
      ).toBe(file)
    })

    it('matches css modules case insensitively', () => {
      const file = createCssModule('BuTtOn.module.css')

      expect(
        findCssModulePath(tmpRoot, '/tokens/button')
      ).toBe(file)
    })

    it('searches nested directories', () => {
      const file = createCssModule(
        'components/buttons/Button.module.css'
      )

      expect(
        findCssModulePath(tmpRoot, '/tokens/button')
      ).toBe(file)
    })

    it('returns undefined when no matching css module exists', () => {
      createCssModule('Surface.module.css')

      expect(
        findCssModulePath(tmpRoot, '/tokens/button')
      ).toBeUndefined()
    })
  })
})