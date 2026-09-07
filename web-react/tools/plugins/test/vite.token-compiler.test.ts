import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { tmpdir } from 'node:os'

import { describe, expect, it, vi } from 'vitest'

import { tokenCompiler } from '../src/vite.token-compiler.ts'

const spawnMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}))

const createProject = (config?: string) => {
  const projectRoot = fs.mkdtempSync(
    path.join(tmpdir(), 'token-compiler-test-'),
  )

  if (config !== undefined) {
    fs.writeFileSync(
      path.join(projectRoot, 'compiler.config.json'),
      config,
    )
  }

  return projectRoot
}

const getBuildStart = () => {
  const hook = tokenCompiler().buildStart

  if (typeof hook !== 'function') {
    throw new TypeError('Expected buildStart to be a function')
  }

  return hook
}

const withCwd = async <T>(
  cwd: string,
  callback: () => Promise<T>,
): Promise<T> => {
  const previousCwd = process.cwd()
  process.chdir(cwd)

  try {
    return await callback()
  } finally {
    process.chdir(previousCwd)
  }
}

describe('[VITE] tokenCompiler', () => {
  it('warns when compiler.config.json is missing', async () => {
    const projectRoot = createProject()
    const warn = vi.fn()

    await withCwd(projectRoot, async () => {
      await getBuildStart().call(
        { warn } as never,
        {} as never,
      )
    })

    expect(warn).toHaveBeenCalledWith(
      'compiler.config.json not found — token compiler disabled',
    )

    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('runs the compiler using the configured CLI file', async () => {
    const projectRoot = createProject(`
      {
        // Token compiler configuration
        "cliFile": "tools/token-compiler/dist/cli.js",
      }
    `)

    const compiler = new EventEmitter()
    spawnMock.mockReturnValue(compiler)

    await withCwd(projectRoot, async () => {
      const promise = getBuildStart().call(
        { warn: vi.fn() } as never,
        {} as never,
      )

      compiler.emit('close', 0)

      await promise
    })

    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      [
        path.resolve(
          projectRoot,
          'tools/token-compiler/dist/cli.js',
        ),
        'build',
        projectRoot,
      ],
      {
        stdio: 'inherit',
      },
    )
  })

  it('rejects when the compiler exits with a non-zero code', async () => {
    const projectRoot = createProject(`
      {
        "cliFile": "tools/token-compiler/dist/cli.js"
      }
    `)

    const compiler = new EventEmitter()
    spawnMock.mockReturnValue(compiler)

    await withCwd(projectRoot, async () => {
      const promise = getBuildStart().call(
        { warn: vi.fn() } as never,
        {} as never,
      )

      compiler.emit('close', 1)

      await expect(promise).rejects.toThrow(
        'Token compiler exited with code 1',
      )
    })
  })

  it('rejects when the compiler process emits an error', async () => {
    const projectRoot = createProject(`
      {
        "cliFile": "tools/token-compiler/dist/cli.js"
      }
    `)

    const compiler = new EventEmitter()
    spawnMock.mockReturnValue(compiler)

    await withCwd(projectRoot, async () => {
      const promise = getBuildStart().call(
        { warn: vi.fn() } as never,
        {} as never,
      )

      compiler.emit(
        'error',
        new Error('failed to start compiler'),
      )

      await expect(promise).rejects.toThrow(
        'failed to start compiler',
      )
    })
  })
})