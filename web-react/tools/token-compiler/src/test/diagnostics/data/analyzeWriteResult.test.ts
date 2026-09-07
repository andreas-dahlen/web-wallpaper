import { describe, expect, it } from 'vitest'

import { analyzeWriteResult } from '../../../diagnostics/data/analyzers/analyzeWriteResult.ts'

describe('[DIAGNOSTICS]', () => {
  describe('analyzeWriteResult', () => {
    it('groups written preset and token files', () => {
      const result = analyzeWriteResult({
        updated: [
          '/src/shared/generated/presets/button.preset.ts',
          '/src/shared/generated/tokenModules/button.token.ts',
        ],
        skipped: [],
      })

      expect(result).toEqual({
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
          written: [],
          skipped: [],
        },
        lsp: {
          written: [],
          skipped: [],
        },
        extension: {
          written: [],
          skipped: [],
        },
      })
    })

    it('groups skipped preset and token files', () => {
      const result = analyzeWriteResult({
        updated: [],
        skipped: [
          '/src/shared/generated/presets/button.preset.ts',
          '/src/shared/generated/tokenModules/button.token.ts',
        ],
      })

      expect(result).toEqual({
        presets: {
          written: [],
          skipped: [
            '/src/shared/generated/presets/button.preset.ts',
          ],
        },
        tokens: {
          written: [],
          skipped: [
            '/src/shared/generated/tokenModules/button.token.ts',
          ],
        },
        meta: {
          written: [],
          skipped: [],
        },
        lsp: {
          written: [],
          skipped: [],
        },
        extension: {
          written: [],
          skipped: [],
        },
      })
    })

    it('groups written metadata, lsp, and extension files', () => {
      const result = analyzeWriteResult({
        updated: [
          '/src/shared/generated/metadata.generated.jsonc',
          '/src/shared/generated/lsp.generated.ts',
          '/src/shared/generated/extension.generated.jsonc',
        ],
        skipped: [],
      })

      expect(result).toEqual({
        presets: {
          written: [],
          skipped: [],
        },
        tokens: {
          written: [],
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

    it('groups skipped metadata, lsp, and extension files', () => {
      const result = analyzeWriteResult({
        updated: [],
        skipped: [
          '/src/shared/generated/metadata.generated.jsonc',
          '/src/shared/generated/lsp.generated.ts',
          '/src/shared/generated/extension.generated.jsonc',
        ],
      })

      expect(result).toEqual({
        presets: {
          written: [],
          skipped: [],
        },
        tokens: {
          written: [],
          skipped: [],
        },
        meta: {
          written: [],
          skipped: [
            '/src/shared/generated/metadata.generated.jsonc',
          ],
        },
        lsp: {
          written: [],
          skipped: [
            '/src/shared/generated/lsp.generated.ts',
          ],
        },
        extension: {
          written: [],
          skipped: [
            '/src/shared/generated/extension.generated.jsonc',
          ],
        },
      })
    })

    it('ignores files that are not generated files', () => {
      const result = analyzeWriteResult({
        updated: [
          '/src/shared/generated/other.jsonc',
          '/src/components/Button/Button.module.css',
        ],
        skipped: [
          '/src/shared/generated/other.jsonc',
        ],
      })

      expect(result).toEqual({
        presets: {
          written: [],
          skipped: [],
        },
        tokens: {
          written: [],
          skipped: [],
        },
        meta: {
          written: [],
          skipped: [],
        },
        lsp: {
          written: [],
          skipped: [],
        },
        extension: {
          written: [],
          skipped: [],
        },
      })
    })

    it('handles an undefined result', () => {
      expect(analyzeWriteResult(undefined)).toEqual({
        presets: {
          written: [],
          skipped: [],
        },
        tokens: {
          written: [],
          skipped: [],
        },
        meta: {
          written: [],
          skipped: [],
        },
        lsp: {
          written: [],
          skipped: [],
        },
        extension: {
          written: [],
          skipped: [],
        },
      })
    })

    it('sorts written and skipped preset and token files', () => {
      const result = analyzeWriteResult({
        updated: [
          '/src/shared/generated/presets/zebra.preset.ts',
          '/src/shared/generated/presets/alpha.preset.ts',
          '/src/shared/generated/tokenModules/zebra.token.ts',
          '/src/shared/generated/tokenModules/alpha.token.ts',
        ],
        skipped: [
          '/src/shared/generated/presets/zulu.preset.ts',
          '/src/shared/generated/presets/bravo.preset.ts',
          '/src/shared/generated/tokenModules/zulu.token.ts',
          '/src/shared/generated/tokenModules/bravo.token.ts',
        ],
      })

      expect(result.presets).toEqual({
        written: [
          '/src/shared/generated/presets/alpha.preset.ts',
          '/src/shared/generated/presets/zebra.preset.ts',
        ],
        skipped: [
          '/src/shared/generated/presets/bravo.preset.ts',
          '/src/shared/generated/presets/zulu.preset.ts',
        ],
      })

      expect(result.tokens).toEqual({
        written: [
          '/src/shared/generated/tokenModules/alpha.token.ts',
          '/src/shared/generated/tokenModules/zebra.token.ts',
        ],
        skipped: [
          '/src/shared/generated/tokenModules/bravo.token.ts',
          '/src/shared/generated/tokenModules/zulu.token.ts',
        ],
      })
    })
  })
})