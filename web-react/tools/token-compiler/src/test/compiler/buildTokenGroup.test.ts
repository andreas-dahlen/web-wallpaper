import { describe, expect, it } from 'vitest'

import { buildTokenGroup } from '../../compiler/builders/buildTokenGroup.ts'
import {
  createCompilerToken,
} from '../compiler.factory.ts'

describe('[COMPILER]', () => {
  describe('buildTokenGroup', () => {
    it('builds a token group', () => {
      const token = createCompilerToken()

      const result = buildTokenGroup(
        '/tokens/button',
        [token],
      )

      expect(result).toEqual({
        groupPath: '/tokens/button',
        cssPath: undefined,
        tokens: [token],
      })
    })

    it('includes the css path when provided', () => {
      const token = createCompilerToken()

      const result = buildTokenGroup(
        '/tokens/button',
        [token],
        '/css/Button.module.css',
      )

      expect(result).toEqual({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
        tokens: [token],
      })
    })

    it('accepts an empty token list', () => {
      const result = buildTokenGroup(
        '/tokens/button',
        [],
      )

      expect(result).toEqual({
        groupPath: '/tokens/button',
        cssPath: undefined,
        tokens: [],
      })
    })
  })
})