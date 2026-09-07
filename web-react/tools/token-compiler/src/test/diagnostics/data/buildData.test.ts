import { describe, expect, it, vi } from 'vitest'

import { buildData } from '../../../diagnostics/data/buildData.ts'
import type {
  CssData,
  CssDataTokenGroup,
} from '../../../types/compiler.types.ts'
import type { CompilerRun } from '../../../compiler/tracking/compilerRun.ts'
import type { TokenCache } from '../../../compiler/tracking/tokenCache.ts'

function createCssData(
  overrides: Partial<CssData> = {},
): CssData {
  return {
    groupPath: '/tokens/button',
    cssPath: '/components/Button/Button.module.css',
    foundSelectors: ['button'],
    usableSelectors: ['button'],
    tokens: [
      {
        name: 'button',
        infix: 'button',
        tokenPath: '/tokens/button/default.jsonc',
        processed: true,
      },
    ],
    foundFinalVariables: [],
    declaredVariables: [],
    ...overrides,
  }
}

function createGroup(
  overrides: Partial<CssDataTokenGroup> = {},
): CssDataTokenGroup {
  return {
    groupPath: '/tokens/button',
    cssPath: '/components/Button/Button.module.css',
    tokens: [
      {
        name: 'button',
        infix: 'button',
        tokenPath: '/tokens/button/default.jsonc',
        vars: [
          {
            key: 'bg',
            name: 'backGround',
            cssName: 'back-ground',
            values: {},
            effectiveAllowed: ['f'],
          },
        ],
      },
    ],
    cssData: createCssData(),
    ...overrides,
  }
}

function createCache(
  groups: CssDataTokenGroup[] = [],
  missingCssGroupPaths: string[] = [],
): TokenCache {
  return {
    getCssDataGroupsByPaths: vi.fn(() => groups),
    getMissingCssGroupPaths: vi.fn(() => missingCssGroupPaths),
  } as unknown as TokenCache
}

function createRun(
  overrides: Partial<{
    processedPaths: string[]
    issues: unknown[]
    emitResult: unknown
  }> = {},
): CompilerRun {
  return {
    getProcessedPaths: vi.fn(() =>
      overrides.processedPaths ?? [],
    ),
    getIssues: vi.fn(() =>
      overrides.issues ?? [],
    ),
    getEmitResult: vi.fn(() =>
      overrides.emitResult,
    ),
  } as unknown as CompilerRun
}

