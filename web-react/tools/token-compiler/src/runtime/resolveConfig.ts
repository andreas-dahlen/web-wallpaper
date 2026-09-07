import path from 'node:path';

import { loadCompilerConfig } from './loadCompilerConfig.ts';
import type { CompilerConfig } from '../types/run.types.ts';


export function resolveConfig(rootDir: string, tokenFolder: string | undefined): CompilerConfig | null {

  const cliDirectory = path.dirname(process.argv[1])
  const compilerDirectory = path.dirname(cliDirectory)
  const projectRoot = path.resolve(
    compilerDirectory,
    rootDir,
  )

  const config = loadCompilerConfig(projectRoot)

  const tokenRaw = config.tokenFolder ?? tokenFolder

  if (!tokenRaw) {
    throw new Error("Error: Couldn't resolve token path in either compiler.config.json or vsCode settings")
  }

  const outPath = config.outDir ? path.resolve(projectRoot, config.outDir) : null

  const outputs = {
    extension: config.outputs?.extension ?? false,
    lsp: config.outputs?.lsp ?? false,
    meta: config.outputs?.meta ?? false,
    pathPatches: config.outputs?.pathPatches ?? false,
    presets: config.outputs?.presets ?? false,
    tokens: config.outputs?.tokens ?? false,
    schema: config.outputs?.schema ?? false
  }

  const logging = {
    trace: config.logging?.trace ?? false,
    emissions: config.logging?.emissions ?? "summary"
  }

  return {
    rootDir: projectRoot,
    tokenPath: path.resolve(projectRoot, tokenRaw),
    outPath,
    logging,
    outputs
  }
}