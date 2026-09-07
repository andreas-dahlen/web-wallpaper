import { describe, expect, it } from 'vitest'

import { createTokenCache } from '../../../compiler/tracking/tokenCache.ts'
import {
  createCompilerToken,
  createCssTokenGroup,
  createTokenGroup,
} from '../../compiler.factory.ts'
import type { CompilerConfig } from '../../../types/run.types.ts'

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
  describe('createTokenCache', () => {
    it('starts empty when no groups are provided', () => {
      const cache = createTokenCache([], config)

      expect(cache.getCssPaths()).toEqual([])
      expect(cache.getMissingCssGroupPaths()).toEqual([])
      expect(cache.getAllPostData()).toEqual([])
      expect(cache.getCssDataGroups()).toEqual([])
    })

    it('initializes with the provided groups', () => {
      const button = createCssTokenGroup({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
      })
      const surface = createCssTokenGroup({
        groupPath: '/tokens/surface',
        cssPath: '/css/Surface.module.css',
      })

      const cache = createTokenCache([button, surface], config)

      expect(cache.getCssPaths()).toEqual([
        '/css/Button.module.css',
        '/css/Surface.module.css',
      ])
    })

    it('indexes a group by every token path', () => {
      const tokenA = createCompilerToken({
        tokenPath: '/tokens/button/color',
      })
      const tokenB = createCompilerToken({
        tokenPath: '/tokens/button/size',
      })
      const group = createTokenGroup({
        groupPath: '/tokens/button',
        tokens: [tokenA, tokenB],
      })

      const cache = createTokenCache([group], config)

      expect(cache.getGroupByTokenPath(tokenA.tokenPath)).toBe(group)
      expect(cache.getGroupByTokenPath(tokenB.tokenPath)).toBe(group)
    })

    it('returns undefined for unknown token paths', () => {
      const cache = createTokenCache([], config)

      expect(cache.getGroupByTokenPath('/tokens/unknown')).toBeUndefined()
    })

    it('indexes groups by css path', () => {
      const group = createCssTokenGroup({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
      })

      const cache = createTokenCache([group], config)

      expect(cache.getGroupByCssPath('/css/Button.module.css')).toBe(group)
    })

    it('returns undefined for unknown css paths', () => {
      const cache = createTokenCache([], config)

      expect(cache.getGroupByCssPath('/css/unknown.css')).toBeUndefined()
    })

    it('does not index groups without a css path', () => {
      const group = createTokenGroup({
        groupPath: '/tokens/button',
      })

      const cache = createTokenCache([group], config)

      expect(cache.getCssPaths()).toEqual([])
      expect(cache.getGroupByCssPath('/css/Button.module.css')).toBeUndefined()
    })

    it('returns all css paths', () => {
      const button = createCssTokenGroup({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
      })
      const surface = createCssTokenGroup({
        groupPath: '/tokens/surface',
        cssPath: '/css/Surface.module.css',
      })
      const missing = createTokenGroup({
        groupPath: '/tokens/missing',
      })

      const cache = createTokenCache([button, surface, missing], config)

      expect(cache.getCssPaths()).toEqual([
        '/css/Button.module.css',
        '/css/Surface.module.css',
      ])
    })

    it('returns group paths for groups without css files', () => {
      const button = createTokenGroup({
        groupPath: '/tokens/button',
      })
      const surface = createTokenGroup({
        groupPath: '/tokens/surface',
      })
      const missing = createTokenGroup({
        groupPath: '/tokens/missing',
      })

      const cache = createTokenCache([missing, surface, button], config)

      expect(cache.getMissingCssGroupPaths()).toEqual([
        '/tokens/missing',
        '/tokens/surface',
        '/tokens/button',
      ])
    })

    it('adds a group to the indexes', () => {
      const token = createCompilerToken({
        tokenPath: '/tokens/button/color',
      })
      const group = createCssTokenGroup({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
        tokens: [token],
      })

      const cache = createTokenCache([], config)

      cache.addGroup(group)

      expect(cache.getGroupByTokenPath(token.tokenPath)).toBe(group)
      expect(cache.getGroupByCssPath(group.cssPath)).toBe(group)
      expect(cache.getCssPaths()).toEqual([group.cssPath])
    })

    it('adds a group without a css path to the token index', () => {
      const token = createCompilerToken({
        tokenPath: '/tokens/button/color',
      })
      const group = createTokenGroup({
        groupPath: '/tokens/button',
        tokens: [token],
      })

      const cache = createTokenCache([], config)

      cache.addGroup(group)

      expect(cache.getGroupByTokenPath(token.tokenPath)).toBe(group)
      expect(cache.getCssPaths()).toEqual([])
      expect(cache.getMissingCssGroupPaths()).toEqual([group.groupPath])
    })

    it('removes a group from all indexes', () => {
      const token = createCompilerToken({
        tokenPath: '/tokens/button/color',
      })
      const group = createCssTokenGroup({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
        tokens: [token],
      })

      const cache = createTokenCache([group], config)

      cache.removeGroup(group)

      expect(cache.getGroupByTokenPath(token.tokenPath)).toBeUndefined()
      expect(cache.getGroupByCssPath(group.cssPath)).toBeUndefined()
      expect(cache.getCssPaths()).toEqual([])
    })

    it('can add a group after removing it', () => {
      const group = createCssTokenGroup({
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
      })

      const cache = createTokenCache([group], config)

      cache.removeGroup(group)
      cache.addGroup(group)

      expect(cache.getGroupByCssPath(group.cssPath)).toBe(group)
      expect(cache.getCssPaths()).toEqual([group.cssPath])
    })

    describe('config', () => {
      it('returns the provided compiler config', () => {
        const cache = createTokenCache([], config)

        expect(cache.getConfig()).toBe(config)
      })

      it('returns the config when an output path exists', () => {
        const cache = createTokenCache([], config)

        expect(cache.getEmitConfig()).toBe(config)
      })

      it('throws when requesting emit config without an output path', () => {
        const noOutputConfig: CompilerConfig = {
          ...config,
          outPath: null,
        }
        const cache = createTokenCache([], noOutputConfig)

        expect(() => cache.getEmitConfig()).toThrow()
      })
    })

    describe('CSS data', () => {
      it('attaches css data to the matching group', () => {
        const group = createCssTokenGroup({
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
        })
        const cache = createTokenCache([group], config)
        const cssData = {
          cssPath: group.cssPath,
        } as Parameters<typeof cache.addCssData>[0]

        cache.addCssData(cssData)

        expect(group.cssData).toBe(cssData)
      })

      it('ignores css data for an unknown css path', () => {
        const group = createCssTokenGroup({
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
        })
        const cache = createTokenCache([group], config)
        const cssData = {
          cssPath: '/css/unknown.css',
        } as Parameters<typeof cache.addCssData>[0]

        cache.addCssData(cssData)

        expect(group.cssData).toBeUndefined()
      })

      it('returns groups with css data', () => {
        const button = createCssTokenGroup({
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
        })
        const surface = createCssTokenGroup({
          groupPath: '/tokens/surface',
          cssPath: '/css/Surface.module.css',
        })
        const cache = createTokenCache([button, surface], config)

        const buttonData = {
          cssPath: button.cssPath,
        } as Parameters<typeof cache.addCssData>[0]
        const surfaceData = {
          cssPath: surface.cssPath,
        } as Parameters<typeof cache.addCssData>[0]

        cache.addCssData(buttonData)
        cache.addCssData(surfaceData)

        expect(cache.getCssDataGroups()).toEqual([button, surface])
      })

      it('throws when a css group has no css data', () => {
        const group = createCssTokenGroup({
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
        })
        const cache = createTokenCache([group], config)

        expect(() => cache.getCssDataGroups()).toThrow()
      })

      it('returns css data groups filtered by paths', () => {
        const button = createCssTokenGroup({
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
        })
        const surface = createCssTokenGroup({
          groupPath: '/tokens/surface',
          cssPath: '/css/Surface.module.css',
        })
        const cache = createTokenCache([button, surface], config)

        cache.addCssData({
          cssPath: button.cssPath,
        } as Parameters<typeof cache.addCssData>[0])
        cache.addCssData({
          cssPath: surface.cssPath,
        } as Parameters<typeof cache.addCssData>[0])

        expect(
          cache.getCssDataGroupsByPaths(['/css/Surface.module.css'])
        ).toEqual([surface])
      })

      it('returns no css data groups for unmatched paths', () => {
        const button = createCssTokenGroup({
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
        })
        const cache = createTokenCache([button], config)

        cache.addCssData({
          cssPath: button.cssPath,
        } as Parameters<typeof cache.addCssData>[0])

        expect(
          cache.getCssDataGroupsByPaths(['/css/unknown.css'])
        ).toEqual([])
      })
    })

    describe('PostCSS data', () => {
      it('stores post data by css path', () => {
        const cache = createTokenCache([], config)
        const data = {
          cssPath: '/css/Button.module.css',
        } as Parameters<typeof cache.addPostData>[0]

        cache.addPostData(data)

        expect(cache.getAllPostData()).toEqual([data])
      })

      it('stores post data for multiple css paths', () => {
        const cache = createTokenCache([], config)
        const button = {
          cssPath: '/css/Button.module.css',
        } as Parameters<typeof cache.addPostData>[0]
        const surface = {
          cssPath: '/css/Surface.module.css',
        } as Parameters<typeof cache.addPostData>[0]

        cache.addPostData(button)
        cache.addPostData(surface)

        expect(cache.getAllPostData()).toEqual([button, surface])
      })

      it('replaces post data for the same css path', () => {
        const cache = createTokenCache([], config)
        const first = {
          cssPath: '/css/Button.module.css',
        } as Parameters<typeof cache.addPostData>[0]
        const second = {
          cssPath: '/css/Button.module.css',
        } as Parameters<typeof cache.addPostData>[0]

        cache.addPostData(first)
        cache.addPostData(second)

        expect(cache.getAllPostData()).toEqual([second])
      })
    })
  })
})