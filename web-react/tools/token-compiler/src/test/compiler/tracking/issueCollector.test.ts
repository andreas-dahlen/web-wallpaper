import { describe, expect, it } from 'vitest'

import {
  createIssueCollector,
  createNullIssueCollector,
  mergeIssueGroups,
} from '../../../compiler/tracking/issueCollector.ts'
import type { IssueGroup } from '../../../types/issueCollector.types.ts'

describe('[COMPILER]', () => {
  describe('createIssueCollector', () => {
    it('throws when setting an issue before a subject is set', () => {
      const collector = createIssueCollector()

      expect(() => {
        collector.set({
          reason: 'invalid declaration',
        })
      }).toThrow('setSubject() must be called before set()')
    })

    it('throws when setting an issue without a valid scope', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')

      expect(() => {
        collector.set({
          reason: 'invalid declaration',
        })
      }).toThrow('scope() must initialize path and value')
    })

    it('allows an empty path', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '',
        value: 'red',
      })

      collector.set({
        reason: 'invalid declaration',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '',
              value: 'red',
              reason: 'invalid declaration',
            },
          ],
        },
      ])
    })

    it('allows an empty value', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: '',
      })

      collector.set({
        reason: 'invalid declaration',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: '',
              reason: 'invalid declaration',
            },
          ],
        },
      ])
    })

    it('records an issue using the current subject and scope', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })

      collector.set({
        reason: 'invalid declaration',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'invalid declaration',
            },
          ],
        },
      ])
    })

    it('records an optional after value', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })

      collector.set({
        reason: 'value was replaced',
        after: 'blue',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'value was replaced',
              after: 'blue',
            },
          ],
        },
      ])
    })

    it('preserves issue context from the current scope', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
        context: 'token',
      })

      collector.set({
        reason: 'invalid declaration',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              context: 'token',
              reason: 'invalid declaration',
            },
          ],
        },
      ])
    })

    it('allows the set value to override the scope value', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })

      collector.set({
        reason: 'value was normalized',
        value: 'blue',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'blue',
              reason: 'value was normalized',
            },
          ],
        },
      ])
    })

    it('adds multiple issues to the same subject', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })

      collector.set({ reason: 'first issue' })
      collector.set({ reason: 'second issue' })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'first issue',
            },
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'second issue',
            },
          ],
        },
      ])
    })

    it('groups issues by subject', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })
      collector.set({
        reason: 'invalid button declaration',
      })

      collector.setSubject('surface')
      collector.scope({
        path: '--p-surface-color',
        value: 'blue',
      })
      collector.set({
        reason: 'invalid surface declaration',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'invalid button declaration',
            },
          ],
        },
        {
          subject: 'surface',
          issues: [
            {
              path: '--p-surface-color',
              value: 'blue',
              reason: 'invalid surface declaration',
            },
          ],
        },
      ])
    })

    it('allows the same scope to be reused for different subjects', () => {
      const collector = createIssueCollector()

      collector.scope({
        path: '--s-color',
        value: 'red',
      })

      collector.setSubject('button')
      collector.set({
        reason: 'button issue',
      })

      collector.setSubject('surface')
      collector.set({
        reason: 'surface issue',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-color',
              value: 'red',
              reason: 'button issue',
            },
          ],
        },
        {
          subject: 'surface',
          issues: [
            {
              path: '--s-color',
              value: 'red',
              reason: 'surface issue',
            },
          ],
        },
      ])
    })

    it('continues an existing subject when returning to it', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })
      collector.set({
        reason: 'first button issue',
      })

      collector.setSubject('surface')
      collector.set({
        reason: 'surface issue',
      })

      collector.setSubject('button')
      collector.set({
        reason: 'second button issue',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'first button issue',
            },
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'second button issue',
            },
          ],
        },
        {
          subject: 'surface',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'surface issue',
            },
          ],
        },
      ])
    })

    it('edits only the supplied scope properties', () => {
      const collector = createIssueCollector()

      collector.scope({
        path: '--s-button-color',
        value: 'red',
        context: 'token',
      })

      collector.setSubject('button')

      collector.editScope({
        value: 'blue',
      })

      collector.set({
        reason: 'invalid declaration',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'blue',
              context: 'token',
              reason: 'invalid declaration',
            },
          ],
        },
      ])
    })

    it('can edit multiple scope properties at once', () => {
      const collector = createIssueCollector()

      collector.scope({
        path: '--s-button-color',
        value: 'red',
        context: 'token',
      })

      collector.setSubject('button')

      collector.editScope({
        path: '--s-button-background',
        value: 'blue',
        context: 'declaration',
      })

      collector.set({
        reason: 'invalid declaration',
      })

      expect(collector.flush()).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-background',
              value: 'blue',
              context: 'declaration',
              reason: 'invalid declaration',
            },
          ],
        },
      ])
    })

    it('flushes all collected groups', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })
      collector.set({
        reason: 'button issue',
      })

      collector.setSubject('surface')
      collector.set({
        reason: 'surface issue',
      })

      expect(collector.flush()).toHaveLength(2)
    })

    it('clears all state after flush', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })
      collector.set({
        reason: 'button issue',
      })

      collector.flush()

      expect(collector.flush()).toEqual([])

      expect(() => {
        collector.set({
          reason: 'another issue',
        })
      }).toThrow('setSubject() must be called before set()')
    })

    it('resets the subject after flush', () => {
      const collector = createIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })
      collector.set({
        reason: 'button issue',
      })

      collector.flush()

      expect(() => {
        collector.set({
          reason: 'another issue',
        })
      }).toThrow('setSubject() must be called before set()')
    })
  })

  describe('mergeIssueGroups', () => {
    it('returns an empty array when there are no groups', () => {
      expect(mergeIssueGroups([])).toEqual([])
    })

    it('returns a single group unchanged', () => {
      const groups: IssueGroup[] = [
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'invalid declaration',
            },
          ],
        },
      ]

      expect(mergeIssueGroups(groups)).toEqual(groups)
    })

    it('merges groups with the same subject', () => {
      const groups: IssueGroup[] = [
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'invalid declaration',
            },
          ],
        },
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-size',
              value: '10px',
              reason: 'unused declaration',
            },
          ],
        },
      ]

      expect(mergeIssueGroups(groups)).toEqual([
        {
          subject: 'button',
          issues: [
            {
              path: '--s-button-color',
              value: 'red',
              reason: 'invalid declaration',
            },
            {
              path: '--s-button-size',
              value: '10px',
              reason: 'unused declaration',
            },
          ],
        },
      ])
    })

    it('preserves groups with different subjects', () => {
      const groups: IssueGroup[] = [
        {
          subject: 'button',
          issues: [],
        },
        {
          subject: 'surface',
          issues: [],
        },
      ]

      expect(mergeIssueGroups(groups)).toEqual(groups)
    })

    it('preserves the order of merged issues', () => {
      const groups: IssueGroup[] = [
        {
          subject: 'button',
          issues: [
            {
              path: 'one',
              value: '1',
              reason: 'first',
            },
          ],
        },
        {
          subject: 'button',
          issues: [
            {
              path: 'two',
              value: '2',
              reason: 'second',
            },
          ],
        },
        {
          subject: 'button',
          issues: [
            {
              path: 'three',
              value: '3',
              reason: 'third',
            },
          ],
        },
      ]

      expect(mergeIssueGroups(groups)[0].issues).toEqual([
        {
          path: 'one',
          value: '1',
          reason: 'first',
        },
        {
          path: 'two',
          value: '2',
          reason: 'second',
        },
        {
          path: 'three',
          value: '3',
          reason: 'third',
        },
      ])
    })

    it('does not mutate the input issue arrays', () => {
      const first: IssueGroup = {
        subject: 'button',
        issues: [
          {
            path: 'one',
            value: '1',
            reason: 'first',
          },
        ],
      }

      const second: IssueGroup = {
        subject: 'button',
        issues: [
          {
            path: 'two',
            value: '2',
            reason: 'second',
          },
        ],
      }

      mergeIssueGroups([first, second])

      expect(first.issues).toHaveLength(1)
      expect(second.issues).toHaveLength(1)
    })
  })

  describe('createNullIssueCollector', () => {
    it('ignores all operations', () => {
      const collector = createNullIssueCollector()

      collector.setSubject('button')
      collector.scope({
        path: '--s-button-color',
        value: 'red',
      })
      collector.editScope({
        value: 'blue',
      })
      collector.set({
        reason: 'invalid declaration',
      })

      expect(collector.flush()).toEqual([])
    })

    it('returns the same collector instance', () => {
      expect(createNullIssueCollector()).toBe(createNullIssueCollector())
    })
  })
})