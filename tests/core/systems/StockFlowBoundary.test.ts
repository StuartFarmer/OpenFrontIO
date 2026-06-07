import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STOCKFLOW_IMPORT_PATTERN =
  /from\s+["'][^"']*StockFlow(?:System|Runtime|Compiler)["']/;

const ALLOWED_STOCKFLOW_IMPORTERS = [
  "src/games/openfront/systems/StockFlowCompiler.ts",
  "src/games/openfront/systems/StockFlowRuntime.ts",
  "src/games/openfront/systems/models/AgricultureSystem.ts",
  "src/games/openfront/systems/models/FoodSystem.ts",
  "src/games/openfront/systems/models/PopulationSystem.ts",
  "src/games/openfront/systems/models/ResourceProductionSystem.ts",
  "src/games/openfront/systems/models/WarSystem.ts",
];

describe("StockFlow boundary", () => {
  it("keeps StockFlow imports quarantined to compatibility economy code", () => {
    const importers = sourceFiles("src")
      .filter((path) =>
        STOCKFLOW_IMPORT_PATTERN.test(readFileSync(path, "utf8")),
      )
      .sort();

    expect(importers).toEqual(ALLOWED_STOCKFLOW_IMPORTERS);
  });

  it("documents StockFlow as internal compatibility code", () => {
    for (const path of [
      "src/games/openfront/systems/StockFlowSystem.ts",
      "src/games/openfront/systems/StockFlowCompiler.ts",
      "src/games/openfront/systems/StockFlowRuntime.ts",
    ]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("@internal");
      expect(source.toLowerCase()).toContain("compatibility");
    }
  });

  it("keeps StockFlow implementation files out of core systems", () => {
    const coreSystemFiles = sourceFiles("src/core/systems");

    expect(
      coreSystemFiles.filter((path) => path.includes("StockFlow")),
    ).toEqual([]);
    expect(
      coreSystemFiles.filter((path) => path.endsWith("ValueAddress.ts")),
    ).toEqual([]);
  });
});

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...sourceFiles(path));
      continue;
    }
    if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      files.push(path);
    }
  }
  return files;
}
