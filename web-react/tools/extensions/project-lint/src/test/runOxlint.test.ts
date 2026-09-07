import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const spawnMock = vi.hoisted(() =>
  vi.fn(),
)

const fileMock = vi.hoisted(() =>
  vi.fn(),
)

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

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}))

vi.mock('vscode', () => ({
  Uri: {
    file: fileMock,
  },

  Range: RangeMock,
  Diagnostic: DiagnosticMock,

  DiagnosticSeverity: {
    Error: 'Error',
    Warning: 'Warning',
  },
}))

import { runOxlint } from '../oxlint/runOxlint.ts'

describe('[Project Lint] runOxlint', () => {
  const stdout = {
    on: vi.fn(),
  }

  const stderr = {
    on: vi.fn(),
  }

  const child = {
    stdout,
    stderr,
    on: vi.fn(),
  }

  const append = vi.fn()
  const appendLine = vi.fn()

  const output = {
    append,
    appendLine,
  }

  const set = vi.fn()

  const diagnostics = {
    set,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    spawnMock.mockReturnValue(child)

    fileMock.mockImplementation(fsPath => ({
      fsPath,
    }))
  })

  it('spawns oxlint with the project root', () => {
    runOxlint(
      '/workspace/web-react',
      output as never,
      diagnostics as never,
    )

    expect(spawnMock).toHaveBeenCalledWith(
      'npm',
      ['run', 'oxlint', '--', '--format=unix'],
      {
        cwd: '/workspace/web-react',
      },
    )
  })

  it('parses stdout diagnostics and groups them by file', () => {
    runOxlint(
      '/workspace/web-react',
      output as never,
      diagnostics as never,
    )

    const stdoutHandler = stdout.on.mock.calls.find(
      ([event]) => event === 'data',
    )?.[1]

    expect(stdoutHandler).toBeDefined()

    stdoutHandler!(
      Buffer.from(
        'src/foo.ts:10:5: First problem [Warning/no-console]\n' +
        'src/foo.ts:20:3: Second problem [Error/no-undef]\n' +
        'src/bar.ts:5:1: Third problem [Warning/no-unused-vars]\n',
      ),
    )

    const closeHandler = child.on.mock.calls.find(
      ([event]) => event === 'close',
    )?.[1]

    closeHandler!()

    expect(fileMock).toHaveBeenCalledWith(
      '/workspace/web-react/src/foo.ts',
    )

    expect(fileMock).toHaveBeenCalledWith(
      '/workspace/web-react/src/bar.ts',
    )

    expect(set).toHaveBeenCalledTimes(2)

    expect(set.mock.calls[0][1]).toHaveLength(2)
    expect(set.mock.calls[1][1]).toHaveLength(1)
  })

  it('forwards stderr to the output channel', () => {
    runOxlint(
      '/workspace/web-react',
      output as never,
      diagnostics as never,
    )

    const stderrHandler = stderr.on.mock.calls.find(
      ([event]) => event === 'data',
    )?.[1]

    expect(stderrHandler).toBeDefined()

    stderrHandler!(Buffer.from('oxlint failed\n'))

    expect(append).toHaveBeenCalledWith(
      'oxlint failed\n',
    )
  })

  it('sets diagnostics and reports the problem count on close', () => {
    runOxlint(
      '/workspace/web-react',
      output as never,
      diagnostics as never,
    )

    const stdoutHandler = stdout.on.mock.calls.find(
      ([event]) => event === 'data',
    )?.[1]

    stdoutHandler!(
      Buffer.from(
        'src/foo.ts:10:5: First problem [Warning/no-console]\n' +
        'src/bar.ts:5:1: Second problem [Error/no-undef]\n',
      ),
    )

    const closeHandler = child.on.mock.calls.find(
      ([event]) => event === 'close',
    )?.[1]

    closeHandler!()

    expect(set).toHaveBeenCalledTimes(2)

    expect(appendLine).toHaveBeenCalledWith(
      'oxlint: 2 problems',
    )
  })

  it('reports no problems when oxlint produces no diagnostics', () => {
    runOxlint(
      '/workspace/web-react',
      output as never,
      diagnostics as never,
    )

    const closeHandler = child.on.mock.calls.find(
      ([event]) => event === 'close',
    )?.[1]

    closeHandler!()

    expect(set).not.toHaveBeenCalled()

    expect(appendLine).toHaveBeenCalledWith(
      'oxlint: 0 problems',
    )
  })
})