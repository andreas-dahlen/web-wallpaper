import { describe, expect, it } from 'vitest'

import { analyzeVariableUsage } from '../../../diagnostics/data/analyzers/analyzeVariableUsage.ts'
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
    name: 'background',
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
  describe('analyzeVariableUsage', () => {
    it('returns no mismatch when usage matches declarations', () => {
      const group = createGroup({
        cssData: createCssData({
          foundFinalVariables: [
            '--final-button-back-ground',
          ],
        }),
      })

      expect(analyzeVariableUsage(group)).toEqual([])
    })

    it('reports a final variable used by CSS but missing from the token', () => {
      const group = createGroup({
        cssData: createCssData({
          foundFinalVariables: [
            '--final-button-back-ground',
            '--final-button-color',
          ],
        }),
      })

      expect(analyzeVariableUsage(group)).toEqual([
        {
          name: 'Button',
          infix: 'button',
          missing: [
            '--final-button-color',
          ],
          unused: [],
        },
      ])
    })

    it('reports a declared variable that is not used by CSS', () => {
      const group = createGroup()

      expect(analyzeVariableUsage(group)).toEqual([
        {
          name: 'Button',
          infix: 'button',
          missing: [],
          unused: [
            '--final-button-back-ground',
          ],
        },
      ])
    })

    it('reports both missing and unused variables', () => {
      const group = createGroup({
        cssData: createCssData({
          foundFinalVariables: [
            '--final-button-color',
          ],
        }),
        tokens: [
          createToken({
            vars: [
              createVariable({
                name: 'back-ground',
              }),
              createVariable({
                key: 'border',
                name: 'border',
                cssName: 'border',
              }),
            ],
          }),
        ],
      })

      expect(analyzeVariableUsage(group)).toEqual([
        {
          name: 'Button',
          infix: 'button',
          missing: [
            '--final-button-color',
          ],
          unused: [
            '--final-button-back-ground',
            '--final-button-border',
          ],
        },
      ])
    })

    it('ignores final variables belonging to another token', () => {
      const group = createGroup({
        cssData: createCssData({
          foundFinalVariables: [
            '--final-surface-back-ground',
          ],
        }),
      })

      expect(analyzeVariableUsage(group)).toEqual([
        {
          name: 'Button',
          infix: 'button',
          missing: [],
          unused: [
            '--final-button-back-ground',
          ],
        },
      ])
    })

    it('analyzes tokens independently', () => {
      const group = createGroup({
        cssData: createCssData({
          foundFinalVariables: [
            '--final-button-back-ground',
            '--final-surface-color',
          ],
        }),
        tokens: [
          createToken({
            name: 'Button',
            infix: 'button',
            vars: [
              createVariable({
                name: 'backGround',
                cssName: 'back-ground',
              }),
            ],
          }),
          createToken({
            name: 'Surface',
            infix: 'surface',
            vars: [
              createVariable({
                key: 'color',
                name: 'color',
                cssName: 'color',
              }),
            ],
          }),
        ],
      })

      expect(analyzeVariableUsage(group)).toEqual([])
    })

    it('returns an empty array when there are no declarations or usage', () => {
      const group = createGroup({
        tokens: [
          createToken({
            vars: [],
          }),
        ],
      })

      expect(analyzeVariableUsage(group)).toEqual([])
    })
  })
})