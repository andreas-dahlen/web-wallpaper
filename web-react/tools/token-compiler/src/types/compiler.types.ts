import type { Rule } from 'postcss';
import type { CssVarString, ValidPrefix } from '../oldSharedUtils/oldSharedCompiler.types.ts';

import type { IssueGroup } from './issueCollector.types.ts';
import type { rawTokenSchema, rawVariableSchema } from '../schema/tokenSchema.ts';
import * as z from "zod"

export type RawToken = z.infer<typeof rawTokenSchema>
export type RawVariable = z.infer<typeof rawVariableSchema>

//resolved Token
export type CompilerToken = {
  name: string
  tokenPath: string
  infix: string
  vars: CompilerVariable[]
};
export type CompilerVariable = {
  key: string
  name: string
  cssName: string
  values: Partial<Record<ValidPrefix, string>>
  effectiveAllowed: ValidPrefix[]
};
export type TokenResult = {
  token?: CompilerToken
  issues: IssueGroup[]
}
export type TokenGroup = {
  groupPath: string
  cssPath?: string
  cssData?: CssData
  tokens: CompilerToken[]
}
//CSS path is garanteed.
export type CssTokenGroup = TokenGroup & {
  cssPath: string
}
//cssData is garanteed.
export type CssDataTokenGroup = CssTokenGroup & {
  cssData: CssData
}

export type TokenGroupResult = {
  group: TokenGroup
  issues: IssueGroup[]
}
export type TokenGroupsResult = {
  groups: TokenGroup[]
  issues: IssueGroup[]
}
// glbal processing

export type PostData = {
  cssPath: string;
  variables: CssVarString[];
  oklchVariables: Array<[CssVarString, string]>;
};

// after CSS processing
export type CssData = { // CssModuleResult
  groupPath: string
  cssPath: string
  foundSelectors: string[]
  usableSelectors: string[]
  tokens: ProcessedToken[]
  foundFinalVariables: CssVarString[]
  declaredVariables: CssVarString[]
}
export type ProcessedToken = {
  name: string
  infix: string
  tokenPath: string
  processed: boolean
}

export type ExtractResult = {
  omittedPresetFiles: string[]
}

export type EmitResult = {
  extractResult: ExtractResult
  writeResult: FileResult
  patchResult: FileResult
}
export type FileResult = {
  updated: string[]
  skipped: string[]
}

//postcss
export type PresetResetData = Array<[Rule, Set<CssVarString>]>
export type WalkModuleResult = {
  rules: Map<string, Rule>
  foundSelectors: string[]
  usableSelectors: string[]
  foundFinalVariables: CssVarString[]
  declaredVariables: CssVarString[]
  presetResetData: PresetResetData
};