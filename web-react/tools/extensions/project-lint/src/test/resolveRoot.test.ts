import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import * as vscode from 'vscode'

const workspaceFolders = vi.hoisted(
  () => [] as unknown[],
)

const joinPathMock = vi.hoisted(() =>
  vi.fn(),
)

const getConfigurationMock = vi.hoisted(() =>
  vi.fn(),
)

const getMock = vi.hoisted(() =>
  vi.fn(),
)

vi.mock('vscode', () => ({
  Uri: {
    joinPath: joinPathMock,
  },

  workspace: {
    get workspaceFolders() {
      return workspaceFolders.length > 0
        ? workspaceFolders
        : undefined
    },

    getConfiguration: getConfigurationMock,
  },
}))

import { resolveRoot } from '../helpers/resolveRoot.ts'

describe('[Project Lint] resolveRoot', () => {
  const appendLine = vi.fn()

  const output = {
    appendLine,
  } as unknown as vscode.OutputChannel

  beforeEach(() => {
    vi.clearAllMocks()

    getMock.mockReturnValue('web-react')
    getConfigurationMock.mockReturnValue({
      get: getMock,
    })

    workspaceFolders.length = 0
    workspaceFolders.push({
      uri: {
        fsPath: '/workspace',
      } as vscode.Uri,
    } as vscode.WorkspaceFolder)

    joinPathMock.mockReturnValue({
      fsPath: '/workspace/web-react',
    } as vscode.Uri)
  })

  it('resolves projectRoot relative to the workspace folder', () => {
    const result = resolveRoot(output)

    expect(result).toBe('/workspace/web-react')

    expect(getConfigurationMock)
      .toHaveBeenCalledWith('projectLint')

    expect(getMock)
      .toHaveBeenCalledWith('projectRoot')

    expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
      expect.objectContaining({
        fsPath: '/workspace',
      }),
      'web-react',
    )
  })

  it('supports nested projectRoot paths', () => {
    getMock.mockReturnValue('tools/lint-project')

    resolveRoot(output)

    expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
      expect.anything(),
      'tools',
      'lint-project',
    )
  })

  it('throws when the workspace folder is missing', () => {
    workspaceFolders.length = 0

    expect(() => resolveRoot(output))
      .toThrow('Workspace folder is missing')

    expect(appendLine).toHaveBeenCalledWith(
      '[Project Lint] ERROR: workspace folder is missing',
    )

    expect(getConfigurationMock).not.toHaveBeenCalled()
    expect(getMock).not.toHaveBeenCalled()
  })

  it('throws when projectRoot is missing', () => {
    getMock.mockReturnValue(undefined)

    expect(() => resolveRoot(output))
      .toThrow('projectRoot setting is missing')

    expect(appendLine).toHaveBeenCalledWith(
      '[Project Lint] ERROR: projectRoot setting is missing',
    )

    expect(vscode.Uri.joinPath).not.toHaveBeenCalled()
  })
})