import { describe, expect, it } from 'vitest';
import { processToken } from '../../compiler/processing/processToken.ts';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

describe('[COMPILER]', () => {
  describe('processToken', () => {
    const createTokenFile = (content: string) => {
      const dir = path.join(tmpdir(), 'style-token-tests');

      mkdirSync(dir, { recursive: true });

      const filePath = path.join(dir, 'button.jsonc');

      writeFileSync(filePath, content);

      return filePath;
    };

    it('processes a valid token', () => {
      const filePath = createTokenFile(`
        {
          "component": "button",
          "vars": {
            "color": {
              "values": {
                "o": "red"
              }
            }
          }
        }
      `);

      const result = processToken(filePath);

      expect(
        result.issues.every(section => section.issues.length === 0)
      ).toBe(true);

      expect(result.token).toMatchObject({
        name: 'button',
        tokenPath: filePath,
        infix: 'button',
      });

      expect(result.token?.vars).toHaveLength(1);
    });

    it('uses component as infix when infix is missing', () => {
      const filePath = createTokenFile(`
        {
          "component": "button",
          "vars": {
            "color": {
              "values": {
                "o": "red"
              }
            }
          }
        }
      `);

      const result = processToken(filePath);

      expect(result.token).toMatchObject({
        name: 'button',
        infix: 'button',
      });
    });

    it('uses provided infix instead of component', () => {
      const filePath = createTokenFile(`
        {
          "component": "button",
          "infix": "primary",
          "vars": {
            "color": {
              "values": {
                "o": "red"
              }
            }
          }
        }
      `);

      const result = processToken(filePath);

      expect(result.token).toMatchObject({
        name: 'button',
        infix: 'primary',
      });
    });

    it('processes multiple variables', () => {
      const filePath = createTokenFile(`
        {
          "component": "button",
          "vars": {
            "color": {
              "values": {
                "o": "red"
              }
            },
            "background": {
              "values": {
                "o": "blue"
              }
            }
          }
        }
      `);

      const result = processToken(filePath);

      expect(result.token?.vars).toHaveLength(2);

      expect(
        result.token?.vars.map(variable => variable.name)
      ).toEqual([
        'color',
        'background',
      ]);
    });
  });
});