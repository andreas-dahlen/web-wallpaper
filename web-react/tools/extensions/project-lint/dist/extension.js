// src/extension.ts
import * as vscode7 from "vscode";

// src/vscode/subscriptions.ts
import * as vscode from "vscode";
function createCommandSubscriptions({
  refresh,
  refreshOxlint
}) {
  return [
    vscode.commands.registerCommand(
      "projectLint.refresh",
      refresh
    ),
    vscode.commands.registerCommand(
      "projectLint.refreshOx",
      refreshOxlint
    )
  ];
}

// src/helpers/resolveRoot.ts
import * as vscode2 from "vscode";
function resolveRoot(output) {
  const workspaceFolder = vscode2.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    output.appendLine(
      "[Project Lint] ERROR: workspace folder is missing"
    );
    throw new Error("Workspace folder is missing");
  }
  const settings = vscode2.workspace.getConfiguration(
    "projectLint"
  );
  const projectRoot = settings.get("projectRoot");
  if (!projectRoot) {
    output.appendLine(
      "[Project Lint] ERROR: projectRoot setting is missing"
    );
    throw new Error("projectRoot setting is missing");
  }
  return vscode2.Uri.joinPath(
    workspaceFolder.uri,
    ...projectRoot.split("/")
  ).fsPath;
}

// src/oxlint/runOxlint.ts
import path from "node:path";
import { spawn } from "node:child_process";
import * as vscode4 from "vscode";

// src/oxlint/parseOxlint.ts
import * as vscode3 from "vscode";
var pattern = /^(.+):(\d+):(\d+):\s+(.*)\s+\[(Error|Warning)\/([^\]]+)\]$/;
function parseDiagnostic(line) {
  const match = pattern.exec(line);
  if (!match) {
    return;
  }
  const filePath = match[1];
  const lineNumber = Number(match[2]) - 1;
  const columnNumber = Number(match[3]) - 1;
  const message = match[4];
  const severity = match[5];
  const code = match[6];
  const diagnostic = new vscode3.Diagnostic(
    new vscode3.Range(
      lineNumber,
      columnNumber,
      lineNumber,
      columnNumber
    ),
    message,
    severity === "Error" ? vscode3.DiagnosticSeverity.Error : vscode3.DiagnosticSeverity.Warning
  );
  diagnostic.source = "LoS";
  diagnostic.code = code;
  return {
    filePath,
    diagnostic
  };
}

// src/oxlint/runOxlint.ts
function runOxlint(projectRoot, output, diagnostics) {
  const child = spawn(
    "npm",
    ["run", "oxlint", "--", "--format=unix"],
    {
      cwd: projectRoot
    }
  );
  const parsed = /* @__PURE__ */ new Map();
  child.stdout.on("data", (data) => {
    const text = data.toString();
    for (const line of text.split("\n")) {
      const result = parseDiagnostic(line);
      if (!result) {
        continue;
      }
      const filePath = path.resolve(
        projectRoot,
        result.filePath
      );
      const existing = parsed.get(filePath) ?? [];
      existing.push(result.diagnostic);
      parsed.set(filePath, existing);
    }
  });
  child.stderr.on("data", (data) => {
    output.append(data.toString());
  });
  child.on("close", () => {
    for (const [filePath, fileDiagnostics] of parsed) {
      diagnostics.set(
        vscode4.Uri.file(filePath),
        fileDiagnostics
      );
    }
    let problemCount = 0;
    for (const fileDiagnostics of parsed.values()) {
      problemCount += fileDiagnostics.length;
    }
    output.appendLine(
      `oxlint: ${problemCount} problem${problemCount === 1 ? "" : "s"}`
    );
  });
}

// src/vscode/runTask.ts
import * as vscode5 from "vscode";
async function runTask(output) {
  const tasks2 = await vscode5.tasks.fetchTasks();
  const settings = vscode5.workspace.getConfiguration(
    "projectLint"
  );
  const taskLabel = settings.get("taskLabel");
  const task = tasks2.find((task2) => task2.name === taskLabel);
  if (!task) {
    output.appendLine(`Couldn't find any task with the name: ${taskLabel}`);
    return;
  }
  await vscode5.tasks.executeTask(task);
}

// src/vscode/statusBar.ts
import "vscode";
function toggleStatusBar(statusBar) {
  statusBar.text = "$(refresh)";
  statusBar.tooltip = "Project Lint: Refresh All Problems";
  statusBar.command = "projectLint.refresh";
  statusBar.show();
}

// src/extension.ts
function activate(context) {
  const output = vscode7.window.createOutputChannel("Project Lint");
  const diagnostics = vscode7.languages.createDiagnosticCollection("project-lint");
  output.appendLine("[Project Lint] loaded");
  const statusBar = vscode7.window.createStatusBarItem(
    vscode7.StatusBarAlignment.Right
  );
  context.subscriptions.push(
    output,
    diagnostics,
    ...createCommandSubscriptions({
      refresh,
      refreshOxlint
    }),
    vscode7.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("projectLint")) {
        return;
      }
      output.appendLine(
        "[Project Lint] configuration changed. Relaunching..."
      );
      refreshOxlint();
    }),
    vscode7.workspace.onDidSaveTextDocument((document) => {
      diagnostics.delete(document.uri);
    })
  );
  toggleStatusBar(statusBar);
  refreshOxlint();
  function refreshOxlint() {
    diagnostics.clear();
    output.appendLine("Running project-wide Oxlint");
    const projectRoot = resolveRoot(output);
    runOxlint(projectRoot, output, diagnostics);
  }
  function refresh() {
    refreshOxlint();
    void runTask(output);
  }
}
function deactivate() {
}
export {
  activate,
  deactivate
};
