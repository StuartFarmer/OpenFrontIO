import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  OpenFrontCompatibilityAdapter,
  uploadOpenFrontFrameData,
  type OpenFrontFrameUploadTarget,
} from "../../../../src/client/render/base-map/OpenFrontCompatibilityAdapter";
import type { GameView as WebGLGameView } from "../../../../src/client/render/gl";
import type { FrameData } from "../../../../src/client/render/types";
import { EMPTY_FRAME_EVENTS } from "../../../../src/client/render/types";

class FakeOpenFrontUploadTarget implements OpenFrontFrameUploadTarget {
  readonly calls: string[] = [];

  uploadTileAndTrailState(): void {
    this.calls.push("uploadTileAndTrailState");
  }

  uploadLiveDelta(): void {
    this.calls.push("uploadLiveDelta");
  }

  uploadLiveTrailDelta(): void {
    this.calls.push("uploadLiveTrailDelta");
  }

  applyFullTiles(): void {
    this.calls.push("applyFullTiles");
  }

  applyDelta(): void {
    this.calls.push("applyDelta");
  }

  uploadRailroadState(): void {
    this.calls.push("uploadRailroadState");
  }

  updateRailroadNetworkOverlay(): void {
    this.calls.push("updateRailroadNetworkOverlay");
  }

  applyRailroadDust(): void {
    this.calls.push("applyRailroadDust");
  }

  updateUnits(): void {
    this.calls.push("updateUnits");
  }

  updateStructures(): void {
    this.calls.push("updateStructures");
  }

  applyDeadUnits(): void {
    this.calls.push("applyDeadUnits");
  }

  applyConquestEvents(): void {
    this.calls.push("applyConquestEvents");
  }

  applyBonusEvents(): void {
    this.calls.push("applyBonusEvents");
  }

  updateAttackRings(): void {
    this.calls.push("updateAttackRings");
  }

  updateNukeTelegraphs(): void {
    this.calls.push("updateNukeTelegraphs");
  }

  updateNames(): void {
    this.calls.push("updateNames");
  }

  updateRelations(): void {
    this.calls.push("updateRelations");
  }

  setSAMAllianceClusters(): void {
    this.calls.push("setSAMAllianceClusters");
  }
}

function makeFrame(overrides: Partial<FrameData> = {}): FrameData {
  return {
    tick: 10,
    inSpawnPhase: false,
    tileState: new Uint16Array([1, 2, 3, 4]),
    trailState: new Uint8Array(4),
    railroadState: new Uint8Array(4),
    units: new Map(),
    players: new Map(),
    names: new Map(),
    events: {
      ...EMPTY_FRAME_EVENTS,
      deadUnits: [{ unitType: "warship", pos: 1, reachedTarget: false }],
      conquestEvents: [{ x: 1, y: 2, gold: 3 }],
      bonusEvents: [
        { playerID: "p1", smallID: 1, tile: 1, gold: 5, troops: 0 },
      ],
    },
    changedTiles: null,
    railroadDirty: true,
    revealedRailTiles: [2],
    connectedRailroadTiles: [1],
    disconnectedRailroadTiles: [3],
    trailDirtyRowMin: 0,
    trailDirtyRowMax: 0,
    playerStatus: new Map(),
    relationMatrix: new Uint8Array([0]),
    relationSize: 1,
    allianceClusters: new Map(),
    nukeTelegraphs: [{ x: 1, y: 2, innerRadius: 3, outerRadius: 4 }],
    attackRings: [{ x: 1, y: 2, unitId: 3 }],
    structuresDirty: true,
    tileMode: "live",
    ...overrides,
  };
}

describe("OpenFrontCompatibilityAdapter", () => {
  it("names the current WebGLFrameBuilder path without Foundation dependencies", () => {
    const adapter = new OpenFrontCompatibilityAdapter({} as WebGLGameView);
    const source = readFileSync(
      "src/client/render/base-map/OpenFrontCompatibilityAdapter.ts",
      "utf8",
    );

    expect(adapter).toBeInstanceOf(OpenFrontCompatibilityAdapter);
    expect(source).not.toContain("foundation");
  });

  it("preserves live full OpenFront frame upload dispatch", () => {
    const target = new FakeOpenFrontUploadTarget();

    uploadOpenFrontFrameData(target, makeFrame({ changedTiles: null }));

    expect(target.calls).toContain("uploadTileAndTrailState");
    expect(target.calls).toContain("uploadRailroadState");
    expect(target.calls).toContain("applyRailroadDust");
    expect(target.calls).toContain("updateUnits");
    expect(target.calls).toContain("updateStructures");
    expect(target.calls).toContain("applyDeadUnits");
    expect(target.calls).toContain("applyConquestEvents");
    expect(target.calls).toContain("applyBonusEvents");
    expect(target.calls).toContain("updateAttackRings");
    expect(target.calls).toContain("updateNukeTelegraphs");
    expect(target.calls).toContain("updateNames");
    expect(target.calls).toContain("updateRelations");
    expect(target.calls).toContain("setSAMAllianceClusters");
  });

  it("preserves live delta tile and trail dispatch", () => {
    const target = new FakeOpenFrontUploadTarget();

    uploadOpenFrontFrameData(
      target,
      makeFrame({
        changedTiles: [{ ref: 1, state: 9 }],
        tileMode: "live",
      }),
    );

    expect(target.calls).toContain("uploadLiveDelta");
    expect(target.calls).toContain("uploadLiveTrailDelta");
    expect(target.calls).not.toContain("uploadTileAndTrailState");
  });

  it("preserves copy full and copy delta dispatch", () => {
    const fullTarget = new FakeOpenFrontUploadTarget();
    const deltaTarget = new FakeOpenFrontUploadTarget();

    uploadOpenFrontFrameData(
      fullTarget,
      makeFrame({ tileMode: "copy", changedTiles: null }),
    );
    uploadOpenFrontFrameData(
      deltaTarget,
      makeFrame({ tileMode: "copy", changedTiles: [{ ref: 2, state: 5 }] }),
    );

    expect(fullTarget.calls).toContain("applyFullTiles");
    expect(deltaTarget.calls).toContain("applyDelta");
  });

  it("honors skipTileUpload while still dispatching non-tile render data", () => {
    const target = new FakeOpenFrontUploadTarget();

    uploadOpenFrontFrameData(target, makeFrame(), { skipTileUpload: true });

    expect(target.calls).not.toContain("uploadTileAndTrailState");
    expect(target.calls).toContain("updateUnits");
    expect(target.calls).toContain("updateNames");
    expect(target.calls).toContain("updateRelations");
  });
});
