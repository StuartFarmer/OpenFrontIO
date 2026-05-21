import {
  addResourceDelta,
  clampResourceDeltaToCapacity,
  createZeroResources,
  remainingResourceCapacity,
  resourceRegenAmount,
  resourceRegenDelta,
  resourcesFromGoldAmount,
} from "../../../src/core/game/Resources";

describe("Resources", () => {
  test("resourcesFromGoldAmount creates equal resource payloads", () => {
    expect(resourcesFromGoldAmount(100n)).toEqual({
      food: 100n,
      energy: 100n,
      materials: 100n,
    });
  });

  test("resource helpers return independent stockpile objects", () => {
    const first = createZeroResources();
    const second = createZeroResources();

    first.food = 10n;

    expect(second).toEqual({
      food: 0n,
      energy: 0n,
      materials: 0n,
    });
  });

  test("addResourceDelta adds partial resource payloads", () => {
    expect(
      addResourceDelta(resourcesFromGoldAmount(100n), {
        food: 5n,
        materials: 20n,
      }),
    ).toEqual({
      food: 105n,
      energy: 100n,
      materials: 120n,
    });
  });

  test("remainingResourceCapacity computes positive per-resource headroom", () => {
    const current = { food: 90n, energy: 120n, materials: 10n };
    const capacity = { food: 100n, energy: 100n, materials: 40n };

    expect(remainingResourceCapacity(current, capacity)).toEqual({
      food: 10n,
      energy: 0n,
      materials: 30n,
    });
  });

  test("clampResourceDeltaToCapacity clamps each resource independently", () => {
    const current = { food: 90n, energy: 50n, materials: 99n };
    const delta = { food: 20n, energy: 20n, materials: 20n };
    const capacity = { food: 100n, energy: 100n, materials: 100n };

    expect(clampResourceDeltaToCapacity(current, delta, capacity)).toEqual({
      food: 10n,
      energy: 20n,
      materials: 1n,
    });
  });

  test("resourceRegenAmount returns zero at or above capacity", () => {
    expect(resourceRegenAmount(100n, 100n)).toBe(0n);
    expect(resourceRegenAmount(120n, 100n)).toBe(0n);
    expect(resourceRegenAmount(10n, 0n)).toBe(0n);
  });

  test("resourceRegenAmount follows the troop-shaped curve", () => {
    const capacity = 100_000n;

    const nearEmpty = resourceRegenAmount(1_000n, capacity);
    const midCurve = resourceRegenAmount(42_000n, capacity);
    const nearCap = resourceRegenAmount(90_000n, capacity);

    expect(midCurve).toBeGreaterThan(nearEmpty);
    expect(midCurve).toBeGreaterThan(nearCap);
    expect(nearCap).toBeGreaterThan(0n);
  });

  test("resourceRegenAmount peaks near forty-two percent of capacity", () => {
    const capacity = 1_000_000n;

    const low = resourceRegenAmount(10_000n, capacity);
    const beforePeak = resourceRegenAmount(250_000n, capacity);
    const nearPeak = resourceRegenAmount(422_000n, capacity);
    const afterPeak = resourceRegenAmount(650_000n, capacity);
    const nearCap = resourceRegenAmount(950_000n, capacity);

    expect(beforePeak).toBeGreaterThan(low);
    expect(nearPeak).toBeGreaterThan(beforePeak);
    expect(nearPeak).toBeGreaterThan(afterPeak);
    expect(afterPeak).toBeGreaterThan(nearCap);
  });

  test("resourceRegenDelta computes a regen stockpile", () => {
    const current = { food: 1_000n, energy: 42_000n, materials: 100_000n };
    const capacity = {
      food: 100_000n,
      energy: 100_000n,
      materials: 100_000n,
    };

    const delta = resourceRegenDelta(current, capacity);

    expect(delta.food).toBeGreaterThan(0n);
    expect(delta.energy).toBeGreaterThan(delta.food);
    expect(delta.materials).toBe(0n);
  });
});
