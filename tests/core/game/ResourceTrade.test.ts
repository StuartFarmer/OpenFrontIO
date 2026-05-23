import {
  calculateTradeExchange,
  calculateTradeManifest,
  resourceTotal,
} from "../../../src/core/game/ResourceTrade";

describe("ResourceTrade", () => {
  test("calculates a one-way manifest from exporter surplus and importer deficit", () => {
    const manifest = calculateTradeManifest(
      10_000n,
      { food: 25_000n, energy: 50_000n, materials: 25_000n },
      { food: 45_000n, energy: 10_000n, materials: 45_000n },
      { food: 100_000n, energy: 100_000n, materials: 100_000n },
    );

    expect(manifest).toEqual({
      food: 0n,
      energy: 10_000n,
      materials: 0n,
    });
  });

  test("scales reciprocal exchange to equal totals", () => {
    const exchange = calculateTradeExchange(
      10_000n,
      { food: 25_000n, energy: 50_000n, materials: 25_000n },
      { food: 100_000n, energy: 100_000n, materials: 100_000n },
      { food: 45_000n, energy: 10_000n, materials: 45_000n },
      { food: 100_000n, energy: 100_000n, materials: 100_000n },
    );

    expect(exchange.secondReceives).toEqual({
      food: 0n,
      energy: 10_000n,
      materials: 0n,
    });
    expect(exchange.firstReceives).toEqual({
      food: 4_999n,
      energy: 0n,
      materials: 5_001n,
    });
    expect(resourceTotal(exchange.firstReceives)).toBe(
      resourceTotal(exchange.secondReceives),
    );
  });

  test("returns zero exchange when either side lacks useful surplus", () => {
    const exchange = calculateTradeExchange(
      10_000n,
      { food: 34_000n, energy: 33_000n, materials: 33_000n },
      { food: 100_000n, energy: 100_000n, materials: 100_000n },
      { food: 45_000n, energy: 10_000n, materials: 45_000n },
      { food: 100_000n, energy: 100_000n, materials: 100_000n },
    );

    expect(exchange).toEqual({
      firstReceives: {
        food: 0n,
        energy: 0n,
        materials: 0n,
      },
      secondReceives: {
        food: 0n,
        energy: 0n,
        materials: 0n,
      },
    });
  });

  test("caps inbound resources by receiver headroom", () => {
    const manifest = calculateTradeManifest(
      10_000n,
      { food: 25_000n, energy: 50_000n, materials: 25_000n },
      { food: 45_000n, energy: 10_000n, materials: 45_000n },
      { food: 100_000n, energy: 15_000n, materials: 100_000n },
    );

    expect(manifest).toEqual({
      food: 0n,
      energy: 5_000n,
      materials: 0n,
    });
  });

  test("scales one-way manifests without creating unavailable resource kinds", () => {
    const manifest = calculateTradeManifest(
      1n,
      { food: 2n, energy: 2n, materials: 0n },
      { food: 0n, energy: 0n, materials: 4n },
      { food: 10n, energy: 10n, materials: 10n },
    );

    expect(resourceTotal(manifest)).toBe(1n);
    expect(manifest.materials).toBe(0n);
  });
});
