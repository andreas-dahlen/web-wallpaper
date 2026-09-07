import { afterEach, describe, expect, it, vi } from 'vitest'

import { printReport } from '../../diagnostics/print/printReport.ts'
import type { ReportSection } from '../../diagnostics/report/buildReport.ts'

describe('[DIAGNOSTICS]', () => {
  describe('printReport', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('prints a section title and separator', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      const sections: ReportSection[] = [
        {
          title: 'Generated Files',
          entries: [],
        },
      ]

      printReport(sections)

      expect(log.mock.calls).toEqual([
        ['Generated Files'],
        ['─────────────────────────────────────────────'],
      ])
    })

    it('prints entries and their lines', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      const sections: ReportSection[] = [
        {
          title: 'Missing Classes',
          entries: [
            {
              title: 'button',
              lines: [
                'button',
                'card',
              ],
            },
          ],
        },
      ]

      printReport(sections)

      expect(log.mock.calls).toEqual([
        ['Missing Classes'],
        ['  button'],
        ['     button'],
        ['     card'],
        ['─────────────────────────────────────────────'],
      ])
    })

    it('prints entries without lines', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      const sections: ReportSection[] = [
        {
          title: 'Issues',
          entries: [
            {
              title: 'Something went wrong',
            },
          ],
        },
      ]

      printReport(sections)

      expect(log.mock.calls).toEqual([
        ['Issues'],
        ['  Something went wrong'],
        ['─────────────────────────────────────────────'],
      ])
    })

    it('prints a blank line between entries with lines', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      const sections: ReportSection[] = [
        {
          title: 'Selectors',
          entries: [
            {
              title: 'button',
              lines: ['invalid'],
            },
            {
              title: 'card',
              lines: ['missing'],
            },
          ],
        },
      ]

      printReport(sections)

      expect(log.mock.calls).toEqual([
        ['Selectors'],
        ['  button'],
        ['     invalid'],
        [],
        ['  card'],
        ['     missing'],
        ['─────────────────────────────────────────────'],
      ])
    })

    it('does not print a blank line after the final entry', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      const sections: ReportSection[] = [
        {
          title: 'Selectors',
          entries: [
            {
              title: 'button',
              lines: ['invalid'],
            },
          ],
        },
      ]

      printReport(sections)

      expect(log.mock.calls).not.toContainEqual([])
    })

    it('prints multiple sections in order', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      const sections: ReportSection[] = [
        {
          title: 'First',
          entries: [
            {
              title: 'entry',
              lines: ['line'],
            },
          ],
        },
        {
          title: 'Second',
          entries: [
            {
              title: 'entry',
              lines: ['line'],
            },
          ],
        },
      ]

      printReport(sections)

      expect(log.mock.calls).toEqual([
        ['First'],
        ['  entry'],
        ['     line'],
        ['─────────────────────────────────────────────'],
        ['Second'],
        ['  entry'],
        ['     line'],
        ['─────────────────────────────────────────────'],
      ])
    })

    it('does nothing for an empty report', () => {
      const log = vi
        .spyOn(console, 'log')
        .mockImplementation(() => { })

      printReport([])

      expect(log).not.toHaveBeenCalled()
    })
  })
})