describe('[DIAGNOSTICS]', () => {
  describe('buildData', () => {
    it('returns empty diagnostic data when nothing was processed', () => {
      const cache = createCache()
      const run = createRun()

      expect(buildData(cache, run)).toEqual({
        missingClasses: [],
        unusableSelectors: [],
        mismatchedVariables: [],
        invalidVarDeclarations: [],
        missingCssModules: [],
        omittedPresetFiles: [],
        processedGroupCount: 0,
        generatedFiles: {
          presets: {
            written: [],
            skipped: []
          },
          tokens: {
            written: [],
            skipped: []
          },
          meta: {
            written: [],
            skipped: []
          },
          lsp: {
            written: [],
            skipped: []
          },
          extension: {
            written: [],
            skipped: []
          }
        },
        generatedPatches: {
          css: {
            skipped: [],
            written: []
          },
          jsonc: {
            skipped: [],
            written: []
          }
        },
        issues: [],
      })
    })

    it('resolves processed groups from processed paths', () => {
      const cache = createCache()
      const run = createRun({
        processedPaths: [
          '/tokens/button',
          '/tokens/input',
        ],
      })

      buildData(cache, run)

      expect(cache.getCssDataGroupsByPaths)
        .toHaveBeenCalledWith([
          '/tokens/button',
          '/tokens/input',
        ])
    })

    it('counts processed groups', () => {
      const groups = [
        createGroup({
          groupPath: '/tokens/button',
        }),
        createGroup({
          groupPath: '/tokens/input',
        }),
      ]

      const cache = createCache(groups)
      const run = createRun({
        processedPaths: [
          '/tokens/button',
          '/tokens/input',
        ],
      })

      const result = buildData(cache, run)

      expect(result.processedGroupCount).toBe(2)
    })

    it('collects missing CSS modules', () => {
      const cache = createCache(
        [],
        [
          '/tokens/button',
          '/tokens/card',
        ],
      )

      const run = createRun()

      const result = buildData(cache, run)

      expect(result.missingCssModules).toEqual([
        'button',
        'card',
      ])
    })

    it('collects diagnostics from processed CSS data', () => {
      const group = createGroup({
        cssData: createCssData({
          foundSelectors: [
            'button',
            'invalid',
          ],
          usableSelectors: [
            'button',
          ],
          tokens: [
            {
              name: 'button',
              infix: 'button',
              tokenPath: '/tokens/button/default.jsonc',
              processed: false,
            },
          ],
          foundFinalVariables: [
            '--final-button-unknown',
          ],
          declaredVariables: [
            '--x-button-back-ground',
          ],
        }),
      })

      const cache = createCache([group])

      const run = createRun({
        processedPaths: [
          '/tokens/button',
        ],
      })

      const result = buildData(cache, run)

      expect(result.unusableSelectors).toEqual([
        {
          cssPath: '/components/Button/Button.module.css',
          unusableSelectors: ['invalid'],
        },
      ])

      expect(result.missingClasses).toEqual([
        {
          infix: 'button',
          tokenPath: '/tokens/button/default.jsonc',
          usableSelectors: ['button'],
        },
      ])

      expect(result.mismatchedVariables).toEqual([
        {
          name: 'button',
          infix: 'button',
          missing: [
            '--final-button-unknown',
          ],
          unused: [
            '--final-button-back-ground',
          ],
        },
      ])

      expect(result.invalidVarDeclarations).toEqual([
        {
          name: 'button',
          infix: 'button',
          invalid: [
            '--x-button-back-ground',
          ],
        },
      ])
    })

    it('does not produce group diagnostics when no groups are returned', () => {
      const cache = createCache()

      const run = createRun({
        processedPaths: [
          '/tokens/button',
        ],
      })

      const result = buildData(cache, run)

      expect(result.processedGroupCount).toBe(0)
      expect(result.missingClasses).toEqual([])
      expect(result.unusableSelectors).toEqual([])
      expect(result.mismatchedVariables).toEqual([])
      expect(result.invalidVarDeclarations).toEqual([])
    })

    it('includes generated file information from the emit result', () => {
      const cache = createCache()

      const run = createRun({
        emitResult: {
          writeResult: {
            updated: [
              '/src/shared/generated/presets/button.preset.ts',
              '/src/shared/generated/tokenModules/button.token.ts',
              '/src/shared/generated/metadata.generated.jsonc',
              '/src/shared/generated/lsp.generated.ts',
              '/src/shared/generated/extension.generated.jsonc',
            ],
            skipped: [],
          },
          patchResult: {
            updated: [],
            skipped: [],
          },
          extractResult: {
            omittedPresetFiles: [],
          },
        },
      })

      const result = buildData(cache, run)

      expect(result.generatedFiles).toEqual({
        presets: {
          written: [
            '/src/shared/generated/presets/button.preset.ts',
          ],
          skipped: [],
        },
        tokens: {
          written: [
            '/src/shared/generated/tokenModules/button.token.ts',
          ],
          skipped: [],
        },
        meta: {
          written: [
            '/src/shared/generated/metadata.generated.jsonc',
          ],
          skipped: [],
        },
        lsp: {
          written: [
            '/src/shared/generated/lsp.generated.ts',
          ],
          skipped: [],
        },
        extension: {
          written: [
            '/src/shared/generated/extension.generated.jsonc',
          ],
          skipped: [],
        },
      })
    })

    it('includes omitted preset files from the emit result', () => {
      const cache = createCache()

      const run = createRun({
        emitResult: {
          writeResult: {
            updated: [],
            skipped: [],
          },
          patchResult: {
            updated: [],
            skipped: [],
          },
          extractResult: {
            omittedPresetFiles: [
              '/components/Button/Button.module.css',
            ],
          },
        },
      })

      const result = buildData(cache, run)

      expect(result.omittedPresetFiles).toEqual([
        '/components/Button/Button.module.css',
      ])
    })

    it('returns no omitted preset files when there is no emit result', () => {
      const cache = createCache()
      const run = createRun()

      const result = buildData(cache, run)

      expect(result.omittedPresetFiles).toEqual([])
    })
  })
})