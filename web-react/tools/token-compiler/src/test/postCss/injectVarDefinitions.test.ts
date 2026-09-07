import { describe, expect, it } from 'vitest'
import postcss from 'postcss'

import { injectVarDefinitions } from '../../postCss/inject/injectVarDefinitions.ts'
import type {
  CompilerToken,
  CompilerVariable,
} from '../../types/compiler.types.ts'
import { normalizeCssValue } from '../../oldSharedUtils/stringFormaters.ts'

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
    name: 'backGround',
    cssName: 'back-ground',
    values: {},
    effectiveAllowed: ['f'],
    ...overrides,
  }
}

function getDeclarations(rule: ReturnType<typeof createRule>) {
  return rule.nodes?.filter(
    node => node.type === 'decl',
  ) ?? []
}

describe('[POSTCSS]', () => {
  describe('injectVarDefinitions', () => {
    it('injects an allowed literal value', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['f'],
        values: {
          f: 'red',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations).toHaveLength(2)
      expect(declarations[1]).toMatchObject({
        prop: '--f-button-back-ground',
        value: 'red',
      })
    })

    it('injects multiple allowed values', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['p', 'f'],
        values: {
          p: 'blue',
          f: 'red',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations).toHaveLength(3)

      expect(declarations[1]).toMatchObject({
        prop: '--p-button-back-ground',
        value: 'blue',
      })

      expect(declarations[2]).toMatchObject({
        prop: '--f-button-back-ground',
        value: 'red',
      })
    })

    it('skips values for disallowed prefixes', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['f'],
        values: {
          f: 'red',
          p: 'blue',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations).toHaveLength(2)

      expect(declarations[1]).toMatchObject({
        prop: '--f-button-back-ground',
        value: 'red',
      })
    })

    it('skips allowed prefixes without a value', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['p', 'f'],
        values: {
          f: 'red',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations).toHaveLength(2)

      expect(declarations[1]).toMatchObject({
        prop: '--f-button-back-ground',
        value: 'red',
      })
    })

    it('converts prefix values into variable references', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['f'],
        values: {
          f: 'p',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations[1]).toMatchObject({
        prop: '--f-button-back-ground',
        value: 'var(--p-button-back-ground)',
      })
    })

    it('normalizes literal CSS values', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        effectiveAllowed: ['f'],
        values: {
          f: '  red  ',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations[1]).toMatchObject({
        prop: '--f-button-back-ground',
        value: normalizeCssValue('  red  '),
      })
    })

    it('uses the variable name rather than its key', () => {
      const rule = createRule()
      const token = createToken()
      const variable = createVariable({
        key: 'bg',
        name: 'background',
        effectiveAllowed: ['f'],
        values: {
          f: 'red',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations[1]).toMatchObject({
        prop: '--f-button-back-ground',
      })
    })

    it('uses the token infix when building variable names', () => {
      const rule = createRule()
      const token = createToken()
      token.infix = 'surface'

      const variable = createVariable({
        name: 'borderRadius',
        cssName: 'border-radius',
        effectiveAllowed: ['f'],
        values: {
          f: '4px',
        },
      })

      injectVarDefinitions(rule, token, variable)

      const declarations = getDeclarations(rule)

      expect(declarations[1]).toMatchObject({
        prop: '--f-surface-border-radius',
        value: '4px',
      })
    })
  })
})