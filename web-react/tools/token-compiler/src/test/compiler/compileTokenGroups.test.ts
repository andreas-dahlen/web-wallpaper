
import { describe, expect, it, vi } from 'vitest'

import { compileTokenGroups } from '../../compiler/pipeline/compileTokenGroups.ts'
import { createModuleMap } from '../../compiler/discovery/createModuleMap.ts'
import { processToken } from '../../compiler/processing/processToken.ts'

import {
  createCompilerToken,
} from '../compiler.factory.ts'

import type { Issue } from '../../types/issueCollector.types.ts'

vi.mock(
  '../../../compiler/discovery/createModuleMap',
  () => ({
    createModuleMap: vi.fn(),
  })
)

vi.mock(
  '../../../compiler/processing/processToken',
  () => ({
    processToken: vi.fn(),
  })
)

describe('[COMPILER]', () => {
  const rootPath = '/project'

  describe('compileTokenGroups', () => {
    it('returns no groups or issues for an empty token list', () => {
      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      const result = compileTokenGroups(rootPath, [])

      expect(result).toEqual({
        groups: [],
        issues: [],
      })
    })

    it('creates one group for each unique group path', () => {
      const firstPath = '/tokens/button/default.jsonc'
      const secondPath = '/tokens/button/hover.jsonc'
      const sliderPath = '/tokens/slider/default.jsonc'

      vi.mocked(createModuleMap).mockReturnValue(
        new Map([
          ['/tokens/button', '/css/Button.module.css'],
          ['/tokens/slider', '/css/Slider.module.css'],
        ])
      )

      vi.mocked(processToken)
        .mockReturnValueOnce({
          token: createCompilerToken({
            tokenPath: firstPath,
            infix: 'default',
          }),
          issues: [],
        })
        .mockReturnValueOnce({
          token: createCompilerToken({
            tokenPath: secondPath,
            infix: 'hover',
          }),
          issues: [],
        })
        .mockReturnValueOnce({
          token: createCompilerToken({
            tokenPath: sliderPath,
            infix: 'default',
          }),
          issues: [],
        })

      const result = compileTokenGroups(rootPath, [
        firstPath,
        secondPath,
        sliderPath,
      ])

      expect(result.groups).toHaveLength(2)

      expect(result.groups).toEqual([
        expect.objectContaining({
          groupPath: '/tokens/button',
          cssPath: '/css/Button.module.css',
        }),
        expect.objectContaining({
          groupPath: '/tokens/slider',
          cssPath: '/css/Slider.module.css',
        }),
      ])
    })

    it('creates a group without a css path when none is mapped', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      const token = createCompilerToken({
        tokenPath,
      })

      vi.mocked(processToken).mockReturnValue({
        token,
        issues: [],
      })

      const result = compileTokenGroups(rootPath, [
        tokenPath,
      ])

      expect(result.groups).toEqual([
        expect.objectContaining({
          groupPath: '/tokens/button',
          cssPath: undefined,
          tokens: [token],
        }),
      ])
    })

    it('passes all unique group paths to createModuleMap', () => {
      const buttonDefault = '/tokens/button/default.jsonc'
      const buttonHover = '/tokens/button/hover.jsonc'
      const sliderDefault = '/tokens/slider/default.jsonc'

      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      vi.mocked(processToken).mockReturnValue({
        token: createCompilerToken(),
        issues: [],
      })

      compileTokenGroups(rootPath, [
        buttonDefault,
        buttonHover,
        sliderDefault,
      ])

      expect(createModuleMap).toHaveBeenCalledWith(
        rootPath,
        [
          '/tokens/button',
          '/tokens/slider',
        ],
      )
    })

    it('processes every token path', () => {
      const paths = [
        '/tokens/button/default.jsonc',
        '/tokens/button/hover.jsonc',
      ]

      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      vi.mocked(processToken).mockReturnValue({
        token: createCompilerToken(),
        issues: [],
      })

      compileTokenGroups(rootPath, paths)

      expect(processToken).toHaveBeenCalledTimes(2)
      expect(processToken).toHaveBeenNthCalledWith(
        1,
        paths[0]
      )
      expect(processToken).toHaveBeenNthCalledWith(
        2,
        paths[1]
      )
    })

    it('attaches each processed token to its group', () => {
      const buttonPath = '/tokens/button/default.jsonc'
      const sliderPath = '/tokens/slider/default.jsonc'

      const buttonToken = createCompilerToken({
        tokenPath: buttonPath,
        infix: 'button',
      })

      const sliderToken = createCompilerToken({
        tokenPath: sliderPath,
        infix: 'slider',
      })

      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      vi.mocked(processToken)
        .mockReturnValueOnce({
          token: buttonToken,
          issues: [],
        })
        .mockReturnValueOnce({
          token: sliderToken,
          issues: [],
        })

      const result = compileTokenGroups(rootPath, [
        buttonPath,
        sliderPath,
      ])

      expect(result.groups).toEqual([
        expect.objectContaining({
          groupPath: '/tokens/button',
          tokens: [buttonToken],
        }),
        expect.objectContaining({
          groupPath: '/tokens/slider',
          tokens: [sliderToken],
        }),
      ])
    })

    it('does not attach a token when processing produces no token', () => {
      const tokenPath = '/tokens/button/default.jsonc'

      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      vi.mocked(processToken).mockReturnValue({
        token: undefined,
        issues: [],
      })

      const result = compileTokenGroups(rootPath, [tokenPath])

      expect(result.groups).toEqual([
        expect.objectContaining({
          groupPath: '/tokens/button',
          tokens: [],
        }),
      ])
    })

    it('aggregates issues from every processed token', () => {
      const firstPath = '/tokens/button/default.jsonc'
      const secondPath = '/tokens/button/hover.jsonc'

      const firstToken = createCompilerToken({
        tokenPath: firstPath,
        infix: 'first',
      })

      const secondToken = createCompilerToken({
        tokenPath: secondPath,
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

      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      vi.mocked(processToken)
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

      const result = compileTokenGroups(rootPath, [
        firstPath,
        secondPath,
      ])

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

    it('preserves token order within a group', () => {
      const paths = [
        '/tokens/button/default.jsonc',
        '/tokens/button/hover.jsonc',
        '/tokens/button/active.jsonc',
      ]

      const tokens = paths.map((tokenPath, index) =>
        createCompilerToken({
          tokenPath,
          infix: `state-${index}`,
        })
      )

      vi.mocked(createModuleMap).mockReturnValue(
        new Map()
      )

      vi.mocked(processToken)
        .mockReturnValueOnce({
          token: tokens[0],
          issues: [],
        })
        .mockReturnValueOnce({
          token: tokens[1],
          issues: [],
        })
        .mockReturnValueOnce({
          token: tokens[2],
          issues: [],
        })

      const result = compileTokenGroups(rootPath, paths)

      expect(result.groups[0].tokens).toEqual(tokens)
    })
  })
})