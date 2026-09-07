import fs from 'node:fs'
import path from 'node:path'
import {
  parse,
  printParseErrorCode,
  type ParseError,
} from 'jsonc-parser'

import type { CompilerOptions } from '../types/run.types.ts'
import { compilerConfigSchema } from '../schema/configSchema.ts'

export function loadCompilerConfig(projectRoot: string): CompilerOptions {
  const configPath = path.join(
    projectRoot,
    'compiler.config.json',
  )

  if (!fs.existsSync(configPath)) {
    return {}
  }

  const text = fs.readFileSync(configPath, 'utf8')

  const errors: ParseError[] = []
  const raw = parse(text, errors)

  if (errors.length > 0) {
    const details = errors
      .map(error => printParseErrorCode(error.error))
      .join(', ')

    throw new Error(
      `Invalid JSONC in ${configPath}: ${details}`,
    )
  }

  return compilerConfigSchema.parse(raw)
}