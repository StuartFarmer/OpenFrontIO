import { describe, expect, it } from "vitest";
import {
  hudCatalogCategories,
  hudCatalogEntries,
  hudCatalogEntriesWithTagName,
  hudCatalogStatuses,
  hudIconCatalog,
} from "../../../src/client/hud/ui/HudCatalog";
import "../../../src/client/hud/ui/HudComponents";

describe("HUD catalog manifest", () => {
  it("has complete metadata for every catalog entry", () => {
    for (const entry of hudCatalogEntries) {
      expect(entry.name).not.toBe("");
      expect(hudCatalogCategories).toContain(entry.category);
      expect(hudCatalogStatuses).toContain(entry.status);
      expect(entry.sourcePath).not.toBe("");
      expect(entry.summary).not.toBe("");
      expect(entry.examples.length).toBeGreaterThan(0);
    }
  });

  it("does not define duplicate tag names", () => {
    const tagNames = hudCatalogEntriesWithTagName().map(
      (entry) => entry.tagName,
    );
    expect(new Set(tagNames).size).toBe(tagNames.length);
  });

  it("registers every cataloged custom element", () => {
    for (const entry of hudCatalogEntriesWithTagName()) {
      expect(customElements.get(entry.tagName), entry.tagName).toBeDefined();
    }
  });

  it("documents named icon assets with usage guidance", () => {
    for (const icon of hudIconCatalog) {
      expect(icon.name).not.toBe("");
      expect(icon.assetPath).not.toBe("");
      expect(icon.usage).not.toBe("");
      expect(["image", "mask"]).toContain(icon.kind);
      expect(["sm", "md", "lg", "xl"]).toContain(icon.preferredSize);
    }
  });
});
