import * as vscode from 'vscode'

export async function runTask(output: vscode.OutputChannel): Promise<void> {
  const tasks = await vscode.tasks.fetchTasks()

  const settings = vscode.workspace.getConfiguration(
    'projectLint',
  )
  const taskLabel = settings.get<string>('taskLabel')

  const task = tasks.find(task => task.name === taskLabel)

  if (!task) {
    output.appendLine(`Couldn't find any task with the name: ${taskLabel}`)
    return
  }

  await vscode.tasks.executeTask(task)
}