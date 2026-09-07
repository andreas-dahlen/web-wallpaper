import * as vscode from 'vscode'

export function toggleStatusBar(
  statusBar: vscode.StatusBarItem
): void {

  statusBar.text = '$(refresh)'
  statusBar.tooltip = 'Project Lint: Refresh All Problems'
  statusBar.command = 'projectLint.refresh'
  statusBar.show()
}