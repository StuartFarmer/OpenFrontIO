import { describe, expect, it } from "vitest";
import {
  isFoundationDynamicLocation,
  isFoundationDynamicsLocation,
  isFoundationLocation,
} from "../../src/games/foundation/client/FoundationRoutes";

describe("Foundation route helpers", () => {
  it("keeps foundation dynamics distinct from the foundation world route", () => {
    expect(isFoundationDynamicsLocation("/foundation/dynamics", "")).toBe(true);
    expect(isFoundationDynamicsLocation("/foundation/dynamics/", "")).toBe(
      true,
    );
    expect(isFoundationLocation("/foundation/dynamics", "")).toBe(false);
    expect(isFoundationLocation("/foundation/dynamics/", "")).toBe(false);
  });

  it("keeps foundation dynamic tuning distinct from the foundation world route", () => {
    expect(isFoundationDynamicLocation("/foundation/dynamic", "")).toBe(true);
    expect(isFoundationDynamicLocation("/foundation/dynamic/", "")).toBe(true);
    expect(isFoundationLocation("/foundation/dynamic", "")).toBe(false);
    expect(isFoundationLocation("/foundation/dynamic/", "")).toBe(false);
  });

  it("still matches the foundation world route", () => {
    expect(isFoundationLocation("/foundation", "")).toBe(true);
    expect(isFoundationLocation("/foundation/", "")).toBe(true);
    expect(isFoundationDynamicsLocation("/foundation", "")).toBe(false);
    expect(isFoundationDynamicsLocation("/foundation/", "")).toBe(false);
  });

  it("lets the dynamics search flag win over the broad foundation search flag", () => {
    expect(isFoundationDynamicsLocation("/", "?foundation-dynamics")).toBe(
      true,
    );
    expect(isFoundationLocation("/", "?foundation-dynamics")).toBe(false);
  });

  it("lets the dynamic search flag win over the broad foundation search flag", () => {
    expect(isFoundationDynamicLocation("/", "?foundation-dynamic")).toBe(true);
    expect(isFoundationLocation("/", "?foundation-dynamic")).toBe(false);
  });
});
