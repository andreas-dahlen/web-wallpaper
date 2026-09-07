import * as z from 'zod'

export const compilerOutputsSchema = z.object({
  extension: z.boolean().optional(),
  lsp: z.boolean().optional(),
  meta: z.boolean().optional(),
  pathPatches: z.boolean().optional(),
  presets: z.boolean().optional(),
  tokens: z.boolean().optional(),
  schema: z.boolean().optional()
}).strict()

export const compilerLoggingSchema = z.object({
  trace: z.boolean().optional(),
  emissions: z.enum(['summary', 'verbose', 'off']).optional(),
}).strict()

export const compilerConfigSchema = z.object({
  tokenFolder: z.string().optional(),
  outDir: z.string().optional(),
  outputs: compilerOutputsSchema.optional(),
  logging: compilerLoggingSchema.optional(),
}).strict()