import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("canonical dynamics core boundary", () => {
  test("dynamics_core_has_no_react_flow_imports", () => {
    for (const source of DYNAMICS_CORE_SOURCES) {
      const contents = readFileSync(new URL(source, import.meta.url), "utf8");
      expect(contents).not.toContain("@xyflow/react");
    }
  });

  test("dynamics_core_has_no_foundation_runtime_imports", () => {
    for (const source of DYNAMICS_CORE_SOURCES) {
      const contents = readFileSync(new URL(source, import.meta.url), "utf8");
      expect(contents).not.toContain("games/foundation");
      expect(contents).not.toContain("../../../games/foundation");
    }
  });
});

const DYNAMICS_CORE_SOURCES = [
  "../../../src/core/systems/dynamics/DynamicsSchema.ts",
  "../../../src/core/systems/dynamics/DynamicsCompiler.ts",
  "../../../src/core/systems/dynamics/DynamicsSimulator.ts",
  "../../../src/core/systems/dynamics/DynamicsGraphBinding.ts",
  "../../../src/core/systems/dynamics/index.ts",
] as const;
