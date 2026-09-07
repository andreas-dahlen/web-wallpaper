import { describe, expect, it, vi } from 'vitest'

import { issuesSection } from '../../../diagnostics/report/sections/problems/issuesSection.ts'
import type { AnalyzedIssueGroup } from '../../../types/diagnostics.types.ts'

vi.mock(
  '../../../../utils/string.js',
  () => ({
    colors: {
      subHeading: 'subHeading',
      value: 'value',
      symbol: 'symbol',
      error: 'error',
      muted: 'muted',
      file: 'file',
      heading: 'heading',
    },

    paint: String,
    formatLogPath: (value: string) => value,
  }))

function createIssueGroup(
  overrides: Partial<AnalyzedIssueGroup> = {},
): AnalyzedIssueGroup {
  return {
    subject: 'Token validation',
    contexts: [
      {
        context: 'button',
        issues: [
          {
            value: 'old-value',
            after: undefined,
            reason: 'Invalid value',
            path: '/tokens/button/default.jsonc',
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('issuesSection', () => {
    it('creates a section for issue groups', () => {
      const result = issuesSection([
        createIssueGroup(),
      ])

      expect(result).toBeDefined()
      expect(result?.title).toContain('JSON Issues')
      expect(result?.title).toContain('(1)')
      expect(result?.entries).toHaveLength(1)
    })

    it('creates an entry for each issue group', () => {
      const result = issuesSection([
        createIssueGroup({
          subject: 'First issue',
        }),
        createIssueGroup({
          subject: 'Second issue',
        }),
      ])

      expect(result?.entries).toHaveLength(2)

      const titles = result?.entries.map(
        entry => entry.title,
      ) ?? []

      expect(titles[0]).toContain('First issue')
      expect(titles[1]).toContain('Second issue')
    })

    it('reports the number of contexts in the group', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: 'button',
              issues: [],
            },
            {
              context: 'surface',
              issues: [],
            },
          ],
        }),
      ])

      expect(result?.entries[0].title).toContain('(2)')
    })

    it('uses the context name in context lines', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: 'button',
              issues: [],
            },
          ],
        }),
      ])

      expect(result?.entries[0].lines?.[0]).toContain(
        'button',
      )
      expect(result?.entries[0].lines?.[0]).toContain(
        '(0)',
      )
    })

    it('uses general when a context has no name', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: undefined,
              issues: [],
            },
          ],
        }),
      ])

      expect(result?.entries[0].lines?.[0]).toContain(
        'general',
      )
    })

    it('reports the number of issues in each context', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: 'button',
              issues: [
                {
                  value: 'one',
                  reason: 'First',
                  path: '/tokens/button.jsonc',
                },
                {
                  value: 'two',
                  reason: 'Second',
                  path: '/tokens/button.jsonc',
                },
              ],
            },
          ],
        }),
      ])

      expect(result?.entries[0].lines?.[0]).toContain(
        '(2)',
      )
    })

    it('includes issue values, reasons, and file paths', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: 'button',
              issues: [
                {
                  value: 'old-value',
                  reason: 'Invalid value',
                  path: '/tokens/button/default.jsonc',
                },
              ],
            },
          ],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('old-value'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('Invalid value'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('/tokens/button/default.jsonc'),
      )).toBe(true)
    })

    it('includes the replacement value when an issue has one', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: 'button',
              issues: [
                {
                  value: 'old-value',
                  after: 'new-value',
                  reason: 'Value changed',
                  path: '/tokens/button.jsonc',
                },
              ],
            },
          ],
        }),
      ])

      const issueLine = result?.entries[0].lines?.find(
        line =>
          line.includes('old-value') &&
          line.includes('new-value'),
      )

      expect(issueLine).toBeDefined()
      expect(issueLine).toContain('→')
    })

    it('does not include a replacement arrow when no replacement exists', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: 'button',
              issues: [
                {
                  value: 'value',
                  after: undefined,
                  reason: 'Something went wrong',
                  path: '/tokens/button.jsonc',
                },
              ],
            },
          ],
        }),
      ])

      const issueLine = result?.entries[0].lines?.find(
        line => line.includes('Something went wrong'),
      )

      expect(issueLine).toBeDefined()
      expect(issueLine).not.toContain('→')
    })

    it('creates entries for multiple contexts', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [
            {
              context: 'button',
              issues: [],
            },
            {
              context: 'surface',
              issues: [],
            },
          ],
        }),
      ])

      const lines = result?.entries[0].lines ?? []

      expect(lines.some(line =>
        line.includes('button'),
      )).toBe(true)

      expect(lines.some(line =>
        line.includes('surface'),
      )).toBe(true)
    })

    it('returns undefined for empty input', () => {
      expect(issuesSection([])).toBeUndefined()
    })

    it('returns undefined when groups contain no contexts', () => {
      const result = issuesSection([
        createIssueGroup({
          contexts: [],
        }),
      ])

      expect(result).toBeUndefined()
    })
  })
})