import * as vscode from 'vscode'

export function resolveRoot(
  output: vscode.OutputChannel
): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

  if (!workspaceFolder) {
    output.appendLine(
      '[Project Lint] ERROR: workspace folder is missing',
    )
    throw new Error('Workspace folder is missing')
  }

  const settings = vscode.workspace.getConfiguration(
    'projectLint',
  )

  const projectRoot = settings.get<string>('projectRoot')

  if (!projectRoot) {
    output.appendLine(
      '[Project Lint] ERROR: projectRoot setting is missing',
    )
    throw new Error('projectRoot setting is missing')
  }

  return vscode.Uri.joinPath(
    workspaceFolder.uri,
    ...projectRoot.split('/'),
  ).fsPath
}