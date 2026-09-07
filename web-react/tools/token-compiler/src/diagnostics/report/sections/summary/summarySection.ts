import { colors, emitValueMsg, paint } from '../../../../utils/string.ts';
import type { DiagnosticData } from '../../../../types/diagnostics.types.ts';
import type { ReportEntry, ReportSection } from '../../buildReport.ts';
import type { CompilerOutputs } from '../../../../types/run.types.ts';

export function summarySection(data: DiagnosticData, outputs: CompilerOutputs): ReportSection {
  const entries: ReportEntry[] = [];

  const header = (data.processedGroupCount > 1)
    ? `\n✨ ${paint(`[DesignTokens]`, colors.heading)} ${paint(`Initialization complete!`, colors.value)} (${paint(data.processedGroupCount, colors.value)})`
    : `\n🔄 ${paint(`[DesignTokens]`, colors.heading)} ${paint(`Update complete!`, colors.value)}`

  const { presets,
    tokens,
    meta,
    lsp,
    extension,
    schema } = data.generatedFiles

  const { css, jsonc } = data.generatedPatches

  entries.push({
    title: `🎯 ${paint(`[Token files]`, colors.heading)}  (${paint(emitValueMsg(tokens.written, outputs.tokens), colors.value)})   `
  }, {
    title: `📁 ${paint(`[Preset files]`, colors.heading)} (${paint(emitValueMsg(presets.written, outputs.presets), colors.value)}) `
  }, {
    title: `🧩 ${paint(`[Metadata]`, colors.heading)}     (${paint(emitValueMsg(meta.written, outputs.meta), colors.value)} )`
  }, {
    title: `🔌 ${paint(`[Extension]`, colors.heading)}    (${paint(emitValueMsg(extension.written, outputs.extension), colors.value)})`
  }, {
    title: `🔮 ${paint(`[LSP]`, colors.heading)}          (${paint(emitValueMsg(lsp.written, outputs.lsp), colors.value)}) `
  }, {
    title: `📐 ${paint(`[JSON Schema]`, colors.heading)}  (${paint(emitValueMsg(schema.written, outputs.schema), colors.value)} ) `
  }, {
    title: `\n  🩹 ${paint(`[Css patches]`, colors.heading)}  (${paint(emitValueMsg(css.written, outputs.pathPatches), colors.value)})  `
  }, {
    title: `🩹 ${paint(`[Jsonc patches]`, colors.heading)}(${paint(emitValueMsg(jsonc.written, outputs.pathPatches), colors.value)})  `
  })

  return {
    title: header,
    entries
  };
}