import { describe, expect, it } from 'vitest'
import postcss from 'postcss'

import { walkModule } from '../../postCss/resolvers/walkModule.ts'

function parseCss(css: string) {
  return postcss.parse(css)
}

describe('[POSTCSS]', () => {
  describe('walkModule', () => {
    describe('rules', () => {
      it('finds expected token rules', () => {
        const root = parseCss(`
          .button-first {
            color: red;
          }

          .button-second {
            color: blue;
          }

          .other {
            color: green;
          }
        `)

        const result = walkModule(
          root,
          ['button-first', 'button-second'],
        )

        // eslint-disable-next-line unicorn/prefer-iterator-to-array
        expect([...result.rules.keys()]).toEqual([
          '.button-first',
          '.button-second',
        ])
      })

      it('ignores rules that are not expected token rules', () => {
        const root = parseCss(`
          .button-first {
            color: red;
          }

          .other {
            color: green;
          }
        `)

        const result = walkModule(root, ['button-first'])

        expect(result.rules.has('.button-first')).toBe(true)
        expect(result.rules.has('.other')).toBe(false)
      })

      it('only matches exact selectors', () => {
        const root = parseCss(`
          .button {
            color: red;
          }

          .button.active {
            color: blue;
          }
        `)

        const result = walkModule(root, ['button'])

        // eslint-disable-next-line unicorn/prefer-iterator-to-array
        expect([...result.rules.keys()]).toEqual([
          '.button',
        ])
      })
    })

    describe('selectors', () => {
      it('collects every class selector', () => {
        const root = parseCss(`
          .button-first {
            color: red;
          }

          .button-second {
            color: blue;
          }

          .other {
            color: green;
          }
        `)

        const result = walkModule(root, [])

        expect(result.foundSelectors).toEqual([
          'button-first',
          'button-second',
          'other',
        ])
      })

      it('collects every class from compound selectors', () => {
        const root = parseCss(`
          .button.active {
            color: red;
          }

          .button:hover .icon {
            color: blue;
          }
        `)

        const result = walkModule(root, [])

        expect(result.foundSelectors).toEqual([
          'button',
          'active',
          'icon',
        ])
      })

      it('deduplicates repeated class selectors', () => {
        const root = parseCss(`
          .button {
            color: red;
          }

          .button.active {
            color: blue;
          }

          .button {
            background: green;
          }
        `)

        const result = walkModule(root, [])

        expect(result.foundSelectors).toEqual([
          'button',
          'active',
        ])
      })

      it('collects only valid class identifiers as usable selectors', () => {
        const root = parseCss(`
          .button-first {
            color: red;
          }

          .button_$state {
            color: blue;
          }

          .button-state.active {
            color: green;
          }
        `)

        const result = walkModule(root, [])

        expect(result.usableSelectors).toEqual([
          'button_$state',
          'active',
        ])
      })

      it('does not mark invalid class selectors as usable', () => {
        const root = parseCss(String.raw`
    .123button {
      color: red;
    }

    .button:first-child {
      color: blue;
    }

    .button\\.invalid {
      color: green;
    }
  `)

        const result = walkModule(root, [])

        expect(result.foundSelectors).toContain('123button')
        expect(result.foundSelectors).toContain(String.raw`button\.invalid`)

        expect(result.usableSelectors).not.toContain('123button')
        expect(result.usableSelectors).not.toContain(String.raw`button\.invalid`)
      })
    })

    describe('declared variables', () => {
      it('finds declared token variables', () => {
        const root = parseCss(`
          .button {
            --s-button-color: red;
            --m-button-color: blue;
            --something-else: green;
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.declaredVariables).toEqual([
          '--s-button-color',
          '--m-button-color',
        ])
      })

      it('ignores variables belonging to other infixes', () => {
        const root = parseCss(`
          .button {
            --s-input-color: red;
            --s-button-color: blue;
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.declaredVariables).toEqual([
          '--s-button-color',
        ])
      })

      it('deduplicates declared variables', () => {
        const root = parseCss(`
          .button {
            --s-button-color: red;
          }

          .button.active {
            --s-button-color: blue;
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.declaredVariables).toEqual([
          '--s-button-color',
        ])
      })
    })

    describe('final variables', () => {
      it('finds final variables used by normal declarations', () => {
        const root = parseCss(`
          .button {
            color: var(--final-button-color);
            background: var(--final-button-background);
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.foundFinalVariables).toEqual([
          '--final-button-color',
          '--final-button-background',
        ])
      })

      it('finds final variables with fallbacks', () => {
        const root = parseCss(`
          .button {
            color: var(--final-button-color, red);
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.foundFinalVariables).toEqual([
          '--final-button-color',
        ])
      })

      it('finds multiple final variables in one declaration', () => {
        const root = parseCss(`
          .button {
            background:
              var(--final-button-color),
              var(--final-button-background);
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.foundFinalVariables).toEqual([
          '--final-button-color',
          '--final-button-background',
        ])
      })

      it('does not treat unrelated variables as final variables', () => {
        const root = parseCss(`
          .button {
            color: var(--s-button-color);
            background: var(--m-button-background);
            border: var(--random-value);
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.foundFinalVariables).toEqual([])
      })

      it('does not create reset data for final variables declared as custom properties', () => {
        const root = parseCss(`
          .button {
            --s-button-color: var(--final-button-color);
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.foundFinalVariables).toEqual([
          '--final-button-color',
        ])

        expect(result.presetResetData).toEqual([])
      })
    })

    describe('preset reset data', () => {
      it('creates reset data from final variables used by normal declarations', () => {
        const root = parseCss(`
          .button {
            color: var(--final-button-color);
            background: var(--final-button-background);
          }
        `)

        const result = walkModule(root, ['button'])

        const rule = root.first

        expect(rule?.type).toBe('rule')

        if (rule?.type !== 'rule') {
          return
        }

        expect(result.presetResetData).toEqual([
          [
            rule,
            new Set([
              '--final-button-color',
              '--final-button-background',
            ]),
          ],
        ])
      })

      it('keeps reset data separate for different rules', () => {
        const root = parseCss(`
          .button {
            color: var(--final-button-color);
          }

          .button.active {
            background: var(--final-button-background);
          }
        `)

        const result = walkModule(root, ['button'])

        const rules = root.nodes.filter(
          node => node.type === 'rule',
        )

        expect(rules).toHaveLength(2)

        expect(result.presetResetData).toEqual([
          [
            rules[0],
            new Set([
              '--final-button-color',
            ]),
          ],
          [
            rules[1],
            new Set([
              '--final-button-background',
            ]),
          ],
        ])
      })

      it('does not create reset data when no final variables are used', () => {
        const root = parseCss(`
          .button {
            color: var(--s-button-color);
            background: red;
          }
        `)

        const result = walkModule(root, ['button'])

        expect(result.presetResetData).toEqual([])
      })
    })

    it('returns empty collections when nothing is found', () => {
      const root = parseCss(`
        .other {
          color: red;
        }
      `)

      const result = walkModule(root, ['button'])

      expect(result.rules.size).toBe(0)
      expect(result.foundSelectors).toEqual(['other'])
      expect(result.usableSelectors).toEqual(['other'])
      expect(result.foundFinalVariables).toEqual([])
      expect(result.declaredVariables).toEqual([])
      expect(result.presetResetData).toEqual([])
    })
  })
})