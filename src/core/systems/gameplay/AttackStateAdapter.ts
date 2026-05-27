import { Attack, Game, Player, TerraNullius } from "../../game/Game";
import { TileRef } from "../../game/GameMap";

export class AttackStateAdapter {
  constructor(private readonly game: Game) {}

  activeAttacks(): AttackState[] {
    const attacks = new Map<string, Attack>();
    for (const player of this.game.allPlayers()) {
      for (const attack of player.outgoingAttacks()) {
        if (attack.isActive()) {
          attacks.set(attack.id(), attack);
        }
      }
    }
    return [...attacks.values()]
      .sort((a, b) => a.id().localeCompare(b.id()))
      .map((attack) => new AttackState(attack));
  }

  outgoingAttacks(player: Player): AttackState[] {
    return player
      .outgoingAttacks()
      .filter((attack) => attack.isActive())
      .map((attack) => new AttackState(attack));
  }

  incomingAttacks(player: Player): AttackState[] {
    return player
      .incomingAttacks()
      .filter((attack) => attack.isActive())
      .map((attack) => new AttackState(attack));
  }
}

export class AttackState {
  constructor(readonly attack: Attack) {}

  id(): string {
    return this.attack.id();
  }

  attacker(): Player {
    return this.attack.attacker();
  }

  target(): Player | TerraNullius {
    return this.attack.target();
  }

  sourceTile(): TileRef | null {
    return this.attack.sourceTile();
  }

  troops(): number {
    return this.attack.troops();
  }

  setTroops(troops: number): void {
    this.attack.setTroops(troops);
  }

  isActive(): boolean {
    return this.attack.isActive();
  }

  delete(): void {
    this.attack.delete();
  }

  retreating(): boolean {
    return this.attack.retreating();
  }

  retreated(): boolean {
    return this.attack.retreated();
  }

  orderRetreat(): void {
    this.attack.orderRetreat();
  }

  executeRetreat(): void {
    this.attack.executeRetreat();
  }

  borderSize(): number {
    return this.attack.borderSize();
  }

  clearBorder(): void {
    this.attack.clearBorder();
  }

  addBorderTile(tile: TileRef): void {
    this.attack.addBorderTile(tile);
  }

  removeBorderTile(tile: TileRef): void {
    this.attack.removeBorderTile(tile);
  }

  clusteredPositions(): TileRef[] {
    return this.attack.clusteredPositions();
  }
}
