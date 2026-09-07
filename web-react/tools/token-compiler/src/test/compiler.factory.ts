import { createIssueCollector } from '../compiler/tracking/issueCollector.ts';
import type { CompilerToken, CompilerVariable, CssTokenGroup, RawVariable, TokenGroup } from '../types/compiler.types.ts';

export function createRawVariable(
  overrides: Partial<RawVariable> = {}
): RawVariable {
  return {
    values: { f: "black" },
    ...overrides,
  };
}
export const compilerVariable_DEFAULT = {
  key: "bg",
  name: "backGround",
  cssName: "back-ground",
  values: { f: "black" },
  effectiveAllowed: ["o", "p", "f"]
} satisfies CompilerVariable

export function createCompilerVariable(
  overrides: Partial<CompilerVariable> = {}
): CompilerVariable {
  return {
    ...compilerVariable_DEFAULT,
    ...overrides,
  };
}
export function createCompilerToken({
  vars = [createCompilerVariable()],
  ...overrides
}: Partial<CompilerToken> = {}): CompilerToken {
  return {
    name: 'button',
    tokenPath: '/tokens/button.jsonc',
    infix: 'default',
    vars,
    ...overrides,
  };
}


export function createTokenGroup({
  tokens = [createCompilerToken()],
  ...overrides
}: Partial<TokenGroup> = {}): TokenGroup {
  return {
    groupPath: '/tokens/button',
    // cssPath: '/css/Button.module.css',
    tokens,
    ...overrides,
  };
}

export function createCssTokenGroup({
  cssPath = '/css/Button.module.css',
  ...overrides
}: Partial<CssTokenGroup> = {}): CssTokenGroup {
  return {
    ...createTokenGroup(overrides),
    cssPath,
  };
}

export function createTestCollector() {
  const collector = createIssueCollector()
  collector.setSubject("testing")
  collector.scope({ path: "test.json", value: "value" })
  return collector
}