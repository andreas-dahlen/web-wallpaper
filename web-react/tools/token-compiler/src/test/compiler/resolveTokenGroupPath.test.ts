import { resolveTokenGroupPath } from '../../compiler/resolvers/resolveTokenGroupPath.ts';
import { describe, it, expect } from "vitest";
describe("[COMPILER]", () => {
  describe("[resolveTokenGroupPath]", () => {
    it.each([
      [
        "/project/tokens/button.json",
        "/project/tokens/button.json",
      ],
      [
        "/project/tokens/slider/thumb.json",
        "/project/tokens/slider",
      ],
      [
        "/project/tokens/components/button/primary.json",
        "/project/tokens/components/button",
      ],
      [
        String.raw`C:\\project\\tokens\\slider\\thumb.json`,
        "C:/project/tokens/slider",
      ],
    ])("resolves %s", (input, expected) => {
      expect(resolveTokenGroupPath(input))
        .toBe(expected);
    });

    it("throws for paths outside tokens directory", () => {
      expect(() =>
        resolveTokenGroupPath("/project/styles/button.json")
      ).toThrow();
    });
  })
})