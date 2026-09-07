import { resolveAllowedPrefixes } from '../../compiler/resolvers/resolveAllowedPrefixes.ts';
import type { IssueCollector } from '../../compiler/tracking/issueCollector.ts';
import { describe, expect, it } from 'vitest';
import { createTestCollector } from '../compiler.factory.ts';
import type { ValidPrefix } from '../../oldSharedUtils/oldSharedCompiler.types.ts';


function hasIssue(
  collector: IssueCollector,
  reason: string,
) {
  return collector
    .flush()
    .some(group =>
      group.issues.some(issue =>
        issue.reason === reason
      )
    );
}


describe('[COMPILER]', () => {
  describe('resolveAllowedPrefixes', () => {

    it.each([
      {
        description: 'merges allowed and alwaysAllowed',
        allowed: ['o'],
        alwaysAllowed: ['f'],
        exclude: [],
        expected: ['o', 'f'],
      },
      {
        description: 'removes excluded prefixes',
        allowed: ['o', 'p'],
        alwaysAllowed: [],
        exclude: ['p'],
        expected: ['o'],
      },
      {
        description: 'removes duplicates',
        allowed: ['o'],
        alwaysAllowed: ['o'],
        exclude: [],
        expected: ['o'],
      },
      {
        description: 'sorts prefixes according to priority',
        allowed: ['f', 'o', 'p'],
        alwaysAllowed: [],
        exclude: [],
        expected: ['o', 'p', 'f'],
      },
      {
        description: 'removes excluded alwaysAllowed prefixes',
        allowed: ['o'],
        alwaysAllowed: ['f'],
        exclude: ['f'],
        expected: ['o'],
      },
    ])(
      '$description',
      ({
        allowed,
        alwaysAllowed,
        exclude,
        expected,
      }) => {
        const result = resolveAllowedPrefixes(
          allowed as ValidPrefix[],
          alwaysAllowed as ValidPrefix[],
          exclude as ValidPrefix[],
        );

        expect(result.effectiveAllowed)
          .toEqual(expected);
      },
    );


    it('reports when allowed contains alwaysAllowed prefix', () => {
      const collector = createTestCollector();

      resolveAllowedPrefixes(
        ['f'],
        ['f'],
        [],
        collector,
      );

      expect(hasIssue(
        collector,
        'already in alwaysAllowed',
      ))
        .toBe(true);
    });


    it('reports when excluding a non alwaysAllowed prefix', () => {
      const collector = createTestCollector();

      resolveAllowedPrefixes(
        [],
        ['f'],
        ['o'],
        collector,
      );

      expect(hasIssue(
        collector,
        'cannot exclude non-alwaysAllowed prefix',
      ))
        .toBe(true);
    });


    it('reports when prefix exists in allowed and exclude', () => {
      const collector = createTestCollector();

      resolveAllowedPrefixes(
        ['o'],
        [],
        ['o'],
        collector,
      );

      expect(hasIssue(
        collector,
        'exists in both allowed and exclude',
      ))
        .toBe(true);
    });

  });
});