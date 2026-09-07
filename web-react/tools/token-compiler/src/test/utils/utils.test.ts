import { describe, expect, it } from 'vitest'

import {
  colors,
  ESC,
  formatLogPath,
  paint,
} from '../../utils/string.ts'

describe('[CONSOLE]', () => {
  describe('formatLogPath', () => {
    it('normalizes Windows separators', () => {
      expect(
        // eslint-disable-next-line unicorn/prefer-string-raw
        formatLogPath('C:\\project\\src\\Button\\Button.module.css'),
      ).toBe('Button/Button.module.css')
    })

    it('keeps only the final two path segments', () => {
      expect(
        formatLogPath('/project/src/components/Button.module.css'),
      ).toBe('components/Button.module.css')
    })

    it('handles a path with fewer than two segments', () => {
      expect(formatLogPath('Button.module.css')).toBe(
        'Button.module.css',
      )
    })
  })

  describe('paint', () => {
    it('wraps text with the supplied color and reset', () => {
      const result = paint('button', colors.heading)

      expect(result).toContain('button')
      expect(result).toContain(colors.heading)
      expect(result).toContain(colors.reset)
    })

    it('supports numeric values', () => {
      const result = paint(42, colors.value)

      expect(result).toContain('42')
      expect(result).toContain(colors.value)
      expect(result).toContain(colors.reset)
    })
  })

  describe('colors', () => {
    it('provides a reset color', () => {
      expect(colors.reset).toBe(`${ESC}[0m`)
    })

    it('defines the expected color categories', () => {
      expect(colors).toEqual(
        expect.objectContaining({
          heading: expect.any(String),
          subHeading: expect.any(String),
          muted: expect.any(String),
          success: expect.any(String),
          error: expect.any(String),
          symbol: expect.any(String),
          value: expect.any(String),
          file: expect.any(String),
          variable: expect.any(String),
          highlight: expect.any(String),
          info: expect.any(String),
          reset: expect.any(String),
        }),
      )
    })
  })
})