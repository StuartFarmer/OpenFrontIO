import { Execution, Game, Player, Tick, Unit, UnitType } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { StructureSystem } from "../systems/gameplay/StructureSystem";

export class ConstructionExecution implements Execution {
  private structure: Unit | null = null;
  private active: boolean = true;
  private mg: Game;
  private structureSystem = new StructureSystem();

  private ticksUntilComplete: Tick;

  constructor(
    private player: Player,
    private constructionType: UnitType,
    private tile: TileRef,
    private rocketDirectionUp?: boolean,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;

    if (
      !this.structureSystem.validateConstructionRequest(
        this.mg,
        this.constructionType,
        this.tile,
      )
    ) {
      this.active = false;
      return;
    }
  }

  tick(ticks: number): void {
    if (this.structure === null) {
      // For non-structure units (nukes/warship), charge once and delegate to specialized executions.
      const isStructure = this.structureSystem.isStructure(
        this.constructionType,
      );
      if (!isStructure) {
        // Defer validation and gold deduction to the specific execution
        this.completeConstruction();
        this.active = false;
        return;
      }

      // Structures: build real unit and mark under construction
      const construction = this.structureSystem.startStructureConstruction(
        this.mg,
        this.player,
        this.constructionType,
        this.tile,
      );
      if (!construction.active) {
        this.active = false;
        return;
      }
      this.structure = construction.structure;
      this.ticksUntilComplete = construction.ticksUntilComplete;
      if (!construction.completed) {
        return;
      }
      // No construction time
      this.completeConstruction();
      this.active = false;
      return;
    }

    if (!this.structure.isActive()) {
      this.active = false;
      return;
    }

    if (this.player !== this.structure.owner()) {
      this.player = this.structure.owner();
    }

    if (this.ticksUntilComplete === 0) {
      this.player = this.structure.owner();
      this.completeConstruction();
      this.active = false;
      return;
    }
    this.ticksUntilComplete--;
  }

  private completeConstruction() {
    this.structureSystem.completeConstruction({
      game: this.mg,
      player: this.player,
      constructionType: this.constructionType,
      tile: this.tile,
      structure: this.structure,
      rocketDirectionUp: this.rocketDirectionUp,
    });
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
