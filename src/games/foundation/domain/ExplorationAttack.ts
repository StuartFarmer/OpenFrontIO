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

  enqueue(tile: TileRef, priority: number): void {
    this.frontier.push({ tile, priority });
  }

  dequeue(): [TileRef, number] {
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
    return [best.tile, best.priority];
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
