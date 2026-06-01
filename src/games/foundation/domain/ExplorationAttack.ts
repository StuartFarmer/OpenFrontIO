import { TileRef } from "./EngineTileMap";
import {
  WildernessExploration,
  WildernessFrontierTile,
} from "./FoundationPlayer";

export class ExplorationAttack {
  private readonly frontier: WildernessFrontierTile[];
  private readonly border: Set<TileRef>;

  constructor(
    state: Pick<WildernessExploration, "frontier" | "borderTiles"> = {
      frontier: [],
      borderTiles: [],
    },
  ) {
    this.frontier = [...state.frontier];
    this.border = new Set(state.borderTiles);
  }

  static fromExploration(
    exploration: WildernessExploration,
  ): ExplorationAttack {
    return new ExplorationAttack(exploration);
  }

  enqueue(
    tile: TileRef,
    priority: number,
    troopShare?: number,
    progress = 0,
  ): void {
    this.frontier.push({ tile, priority, troopShare, progress });
  }

  dequeue(): [TileRef, number, number | undefined, number] {
    if (this.frontier.length === 0) {
      throw new Error("exploration frontier empty");
    }

    let bestIndex = 0;
    let bestPriority = this.frontier[0].priority;
    for (let i = 1; i < this.frontier.length; i++) {
      const priority = this.frontier[i].priority;
      if (priority < bestPriority) {
        bestPriority = priority;
        bestIndex = i;
      }
    }
    const [best] = this.frontier.splice(bestIndex, 1);
    let troopShare = best.troopShare;
    let progress = best.progress ?? 0;
    for (let i = this.frontier.length - 1; i >= 0; i--) {
      if (this.frontier[i].tile !== best.tile) {
        continue;
      }

      const entryTroopShare = this.frontier[i].troopShare;
      if (entryTroopShare !== undefined) {
        troopShare = (troopShare ?? 0) + entryTroopShare;
      }
      progress += this.frontier[i].progress ?? 0;
      this.frontier.splice(i, 1);
    }
    return [best.tile, best.priority, troopShare, progress];
  }

  drainFrontier(): WildernessFrontierTile[] {
    const byTile = new Map<TileRef, WildernessFrontierTile>();
    for (const entry of this.frontier) {
      const existing = byTile.get(entry.tile);
      if (!existing) {
        byTile.set(entry.tile, { ...entry });
        continue;
      }

      existing.priority = Math.min(existing.priority, entry.priority);
      if (entry.troopShare !== undefined) {
        existing.troopShare = (existing.troopShare ?? 0) + entry.troopShare;
      }
      existing.progress = (existing.progress ?? 0) + (entry.progress ?? 0);
    }

    this.frontier.length = 0;
    return Array.from(byTile.values()).sort((a, b) => a.priority - b.priority);
  }

  frontierSize(): number {
    return this.frontier.length;
  }

  addBorderTile(tile: TileRef): void {
    this.border.add(tile);
  }

  removeBorderTile(tile: TileRef): void {
    this.border.delete(tile);
  }

  clearBorder(): void {
    this.border.clear();
  }

  scaleTroopShares(factor: number): void {
    for (const entry of this.frontier) {
      if (entry.troopShare !== undefined) {
        entry.troopShare *= factor;
      }
    }
  }

  borderSize(): number {
    return this.border.size;
  }

  toState(): Pick<WildernessExploration, "frontier" | "borderTiles"> {
    return {
      frontier: [...this.frontier],
      borderTiles: Array.from(this.border),
    };
  }
}
