import fs from "node:fs";
import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser';
import type { RawToken } from '../../types/compiler.types.ts';
import { rawTokenSchema } from '../../schema/tokenSchema.ts';

export function loadTokenFile(fullPath: string): RawToken {
  const text = fs.readFileSync(fullPath, 'utf8')

  const errors: ParseError[] = []
  const jsonc = parse(text, errors)

  if (errors.length > 0) {
    const details = errors
      .map(error => printParseErrorCode(error.error))
      .join(', ')

    throw new Error(
      `Invalid JSONC in ${fullPath}: ${details}`,
    )
  }
  return rawTokenSchema.parse(jsonc)
}