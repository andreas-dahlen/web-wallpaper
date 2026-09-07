import { afterEach, describe, expect, it, vi } from 'vitest'

import { print } from '../../utils/print.ts'

vi.mock(
  '../../../utils/string.js',
  () => ({
    colors: {
      subHeading: 'subHeading',
      file: 'file',
      heading: 'heading',
      muted: 'muted',
      variable: 'variable',
      symbol: 'symbol',
      reset: 'reset',
      success: 'success',
    },

    paint: String,

    formatLogPath: (value: string) =>
      `formatted:${value}`,
  }),
)

describe('[CONSOLE]', () => {
  describe('print', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('logs when injecting into a file', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      print.injecting('/src/Button.module.css')

      expect(log).toHaveBeenCalled()
      expect(log.mock.calls[0][0]).toContain(
        'formatted:/src/Button.module.css',
      )
    })

    it('logs the token being processed', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      print.processing('button')

      expect(log).toHaveBeenCalled()
      expect(log.mock.calls[0][0]).toContain('button')
    })

    it('logs the infix when building a chain', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      print.buildingChains('button')

      expect(log).toHaveBeenCalled()
      expect(log.mock.calls[0][0]).toContain(
        '--final-button-*',
      )
    })

    it('logs the variable key when printing a cascade', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      print.resultCascade({
        key: '--final-button-color',
        effectiveAllowed: ['theme'],
        values: {
          theme: '#fff',
        },
      } as never)

      expect(log).toHaveBeenCalled()

      const output = log.mock.calls[0][0]

      expect(output).toContain('--final-button-color')
    })

    it('logs cascade values', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      print.resultCascade({
        key: '--final-button-color',
        effectiveAllowed: ['theme', 'preset', 'final'],
        values: {
          theme: '#fff',
          preset: '#000',
          final: '#123',
        },
      } as never)

      const output = log.mock.calls[0][0]

      expect(output).toContain('theme')
      expect(output).toContain('#fff')
      expect(output).toContain('preset')
      expect(output).toContain('#000')
      expect(output).toContain('final')
      expect(output).toContain('#123')
    })

    it('prints prefixes even when their values are missing', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      print.resultCascade({
        key: '--final-button-color',
        effectiveAllowed: ['theme', 'preset', 'final'],
        values: {
          theme: '#fff',
          preset: undefined,
          final: '#123',
        },
      } as never)

      const output = log.mock.calls[0][0]

      expect(output).toContain('theme')
      expect(output).toContain('preset')
      expect(output).toContain('final')
      expect(output).toContain('#fff')
      expect(output).toContain('#123')
    })

    it('handles an empty cascade', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      print.resultCascade({
        key: '--final-button-color',
        effectiveAllowed: [],
        values: {},
      } as never)

      expect(log).toHaveBeenCalled()

      const output = log.mock.calls[0][0]

      expect(output).toContain('--final-button-color')
    })
  })
})