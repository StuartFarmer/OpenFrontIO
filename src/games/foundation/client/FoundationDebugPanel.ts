import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { renderTroops } from "../../../client/Utils";
import type { FoundationRuntimeSnapshot } from "../runtime";

export interface FoundationClientStatus {
  tone: "idle" | "ok" | "error";
  text: string;
}

@customElement("foundation-debug-panel")
export class FoundationDebugPanel extends LitElement {
  @property({ attribute: false })
  snapshot: FoundationRuntimeSnapshot | null = null;

  @property({ attribute: false })
  status: FoundationClientStatus = {
    tone: "idle",
    text: "Click a tile to place the player.",
  };

  @property({ type: Boolean })
  paused = false;

  static styles = css`
    :host {
      display: block;
      width: min(280px, calc(100vw - 24px));
      color: #edf7f3;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      pointer-events: auto;
    }

    .panel {
      background: rgba(10, 17, 16, 0.84);
      border: 1px solid rgba(199, 227, 212, 0.22);
      border-radius: 8px;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
      overflow: hidden;
      backdrop-filter: blur(8px);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 12px;
      border-bottom: 1px solid rgba(199, 227, 212, 0.16);
      background: rgba(255, 255, 255, 0.04);
    }

    .title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.2;
    }

    .state {
      border-radius: 999px;
      padding: 3px 7px;
      background: rgba(255, 255, 255, 0.08);
      color: #b8cbc3;
      font-size: 11px;
      font-weight: 650;
      line-height: 1.2;
      text-transform: uppercase;
    }

    .state.ok {
      background: rgba(70, 190, 126, 0.18);
      color: #a9f0c9;
    }

    .state.error {
      background: rgba(236, 91, 91, 0.18);
      color: #ffc1bd;
    }

    dl {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 12px;
      margin: 0;
      padding: 12px;
    }

    dt,
    dd {
      margin: 0;
      min-width: 0;
      font-size: 12px;
      line-height: 1.25;
    }

    dt {
      color: #a9bab2;
    }

    dd {
      color: #f2fbf7;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }

    .status {
      padding: 10px 12px 12px;
      border-top: 1px solid rgba(199, 227, 212, 0.13);
      color: #d6e6df;
      font-size: 12px;
      line-height: 1.35;
    }

    .controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 0 12px 12px;
    }

    button {
      border: 1px solid rgba(199, 227, 212, 0.24);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.07);
      color: #edf7f3;
      font: inherit;
      font-size: 12px;
      font-weight: 650;
      line-height: 1.2;
      padding: 7px 8px;
      cursor: pointer;
    }

    button:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  `;

  render() {
    const snapshot = this.snapshot;
    const selectedTile =
      snapshot?.player.selectedTile === null ||
      snapshot?.player.selectedTile === undefined
        ? "none"
        : snapshot.player.selectedTile.toLocaleString();

    return html`
      <section class="panel" aria-label="Foundation runtime state">
        <div class="header">
          <div class="title">Foundation</div>
          <div class=${`state ${this.status.tone}`}>${this.status.tone}</div>
        </div>
        <dl>
          <dt>Map</dt>
          <dd>
            ${snapshot
              ? `${snapshot.map.width} x ${snapshot.map.height}`
              : "pending"}
          </dd>
          <dt>Player</dt>
          <dd>${snapshot?.player.placed ? "placed" : "unplaced"}</dd>
          <dt>Selected tile</dt>
          <dd>${selectedTile}</dd>
          <dt>Claimed tiles</dt>
          <dd>${snapshot?.player.claimedTileCount.toLocaleString() ?? "0"}</dd>
          <dt>Troops</dt>
          <dd>${formatTroops(snapshot?.player.troops)}</dd>
          <dt>Max troops</dt>
          <dd>${formatTroops(snapshot?.player.maxTroops)}</dd>
          <dt>Troop rate</dt>
          <dd>${formatTroopRate(snapshot?.player.troopIncreaseRate)}</dd>
          <dt>Exploring</dt>
          <dd>${formatTroops(snapshot?.player.exploringTroops)}</dd>
          <dt>Tick</dt>
          <dd>${snapshot?.tick.toLocaleString() ?? "0"}</dd>
          <dt>Updates</dt>
          <dd>${snapshot?.updateCount.toLocaleString() ?? "0"}</dd>
        </dl>
        <div class="status">${this.status.text}</div>
        <div class="controls">
          <button type="button" @click=${this.togglePlayPause}>
            ${this.paused ? "Play" : "Pause"}
          </button>
          <button type="button" @click=${this.resetSimulation}>Reset</button>
        </div>
      </section>
    `;
  }

  private readonly togglePlayPause = (): void => {
    this.dispatchEvent(
      new CustomEvent("foundation-play-pause", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  private readonly resetSimulation = (): void => {
    this.dispatchEvent(
      new CustomEvent("foundation-reset-simulation", {
        bubbles: true,
        composed: true,
      }),
    );
  };
}

function formatTroops(value: number | undefined): string {
  return renderTroops(value ?? 0);
}

function formatTroopRate(value: number | undefined): string {
  return `${renderTroops((value ?? 0) * 10)}/s`;
}

declare global {
  interface HTMLElementTagNameMap {
    "foundation-debug-panel": FoundationDebugPanel;
  }
}
