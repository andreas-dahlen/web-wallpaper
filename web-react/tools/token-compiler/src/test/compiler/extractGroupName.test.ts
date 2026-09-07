import { extractGroupName } from '../../compiler/resolvers/extractGroupName.ts';
import { describe, expect, it } from 'vitest';


describe('[COMPILER]', () => {
  describe('extractGroupName', () => {
    it.each([
      {
        description: 'extracts name from unix path',
        input: '/tokens/button.jsonc',
        expected: 'button',
      },
      {
        description: 'extracts name from windows path',
        input: String.raw`\\tokens\\button.json`,
        expected: 'button',
      },
      {
        description: 'removes json extension',
        input: '/tokens/button.json',
        expected: 'button',
      },
      {
        description: 'removes jsonc extension',
        input: '/tokens/button.jsonc',
        expected: 'button',
      },
      {
        description: 'handles uppercase extensions',
        input: '/tokens/button.JSONC',
        expected: 'button',
      },
      {
        description: 'handles filenames without folders',
        input: 'button.jsonc',
        expected: 'button',
      },
    ])('$description', ({ input, expected }) => {
      expect(extractGroupName(input))
        .toBe(expected);
    })
  })
})