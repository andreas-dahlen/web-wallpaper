import type { EmitData } from '../extract/extractData.ts';
import { formatTokenFiles } from './format/formatTokenFiles.ts';
import { formatPresetFiles } from './format/formatPresetFiles.ts';
import { formatMetaFile } from './format/formatMetaFile.ts';
import { formatPathPatches } from './format/formatPathPatches.ts';
import { formatLspFile } from './format/formatLspFile.ts';
import { formatExtensionFile } from './format/formatExtensionFile.ts';
import type { CompilerConfig } from '../../types/run.types.ts';

export type FormatResult = {
  outputFile: string;
  content: string;
};

export type GeneratedOutput = {
  files: FormatResult[]
  patches: FormatResult[]
}

export function generateOutput(data: EmitData, config: CompilerConfig): GeneratedOutput {

  return {
    files: [
      ...(config.outputs.presets ? formatPresetFiles(data.presetFiles) : []),
      ...(config.outputs.tokens ? formatTokenFiles(data.tokenFiles) : []),
      ...(config.outputs.meta ? [formatMetaFile(data.metadata)] : []),
      ...(config.outputs.lsp ? [formatLspFile(data.lspData)] : []),
      ...(config.outputs.extension ? [formatExtensionFile(data.extensionData)] : []),
      ...(config.outputs.schema ? [data.jsonSchema] : [])
    ],
    patches: config.outputs.pathPatches ? formatPathPatches(data.metadata) : []
  }
}
