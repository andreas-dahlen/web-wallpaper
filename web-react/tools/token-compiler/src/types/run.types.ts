import type z from 'zod';
import { compilerConfigSchema, compilerOutputsSchema } from '../schema/configSchema.ts';
import type { TokenCompiler } from '../compiler/compilerService.ts';
import type { FSWatcher } from 'chokidar';
export type CompilerOptions = z.infer<typeof compilerConfigSchema>

export type CompilerConfig = {
  rootDir: string
  tokenPath: string
  outPath: string | null
  outputs: CompilerOutputs
  logging: CompilerLogs
}
export type CompilerOutputs = Required<z.infer<typeof compilerOutputsSchema>>

type CompilerLogs = {
  trace: boolean
  emissions: "summary" | "verbose" | "off"
}

export type EmitConfig = CompilerConfig & {
  outPath: string
}

export type CompilerRuntime = {
  compiler: TokenCompiler
  contentWatcher: FSWatcher
  configWatcher: FSWatcher
  dispose(): Promise<void>
}