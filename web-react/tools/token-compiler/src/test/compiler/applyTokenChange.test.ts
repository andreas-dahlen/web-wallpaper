import { describe, expect, it, vi } from 'vitest'

import { applyTokenChange } from '../../compiler/pipeline/applyTokenChange.ts'
import { createTokenCache } from '../../compiler/tracking/tokenCache.ts'

import * as processTokenModule from '../../compiler/processing/processToken.ts'
import * as findCssModulePathModule from '../../compiler/discovery/findCssModulePath.ts'
import * as findTokenPathsModule from '../../compiler/discovery/findTokenPaths.ts'

import {
  createCompilerToken,
  createCssTokenGroup,
} from '../compiler.factory.ts'

import type { CompilerConfig } from '../../types/run.types.ts'
import type { Issue } from '../../types/issueCollector.types.ts'

const config: CompilerConfig = {
  rootDir: '/project',
  tokenPath: '/project/tokens',
  outPath: '/project/output',


  outputs: {
    extension: false,
    lsp: false,
    meta: false,
    pathPatches: false,
    presets: false,
    tokens: false,
    schema: false
  },
  logging: {
    trace: false,
    emissions: "summary"
  }
}

describe('[COMPILER]', () => {
  describe('applyTokenChange', () => {
    it('creates and caches a group for a new token', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      const token = createCompilerToken({
        tokenPath,
      })

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue('/css/Button.module.css')

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([tokenPath])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValue({
          token,
          issues: [],
        })

      const cache = createTokenCache([], config)

      const result = applyTokenChange({
        tokenPath,
        cache,
      })

      expect(result).toEqual({
        group: {
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
          tokens: [token],
        },
        issues: [],
      })

      expect(cache.getGroupByTokenPath(tokenPath))
        .toBe(result.group)
    })

    it('resolves the group path from a new token path', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue(undefined)

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([tokenPath])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValue({
          token: createCompilerToken({ tokenPath }),
          issues: [],
        })

      const cache = createTokenCache([], config)

      const result = applyTokenChange({
        tokenPath,
        cache,
      })

      expect(result.group.groupPath)
        .toBe('/tokens/button')
    })

    it('uses the existing group path when the token already exists', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      const staleGroup = createCssTokenGroup({
        groupPath: '/tokens/old-button',
        tokens: [
          createCompilerToken({ tokenPath }),
        ],
      })

      const token = createCompilerToken({
        tokenPath,
      })

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue('/css/OldButton.module.css')

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([tokenPath])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValue({
          token,
          issues: [],
        })

      const cache = createTokenCache([staleGroup], config)

      const result = applyTokenChange({
        tokenPath,
        cache,
      })

      expect(result.group.groupPath)
        .toBe('/tokens/old-button')

      expect(result.group.cssPath)
        .toBe('/css/OldButton.module.css')
    })

    it('uses the cache root directory when resolving the css path', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      const findCssModulePath = vi.spyOn(
        findCssModulePathModule,
        'findCssModulePath',
      ).mockReturnValue(undefined)

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([tokenPath])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValue({
          token: createCompilerToken({ tokenPath }),
          issues: [],
        })

      const cache = createTokenCache([], config)

      applyTokenChange({
        tokenPath,
        cache,
      })

      expect(findCssModulePath)
        .toHaveBeenCalledWith(
          config.rootDir,
          '/tokens/button',
        )
    })

    it('removes the stale group from the cache', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      const staleGroup = createCssTokenGroup({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
        tokens: [
          createCompilerToken({ tokenPath }),
        ],
      })

      const token = createCompilerToken({
        tokenPath,
      })

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue('/css/Button.module.css')

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([tokenPath])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValue({
          token,
          issues: [],
        })

      const cache = createTokenCache([staleGroup], config)

      const result = applyTokenChange({
        tokenPath,
        cache,
      })

      expect(cache.getGroupByTokenPath(tokenPath))
        .toBe(result.group)

      expect(cache.getGroupByCssPath(staleGroup.cssPath!))
        .toBe(result.group)
    })

    it('processes every token in the group', () => {
      const changedTokenPath = '/tokens/button/default.jsonc'
      const secondTokenPath = '/tokens/button/hover.jsonc'

      const firstToken = createCompilerToken({
        tokenPath: changedTokenPath,
        infix: 'first',
      })

      const secondToken = createCompilerToken({
        tokenPath: secondTokenPath,
        infix: 'second',
      })

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue(undefined)

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([
          changedTokenPath,
          secondTokenPath,
        ])

      const processToken = vi.spyOn(
        processTokenModule,
        'processToken',
      )

      processToken
        .mockReturnValueOnce({
          token: firstToken,
          issues: [],
        })
        .mockReturnValueOnce({
          token: secondToken,
          issues: [],
        })

      const cache = createTokenCache([], config)

      applyTokenChange({
        tokenPath: changedTokenPath,
        cache,
      })

      expect(processToken)
        .toHaveBeenCalledTimes(2)

      expect(processToken)
        .toHaveBeenNthCalledWith(1, changedTokenPath)

      expect(processToken)
        .toHaveBeenNthCalledWith(2, secondTokenPath)
    })

    it('includes all processed tokens in the rebuilt group', () => {
      const firstToken = createCompilerToken({
        tokenPath: '/tokens/button/default.jsonc',
        infix: 'first',
      })

      const secondToken = createCompilerToken({
        tokenPath: '/tokens/button/hover.jsonc',
        infix: 'second',
      })

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue(undefined)

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([
          firstToken.tokenPath,
          secondToken.tokenPath,
        ])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValueOnce({
          token: firstToken,
          issues: [],
        })
        .mockReturnValueOnce({
          token: secondToken,
          issues: [],
        })

      const cache = createTokenCache([], config)

      const result = applyTokenChange({
        tokenPath: firstToken.tokenPath,
        cache,
      })

      expect(result.group.tokens).toEqual([
        firstToken,
        secondToken,
      ])
    })

    it('aggregates issues from all processed tokens', () => {
      const firstToken = createCompilerToken({
        tokenPath: '/tokens/button/default.jsonc',
        infix: 'first',
      })

      const secondToken = createCompilerToken({
        tokenPath: '/tokens/button/hover.jsonc',
        infix: 'second',
      })

      const firstIssue = {
        path: '--s-button-color',
        value: 'red',
        reason: 'invalid declaration',
      } satisfies Issue

      const secondIssue = {
        path: '--s-button-size',
        value: '10px',
        reason: 'unused declaration',
      } satisfies Issue

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue(undefined)

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([
          firstToken.tokenPath,
          secondToken.tokenPath,
        ])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValueOnce({
          token: firstToken,
          issues: [
            {
              subject: 'test',
              issues: [firstIssue],
            },
          ],
        })
        .mockReturnValueOnce({
          token: secondToken,
          issues: [
            {
              subject: 'test',
              issues: [secondIssue],
            },
          ],
        })

      const cache = createTokenCache([], config)

      const result = applyTokenChange({
        tokenPath: firstToken.tokenPath,
        cache,
      })

      expect(result.issues).toEqual([
        {
          subject: 'test',
          issues: [firstIssue],
        },
        {
          subject: 'test',
          issues: [secondIssue],
        },
      ])
    })

    it('adds the rebuilt group to the cache', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      const token = createCompilerToken({
        tokenPath,
      })

      vi.spyOn(findCssModulePathModule, 'findCssModulePath')
        .mockReturnValue(undefined)

      vi.spyOn(findTokenPathsModule, 'findTokenPaths')
        .mockReturnValue([tokenPath])

      vi.spyOn(processTokenModule, 'processToken')
        .mockReturnValue({
          token,
          issues: [],
        })

      const cache = createTokenCache([], config)

      const result = applyTokenChange({
        tokenPath,
        cache,
      })

      expect(cache.getGroupByTokenPath(tokenPath))
        .toBe(result.group)
    })
  })
})