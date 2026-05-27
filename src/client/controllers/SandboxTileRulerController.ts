import { EventBus } from "../../core/EventBus";
import { Cell } from "../../core/game/Game";
import { GameView } from "../../core/game/GameView";
import { Controller } from "../Controller";
import { ContextMenuEvent } from "../InputHandler";
import { TransformHandler } from "../TransformHandler";

interface TileSquareSize {
  side: number;
  label: string;
}

const TILE_SQUARE_SIZES: TileSquareSize[] = [
  { side: 10, label: "10 x 10 (100 tiles)" },
  { side: 16, label: "16 x 16 (256 tiles, ~250)" },
  { side: 22, label: "22 x 22 (484 tiles, ~500)" },
  { side: 32, label: "32 x 32 (1,024 tiles, ~1,000)" },
  { side: 50, label: "50 x 50 (2,500 tiles)" },
  { side: 71, label: "71 x 71 (5,041 tiles, ~5,000)" },
  { side: 100, label: "100 x 100 (10,000 tiles)" },
  { side: 250, label: "250 x 250 (62,500 tiles)" },
  { side: 500, label: "500 x 500 (250,000 tiles)" },
  { side: 1000, label: "1000 x 1000 (1,000,000 tiles)" },
];

export class SandboxTileRulerController implements Controller {
  private root: HTMLDivElement | null = null;
  private menu: HTMLDivElement | null = null;
  private previewLayer: HTMLDivElement | null = null;
  private square: HTMLDivElement | null = null;
  private label: HTMLDivElement | null = null;
  private activeSize: TileSquareSize | null = null;
  private lastPointer = { x: 0, y: 0 };

  constructor(
    private game: GameView,
    private eventBus: EventBus,
    private transformHandler: TransformHandler,
  ) {}

  init() {
    if (!this.game.config().gameConfig().isSandbox) {
      return;
    }

    this.createDom();
    this.eventBus.on(ContextMenuEvent, (event) => {
      event.consumed = true;
      this.showMenu(event.x, event.y);
    });
  }

  private createDom() {
    this.root = document.createElement("div");
    this.root.style.position = "fixed";
    this.root.style.inset = "0";
    this.root.style.zIndex = "260";
    this.root.style.pointerEvents = "none";

    this.menu = document.createElement("div");
    this.menu.style.position = "fixed";
    this.menu.style.display = "none";
    this.menu.style.width = "220px";
    this.menu.style.border = "1px solid rgba(148, 163, 184, 0.55)";
    this.menu.style.borderRadius = "4px";
    this.menu.style.background = "rgba(15, 23, 42, 0.96)";
    this.menu.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.38)";
    this.menu.style.color = "#e5e7eb";
    this.menu.style.fontFamily = "monospace";
    this.menu.style.fontSize = "12px";
    this.menu.style.padding = "8px";
    this.menu.style.pointerEvents = "auto";

    const title = document.createElement("div");
    title.textContent = "Tile square";
    title.style.marginBottom = "6px";
    title.style.fontWeight = "700";
    title.style.textTransform = "uppercase";

    const select = document.createElement("select");
    select.style.width = "100%";
    select.style.border = "1px solid rgba(148, 163, 184, 0.45)";
    select.style.borderRadius = "3px";
    select.style.background = "#111827";
    select.style.color = "#f8fafc";
    select.style.padding = "5px";
    select.style.font = "inherit";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose size";
    select.appendChild(placeholder);

