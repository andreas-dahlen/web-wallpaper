import { parseToken } from '../../compiler/processing/parseToken.ts';
import { createRawVariable, createTestCollector } from '../compiler.factory.ts';
import { describe, expect, it } from 'vitest';

describe('[COMPILER]', () => {
  describe('parseToken.identifier', () => {
    it.each([
      {
        description: 'returns a valid identifier unchanged',
        input: 'button',
        expected: 'button',
      },
      {
        description: 'removes whitespace',
        input: 'button primary',
        expected: 'buttonprimary',
      },
      {
        description: 'converts to camelCase',
        input: 'button-primary',
        expected: 'buttonPrimary',
      },
      {
        description: 'removes invalid characters',
        input: 'button!@#$',
        expected: 'button',
      },
      {
        description: 'prefixes identifiers beginning with numbers',
        input: '123button',
        expected: '_123button',
      },
      {
        description: 'escapes reserved words',
        input: 'default',
        expected: '_default',
      },
      {
        description: 'applies multiple transformations',
        input: '123 button-primary!',
        expected: '_123buttonPrimary',
      },
    ])('$description', ({ input, expected }) => {
      expect(parseToken.identifier(input)).toEqual({
        name: expected,
      });
    });

    it('throws when nothing remains after parsing', () => {
      expect(() =>
        parseToken.identifier('!!!')
      ).toThrow('Identifier was empty after parsing');
    });
  });

  describe('parseToken.values', () => {
    it.each([
      {
        description: "returns empty object",
        input: undefined,
        expected: {},
      },
      {
        description: "keeps normal values",
        input: { f: "black", p: "red" },
        expected: { f: "black", p: "red" },
      },
      {
        description: "removes self reference",
        input: { f: "f", p: "red" },
        expected: { p: "red" },
      },
      {
        description: "removes multiple self references",
        input: { f: "f", p: "p", o: "green" },
        expected: { o: "green" },
      },
    ])("$description", ({ input, expected }) => {
      expect(parseToken.values(input, createTestCollector()))
        .toEqual(expected);
    });
  })

  describe('parseToken.variable', () => {
    it('uses the key as the default variable name', () => {
      const result = parseToken.variable(
        createRawVariable(),
        'background',
        [],
        createTestCollector()
      )

      expect(result.variable.name).toBe('background');
      expect(result.variable.key).toBe('background');
    });

    it('uses the explicit variable name when provided', () => {
      const result = parseToken.variable(
        createRawVariable({ name: 'Background' }),
        'bg',
        [],
        createTestCollector()
      )

      expect(result.variable.name).toBe('background');
      expect(result.variable.key).toBe('bg');
    });

    it('removes whitespace from the explicit variable name', () => {
      const result = parseToken.variable(
        createRawVariable({ name: 'background Color' }),
        'bg',
        [],
        createTestCollector()
      )

      expect(result.variable.name)
        .toBe('backgroundColor');
    })

    it('resolves effective allowed prefixes', () => {
      const result = parseToken.variable(
        createRawVariable({ allowed: ['o'], exclude: ['p'] }),
        'bg',
        ['f'],
        createTestCollector()
      )

      expect(result.variable.effectiveAllowed)
        .toContain('o');

      expect(result.variable.effectiveAllowed)
        .toContain('f');

      expect(result.variable.effectiveAllowed)
        .not.toContain('p');
    })

    it('parses variable values', () => {
      const result = parseToken.variable(
        createRawVariable({
          values: { f: 'black', p: 'red' }
        }),
        'bg',
        [],
        createTestCollector()
      )

      expect(result.variable.values).toEqual({ f: 'black', p: 'red' });
    });

    it('removes self references from values', () => {
      const result = parseToken.variable(
        createRawVariable({
          values: { f: 'f', p: 'red' },
        }),
        'bg',
        [],
        createTestCollector()
      )

      expect(result.variable.values).toEqual({ p: 'red' })
    })

    it('records issues for identifier transformations', () => {
      const collector = createTestCollector()

      const result = parseToken.identifier(
        '123 button-primary',
        collector
      )

      expect(result).toEqual({
        name: '_123buttonPrimary',
      })

      const [group] = collector.flush()

      expect(group.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reason: 'removed whitespace',
          }),
          expect.objectContaining({
            reason: 'converted to camelCase',
          }),
          expect.objectContaining({
            reason: 'prefix being a number',
          }),
        ])
      )
    })
  })
})