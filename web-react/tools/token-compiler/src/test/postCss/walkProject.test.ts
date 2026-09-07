import { describe, expect, it } from 'vitest'
import postcss from 'postcss'

import { walkProject } from '../../postCss/resolvers/walkProject.ts'

function parseCss(css: string) {
  return postcss.parse(css)
}

describe('[POSTCSS]', () => {
  describe('walkProject', () => {
    it('collects CSS custom properties', () => {
      const root = parseCss(`
        .button {
          --button-color: red;
          --button-radius: 4px;
        }
      `)

      const result = walkProject(
        root,
        '/styles/button.css',
      )

      expect(result.variables).toEqual([
        '--button-color',
        '--button-radius',
      ])
    })

    it('ignores non-custom-property declarations', () => {
      const root = parseCss(`
        .button {
          color: red;
          background: blue;
          --button-color: red;
        }
      `)

      const result = walkProject(
        root,
        '/styles/button.css',
      )

      expect(result.variables).toEqual([
        '--button-color',
      ])
    })

    it('deduplicates CSS variables', () => {
      const root = parseCss(`
        .button {
          --button-color: red;
        }

        .other {
          --button-color: blue;
        }
      `)

      const result = walkProject(
        root,
        '/styles/button.css',
      )

      expect(result.variables).toEqual([
        '--button-color',
      ])
    })

    it('collects oklch variables separately', () => {
      const root = parseCss(`
        .button {
          --button-color: oklch(60% 0.2 240);
          --button-radius: 4px;
        }
      `)

      const result = walkProject(
        root,
        '/styles/button.css',
      )

      expect(result.oklchVariables).toEqual([
        [
          '--button-color',
          'oklch(60% 0.2 240)',
        ],
      ])
    })

    it('trims whitespace from oklch values', () => {
      const root = parseCss(`
        .button {
          --button-color:   oklch(60% 0.2 240)   ;
        }
      `)

      const result = walkProject(
        root,
        '/styles/button.css',
      )

      expect(result.oklchVariables).toEqual([
        [
          '--button-color',
          'oklch(60% 0.2 240)',
        ],
      ])
    })

    it('does not include non-oklch variables in oklchVariables', () => {
      const root = parseCss(`
        .button {
          --color: rgb(255 0 0);
          --radius: 4px;
          --spacing: var(--other);
        }
      `)

      const result = walkProject(
        root,
        '/styles/button.css',
      )

      expect(result.oklchVariables).toEqual([])
    })

    it('preserves the CSS path', () => {
      const root = parseCss(`
        .button {
          --button-color: red;
        }
      `)

      const result = walkProject(
        root,
        '/components/Button/Button.module.css',
      )

      expect(result.cssPath).toBe(
        '/components/Button/Button.module.css',
      )
    })

    it('returns empty collections when no CSS variables are found', () => {
      const root = parseCss(`
        .button {
          color: red;
        }
      `)

      const result = walkProject(
        root,
        '/styles/button.css',
      )

      expect(result).toEqual({
        cssPath: '/styles/button.css',
        variables: [],
        oklchVariables: [],
      })
    })
  })
})