import { validateDuplicateVars } from '../../compiler/builders/validateDuplicateVars.ts';
import { createCompilerToken, createCompilerVariable } from '../compiler.factory.ts';
import { describe, expect, it } from 'vitest';
describe('[COMPILER]', () => {
  describe('validateDuplicateVars', () => {
    it('does not throw when all variable identities are unique', () => {
      const first = createCompilerToken({
        tokenPath: '/first.jsonc',
        infix: 'og',
        vars: [
          createCompilerVariable({
            key: 'color',
            name: 'color',
            cssName: 'color',
          }),
        ],
      })

      const second = createCompilerToken({
        tokenPath: '/second.jsonc',
        infix: 'different',
        vars: [
          createCompilerVariable({
            key: 'color',
            name: 'color',
            cssName: 'color',
          }),
        ],
      })

      expect(() =>
        validateDuplicateVars([first, second])
      ).not.toThrow()
    })

    it('throws when two variables generate the same identity', () => {
      expect(() =>
        validateDuplicateVars([
          createCompilerToken({
            tokenPath: '/first.jsonc',
            vars: [
              createCompilerVariable({
                name: 'color'
              })
            ]
          }),
          createCompilerToken({
            tokenPath: '/second.jsonc',
            vars: [
              createCompilerVariable({
                name: 'color'
              })
            ]
          })
        ])
      ).toThrow('CSS variable identity collision');
    });

    it('allows identical variable names in different token groups', () => {
      expect(() =>
        validateDuplicateVars([
          createCompilerToken({
            name: "button",
            tokenPath: '/first.jsonc',
            vars: [
              createCompilerVariable({
                name: 'color'
              })
            ]
          }),
          createCompilerToken({
            name: "surface",
            tokenPath: '/second.jsonc',
            vars: [
              createCompilerVariable({
                name: 'color'
              })
            ]
          })
        ])
      ).not.toThrow();
    });

    it('allows different variable names within the same token', () => {
      expect(() =>
        validateDuplicateVars([
          createCompilerToken({
            vars: [
              createCompilerVariable({
                cssName: 'color'
              }),
              createCompilerVariable({
                cssName: 'another'
              })
            ]
          })
        ])
      ).not.toThrow();
    });

    it('includes both token paths in the error', () => {
      let error: Error | undefined;
      try {

        validateDuplicateVars([
          createCompilerToken({
            tokenPath: '/first.jsonc',
            vars: [createCompilerVariable({ name: 'color' })]
          }),
          createCompilerToken({
            tokenPath: '/second.jsonc',
            vars: [createCompilerVariable({ name: 'color' })]
          })
        ])

      } catch (error_) {
        error = error_ as Error;
      }

      expect(error).toBeDefined();

      expect(error!.message).toContain('CSS variable identity collision');
      expect(error!.message).toContain('first.jsonc');
      expect(error!.message).toContain('second.jsonc');
    })
  })
})