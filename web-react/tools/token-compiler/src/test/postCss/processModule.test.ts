import { describe, expect, it } from 'vitest'
import postcss from 'postcss'
import type { Root } from 'postcss'

import { processModule } from '../../postCss/processModule.ts'
import type {
  CompilerToken,
  CompilerVariable,
  CssTokenGroup,
} from '../../types/compiler.types.ts'

function parseCss(css: string): Root {
  return postcss.parse(css)
}

function createVariable(
  overrides: Partial<CompilerVariable> = {},
): CompilerVariable {
  return {
    key: 'bg',
    name: 'backGround',
    cssName: 'back-ground',
    values: {
      f: 'red',
    },
    effectiveAllowed: ['f'],
    ...overrides,
  }
}

function createToken(
  overrides: Partial<CompilerToken> = {},
): CompilerToken {
  return {
    name: 'button',
    infix: 'button',
    tokenPath: '/tokens/button/default.jsonc',
    vars: [createVariable()],
    ...overrides,
  }
}

function createGroup(
  overrides: Partial<CssTokenGroup> = {},
): CssTokenGroup {
  return {
    groupPath: '/tokens/button',
    cssPath: '/components/Button/Button.module.css',
    tokens: [createToken()],
    ...overrides,
  }
}

function getRule(root: Root, selector: string) {
  const rule = root.nodes?.find(
    node => node.type === 'rule' && node.selector === selector,
  )

  if (!rule || rule.type !== 'rule') {
    throw new Error(`Expected rule ${selector}`)
  }

  return rule
}

function getDeclarations(root: Root, selector: string) {
  return getRule(root, selector).nodes?.filter(
    node => node.type === 'decl',
  ) ?? []
}

describe('[POSTCSS]', () => {
  describe('processModule', () => {
    it('processes every token with a matching rule', () => {
      const root = parseCss(`
        .button {
          color: red;
        }

        .surface {
          color: blue;
        }
      `)

      const group = createGroup({
        tokens: [
          createToken(),
          createToken({
            name: 'surface',
            infix: 'surface',
            tokenPath: '/tokens/surface/default.jsonc',
            vars: [
              createVariable({
                name: 'borderRadius',
                cssName: 'border-radius'
              }),
            ],
          }),
        ],
      })

      const result = processModule({
        root,
        group,
        trace: true
      })

      expect(result.tokens).toEqual([
        {
          name: 'button',
          infix: 'button',
          tokenPath: '/tokens/button/default.jsonc',
          processed: true,
        },
        {
          name: 'surface',
          infix: 'surface',
          tokenPath: '/tokens/surface/default.jsonc',
          processed: true,
        },
      ])
    })

    it('marks tokens without a matching rule as unprocessed', () => {
      const root = parseCss(`
        .other {
          color: red;
        }
      `)

      const result = processModule({
        root,
        group: createGroup(),
        trace: true
      })

      expect(result.tokens).toEqual([
        {
          name: 'button',
          infix: 'button',
          tokenPath: '/tokens/button/default.jsonc',
          processed: false,
        },
      ])
    })

    it('injects variable definitions and the final cascade', () => {
      const root = parseCss(`
        .button {
          color: red;
        }
      `)

      processModule({
        root,
        group: createGroup({
          tokens: [
            createToken({
              vars: [
                // eslint-disable-next-line unicorn/max-nested-calls
                createVariable({
                  values: {
                    f: 'red',
                  },
                  effectiveAllowed: ['f'],
                }),
              ],
            }),
          ],
        }),
        trace: true
      })

      const declarations = getDeclarations(root, '.button')

      expect(declarations).toContainEqual(
        expect.objectContaining({
          prop: '--f-button-back-ground',
          value: 'red',
        }),
      )

      expect(declarations).toContainEqual(
        expect.objectContaining({
          prop: '--final-button-back-ground',
          value: 'var(--f-button-back-ground)',
        }),
      )
    })

    it('injects preset resets when the preset prefix is allowed', () => {
      const root = parseCss(`
        .button {
          color: var(--final-button-back-ground);
        }
      `)

      processModule({
        root,
        group: createGroup({
          tokens: [
            createToken({
              vars: [
                // eslint-disable-next-line unicorn/max-nested-calls
                createVariable({
                  effectiveAllowed: ['p', 'f'],
                }),
              ],
            }),
          ],
        }),
        trace: true
      })

      const declarations = getDeclarations(root, '.button')

      expect(declarations).toContainEqual(
        expect.objectContaining({
          prop: '--p-button-back-ground',
          value: 'initial',
        }),
      )
    })

    it('does not mutate the CSS when mutate is false', () => {
      const root = parseCss(`
        .button {
          color: var(--final-button-back-ground);
        }
      `)

      const before = root.toString()

      const result = processModule({
        root,
        group: createGroup(),
        mutate: false,
        trace: true,
      })

      expect(root.toString()).toBe(before)

      expect(result.tokens).toEqual([
        {
          name: 'button',
          infix: 'button',
          tokenPath: '/tokens/button/default.jsonc',
          processed: true,
        },
      ])

      expect(result.foundFinalVariables).toEqual([
        '--final-button-back-ground',
      ])
    })

    it('returns the analysis collected while processing', () => {
      const root = parseCss(`
        .button {
          --s-button-back-ground: red;
          color: var(--final-button-back-ground);
        }

        .other {
          color: blue;
        }
      `)

      const result = processModule({
        root,
        group: createGroup(),
        mutate: false,
        trace: true
      })

      expect(result.groupPath).toBe('/tokens/button')
      expect(result.cssPath).toBe(
        '/components/Button/Button.module.css',
      )

      expect(result.foundSelectors).toEqual([
        'button',
        'other',
      ])

      expect(result.usableSelectors).toEqual([
        'button',
        'other',
      ])

      expect(result.declaredVariables).toEqual([
        '--s-button-back-ground',
      ])

      expect(result.foundFinalVariables).toEqual([
        '--final-button-back-ground',
      ])
    })
  })
})