    for (const size of TILE_SQUARE_SIZES) {
      const option = document.createElement("option");
      option.value = String(size.side);
      option.textContent = size.label;
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      const side = Number(select.value);
      const size = TILE_SQUARE_SIZES.find(
        (candidate) => candidate.side === side,
      );
      if (!size) return;
      select.value = "";
      this.startPreview(size, this.lastPointer.x, this.lastPointer.y);
    });

    this.menu.append(title, select);

    this.previewLayer = document.createElement("div");
    this.previewLayer.style.position = "fixed";
    this.previewLayer.style.inset = "0";
    this.previewLayer.style.display = "none";
    this.previewLayer.style.cursor = "crosshair";
    this.previewLayer.style.pointerEvents = "auto";

    this.square = document.createElement("div");
    this.square.style.position = "fixed";
    this.square.style.boxSizing = "border-box";
    this.square.style.border = "2px solid rgba(56, 189, 248, 0.95)";
    this.square.style.background = "rgba(56, 189, 248, 0.16)";
    this.square.style.boxShadow =
      "0 0 0 1px rgba(15, 23, 42, 0.75), inset 0 0 24px rgba(56, 189, 248, 0.18)";
    this.square.style.pointerEvents = "none";

    this.label = document.createElement("div");
    this.label.style.position = "fixed";
    this.label.style.padding = "3px 5px";
    this.label.style.borderRadius = "3px";
    this.label.style.background = "rgba(15, 23, 42, 0.94)";
    this.label.style.color = "#e0f2fe";
    this.label.style.fontFamily = "monospace";
    this.label.style.fontSize = "11px";
    this.label.style.fontWeight = "700";
    this.label.style.pointerEvents = "none";

    this.previewLayer.append(this.square, this.label);
    this.previewLayer.addEventListener("pointermove", this.handlePreviewMove);
    this.previewLayer.addEventListener("pointerdown", this.handlePreviewDone);
    this.previewLayer.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.hidePreview();
    });

    this.root.append(this.previewLayer, this.menu);
    document.body.appendChild(this.root);
  }

  private showMenu(x: number, y: number) {
    if (!this.menu) return;
    this.hidePreview();
    this.lastPointer = { x, y };

    const menuWidth = 220;
    const menuHeight = 76;
    this.menu.style.left = `${Math.min(x, window.innerWidth - menuWidth - 8)}px`;
    this.menu.style.top = `${Math.min(y, window.innerHeight - menuHeight - 8)}px`;
    this.menu.style.display = "block";

    window.addEventListener("pointerdown", this.handleOutsideMenuDown, true);
  }

  private hideMenu() {
    if (this.menu) {
      this.menu.style.display = "none";
    }
    window.removeEventListener("pointerdown", this.handleOutsideMenuDown, true);
  }

  private startPreview(size: TileSquareSize, x: number, y: number) {
    if (!this.previewLayer) return;
    this.activeSize = size;
    this.hideMenu();
    this.lastPointer = { x, y };
    this.previewLayer.style.display = "block";
    this.renderPreview();
  }

  private hidePreview() {
    this.activeSize = null;
    if (this.previewLayer) {
      this.previewLayer.style.display = "none";
    }
  }

  private renderPreview() {
    if (!this.activeSize || !this.square || !this.label) return;

    const center = this.transformHandler.screenToWorldCoordinatesFloat(
      this.lastPointer.x,
      this.lastPointer.y,
    );
    const halfSide = this.activeSize.side / 2;
    const topLeft = this.transformHandler.worldToScreenCoordinates(
      new Cell(center.x - halfSide, center.y - halfSide),
    );
    const bottomRight = this.transformHandler.worldToScreenCoordinates(
      new Cell(center.x + halfSide, center.y + halfSide),
    );
    const left = Math.min(topLeft.x, bottomRight.x);
    const top = Math.min(topLeft.y, bottomRight.y);
    const width = Math.abs(bottomRight.x - topLeft.x);
    const height = Math.abs(bottomRight.y - topLeft.y);

    this.square.style.left = `${left}px`;
    this.square.style.top = `${top}px`;
    this.square.style.width = `${width}px`;
    this.square.style.height = `${height}px`;

    this.label.textContent = this.activeSize.label;
    this.label.style.left = `${Math.max(8, Math.min(left, window.innerWidth - 180))}px`;
    this.label.style.top = `${Math.max(8, top - 24)}px`;
  }

  private handlePreviewMove = (event: PointerEvent) => {
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.renderPreview();
  };

  private handlePreviewDone = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.hidePreview();
  };

  private handleOutsideMenuDown = (event: PointerEvent) => {
    if (this.menu?.contains(event.target as Node)) {
      return;
    }
    this.hideMenu();
  };
}
