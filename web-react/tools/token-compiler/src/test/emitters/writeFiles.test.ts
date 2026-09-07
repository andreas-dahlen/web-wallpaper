import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { writeFiles } from '../../emitters/write/writeFiles.ts'

describe('[EMITTER]', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'style-tokens-write-'),
    )
  })

  afterEach(() => {
    fs.rmSync(tempDir, {
      recursive: true,
      force: true,
    })
  })

  describe('writeFiles', () => {
    it('writes a new file', () => {
      const filePath = path.join(
        tempDir,
        'button.ts',
      )

      const result = writeFiles([
        {
          outputFile: filePath,
          content: 'export const button = {}',
        },
      ])

      expect(result).toEqual({
        updated: [filePath],
        skipped: [],
      })

      expect(fs.readFileSync(filePath, 'utf8')).toBe(
        'export const button = {}',
      )
    })

    it('creates missing parent directories', () => {
      const filePath = path.join(
        tempDir,
        'generated',
        'tokens',
        'button.ts',
      )

      const result = writeFiles([
        {
          outputFile: filePath,
          content: 'generated',
        },
      ])

      expect(result).toEqual({
        updated: [filePath],
        skipped: [],
      })

      expect(fs.readFileSync(filePath, 'utf8')).toBe(
        'generated',
      )
    })

    it('skips an existing file with identical content', () => {
      const filePath = path.join(
        tempDir,
        'button.ts',
      )

      const content = 'export const button = {}'

      fs.writeFileSync(filePath, content)

      const result = writeFiles([
        {
          outputFile: filePath,
          content,
        },
      ])

      expect(result).toEqual({
        updated: [],
        skipped: [filePath],
      })

      expect(fs.readFileSync(filePath, 'utf8')).toBe(content)
    })

    it('updates an existing file when content differs', () => {
      const filePath = path.join(
        tempDir,
        'button.ts',
      )

      fs.writeFileSync(
        filePath,
        'export const button = "old"',
      )

      const result = writeFiles([
        {
          outputFile: filePath,
          content: 'export const button = "new"',
        },
      ])

      expect(result).toEqual({
        updated: [filePath],
        skipped: [],
      })

      expect(fs.readFileSync(filePath, 'utf8')).toBe(
        'export const button = "new"',
      )
    })

    it('processes multiple files independently', () => {
      const newPath = path.join(
        tempDir,
        'new.ts',
      )

      const skippedPath = path.join(
        tempDir,
        'skipped.ts',
      )

      const updatedPath = path.join(
        tempDir,
        'updated.ts',
      )

      fs.writeFileSync(
        skippedPath,
        'same',
      )

      fs.writeFileSync(
        updatedPath,
        'old',
      )

      const result = writeFiles([
        {
          outputFile: newPath,
          content: 'new',
        },
        {
          outputFile: skippedPath,
          content: 'same',
        },
        {
          outputFile: updatedPath,
          content: 'new',
        },
      ])

      expect(result).toEqual({
        updated: [
          newPath,
          updatedPath,
        ],
        skipped: [
          skippedPath,
        ],
      })

      expect(fs.readFileSync(newPath, 'utf8')).toBe('new')
      expect(fs.readFileSync(skippedPath, 'utf8')).toBe('same')
      expect(fs.readFileSync(updatedPath, 'utf8')).toBe('new')
    })
  })
})