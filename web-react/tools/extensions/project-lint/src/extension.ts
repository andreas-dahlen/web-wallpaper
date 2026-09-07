import * as vscode from 'vscode'
import { createCommandSubscriptions } from './vscode/subscriptions.ts'
import { resolveRoot } from './helpers/resolveRoot.ts'
import { runOxlint } from './oxlint/runOxlint.ts'
import { runTask } from './vscode/runTask.ts'
import { toggleStatusBar } from './vscode/statusBar.ts'

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Project Lint')
  const diagnostics = vscode.languages.createDiagnosticCollection('project-lint')

  output.appendLine('[Project Lint] loaded')
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
  )


  context.subscriptions.push(
    output,
    diagnostics,
    ...createCommandSubscriptions({
      refresh,
      refreshOxlint
    }),

    vscode.workspace.onDidChangeConfiguration(event => {
      if (!event.affectsConfiguration('projectLint')) {
        return
      }

      output.appendLine(
        '[Project Lint] configuration changed. Relaunching...',
      )
      refreshOxlint()
    }),

    vscode.workspace.onDidSaveTextDocument(document => {
      diagnostics.delete(document.uri)
    })
  )

  toggleStatusBar(statusBar)
  refreshOxlint()

  function refreshOxlint(): void {
    diagnostics.clear()
    output.appendLine('Running project-wide Oxlint')

    const projectRoot = resolveRoot(output)
    runOxlint(projectRoot, output, diagnostics)
  }

  function refresh(): void {
    refreshOxlint()
    void runTask(output)
  }
}

export function deactivate(): void { }