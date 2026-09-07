import type { FileResult } from '../../../types/compiler.types.ts'
import type { GeneratedFiles } from '../../../types/diagnostics.types.ts'

export function analyzeWriteResult(result: FileResult | undefined): GeneratedFiles {

  const generatedFiles: GeneratedFiles = {
    presets: {
      written: [],
      skipped: []
    },
    tokens: {
      written: [],
      skipped: []
    },
    meta: {
      written: [],
      skipped: []
    },
    lsp: {
      written: [],
      skipped: []
    },
    extension: {
      written: [],
      skipped: []
    },
    schema: {
      written: [],
      skipped: []
    }
  }

  const writtenPaths = result?.updated ?? []
  const skippedPaths = result?.skipped ?? []

  for (const file of writtenPaths) {
    if (file.endsWith(".preset.ts")) {
      generatedFiles.presets.written.push(file)
    } else if (file.endsWith(".token.ts")) {
      generatedFiles.tokens.written.push(file)
    } else if (file.endsWith("metadata.generated.jsonc")) {
      generatedFiles.meta.written.push(file)
    } else if (file.endsWith("lsp.generated.ts")) {
      generatedFiles.lsp.written.push(file)
    } else if (file.endsWith("extension.generated.jsonc")) {
      generatedFiles.extension.written.push(file)
    } else if (file.endsWith("generated.schema.json")) {
      generatedFiles.schema.written.push(file)
    }
  }

  for (const file of skippedPaths) {
    if (file.endsWith(".preset.ts")) {
      generatedFiles.presets.skipped.push(file)
    } else if (file.endsWith(".token.ts")) {
      generatedFiles.tokens.skipped.push(file)
    } else if (file.endsWith("metadata.generated.jsonc")) {
      generatedFiles.meta.skipped.push(file)
    } else if (file.endsWith("lsp.generated.ts")) {
      generatedFiles.lsp.skipped.push(file)
    } else if (file.endsWith("extension.generated.jsonc")) {
      generatedFiles.extension.skipped.push(file)
    } else if (file.endsWith("generated.schema.json")) {
      generatedFiles.schema.skipped.push(file)
    }
  }


  sortFiles(generatedFiles.presets.written)
  sortFiles(generatedFiles.presets.skipped)
  sortFiles(generatedFiles.tokens.written)
  sortFiles(generatedFiles.tokens.skipped)

  return generatedFiles
}

function sortFiles(files: string[]) {
  files.sort((a, b) => a.localeCompare(b))
}
