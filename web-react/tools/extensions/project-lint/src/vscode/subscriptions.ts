import * as vscode from 'vscode'

type ProjectLintActions = {
  refresh(): void
  refreshOxlint(): void
}
export function createCommandSubscriptions({
  refresh,
  refreshOxlint,
}: ProjectLintActions): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand(
      'projectLint.refresh',
      refresh,
    ),

    vscode.commands.registerCommand(
      'projectLint.refreshOx',
      refreshOxlint,
    )
  ]
}