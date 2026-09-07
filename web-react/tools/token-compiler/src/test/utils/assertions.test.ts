import { describe, expect, it } from 'vitest'

import { assert } from '../../utils/assertions.ts'
import type {
  CssDataTokenGroup,
  TokenGroup,
} from '../../types/compiler.types.ts'
import type { CompilerConfig } from '../../types/run.types.ts'

describe('[COMPILER]', () => {
  describe('assert.cssVariable', () => {
    it.each([
      '--button-background',
      '--foo',
      '--_private',
      '--foo_123-bar',
    ])('accepts valid CSS variable %s', value => {
      expect(() =>
        assert.cssVariable(value),
      ).not.toThrow()
    })

    it.each([
      'button-background',
      '-button-background',
      '--',
      '--1button',
      '--foo!',
      '--foo bar',
    ])('rejects invalid CSS variable %s', value => {
      expect(() =>
        assert.cssVariable(value),
      ).toThrow('is not a CSS custom property')
    })
  })

  describe('assert.hasCssPath', () => {
    it('accepts groups with cssPath', () => {
      const group = {
        groupPath: '/tokens/button',
        cssPath: '/css/Button.module.css',
        tokens: [],
      }

      expect(() =>
        assert.hasCssPath(group),
      ).not.toThrow()
    })

    it('rejects undefined groups', () => {
      expect(() =>
        assert.hasCssPath(undefined),
      ).toThrow('has no cssPath')
    })

    it('rejects groups without cssPath', () => {
      const group = {
        groupPath: '/tokens/button',
        tokens: [],
      } as TokenGroup

      expect(() =>
        assert.hasCssPath(group),
      ).toThrow('has no cssPath')
    })
  })

  describe('assert.hasOutPath', () => {
    it('accepts config with outPath', () => {
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
          tokens: false
        },
        logging: {
          trace: false,
          emissions: "summary"
        }
      }

      expect(() =>
        assert.hasOutPath(config),
      ).not.toThrow()
    })

    it('rejects config without outPath', () => {
      const config: CompilerConfig = {
        rootDir: '/project',
        tokenPath: '/project/tokens',
        outPath: null,


        outputs: {
          extension: false,
          lsp: false,
          meta: false,
          pathPatches: false,
          presets: false,
          tokens: false
        },
        logging: {
          trace: false,
          emissions: "summary"
        }
      }

      expect(() =>
        assert.hasOutPath(config),
      ).toThrow('Expected compiler config to have an outPath')
    })
  })

  describe('assert.groupsHaveCssPath', () => {
    it('accepts groups with cssPath', () => {
      const groups = [
        {
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
          tokens: [],
        },
        {
          groupPath: '/tokens/input',
          cssPath: '/css/Input.module.css',
          tokens: [],
        },
      ] as TokenGroup[]

      expect(() =>
        assert.groupsHaveCssPath(groups),
      ).not.toThrow()
    })

    it('rejects a group without cssPath', () => {
      const groups = [
        {
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
          tokens: [],
        },
        {
          groupPath: '/tokens/input',
          tokens: [],
        },
      ] as TokenGroup[]

      expect(() =>
        assert.groupsHaveCssPath(groups),
      ).toThrow('Token group "/tokens/input" has no cssPath')
    })

    it('returns without error for an empty group list', () => {
      expect(() =>
        assert.groupsHaveCssPath([]),
      ).not.toThrow()
    })
  })

  describe('assert.groupsHaveCssData', () => {
    it('accepts groups with cssData', () => {
      const groups = [
        {
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
          tokens: [],
          cssData: {},
        },
        {
          groupPath: '/tokens/input',
          cssPath: '/css/Input.module.css',
          tokens: [],
          cssData: {},
        },
      ] as unknown as CssDataTokenGroup[]

      expect(() =>
        assert.groupsHaveCssData(groups),
      ).not.toThrow()
    })

    it('rejects a group without cssData', () => {
      const groups = [
        {
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
          tokens: [],
          cssData: {},
        },
        {
          groupPath: '/tokens/input',
          cssPath: '/css/Input.module.css',
          tokens: [],
        },
      ] as unknown as CssDataTokenGroup[]

      expect(() =>
        assert.groupsHaveCssData(groups),
      ).toThrow(
        'A token in tokenGroups "/tokens/input" has no cssData',
      )
    })

    it('returns without error for an empty group list', () => {
      expect(() =>
        assert.groupsHaveCssData([]),
      ).not.toThrow()
    })
  })
})