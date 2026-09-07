import path from 'node:path'
import { spawn } from 'node:child_process'
import * as vscode from 'vscode'

import { parseDiagnostic } from './parseOxlint.ts'

export function runOxlint(
  projectRoot: string,
  output: vscode.OutputChannel,
  diagnostics: vscode.DiagnosticCollection,
): void {
  const child = spawn(
    'npm',
    ['run', 'oxlint', '--', '--format=unix'],
    {
      cwd: projectRoot,
    },
  )

  const parsed = new Map<string, vscode.Diagnostic[]>()

  child.stdout.on('data', data => {
    const text = data.toString()

    for (const line of text.split('\n')) {
      const result = parseDiagnostic(line)

      if (!result) {
        continue
      }

      const filePath = path.resolve(
        projectRoot,
        result.filePath,
      )

      const existing = parsed.get(filePath) ?? []
      existing.push(result.diagnostic)
      parsed.set(filePath, existing)
    }
  })

  child.stderr.on('data', data => {
    output.append(data.toString())
  })

  child.on('close', () => {
    for (const [filePath, fileDiagnostics] of parsed) {
      diagnostics.set(
        vscode.Uri.file(filePath),
        fileDiagnostics,
      )
    }

    let problemCount = 0

    for (const fileDiagnostics of parsed.values()) {
      problemCount += fileDiagnostics.length
    }

    output.appendLine(
      `oxlint: ${problemCount} problem${problemCount === 1 ? '' : 's'}`,
    )
  })
}