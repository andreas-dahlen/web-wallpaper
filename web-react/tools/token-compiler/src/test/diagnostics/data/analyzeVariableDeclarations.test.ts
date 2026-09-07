import { describe, expect, it } from 'vitest'

import { analyzeVariableDeclarations } from '../../../diagnostics/data/analyzers/analyzeVariableDeclarations.ts'
import type {
  CompilerToken,
  CompilerVariable,
  CssData,
  CssDataTokenGroup,
} from '../../../types/compiler.types.ts'

function createVariable(
  overrides: Partial<CompilerVariable> = {},
): CompilerVariable {
  return {
    key: 'bg',
    name: 'backGround',
    cssName: 'back-ground',
    values: {},
    effectiveAllowed: ['f'],
    ...overrides,
  }
}

function createToken(
  overrides: Partial<CompilerToken> = {},
): CompilerToken {
  return {
    name: 'Button',
    infix: 'button',
    tokenPath: '/tokens/button.jsonc',
    vars: [
      createVariable(),
    ],
    ...overrides,
  }
}

function createCssData(
  overrides: Partial<CssData> = {},
): CssData {
  return {
    groupPath: '/tokens/button',
    cssPath: '/components/Button/Button.module.css',
    foundSelectors: [],
    usableSelectors: [],
    foundFinalVariables: [],
    declaredVariables: [],
    tokens: [],
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
      createToken(),
    ],
    cssData: createCssData(),
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('analyzeVariableDeclarations', () => {
    it('ignores declarations with an allowed prefix', () => {
      const group = createGroup({
        cssData: createCssData({
          declaredVariables: [
            '--f-button-back-ground',
          ],
        }),
      })

      expect(
        analyzeVariableDeclarations(group),
      ).toEqual([])
    })

    it('reports declarations with a disallowed prefix', () => {
      const group = createGroup({
        cssData: createCssData({
          declaredVariables: [
            '--p-button-back-ground',
          ],
        }),
      })

      expect(
        analyzeVariableDeclarations(group),
      ).toEqual([
        {
          name: 'Button',
          infix: 'button',
          invalid: [
            '--p-button-back-ground',
          ],
        },
      ])
    })

    it('ignores unrelated declarations', () => {
      const group = createGroup({
        cssData: createCssData({
          declaredVariables: [
            '--f-other-back-ground',
            '--p-surface-color',
            '--random-value',
          ],
        }),
      })

      expect(
        analyzeVariableDeclarations(group),
      ).toEqual([])
    })

    it('reports multiple invalid declarations for one token', () => {
      const group = createGroup({
        cssData: createCssData({
          declaredVariables: [
            '--p-button-back-ground',
            '--m-button-back-ground',
            '--s-button-back-ground',
          ],
        }),
      })

      expect(
        analyzeVariableDeclarations(group),
      ).toEqual([
        {
          name: 'Button',
          infix: 'button',
          invalid: [
            '--p-button-back-ground',
            '--m-button-back-ground',
            '--s-button-back-ground',
          ],
        },
      ])
    })

    it('allows multiple configured prefixes', () => {
      const group = createGroup({
        cssData: createCssData({
          declaredVariables: [
            '--f-button-back-ground',
            '--p-button-back-ground',
            '--m-button-back-ground',
          ],
        }),
        tokens: [
          createToken({
            vars: [
              createVariable({
                effectiveAllowed: ['p', 'f'],
              }),
            ],
          }),
        ],
      })

      expect(
        analyzeVariableDeclarations(group),
      ).toEqual([
        {
          name: 'Button',
          infix: 'button',
          invalid: [
            '--m-button-back-ground',
          ],
        },
      ])
    })

    it('analyzes variables independently', () => {
      const group = createGroup({
        cssData: createCssData({
          declaredVariables: [
            '--p-button-back-ground',
            '--p-button-color',
          ],
        }),
        tokens: [
          createToken({
            vars: [
              createVariable({
                name: 'backGround',
                cssName: 'back-ground',
                effectiveAllowed: ['p'],
              }),
              createVariable({
                key: 'color',
                name: 'color',
                cssName: 'color',
                effectiveAllowed: ['f'],
              }),
            ],
          }),
        ],
      })

      expect(
        analyzeVariableDeclarations(group),
      ).toEqual([
        {
          name: 'Button',
          infix: 'button',
          invalid: [
            '--p-button-color',
          ],
        },
      ])
    })

    it('returns an empty array when there are no declarations', () => {
      const group = createGroup()

      expect(
        analyzeVariableDeclarations(group),
      ).toEqual([])
    })
  })
})