import { describe, expect, it } from 'vitest'

import { analyzeIssues } from '../../../diagnostics/data/analyzers/analyzeIssues.ts'
import type {
  Issue,
  IssueGroup,
} from '../../../types/issueCollector.types.ts'

function createIssue(
  overrides: Partial<Issue> = {},
): Issue {
  return {
    reason: 'test issue',
    path: 'test/path.whatever',
    value: 'test value',
    ...overrides,
  }
}

function createGroup(
  overrides: Partial<IssueGroup> = {},
): IssueGroup {
  return {
    subject: 'Test Subject',
    issues: [],
    ...overrides,
  }
}

describe('[DIAGNOSTICS]', () => {
  describe('analyzeIssues', () => {
    it('removes groups with no issues', () => {
      const groups = [
        createGroup({
          subject: 'Empty',
        }),
        createGroup({
          subject: 'Used',
          issues: [
            createIssue(),
          ],
        }),
      ]

      const result = analyzeIssues(groups)

      expect(result).toHaveLength(1)
      expect(result[0]?.subject).toBe('Used')
    })

    it('preserves the group subject', () => {
      const groups = [
        createGroup({
          subject: 'Variable Parsing',
          issues: [
            createIssue(),
          ],
        }),
      ]

      const result = analyzeIssues(groups)

      expect(result).toEqual([
        {
          subject: 'Variable Parsing',
          contexts: [
            {
              context: undefined,
              issues: [
                createIssue(),
              ],
            },
          ],
        },
      ])
    })

    it('groups issues by context', () => {
      const first = createIssue({
        context: 'variable key',
      })

      const second = createIssue({
        context: 'variable key',
      })

      const third = createIssue({
        context: 'variable name',
      })

      const result = analyzeIssues([
        createGroup({
          issues: [first, second, third],
        }),
      ])

      expect(result[0]?.contexts).toEqual([
        {
          context: 'variable key',
          issues: [first, second],
        },
        {
          context: 'variable name',
          issues: [third],
        },
      ])
    })

    it('keeps issues without a context', () => {
      const issue = createIssue()

      const result = analyzeIssues([
        createGroup({
          issues: [issue],
        }),
      ])

      expect(result[0]?.contexts).toEqual([
        {
          context: undefined,
          issues: [issue],
        },
      ])
    })

    it('places undefined context after defined contexts', () => {
      const noContext = createIssue()

      const first = createIssue({
        context: 'first',
      })

      const second = createIssue({
        context: 'second',
      })

      const result = analyzeIssues([
        createGroup({
          issues: [
            noContext,
            first,
            second,
          ],
        }),
      ])

      expect(result[0]?.contexts).toEqual([
        {
          context: 'first',
          issues: [first],
        },
        {
          context: 'second',
          issues: [second],
        },
        {
          context: undefined,
          issues: [noContext],
        },
      ])
    })

    it('preserves insertion order for defined contexts', () => {
      const second = createIssue({
        context: 'second',
      })

      const first = createIssue({
        context: 'first',
      })

      const result = analyzeIssues([
        createGroup({
          issues: [second, first],
        }),
      ])

      expect(result[0]?.contexts.map(
        context => context.context,
      )).toEqual([
        'second',
        'first',
      ])
    })

    it('analyzes multiple issue groups independently', () => {
      const firstIssue = createIssue({
        context: 'first',
      })

      const secondIssue = createIssue({
        context: 'second',
      })

      const result = analyzeIssues([
        createGroup({
          subject: 'First',
          issues: [firstIssue],
        }),
        createGroup({
          subject: 'Second',
          issues: [secondIssue],
        }),
      ])

      expect(result).toEqual([
        {
          subject: 'First',
          contexts: [
            {
              context: 'first',
              issues: [firstIssue],
            },
          ],
        },
        {
          subject: 'Second',
          contexts: [
            {
              context: 'second',
              issues: [secondIssue],
            },
          ],
        },
      ])
    })
  })
})