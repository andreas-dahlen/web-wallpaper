import { describe, expect, it, vi } from 'vitest'

import { extractData } from '../../../emitters/extract/extractData.ts'
import { assembleMetadata } from '../../../emitters/extract/assemblers/assembleMetadata.ts'
import { assembleTokenData } from '../../../emitters/extract/assemblers/assembleTokenData.ts'
import { assemblePresetData } from '../../../emitters/extract/assemblers/assemblePresetData.ts'
import { assembleLspData } from '../../../emitters/extract/assemblers/assembleLspData.ts'
import { assembleExtensionData } from '../../../emitters/extract/assemblers/assembleExtensionData.ts'
import type { CssVarString } from '../../../oldSharedUtils/oldSharedCompiler.types.ts'

vi.mock(
  '../../../../emitters/extract/assemblers/assembleMetadata.js',
)

vi.mock(
  '../../../../emitters/extract/assemblers/assembleTokenData.js',
)

vi.mock(
  '../../../../emitters/extract/assemblers/assemblePresetData.js',
)

vi.mock(
  '../../../../emitters/extract/assemblers/assembleLspData.js',
)

vi.mock(
  '../../../../emitters/extract/assemblers/assembleExtensionData.js',
)

describe('[EMITTERS]', () => {
  describe('extractData', () => {
    const outPath = '/generated'

    function createCache({
      groups = [],
      postData = [],
    }: {
      groups?: Array<{ groupPath: string }>
      postData?: unknown[]
    } = {}) {
      return {
        getCssDataGroups: vi.fn(() => groups),
        getCssDataGroupsByPaths: vi.fn((paths: string[]) =>
          groups.filter(group =>
            paths.includes(group.groupPath)
          )
        ),
        getAllPostData: vi.fn(() => postData),
        getEmitConfig: vi.fn(() => ({
          outPath,
        })),
      } as never
    }

    function createRun({
      processedPaths = [],
    }: {
      processedPaths?: string[]
    } = {}) {
      return {
        getProcessedPaths: vi.fn(() => processedPaths),
      } as never
    }
    it('returns empty collections when there are no groups', () => {
      const cache = createCache()
      const run = createRun()

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [],
          outputFile: '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile: '/generated/metadata/lsp.generated.ts',
        })

      const result = extractData(cache, run)

      expect(result).toEqual({
        outputData: {
          presetFiles: [],
          tokenFiles: [],
          metadata: [],
          extensionData: {
            variables: [],
            outputFile:
              '/generated/metadata/extension.generated.jsonc',
          },
          lspData: {
            rgbVariables: [],
            tokens: [],
            outputFile:
              '/generated/metadata/lsp.generated.ts',
          },
        },
        extractResult: {
          omittedPresetFiles: [],
        },
      })

      expect(assembleExtensionData)
        .toHaveBeenCalledWith([], [], outPath)

      expect(assembleLspData)
        .toHaveBeenCalledWith([], [], outPath)
    })

    it('assembles token and metadata data from all groups', () => {
      const group = {
        groupPath: '/tokens/button',
        cssPath: '/components/Button/Button.module.css',
        cssData: {},
        tokens: [],
      }

      const tokenData = {
        groupPath: group.groupPath,
        name: 'button',
        tokens: [],
      }

      const metadata = {
        name: 'button',
        groupPath: group.groupPath,
        tokenFiles: [],
        cssFile: group.cssPath,
        outputFile: '/generated/metadata/metadata.generated.jsonc',
      }

      vi.mocked(assembleTokenData)
        .mockReturnValue(tokenData as never)

      vi.mocked(assembleMetadata)
        .mockReturnValue(metadata as never)

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [],
          outputFile:
            '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile:
            '/generated/metadata/lsp.generated.ts',
        })

      const cache = createCache({
        groups: [group],
      })
      const run = createRun()

      const result = extractData(cache, run)

      expect(result.outputData.metadata)
        .toEqual([metadata])

      expect(assembleTokenData)
        .toHaveBeenCalledWith(group, outPath)

      expect(assembleMetadata)
        .toHaveBeenCalledWith(group, outPath)
    })

    it('collects token files only for processed groups', () => {
      const firstGroup = {
        groupPath: '/tokens/button',
        cssPath: '/components/Button/Button.module.css',
        cssData: {},
      }

      const secondGroup = {
        groupPath: '/tokens/input',
        cssPath: '/components/Input/Input.module.css',
        cssData: {},
      }

      const firstTokenData = {
        groupPath: firstGroup.groupPath,
        name: 'button',
        tokens: [],
      }

      const secondTokenData = {
        groupPath: secondGroup.groupPath,
        name: 'input',
        tokens: [],
      }

      vi.mocked(assembleTokenData)
        .mockReturnValueOnce(firstTokenData as never)
        .mockReturnValueOnce(secondTokenData as never)

      vi.mocked(assemblePresetData)
        .mockReturnValue(null)

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [],
          outputFile:
            '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile:
            '/generated/metadata/lsp.generated.ts',
        })

      const cache = createCache({
        groups: [firstGroup, secondGroup],
      })

      const run = createRun({
        processedPaths: [secondGroup.groupPath],
      })

      const result = extractData(cache, run)

      expect(result.outputData.tokenFiles)
        .toEqual([secondTokenData])

      expect(assemblePresetData)
        .toHaveBeenCalledWith(
          secondGroup.cssData,
          outPath,
        )
    })

    it('records omitted preset files when preset assembly returns null', () => {
      const runGroup = {
        groupPath: '/tokens/button',
        cssPath: '/components/Button/Button.module.css',
        cssData: {},
      }

      const tokenData = {
        groupPath: runGroup.groupPath,
        name: 'button',
        tokens: [],
      }

      vi.mocked(assembleTokenData)
        .mockReturnValue(tokenData as never)

      vi.mocked(assemblePresetData)
        .mockReturnValue(null)

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [],
          outputFile:
            '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile:
            '/generated/metadata/lsp.generated.ts',
        })

      const cache = createCache({
        groups: [runGroup],
      })

      const run = createRun({
        processedPaths: [runGroup.groupPath],
      })

      const result = extractData(cache, run)

      expect(result.outputData.presetFiles)
        .toEqual([])

      expect(result.extractResult.omittedPresetFiles)
        .toEqual([
          '/components/Button/Button.module.css',
        ])
    })

    it('includes successful preset data for processed groups', () => {
      const runGroup = {
        groupPath: '/tokens/button',
        cssPath: '/components/Button/Button.module.css',
        cssData: {},
      }

      const presetData = {
        presetName: 'buttonPreset',
        typeName: 'ButtonPreset',
        cssImport: './Button.module.css',
        selectors: ['primary'],
        outputFile: '/generated/presets/button.preset.ts',
      }

      vi.mocked(assembleTokenData)
        .mockReturnValue({
          groupPath: runGroup.groupPath,
          name: 'button',
          tokens: [],
        } as never)

      vi.mocked(assemblePresetData)
        .mockReturnValue(presetData as never)

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [],
          outputFile:
            '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile:
            '/generated/metadata/lsp.generated.ts',
        })

      const cache = createCache({
        groups: [runGroup],
      })

      const run = createRun({
        processedPaths: [runGroup.groupPath],
      })

      const result = extractData(cache, run)

      expect(result.outputData.presetFiles)
        .toEqual([presetData])

      expect(result.extractResult.omittedPresetFiles)
        .toEqual([])
    })

    it('passes post data and assembled token variables to extension assembly', () => {
      const group = {
        groupPath: '/tokens/button',
      }

      const tokenData = {
        groupPath: group.groupPath,
        name: 'button',
        tokens: [
          {
            infix: 'button',
            variables: [],
          },
        ],
      }

      const postData = [
        {
          variables: [
            '--existing-color',
          ],
        },
        {
          variables: [
            '--existing-radius',
          ],
        },
      ]

      vi.mocked(assembleTokenData)
        .mockReturnValue(tokenData as never)

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [
            '--existing-color',
          ] as CssVarString[],
          outputFile:
            '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile:
            '/generated/metadata/lsp.generated.ts',
        })

      const cache = createCache({
        groups: [group],
        postData,
      })

      const run = createRun()

      extractData(cache, run)

      expect(assembleExtensionData)
        .toHaveBeenCalledWith(
          [
            '--existing-color',
            '--existing-radius',
          ],
          tokenData.tokens,
          outPath,
        )
    })

    it('passes all OKLCH variables and token data to LSP assembly', () => {
      const group = {
        groupPath: '/tokens/button',
      }

      const tokenData = {
        groupPath: group.groupPath,
        name: 'button',
        tokens: [
          {
            infix: 'button',
            variables: [],
          },
        ],
      }

      const postData = [
        {
          oklchVariables: [
            ['--button-color', 'oklch(70% 0.2 30)'],
          ],
        },
        {
          oklchVariables: [
            ['--button-bg', 'oklch(80% 0.1 120)'],
          ],
        },
      ]

      vi.mocked(assembleTokenData)
        .mockReturnValue(tokenData as never)

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [],
          outputFile:
            '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile:
            '/generated/metadata/lsp.generated.ts',
        })

      const cache = createCache({
        groups: [group],
        postData,
      })

      const run = createRun()

      extractData(cache, run)

      expect(assembleLspData)
        .toHaveBeenCalledWith(
          [
            ['--button-color', 'oklch(70% 0.2 30)'],
            ['--button-bg', 'oklch(80% 0.1 120)'],
          ],
          tokenData.tokens,
          outPath,
        )
    })

    it('returns assembled extension and LSP data', () => {
      const extensionData = {
        variables: [
          '--button-color',
        ] as CssVarString[],
        outputFile:
          '/generated/metadata/extension.generated.jsonc',
      }

      const lspData = {
        rgbVariables: [
          '--button-color: rgb(100% 0% 0%)',
        ],
        tokens: [],
        outputFile:
          '/generated/metadata/lsp.generated.ts',
      }

      vi.mocked(assembleExtensionData)
        .mockReturnValue(extensionData)

      vi.mocked(assembleLspData)
        .mockReturnValue(lspData)

      const cache = createCache()
      const run = createRun()

      const result = extractData(cache, run)

      expect(result.outputData.extensionData)
        .toBe(extensionData)

      expect(result.outputData.lspData)
        .toBe(lspData)
    })

    it('assembles token data for all groups, while only emitting processed token files', () => {
      const group = {
        groupPath: '/tokens/button',
        cssPath: '/components/Button/Button.module.css',
        cssData: {},
      }

      const runGroup = {
        groupPath: '/tokens/input',
        cssPath: '/components/Input/Input.module.css',
        cssData: {},
      }

      const groupTokenData = {
        groupPath: group.groupPath,
        name: 'button',
        tokens: [],
      }

      const runTokenData = {
        groupPath: runGroup.groupPath,
        name: 'input',
        tokens: [],
      }

      vi.mocked(assembleTokenData)
        .mockReturnValueOnce(groupTokenData as never)
        .mockReturnValueOnce(runTokenData as never)

      vi.mocked(assemblePresetData)
        .mockReturnValue(null)

      vi.mocked(assembleExtensionData)
        .mockReturnValue({
          variables: [],
          outputFile:
            '/generated/metadata/extension.generated.jsonc',
        })

      vi.mocked(assembleLspData)
        .mockReturnValue({
          rgbVariables: [],
          tokens: [],
          outputFile:
            '/generated/metadata/lsp.generated.ts',
        })

      const cache = createCache({
        groups: [group, runGroup],
      })

      const run = createRun({
        processedPaths: [runGroup.groupPath],
      })

      const result = extractData(cache, run)

      expect(assembleTokenData)
        .toHaveBeenNthCalledWith(1, group, outPath)

      expect(assembleTokenData)
        .toHaveBeenNthCalledWith(2, runGroup, outPath)

      expect(result.outputData.tokenFiles)
        .toEqual([runTokenData])

      expect(assembleExtensionData)
        .toHaveBeenCalledWith(
          [],
          [
            ...groupTokenData.tokens,
            ...runTokenData.tokens,
          ],
          outPath,
        )
    })
  })
})