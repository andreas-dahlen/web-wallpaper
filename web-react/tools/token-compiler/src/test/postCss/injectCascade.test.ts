import { describe, expect, it } from 'vitest'
import postcss from 'postcss'

import { injectCascade } from '../../postCss/inject/injectCascade.ts'
import type {
  CompilerToken,
  CompilerVariable,
} from '../../types/compiler.types.ts'

function createRule() {
  const root = postcss.parse(`
    .button {
      color: red;
    }
  `)

  const rule = root.first

  if (rule?.type !== 'rule') {
    throw new Error('Expected a CSS rule')
  }

  return rule
}

function createToken(): CompilerToken {
  return {
    name: 'button',
    infix: 'button',
    tokenPath: '/tokens/button/default.jsonc',
    vars: [],
  }
}

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

function getLastDeclaration(rule: ReturnType<typeof createRule>) {
  const declaration = rule.last

  if (declaration?.type !== 'decl') {
    throw new Error('Expected the last child to be a declaration')
  }

  return declaration
}

describe('[POSTCSS]', () => {
  describe('injectCascade', () => {
    it('appends a final variable using the allowed prefix', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['f'],
      })

      injectCascade(rule, token, variable)

      const declaration = getLastDeclaration(rule)

      expect(declaration.prop).toBe(
        '--final-button-back-ground',
      )

      expect(declaration.value).toBe(
        'var(--f-button-back-ground)',
      )
    })

    it('builds a fallback chain from multiple allowed prefixes', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['p', 'f'],
      })

      injectCascade(rule, token, variable)

      const declaration = getLastDeclaration(rule)

      expect(declaration.prop).toBe(
        '--final-button-back-ground',
      )

      expect(declaration.value).toBe(
        'var(--p-button-back-ground, var(--f-button-back-ground))',
      )
    })

    it('uses the variable name rather than its key', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        key: 'bg',
        name: 'backGround',
        cssName: 'back-ground',
        effectiveAllowed: ['f'],
      })

      injectCascade(rule, token, variable)

      const declaration = getLastDeclaration(rule)

      expect(declaration.prop).toBe(
        '--final-button-back-ground',
      )

      expect(declaration.value).toBe(
        'var(--f-button-back-ground)',
      )
    })

    it('uses the token infix when building variable names', () => {
      const rule = createRule()
      const token = createToken()
      token.infix = 'surface'

      const variable = createVariable({
        name: 'borderRadius',
        cssName: 'border-radius',
        effectiveAllowed: ['f'],
      })

      injectCascade(rule, token, variable)

      const declaration = getLastDeclaration(rule)

      expect(declaration.prop).toBe(
        '--final-surface-border-radius',
      )

      expect(declaration.value).toBe(
        'var(--f-surface-border-radius)',
      )
    })
  })
})