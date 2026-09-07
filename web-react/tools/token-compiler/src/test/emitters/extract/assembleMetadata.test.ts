import { describe, expect, it } from 'vitest'

import { assembleMetadata } from '../../../emitters/extract/assemblers/assembleMetadata.ts'
import type {
  CompilerToken,
  CssTokenGroup,
} from '../../../types/compiler.types.ts'

const outPath = '/generated'

function createToken(
  overrides: Partial<CompilerToken> = {},
): CompilerToken {
  return {
    name: 'button',
    infix: 'button',
    tokenPath: '/tokens/button/default.jsonc',
    vars: [],
    ...overrides,
  }
}

function createGroup(
  overrides: Partial<CssTokenGroup> = {},
): CssTokenGroup {
  return {
    groupPath: '/tokens/button',
    cssPath: '/components/Button/Button.module.css',
    tokens: [
      createToken(),
      createToken({
        name: 'hover',
        infix: 'button_hover',
        tokenPath: '/tokens/button/hover.jsonc',
      }),
    ],
    ...overrides,
  }
}

describe('[EMITTER]', () => {
  describe('assembleMetadata', () => {
    it('assembles metadata from a token group', () => {
      const group = createGroup()

      expect(assembleMetadata(group, outPath)).toEqual({
        name: 'button',
        groupPath: '/tokens/button',
        tokenFiles: [
          '/tokens/button/default.jsonc',
          '/tokens/button/hover.jsonc',
        ],
        cssFile: '/components/Button/Button.module.css',
        outputFile: '/generated/metadata/metadata.generated.jsonc',
      })
    })

    it('extracts the group name from the group path', () => {
      const group = createGroup({
        groupPath: '/styleTokens/components/button',
      })

      expect(
        assembleMetadata(group, outPath).name,
      ).toBe('button')
    })

    it('collects token paths without modifying the group', () => {
      const group = createGroup()
      const originalTokens = [...group.tokens]

      const result = assembleMetadata(group, outPath)

      expect(result.tokenFiles).toEqual(
        originalTokens.map(token => token.tokenPath),
      )

      expect(group.tokens).toEqual(originalTokens)
    })

    it('creates the metadata output path', () => {
      const result = assembleMetadata(
        createGroup(),
        outPath,
      )

      expect(result.outputFile).toBe(
        '/generated/metadata/metadata.generated.jsonc',
      )
    })
  })
})