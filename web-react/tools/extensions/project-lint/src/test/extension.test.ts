import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const resolveRootMock = vi.hoisted(() =>
  vi.fn(),
)

const runOxlintMock = vi.hoisted(() =>
  vi.fn(),
)

const runTaskMock = vi.hoisted(() =>
  vi.fn(),
)

const createCommandSubscriptionsMock =
  vi.hoisted(() => vi.fn())

const createOutputChannelMock = vi.hoisted(() =>
  vi.fn(),
)

const createDiagnosticCollectionMock =
  vi.hoisted(() => vi.fn())

const onDidChangeConfigurationMock =
  vi.hoisted(() => vi.fn())

const onDidSaveTextDocumentMock =
  vi.hoisted(() => vi.fn())

vi.mock('../helpers/resolveRoot.ts', () => ({
  resolveRoot: resolveRootMock,
}))

vi.mock('../oxlint/runOxlint.ts', () => ({
  runOxlint: runOxlintMock,
}))

vi.mock('../vscode/runTask.ts', () => ({
  runTask: runTaskMock,
}))

vi.mock('../vscode/subscriptions.ts', () => ({
  createCommandSubscriptions:
    createCommandSubscriptionsMock,
}))

vi.mock('vscode', () => ({
  window: {
    createOutputChannel: createOutputChannelMock,
  },

  languages: {
    createDiagnosticCollection:
      createDiagnosticCollectionMock,
  },

  workspace: {
    onDidChangeConfiguration:
      onDidChangeConfigurationMock,

    onDidSaveTextDocument:
      onDidSaveTextDocumentMock,
  },
}))

import { activate } from '../extension.ts'

describe('[Project Lint] activate', () => {
  const appendLine = vi.fn()
  const clear = vi.fn()
  const deleteMock = vi.fn()

  const output = {
    appendLine,
  }

  const diagnostics = {
    clear,
    delete: deleteMock,
  }

  const commandSubscriptions = [
    {},
    {},
  ]

  const context = {
    subscriptions: [] as unknown[],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    context.subscriptions.length = 0

    createOutputChannelMock.mockReturnValue(output)

    createDiagnosticCollectionMock.mockReturnValue(
      diagnostics,
    )

    resolveRootMock.mockReturnValue(
      '/workspace/web-react',
    )

    createCommandSubscriptionsMock.mockReturnValue(
      commandSubscriptions,
    )

    onDidChangeConfigurationMock.mockImplementation(
      callback => ({
        callback,
      }),
    )

    onDidSaveTextDocumentMock.mockImplementation(
      callback => ({
        callback,
      }),
    )
  })

  it('initializes and launches Oxlint', () => {
    activate(context as never)

    expect(
      createOutputChannelMock,
    ).toHaveBeenCalledWith('Project Lint')

    expect(
      createDiagnosticCollectionMock,
    ).toHaveBeenCalledWith('project-lint')

    expect(appendLine).toHaveBeenCalledWith(
      '[Project Lint] loaded',
    )

    expect(resolveRootMock).toHaveBeenCalledWith(
      output,
    )

    expect(clear).toHaveBeenCalledOnce()

    expect(runOxlintMock).toHaveBeenCalledWith(
      '/workspace/web-react',
      output,
      diagnostics,
    )
  })

  it('relaunches Oxlint when projectLint configuration changes', () => {
    activate(context as never)

    const callback =
      onDidChangeConfigurationMock.mock.calls[0][0]

    callback({
      affectsConfiguration: vi.fn(() => true),
    })

    expect(clear).toHaveBeenCalledTimes(2)
    expect(resolveRootMock).toHaveBeenCalledTimes(2)
    expect(runOxlintMock).toHaveBeenCalledTimes(2)

    expect(appendLine).toHaveBeenCalledWith(
      '[Project Lint] configuration changed. Relaunching...',
    )
  })

  it('ignores unrelated configuration changes', () => {
    activate(context as never)

    const callback =
      onDidChangeConfigurationMock.mock.calls[0][0]

    callback({
      affectsConfiguration: vi.fn(() => false),
    })

    expect(clear).toHaveBeenCalledOnce()
    expect(resolveRootMock).toHaveBeenCalledOnce()
    expect(runOxlintMock).toHaveBeenCalledOnce()
  })

  it('clears diagnostics when a document is saved', () => {
    activate(context as never)

    const callback =
      onDidSaveTextDocumentMock.mock.calls[0][0]

    const uri = {
      fsPath: '/workspace/src/example.ts',
    }

    callback({ uri })

    expect(deleteMock).toHaveBeenCalledWith(uri)
  })

  it('passes refresh actions to command subscriptions', () => {
    activate(context as never)

    expect(
      createCommandSubscriptionsMock,
    ).toHaveBeenCalledOnce()

    const actions =
      createCommandSubscriptionsMock.mock.calls[0][0]

    expect(actions.refresh).toEqual(
      expect.any(Function),
    )

    expect(actions.refreshOxlint).toEqual(
      expect.any(Function),
    )
  })

  it('refreshes Oxlint and runs the project task', () => {
    activate(context as never)

    const actions =
      createCommandSubscriptionsMock.mock.calls[0][0]

    actions.refresh()

    expect(clear).toHaveBeenCalledTimes(2)

    expect(runOxlintMock).toHaveBeenCalledTimes(2)

    expect(runTaskMock).toHaveBeenCalledWith(
      output,
    )
  })

  it('refreshes Oxlint through the Oxlint refresh action', () => {
    activate(context as never)

    const actions =
      createCommandSubscriptionsMock.mock.calls[0][0]

    actions.refreshOxlint()

    expect(clear).toHaveBeenCalledTimes(2)
    expect(runOxlintMock).toHaveBeenCalledTimes(2)

    expect(runTaskMock).not.toHaveBeenCalled()
  })

  it('registers its subscriptions', () => {
    activate(context as never)

    expect(context.subscriptions).toHaveLength(6)

    expect(context.subscriptions).toContain(
      output,
    )

    expect(context.subscriptions).toContain(
      diagnostics,
    )

    for (const subscription of commandSubscriptions) {
      expect(context.subscriptions).toContain(
        subscription,
      )
    }
  })
})