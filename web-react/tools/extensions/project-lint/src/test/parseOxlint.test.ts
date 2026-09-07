import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const RangeMock = vi.hoisted(() =>
  vi.fn(
    class {
      constructor(
        public startLine: number,
        public startCharacter: number,
        public endLine: number,
        public endCharacter: number,
      ) { }
    },
  ),
)

const DiagnosticMock = vi.hoisted(() =>
  vi.fn(
    class {
      source?: string
      code?: string

      constructor(
        public range: unknown,
        public message: string,
        public severity: unknown,
      ) { }
    },
  ),
)

vi.mock('vscode', () => ({
  Diagnostic: DiagnosticMock,
  Range: RangeMock,

  DiagnosticSeverity: {
    Error: 'Error',
    Warning: 'Warning',
  },
}))

import * as vscode from 'vscode'

import { parseDiagnostic } from '../oxlint/parseOxlint.ts'

describe('[LINT-ON-START] parseDiagnostic', () => {
  it('parses a warning diagnostic', () => {
    const result = parseDiagnostic(
      'src/example.ts:10:5: Something is wrong [Warning/no-console]',
    )

    expect(result).toBeDefined()
    expect(result?.filePath).toBe('src/example.ts')

    expect(result?.diagnostic.message).toBe(
      'Something is wrong',
    )

    expect(result?.diagnostic.severity).toBe(
      vscode.DiagnosticSeverity.Warning,
    )

    expect(result?.diagnostic.source).toBe('LoS')
    expect(result?.diagnostic.code).toBe('no-console')

    expect(result?.diagnostic.range).toBeInstanceOf(
      vscode.Range,
    )

    expect(RangeMock).toHaveBeenCalledWith(
      9,
      4,
      9,
      4,
    )
  })

  it('parses an error diagnostic', () => {
    const result = parseDiagnostic(
      'src/example.ts:10:5: Something is wrong [Error/no-undef]',
    )

    expect(result?.diagnostic.severity).toBe(
      vscode.DiagnosticSeverity.Error,
    )
  })

  it('returns undefined for an invalid line', () => {
    expect(
      parseDiagnostic('not a diagnostic'),
    ).toBeUndefined()
  })
})