import {
  addResourceDelta,
  createZeroResources,
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
});
