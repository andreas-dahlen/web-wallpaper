import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { patchFiles } from '../../emitters/write/patchFiles.ts'

describe('[EMITTER]', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'style-tokens-patch-'),
    )
  })

  afterEach(() => {
    fs.rmSync(tempDir, {
      recursive: true,
      force: true,
    })
  })

  describe('patchFiles', () => {
    it('skips files that do not exist', () => {
      const filePath = path.join(
        tempDir,
        'missing.css',
      )

      const result = patchFiles([
        {
          outputFile: filePath,
          content: '/* generated */',
        },
      ])

      expect(result).toEqual({
        updated: [],
        skipped: [filePath],
      })
    })

    it('skips files that already contain the patch', () => {
      const filePath = path.join(
        tempDir,
        'button.css',
      )

      const content = `/* generated */
.button {
  color: red;
}`

      fs.writeFileSync(filePath, content)

      const result = patchFiles([
        {
          outputFile: filePath,
          content: '/* generated */',
        },
      ])

      expect(result).toEqual({
        updated: [],
        skipped: [filePath],
      })

      expect(fs.readFileSync(filePath, 'utf8')).toBe(content)
    })

    it('prepends a patch to an existing file', () => {
      const filePath = path.join(
        tempDir,
        'button.css',
      )

      const current = `.button {
  color: red;
}`

      fs.writeFileSync(filePath, current)

      const result = patchFiles([
        {
          outputFile: filePath,
          content: '/* generated */',
        },
      ])

      expect(result).toEqual({
        updated: [filePath],
        skipped: [],
      })

      expect(fs.readFileSync(filePath, 'utf8')).toBe(
        `/* generated */
${current}`,
      )
    })

    it('processes multiple files independently', () => {
      const updatedPath = path.join(
        tempDir,
        'updated.css',
      )

      const skippedPath = path.join(
        tempDir,
        'skipped.css',
      )

      fs.writeFileSync(
        updatedPath,
        '.button {}',
      )

      fs.writeFileSync(
        skippedPath,
        '/* generated */\n.button {}',
      )

      const result = patchFiles([
        {
          outputFile: updatedPath,
          content: '/* generated */',
        },
        {
          outputFile: skippedPath,
          content: '/* generated */',
        },
        {
          outputFile: path.join(tempDir, 'missing.css'),
          content: '/* generated */',
        },
      ])

      expect(result).toEqual({
        updated: [updatedPath],
        skipped: [
          skippedPath,
          path.join(tempDir, 'missing.css'),
        ],
      })
    })
  })
})