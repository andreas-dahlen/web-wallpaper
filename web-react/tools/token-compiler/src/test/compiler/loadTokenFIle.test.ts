import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadTokenFile } from '../../compiler/loaders/loadTokenFile.ts'

function createTempDir() {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), 'token-load-test-'),
  )
}

function createFile(
  filePath: string,
  content: string,
) {
  fs.mkdirSync(
    path.dirname(filePath),
    { recursive: true },
  )

  fs.writeFileSync(
    filePath,
    content,
  )
}

describe('[COMPILER]', () => {
  describe('loadTokenFile', () => {
    it('loads and validates a token file', () => {
      const dir = createTempDir()
      const filePath = path.join(
        dir,
        'button.jsonc',
      )

      createFile(
        filePath,
        `{
          "component": "button",
          "vars": {
            "background": {
              "values": {
                "f": "black"
              }
            }
          }
        }`,
      )

      const result = loadTokenFile(filePath)

      expect(result).toEqual({
        component: 'button',
        vars: {
          background: {
            values: {
              f: 'black',
            },
          },
        },
      })
    })

    it('supports JSONC comments', () => {
      const dir = createTempDir()
      const filePath = path.join(
        dir,
        'button.jsonc',
      )

      createFile(
        filePath,
        `{
          // Button component
          "component": "button",
          "vars": {
            // Button background
            "background": {
              "values": {
                // Fallback value
                "f": "black"
              }
            }
          }
        }`,
      )

      expect(loadTokenFile(filePath)).toEqual({
        component: 'button',
        vars: {
          background: {
            values: {
              f: 'black',
            },
          },
        },
      })
    })

    it('throws when the file contains invalid JSON', () => {
      const dir = createTempDir()
      const filePath = path.join(
        dir,
        'broken.jsonc',
      )

      createFile(
        filePath,
        `{
          "component": "button",
          "vars": {
            "background": {
              "values": {
                "f": "black"
              }
            }
        `,
      )

      expect(() =>
        loadTokenFile(filePath),
      ).toThrow(/Invalid JSON/)
    })
  })
})