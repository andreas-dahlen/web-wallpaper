import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { findTokenPaths } from '../../compiler/discovery/findTokenPaths.ts';


function createTempDir() {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "token-test-")
  );
}


function createFile(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, "{}");
}

describe('[COMPILER]', () => {
  describe("findTokenPaths", () => {

    it("finds json and jsonc files in a directory", () => {
      const dir = createTempDir();

      createFile(path.join(dir, "button.json"));
      createFile(path.join(dir, "slider.jsonc"));
      createFile(path.join(dir, "ignored.txt"));

      const result = findTokenPaths(dir);

      expect(result).toEqual([
        path.join(dir, "button.json"),
        path.join(dir, "slider.jsonc"),
      ]);
    });


    it("finds token files recursively", () => {
      const dir = createTempDir();

      createFile(
        path.join(dir, "components", "button.json")
      );

      createFile(
        path.join(dir, "components", "slider.jsonc")
      );

      const result = findTokenPaths(dir);

      expect(result).toEqual([
        path.join(dir, "components", "button.json"),
        path.join(dir, "components", "slider.jsonc"),
      ]);
    });


    it("returns a single token file when given a file path", () => {
      const dir = createTempDir();

      const file = path.join(dir, "button.json");

      createFile(file);

      const result = findTokenPaths(file);

      expect(result).toEqual([
        file,
      ]);
    });


    it("sorts paths alphabetically", () => {
      const dir = createTempDir();

      createFile(path.join(dir, "z.json"));
      createFile(path.join(dir, "a.json"));
      createFile(path.join(dir, "m.json"));

      const result = findTokenPaths(dir);

      expect(result).toEqual([
        path.join(dir, "a.json"),
        path.join(dir, "m.json"),
        path.join(dir, "z.json"),
      ])
    })
  })
})