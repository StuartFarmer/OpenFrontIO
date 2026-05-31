import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { Copy, Dice5, Pause, Play, RotateCcw } from "lucide";
import "../../../client/hud/ui";
import { renderLucideIcon } from "../../../client/hud/ui/LucideIcon";
import {
  BaseMapWebGLAdapter,
  type BaseMapPalette,
  type BaseMapTileStateDelta,
} from "../../../client/render/base-map";
import { renderTroops } from "../../../client/Utils";
import {
  FoundationEngineTileMap,
  buildWorldEngineTerrainColors,
  createFoundationMap,
  deriveFoundationWorldEngineResourceConfig,
  deriveWorldEngineOcean,
  deriveWorldEngineSeaDepth,
  foundationLandTerrainByteForElevation,
  foundationWaterTerrainByteForElevation,
  generateWorldEngineBiome,
  generateWorldEngineElevation,
  generateWorldEngineHumidity,
  generateWorldEngineIrrigation,
  generateWorldEnginePermeability,
  generateWorldEnginePrecipitation,
  generateWorldEngineResourceMaps,
  generateWorldEngineTemperature,
  generateWorldEngineWatermap,
  normalizeFoundationWorldEngineMapConfig,
  normalizeWorldEngineLand,
  ownerIdFromState,
  type FoundationWorldEngineLayers,
  type WorldEngineResourceMaps,
} from "../domain";
import {
  FoundationRuntime,
  createFoundationRuntime,
  createGrowTerritoryCommand,
  createPlacePlayerCommand,
  type FoundationMapUpdate,
  type FoundationRuntimeSnapshot,
} from "../runtime";
import {
  DEFAULT_FOUNDATION_TUNING_SETTINGS,
  FoundationTuningSettings,
  loadFoundationTuningSettings,
  normalizeFoundationTuningSettings,
  saveFoundationTuningSettings,
} from "./FoundationTuningSettings";

interface FoundationClientStatus {
  tone: "idle" | "ok" | "error";
  text: string;
}

interface FoundationDirectionalBorderPreview {
  originTile: number;
  targetTile: number;
}

const FOUNDATION_DIRECTIONAL_BORDER_BASELINE_HEAT = 128;

type FoundationControlTab = "world" | "river" | "mechanics";

const FOUNDATION_CONTROL_TABS = [
  { id: "world", label: "World" },
  { id: "river", label: "River" },
  { id: "mechanics", label: "Mechanics" },
];

interface FoundationMechanicBreakdown {
  readonly does: string;
  readonly exists: string;
  readonly represents: string;
  readonly increase: string;
  readonly decrease: string;
  readonly formula: string;
}

const FOUNDATION_MECHANIC_BREAKDOWNS: Partial<
  Record<keyof FoundationTuningSettings, FoundationMechanicBreakdown>
> = {
  tickIntervalMs: {
    does: "Sets the real-time delay between automatic simulation ticks.",
    exists:
      "Separates game pacing from the underlying territory and troop formulas.",
    represents: "Clock tempo: how quickly the world updates for the player.",
    increase:
      "Slows visible growth, troop regeneration, and exploration updates.",
    decrease:
      "Speeds up the running simulation without changing per-tick math.",
    formula: "ticksPerSecond = 1000 / tickIntervalMs",
  },
  attackRatio: {
    does: "Chooses the share of current idle troops committed when you click wilderness.",
    exists:
      "Creates a risk/reach tradeoff between home reserves and expansion force.",
    represents:
      "Expedition commitment: how much population is sent into unsettled land.",
    increase:
      "Sends larger expeditions that can survive more tile losses, but leaves fewer idle troops.",
    decrease: "Keeps more troops at home, but explorations run out sooner.",
    formula: "committedTroops = floor(playerTroops * clamp(attackRatio, 0, 1))",
  },
  startingTroops: {
    does: "Sets the player's troop count when a new runtime is created.",
    exists: "Gives the first placement enough population to start expanding.",
    represents: "Initial settlement population and military capacity.",
    increase:
      "Makes the opening stronger and supports larger first explorations.",
    decrease: "Makes the opening leaner and can delay viable expansion.",
    formula: "initialTroops = startingTroops",
  },
  placementRadius: {
    does: "Sets the radius of tiles claimed around the first clicked tile.",
    exists: "Turns one placement click into an initial settlement footprint.",
    represents: "Starting settlement size and immediate local control.",
    increase:
      "Claims more land immediately, creating more border and a higher troop cap.",
    decrease:
      "Creates a smaller start with less border and lower early capacity.",
    formula:
      "(x - (centerX - 0.5))^2 + (y - (centerY - 0.5))^2 <= placementRadius^2",
  },
  troopRegenBase: {
    does: "Adds a fixed amount to the troop growth calculation before capacity damping.",
    exists: "Guarantees baseline recovery even when troop counts are small.",
    represents: "Minimum local recruitment or organic population recovery.",
    increase:
      "Raises low-population recovery and makes depleted states bounce back faster.",
    decrease:
      "Makes growth depend more on the scaling term and current troop count.",
    formula:
      "troopDelta = min(troops + (regenBase + troops^regenExponent / regenDivisor) * (1 - troops / maxTroops), maxTroops) - troops",
  },
  troopRegenExponent: {
    does: "Controls how strongly current troops amplify troop regeneration.",
    exists:
      "Lets growth scale with population without making it purely linear.",
    represents:
      "Population momentum: larger societies recruit and recover faster.",
    increase:
      "Makes large troop pools generate disproportionately more growth.",
    decrease:
      "Flattens growth so small and large populations recover more similarly.",
    formula:
      "troopDelta = min(troops + (regenBase + troops^regenExponent / regenDivisor) * (1 - troops / maxTroops), maxTroops) - troops",
  },
  troopRegenDivisor: {
    does: "Divides the current-troop scaling term in the regen formula.",
    exists: "Provides a direct brake on compounding troop growth.",
    represents: "Recruitment friction, logistics, or administrative drag.",
    increase: "Slows troop growth from the scaling term.",
    decrease: "Accelerates scaling growth and can make recovery much faster.",
    formula:
      "troopDelta = min(troops + (regenBase + troops^regenExponent / regenDivisor) * (1 - troops / maxTroops), maxTroops) - troops",
  },
  maxTroopMultiplier: {
    does: "Multiplies the whole maximum troop capacity formula.",
    exists:
      "Provides one global handle for how many troops a territory can support.",
    represents: "Overall carrying capacity of the society.",
    increase: "Raises troop caps at every territory size.",
    decrease: "Lowers caps and makes the capacity damping hit sooner.",
    formula:
      "maxTroops = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  maxTroopTileExponent: {
    does: "Sets how strongly owned tile count curves into maximum troop capacity.",
    exists:
      "Controls whether land rewards flatten or accelerate as empires grow.",
    represents: "Economies of scale from holding more territory.",
    increase:
      "Makes large territories gain much more capacity from extra land.",
    decrease:
      "Makes each additional tile add less long-term capacity advantage.",
    formula:
      "maxTroops = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  maxTroopTileScale: {
    does: "Scales the land-based part of maximum troop capacity.",
    exists: "Separates land value from the fixed base capacity.",
    represents: "How productive each controlled tile is for supporting troops.",
    increase: "Makes territorial growth raise the troop cap more strongly.",
    decrease: "Makes the base cap dominate and reduces the reward for land.",
    formula:
      "maxTroops = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  maxTroopBase: {
    does: "Adds fixed capacity before the global max troop multiplier is applied.",
    exists: "Gives small settlements a minimum support capacity.",
    represents: "Core settlement infrastructure independent of land area.",
    increase: "Raises the minimum cap, especially early in the game.",
    decrease: "Makes small territories hit low caps sooner.",
    formula:
      "maxTroops = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  wildernessBaseSpeed: {
    does: "Sets the base movement cost used when converting terrain speed into tile budget usage.",
    exists:
      "Anchors how expensive wilderness expansion is before slope modifiers.",
    represents: "Baseline travel difficulty through unsettled land.",
    increase:
      "Uses more tile budget per claimed tile, usually slowing expansion.",
    decrease:
      "Uses less tile budget per tile until the minimum cost clamp dominates.",
    formula:
      "tileBudgetUsed = clamp(2000 * max(10, wildernessBaseSpeed / slopeMultiplier) / min(explorationTroops, wildernessFrontCapacity), 5, 100)",
  },
  elevationSlopeScale: {
    does: "Multiplies elevation difference between a candidate tile and owned neighbors.",
    exists: "Controls how much terrain height affects wilderness movement.",
    represents:
      "Terrain steepness and the cost of climbing or descending from controlled land.",
    increase:
      "Makes elevation changes matter more, making rough terrain more uneven to conquer.",
    decrease: "Makes expansion treat hills and flats more similarly.",
    formula:
      "slope = (tileElevation - averageOwnedNeighborElevation) * elevationSlopeScale",
  },
  minToblerSpeedMultiplier: {
    does: "Sets the lower clamp for the Tobler slope speed multiplier.",
    exists: "Prevents extreme slopes from becoming infinitely punishing.",
    represents: "Worst-case mobility floor through hostile terrain.",
    increase:
      "Softens bad-slope penalties and helps expeditions cross rough terrain.",
    decrease: "Allows harsh slopes to become much slower and more expensive.",
    formula:
      "slopeMultiplier = clamp(toblerSpeed(slope) / toblerSpeed(0), minToblerSpeedMultiplier, maxToblerSpeedMultiplier)",
  },
  maxToblerSpeedMultiplier: {
    does: "Sets the upper clamp for favorable Tobler slope movement.",
    exists: "Caps how much terrain can speed up expansion.",
    represents: "Best-case mobility advantage from favorable grades.",
    increase: "Allows favorable slopes to reduce tile cost more.",
    decrease:
      "Limits terrain speed bonuses and makes good routes less special.",
    formula:
      "slopeMultiplier = clamp(toblerSpeed(slope) / toblerSpeed(0), minToblerSpeedMultiplier, maxToblerSpeedMultiplier)",
  },
  terrainPriorityElevationScale: {
    does: "Adds elevation weight to frontier priority; lower priority values are claimed first.",
    exists:
      "Lets terrain shape the order of expansion, not just the movement cost.",
    represents:
      "Preference for easier lowland routes before pushing into high ground.",
    increase:
      "Pushes high-elevation tiles later in the queue, favoring low terrain first.",
    decrease: "Makes frontier order less sensitive to elevation.",
    formula:
      "priority = (randomInt(0, 7) + 10) * (1 - ownedNeighborCount * 0.5 + (1 + elevation * priorityScale) / 2) + tick",
  },
  wildernessVectorSharpness: {
    does: "Scales how tightly a click vector focuses wilderness frontier priority.",
    exists:
      "Lets directional movement be tuned separately from troop commitment and terrain cost.",
    represents:
      "Operational focus: low values make broad fronts, high values make narrower pushes.",
    increase:
      "Makes clicked directions more decisive, with distance influence capped by inverse-log scaling.",
    decrease:
      "Makes exploration fill more broadly around the border before following the vector.",
    formula:
      "focus = clamp((1 - 1 / (1 + log1p(distance / 40))) * wildernessVectorSharpness, 0, 1)",
  },
  wildernessDirectionalPreviewDistance: {
    does: "Sets the click distance that makes border preview colors reach full contrast.",
    exists:
      "Lets the visual preview be tuned separately from the simulation's inverse-log movement focus.",
    represents:
      "Preview calibration distance: shorter values make nearby hovers contrast sooner.",
    increase:
      "Keeps the border preview yellower until the pointer is farther from the closest border.",
    decrease:
      "Makes red and blue concentration bands appear at shorter pointer distances.",
    formula:
      "visualFocus = clamp((clickDistance / wildernessDirectionalPreviewDistance) * wildernessDirectionalPreviewSharpness, 0, 1)",
  },
  wildernessDirectionalPreviewSharpness: {
    does: "Scales how quickly border preview focus increases with click distance.",
    exists:
      "Keeps preview tuning independent from the simulation vector sharpness.",
    represents:
      "Visual-only distance sensitivity before contrast and perimeter falloff are applied.",
    increase: "Makes focused red/blue bands appear at shorter click distances.",
    decrease: "Keeps more hover previews near the equal yellow baseline.",
    formula:
      "visualFocus = clamp((clickDistance / wildernessDirectionalPreviewDistance) * wildernessDirectionalPreviewSharpness, 0, 1)",
  },
  wildernessDirectionalPreviewContrast: {
    does: "Controls how far the border preview can move away from yellow.",
    exists:
      "Lets the preview be made subtle or high-contrast without changing the front shape.",
    represents: "Color gain around the yellow equal-priority baseline.",
    increase: "Pushes peak fronts redder and distant perimeter regions bluer.",
    decrease: "Compresses the preview toward yellow.",
    formula:
      "heat = clamp(0.5 + (concentration - 0.5) * visualFocus * wildernessDirectionalPreviewContrast, 0, 1)",
  },
  wildernessDirectionalPreviewFalloff: {
    does: "Controls how quickly preview concentration decays around the border perimeter.",
    exists:
      "Lets perimeter bands be made tighter or broader after the peak front is chosen.",
    represents: "Perimeter-distance decay strength for the visual heat map.",
    increase: "Makes the red region tighter and the opposite side colder.",
    decrease: "Spreads warm colors farther around the border.",
    formula:
      "concentration = exp(-normalizedPerimeterDistance * (1 + visualFocus * wildernessDirectionalPreviewFalloff))",
  },
  wildernessFrontCapacity: {
    does: "Caps how many exploration troops can affect per-tile expansion speed at once.",
    exists: "Separates wave endurance from immediate front-line throughput.",
    represents:
      "The number of committed troops that can actively fight at the front.",
    increase:
      "Lets larger waves convert more troop mass into faster tile claims.",
    decrease:
      "Makes extra troops mostly extend the push duration instead of increasing speed.",
    formula:
      "activeFrontTroops = min(explorationTroops, wildernessFrontCapacity)",
  },
  wildernessAttackerLossPerTile: {
    does: "Subtracts exploration troops after each wilderness tile is claimed.",
    exists:
      "Makes expansion consume manpower and creates a natural expedition limit.",
    represents: "Attrition, settlement costs, supply losses, and resistance.",
    increase: "Burns expedition troops faster and shortens exploration reach.",
    decrease: "Lets the same committed troops claim more tiles.",
    formula:
      "explorationTroopsAfterTile = explorationTroopsBeforeTile - wildernessAttackerLossPerTile",
  },
  wildernessTilesPerTickMultiplier: {
    does: "Multiplies the per-tick frontier budget before tiles are claimed.",
    exists: "Controls how much border can be processed each simulation tick.",
    represents: "Operational throughput across the active frontier.",
    increase:
      "Claims more tiles per tick when troops and frontier are available.",
    decrease: "Spreads conquest over more ticks and makes growth more gradual.",
    formula:
      "tileBudget = (borderSize + randomInt(0, 5)) * wildernessTilesPerTickMultiplier",
  },
};

const FOUNDATION_RESTART_SETTING_KEYS = new Set<keyof FoundationTuningSettings>(
  [
    "seed",
    "width",
    "height",
    "seaLevel",
    "continentScale",
    "mountainStrength",
    "coastFalloff",
    "coastRoughness",
    "latitudeEffect",
    "elevationCooling",
    "rainNoise",
    "warmthRainfall",
    "riverFlowRetention",
    "lakeWaterThreshold",
    "lakeElevationRange",
    "riverWeakThreshold",
    "riverStrongThreshold",
    "startingTroops",
    "placementRadius",
  ],
);

const FOUNDATION_PLAYER_PALETTE: BaseMapPalette = {
  entries: [
    {
      ownerId: 1,
      fill: [0.13, 0.62, 0.43, 0.78],
      border: [0.73, 0.95, 0.63, 0.95],
    },
  ],
};

const FOUNDATION_AUTO_GENERATE_MAX_DIMENSION = 512;
export const FOUNDATION_GENERATED_MAP_STORAGE_KEY =
  "foundation.generatedMap.v4";
const FOUNDATION_GESTURE_EVENTS = [
  "gesturestart",
  "gesturechange",
  "gestureend",
] as const;
const FOUNDATION_DRAG_THRESHOLD_PX = 3;

const FOUNDATION_MAP_SETTING_KEYS = new Set<keyof FoundationTuningSettings>([
  "seed",
  "width",
  "height",
  "seaLevel",
  "continentScale",
  "mountainStrength",
  "coastFalloff",
  "coastRoughness",
  "latitudeEffect",
  "elevationCooling",
  "rainNoise",
  "warmthRainfall",
  "riverFlowRetention",
  "lakeWaterThreshold",
  "lakeElevationRange",
  "riverWeakThreshold",
  "riverStrongThreshold",
  "elevation",
  "mapGenerator",
]);

interface FoundationGeneratedMapCache {
  version?: number;
  signature: string;
  width: number;
  height: number;
  terrain: string;
  elevation?: string;
  elevation16?: string;
  terrainColors?: string;
  terrainColorsRgb?: string;
  resourceLayers8?: Partial<Record<FoundationResourceLayerKey, string>>;
}

interface FoundationPreparedMap {
  map: FoundationEngineTileMap;
  terrainColors: Uint8Array | undefined;
  worldEngineLayers?: FoundationWorldEngineLayers;
  resourceLayers?: WorldEngineResourceMaps;
  source: "cache" | "current" | "generated";
}

type FoundationResourceLayerKey = keyof WorldEngineResourceMaps;

const FOUNDATION_RESOURCE_LAYER_KEYS: readonly FoundationResourceLayerKey[] = [
  "crop",
  "basin",
  "oil",
  "metal",
];

type FoundationLayerColor = readonly [r: number, g: number, b: number];
type FoundationScalarLayerPalette = readonly (readonly [
  value: number,
  color: FoundationLayerColor,
])[];

const FOUNDATION_CROP_LAYER_PALETTE: FoundationScalarLayerPalette = [
  [0, [28, 40, 34]],
  [0.35, [83, 111, 58]],
  [0.7, [151, 171, 77]],
  [1, [222, 214, 126]],
];

const FOUNDATION_BASIN_LAYER_PALETTE: FoundationScalarLayerPalette = [
  [0, [31, 37, 45]],
  [0.38, [76, 83, 94]],
  [0.72, [145, 137, 103]],
  [1, [218, 192, 126]],
];

const FOUNDATION_OIL_LAYER_PALETTE: FoundationScalarLayerPalette = [
  [0, [20, 33, 42]],
  [0.35, [56, 73, 76]],
  [0.72, [106, 112, 79]],
  [1, [226, 181, 83]],
];

const FOUNDATION_METAL_LAYER_PALETTE: FoundationScalarLayerPalette = [
  [0, [29, 34, 39]],
  [0.4, [83, 91, 98]],
  [0.72, [151, 155, 152]],
  [1, [236, 239, 228]],
];

interface FoundationResourceLayerDefinition {
  key: FoundationResourceLayerKey;
  label: string;
  palette: FoundationScalarLayerPalette;
}

const FOUNDATION_RESOURCE_LAYER_DEFINITIONS: readonly FoundationResourceLayerDefinition[] =
  [
    { key: "crop", label: "Crop", palette: FOUNDATION_CROP_LAYER_PALETTE },
    { key: "basin", label: "Basin", palette: FOUNDATION_BASIN_LAYER_PALETTE },
    { key: "oil", label: "Oil", palette: FOUNDATION_OIL_LAYER_PALETTE },
    { key: "metal", label: "Metal", palette: FOUNDATION_METAL_LAYER_PALETTE },
  ];

interface FoundationResourceLayerPreviewItem {
  key: FoundationResourceLayerKey;
  label: string;
  src: string;
}

@customElement("foundation-page")
export class FoundationPage extends LitElement {
  @query("canvas")
  private canvas!: HTMLCanvasElement;

  @state()
  private snapshot: FoundationRuntimeSnapshot | null = null;

  @state()
  private status: FoundationClientStatus = {
    tone: "idle",
    text: "Click a tile to place the player.",
  };

  @state()
  private paused = true;

  @state()
  private loading = false;

  @state()
  private loadingStepLabel = "Preparing world generation...";

  @state()
  private tuningSettings: FoundationTuningSettings =
    DEFAULT_FOUNDATION_TUNING_SETTINGS;

  @state()
  private activeControlTab: FoundationControlTab = "world";

  @state()
  private inputDrafts: Partial<Record<keyof FoundationTuningSettings, string>> =
    {};

  @state()
  private openMechanicKeys: (keyof FoundationTuningSettings)[] = [];

  private runtime: FoundationRuntime | null = null;
  private renderer: BaseMapWebGLAdapter | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private tickTimer: number | null = null;
  private directionalBorderPreview: FoundationDirectionalBorderPreview | null =
    null;
  private currentPreparedWorld: FoundationPreparedMap | null = null;
  private resourceLayerPreviewWorld: FoundationPreparedMap | null = null;
  private resourceLayerPreviewItems: readonly FoundationResourceLayerPreviewItem[] =
    [];
  private currentWorldSignature: string | null = null;
  private dragPointerId: number | null = null;
  private dragLastX = 0;
  private dragLastY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragMoved = false;
  private suppressNextCanvasClick = false;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 50000;
      overflow: auto;
      color-scheme: dark;
      --bg: #101416;
      --panel: #181d20;
      --panel-2: #20262a;
      --line: #30383d;
      --text: #e7ecef;
      --muted: #9daab1;
      --accent: #7dc8a6;
      --accent-2: #e6bf63;
      --danger: #de786b;
      background: var(--bg);
      color: var(--text);
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
    }

    .controls {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto;
      border-right: 1px solid var(--line);
      background: var(--panel);
      padding: 20px;
      overflow: hidden;
      max-height: 100vh;
    }

    .brand {
      margin-bottom: 22px;
    }

    .brand h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.1;
    }

    .brand p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .tab-tools {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 8px;
      margin-bottom: 14px;
    }

    .control-tabs-kit {
      display: block;
      --hud-color: var(--text);
    }

    .panel-scroll {
      min-height: 0;
      overflow-y: auto;
      padding-right: 2px;
    }

    .panel-scroll-disabled {
      opacity: 0.58;
      pointer-events: none;
      user-select: none;
    }

    .control-panel[hidden] {
      display: none;
    }

    .control-section {
      display: block;
      margin-bottom: 14px;
      --hud-radius: 8px;
      --hud-surface-header-min-height: 42px;
      --hud-surface-header-padding: 10px 12px;
      --hud-surface-body-padding: 12px;
    }

    .control-section::part(surface) {
      border: 1px solid rgb(48 56 61 / 0.86);
      background: rgb(24 29 32 / 0.92);
    }

    .section-title {
      color: var(--accent);
      font-size: 13px;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    hud-input {
      --hud-input-height: 24px;
      --hud-input-radius: 6px;
      --hud-input-font-size: 10px;
      --hud-input-background: var(--panel-2);
      --hud-input-border-color: var(--line);
      --hud-input-text-align: right;
    }

    hud-button {
      --hud-button-width: 100%;
      --hud-button-min-height: 30px;
      --hud-button-radius: 6px;
      --hud-button-padding: 5px 8px;
    }

    hud-icon-button {
      --hud-icon-button-size: 24px;
      --hud-button-border-color: var(--line);
      --hud-button-background: rgb(32 38 42 / 0.82);
      --hud-button-hover-background: rgb(48 56 61 / 0.9);
      --hud-button-color: var(--text);
    }

    hud-toggle {
      --hud-color: var(--text);
    }

    .control-icon {
      display: block;
      width: 14px;
      height: 14px;
      color: currentColor;
      stroke: currentColor;
    }

    hud-button.primary-action {
      --hud-button-background: var(--accent);
      --hud-button-border-color: rgb(125 200 166 / 0.55);
      --hud-button-color: #09100d;
      --hud-button-hover-background: #95d9bb;
    }

    hud-button.danger-action {
      --hud-button-background: rgb(120 36 36 / 0.34);
      --hud-button-border-color: rgb(222 120 107 / 0.72);
      --hud-button-color: #fecaca;
      --hud-button-hover-background: rgb(140 42 42 / 0.48);
    }

    .world-generate {
      display: block;
    }

    .world-generation-controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }

    .control-table {
      display: grid;
      grid-template-columns: minmax(84px, 0.8fr) minmax(154px, 1.45fr);
      align-items: center;
      gap: 7px 10px;
    }

    .control-table-head {
      display: contents;
      color: var(--muted);
      font-size: 9px;
      font-weight: 700;
      line-height: 1;
      text-transform: uppercase;
    }

    .control-row {
      display: contents;
    }

    .control-name {
      min-width: 0;
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      line-height: 1.15;
    }

    .mechanic-toggle {
      display: inline-grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 5px;
      width: 100%;
      min-width: 0;
      border: 0;
      background: transparent;
      color: var(--text);
      cursor: pointer;
      font: inherit;
      font-weight: 800;
      line-height: 1.15;
      padding: 0;
      text-align: left;
    }

    .mechanic-toggle::before {
      content: "+";
      display: inline-grid;
      place-items: center;
      width: 13px;
      height: 13px;
      border: 1px solid rgb(125 200 166 / 0.5);
      border-radius: 3px;
      color: var(--accent);
      font-size: 10px;
      line-height: 1;
    }

    .mechanic-toggle[aria-expanded="true"]::before {
      content: "-";
    }

    .mechanic-toggle:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    .control-widget {
      min-width: 0;
    }

    .mechanic-detail {
      grid-column: 1 / -1;
      min-width: 0;
      margin: -2px 0 8px;
      overflow: hidden;
      border: 1px solid rgb(48 56 61 / 0.72);
      border-left: 2px solid rgb(125 200 166 / 0.7);
      border-radius: 6px;
      background: rgb(32 38 42 / 0.62);
      color: var(--muted);
      font-size: 10px;
      line-height: 1.35;
    }

    .mechanic-table {
      width: 100%;
      border-collapse: collapse;
    }

    .mechanic-table th,
    .mechanic-table td {
      padding: 7px 9px;
      border-bottom: 1px solid rgb(48 56 61 / 0.62);
      text-align: left;
      vertical-align: top;
    }

    .mechanic-table tr:last-child th,
    .mechanic-table tr:last-child td {
      border-bottom: 0;
    }

    .mechanic-table th {
      width: 74px;
      color: var(--accent-2);
      font-size: 9px;
      line-height: 1.2;
      text-transform: uppercase;
    }

    .mechanic-table td {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .mechanic-formula {
      color: var(--text);
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", monospace;
      font-size: 9px;
    }

    .inline-input-action {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .slider-value-control {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(42px, auto);
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .slider-value-text {
      min-width: 0;
      color: var(--text);
      font-size: 10px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      overflow: hidden;
      text-align: right;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .reset-actions {
      position: sticky;
      bottom: 0;
      background: linear-gradient(180deg, rgb(24 29 32 / 0), var(--panel) 22%);
      padding-top: 24px;
      --hud-stack-gap: 8px;
    }

    .runtime-title {
      color: var(--accent);
      font-size: 13px;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .runtime-header-tools {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      margin-left: auto;
      pointer-events: auto;
    }

    .runtime-header-tools hud-icon-button {
      --hud-icon-button-size: 22px;
    }

    .runtime-status-pill {
      width: 42px;
      --hud-pill-justify: center;
    }

    .workspace {
      min-width: 0;
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      padding: 20px;
    }

    .statusbar {
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 20px;
      color: var(--muted);
      font-size: 14px;
    }

    .statusbar div {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .statusbar strong {
      color: var(--text);
    }

    hud-surface.map-panel {
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      --hud-radius: 8px;
      --hud-surface-header-min-height: 50px;
      --hud-surface-header-padding: 12px 14px;
      --hud-surface-body-padding: 0;
    }

    hud-surface.map-panel::part(surface) {
      display: grid;
      min-height: 0;
      height: 100%;
      grid-template-rows: auto minmax(0, 1fr);
      border: 1px solid var(--line);
      background: var(--panel);
    }

    .panel-head-content {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .panel-head-content h2 {
      margin: 0;
      font-size: 16px;
    }

    .panel-head-content span {
      color: var(--muted);
      font-size: 13px;
    }

    .canvas-frame-host {
      display: block;
      min-height: 0;
      height: 100%;
    }

    .canvas-frame-host::part(body) {
      min-height: 0;
      height: 100%;
      padding: 0;
    }

    .canvas-frame {
      position: relative;
      min-height: 0;
      height: 100%;
    }

    .board-state-overlay {
      position: absolute;
      inset: 0;
      z-index: 4;
      display: grid;
      place-items: center;
      background: rgb(5 7 8 / 0.48);
      pointer-events: auto;
    }

    .board-state-panel {
      display: grid;
      min-width: min(260px, calc(100% - 40px));
      gap: 8px;
      place-items: center;
      border: 1px solid rgb(48 56 61 / 0.9);
      border-radius: 8px;
      background: rgb(24 29 32 / 0.9);
      box-shadow: 0 18px 48px rgb(0 0 0 / 0.32);
      color: var(--text);
      padding: 16px;
      text-align: center;
      backdrop-filter: blur(8px);
    }

    .board-state-panel p {
      max-width: 280px;
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
    }

    .board-state-step {
      color: var(--text);
      font-size: 12px;
      font-weight: 800;
    }

    .runtime-overlay {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
      width: min(280px, calc(100% - 24px));
      pointer-events: none;
      backdrop-filter: blur(8px);
      --hud-radius: 8px;
      --hud-surface-header-min-height: 34px;
      --hud-surface-header-padding: 8px 10px;
      --hud-surface-body-padding: 10px;
    }

    .runtime-overlay::part(surface) {
      border: 1px solid rgb(48 56 61 / 0.86);
      background: rgb(24 29 32 / 0.88);
      box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
    }

    .runtime-overlay hud-stat-grid {
      --hud-stat-gap: 8px;
    }

    .runtime-overlay hud-alert {
      margin-top: 10px;
    }

    .resource-layer-overlay {
      position: absolute;
      right: 12px;
      bottom: 12px;
      z-index: 2;
      width: min(360px, calc(100% - 24px));
      pointer-events: auto;
      backdrop-filter: blur(8px);
      --hud-radius: 8px;
      --hud-surface-header-min-height: 32px;
      --hud-surface-header-padding: 8px 10px;
      --hud-surface-body-padding: 10px;
    }

    .resource-layer-overlay::part(surface) {
      border: 1px solid rgb(48 56 61 / 0.86);
      background: rgb(24 29 32 / 0.88);
      box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
    }

    .resource-layer-title {
      color: var(--accent);
      font-size: 12px;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .resource-layer-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }

    .resource-layer-tile {
      display: grid;
      gap: 5px;
      min-width: 0;
    }

    .resource-layer-tile img {
      display: block;
      width: 100%;
      aspect-ratio: 1;
      border: 1px solid rgb(48 56 61 / 0.9);
      border-radius: 4px;
      background: #050708;
      image-rendering: pixelated;
      object-fit: cover;
    }

    .resource-layer-tile span {
      min-width: 0;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      line-height: 1;
      overflow: hidden;
      text-align: center;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: crosshair;
      touch-action: none;
      image-rendering: pixelated;
      background: #050708;
    }

    @media (max-width: 820px) {
      :host {
        position: static;
      }

      .app {
        grid-template-columns: 1fr;
      }

      .controls {
        max-height: none;
        border-right: 0;
        border-bottom: 1px solid var(--line);
        overflow: visible;
      }

      .panel-scroll {
        overflow: visible;
      }

      .workspace {
        min-height: 70vh;
      }

      .statusbar {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `;

  firstUpdated(): void {
    this.tuningSettings = loadFoundationTuningSettings(
      foundationTuningOverridesFromLocation(),
    );

    this.canvas.addEventListener("click", this.handleCanvasClick);
    this.canvas.addEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.addEventListener("wheel", this.handleCanvasWheel, {
      passive: false,
    });
    window.addEventListener("pointermove", this.handleCanvasPointerMove);
    window.addEventListener("pointerup", this.handleCanvasPointerUp);
    window.addEventListener("pointercancel", this.handleCanvasPointerUp);
    for (const eventName of FOUNDATION_GESTURE_EVENTS) {
      document.addEventListener(eventName, this.preventPageGestureZoom, {
        passive: false,
      });
    }
    this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
    this.resizeObserver.observe(this.canvas);
    this.configureTickTimer();
    const hasCachedMap = hasGeneratedMapCache(
      foundationGeneratedMapSignature(this.tuningSettings),
    );
    this.status = this.initialGenerationStatus(hasCachedMap);
    if (this.shouldAutoGenerateCurrentMap() || hasCachedMap) {
      void this.generateWorld("Generated world with saved parameters.", {
        force: hasCachedMap,
      });
    }
  }

  disconnectedCallback(): void {
    this.canvas?.removeEventListener("click", this.handleCanvasClick);
    this.canvas?.removeEventListener(
      "pointerdown",
      this.handleCanvasPointerDown,
    );
    this.canvas?.removeEventListener("wheel", this.handleCanvasWheel);
    window.removeEventListener("pointermove", this.handleCanvasPointerMove);
    window.removeEventListener("pointerup", this.handleCanvasPointerUp);
    window.removeEventListener("pointercancel", this.handleCanvasPointerUp);
    for (const eventName of FOUNDATION_GESTURE_EVENTS) {
      document.removeEventListener(eventName, this.preventPageGestureZoom);
    }
    this.resizeObserver?.disconnect();
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
    }
    this.renderer?.dispose();
    this.resizeObserver = null;
    this.tickTimer = null;
    this.directionalBorderPreview = null;
    this.renderer = null;
    this.runtime = null;
    super.disconnectedCallback();
  }

  render() {
    const snapshot = this.snapshot;
    return html`
      <main class="app">
        <aside class="controls" aria-label="Foundation world controls">
          <div class="brand">
            <h1>Foundation</h1>
            <p>WorldEngine terrain and growth mechanics</p>
          </div>

          <div class="tab-tools">
            <hud-tabs
              class="control-tabs-kit"
              .items=${FOUNDATION_CONTROL_TABS}
              .selected=${this.activeControlTab}
              @selection-change=${this.handleControlTabChange}
              aria-label="Control groups"
            ></hud-tabs>
            <hud-icon-button
              label="Copy parameters as JSON"
              title="Copy parameters as JSON"
              ?disabled=${this.loading}
              @click=${this.copyParameters}
            >
              ${renderLucideIcon(Copy, "control-icon")}
            </hud-icon-button>
          </div>

          <div
            class=${`panel-scroll ${this.loading ? "panel-scroll-disabled" : ""}`}
            ?inert=${this.loading}
            aria-disabled=${this.loading ? "true" : "false"}
          >
            <div
              class="control-panel"
              ?hidden=${this.activeControlTab !== "world"}
            >
              <div class="world-generation-controls">
                <hud-toggle
                  label="Auto generate"
                  .checked=${this.tuningSettings.autoGenerateWorld}
                  ?disabled=${this.loading}
                  @change=${this.handleAutoGenerateToggle}
                ></hud-toggle>
                <hud-button
                  class="primary-action world-generate"
                  variant="primary"
                  ?disabled=${this.generateWorldButtonDisabled()}
                  @click=${this.handleGenerate}
                >
                  Generate World
                </hud-button>
              </div>
              ${this.controlSection(
                "World",
                html`
                  ${this.seedInput()}
                  ${this.numberInput("Width", "width", 32, 1024, 1)}
                  ${this.numberInput("Height", "height", 32, 1024, 1)}
                  ${this.rangeInput(
                    "Sea level",
                    "seaLevel",
                    0.2,
                    0.75,
                    0.01,
                    2,
                  )}
                `,
              )}
              ${this.controlSection(
                "Elevation",
                html`
                  ${this.rangeInput(
                    "Continent scale",
                    "continentScale",
                    0.35,
                    1.6,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Mountain strength",
                    "mountainStrength",
                    0,
                    1,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Edge water bias",
                    "coastFalloff",
                    0,
                    1.4,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Coast roughness",
                    "coastRoughness",
                    0,
                    1,
                    0.01,
                    2,
                  )}
                `,
              )}
              ${this.controlSection(
                "Climate",
                html`
                  ${this.rangeInput(
                    "Latitude effect",
                    "latitudeEffect",
                    0,
                    1,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Elevation cooling",
                    "elevationCooling",
                    0,
                    0.8,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput("Rain noise", "rainNoise", 0, 1, 0.01, 2)}
                  ${this.rangeInput(
                    "Warmth rainfall",
                    "warmthRainfall",
                    0,
                    1,
                    0.01,
                    2,
                  )}
                `,
              )}
            </div>

            <div
              class="control-panel"
              ?hidden=${this.activeControlTab !== "river"}
            >
              ${this.controlSection(
                "River",
                html`
                  ${this.rangeInput(
                    "Flow retention",
                    "riverFlowRetention",
                    0,
                    1,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Lake water threshold",
                    "lakeWaterThreshold",
                    0.1,
                    5,
                    0.05,
                    2,
                  )}
                  ${this.rangeInput(
                    "Lake basin depth",
                    "lakeElevationRange",
                    0,
                    0.5,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Weak river display",
                    "riverWeakThreshold",
                    0,
                    1,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Strong river display",
                    "riverStrongThreshold",
                    0,
                    1,
                    0.01,
                    2,
                  )}
                `,
              )}
            </div>

            <div
              class="control-panel"
              ?hidden=${this.activeControlTab !== "mechanics"}
            >
              ${this.controlSection(
                "Simulation",
                html`
                  ${this.rangeInput(
                    "Tick ms",
                    "tickIntervalMs",
                    20,
                    1000,
                    10,
                    0,
                  )}
                  ${this.percentRangeInput("Attack", "attackRatio", 1, 100, 1)}
                  ${this.rangeInput(
                    "Starting troops",
                    "startingTroops",
                    0,
                    100000,
                    500,
                    0,
                  )}
                  ${this.rangeInput(
                    "Placement radius",
                    "placementRadius",
                    0,
                    16,
                    1,
                    0,
                  )}
                `,
              )}
              ${this.controlSection(
                "Troop Growth",
                html`
                  ${this.rangeInput(
                    "Regen base",
                    "troopRegenBase",
                    0,
                    200,
                    1,
                    0,
                  )}
                  ${this.rangeInput(
                    "Regen exponent",
                    "troopRegenExponent",
                    0,
                    1.5,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Regen divisor",
                    "troopRegenDivisor",
                    0.5,
                    20,
                    0.5,
                    1,
                  )}
                  ${this.rangeInput(
                    "Max multiplier",
                    "maxTroopMultiplier",
                    0.1,
                    6,
                    0.1,
                    1,
                  )}
                  ${this.rangeInput(
                    "Max tile exponent",
                    "maxTroopTileExponent",
                    0,
                    1.5,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Max tile scale",
                    "maxTroopTileScale",
                    0,
                    5000,
                    100,
                    0,
                  )}
                  ${this.rangeInput(
                    "Max base",
                    "maxTroopBase",
                    0,
                    200000,
                    1000,
                    0,
                  )}
                `,
              )}
              ${this.controlSection(
                "Wilderness",
                html`
                  ${this.rangeInput(
                    "Base speed",
                    "wildernessBaseSpeed",
                    1,
                    80,
                    0.5,
                    1,
                  )}
                  ${this.rangeInput(
                    "Slope scale",
                    "elevationSlopeScale",
                    0,
                    2,
                    0.05,
                    2,
                  )}
                  ${this.rangeInput(
                    "Min speed mult",
                    "minToblerSpeedMultiplier",
                    0.01,
                    2,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Max speed mult",
                    "maxToblerSpeedMultiplier",
                    0.01,
                    3,
                    0.05,
                    2,
                  )}
                  ${this.rangeInput(
                    "Priority scale",
                    "terrainPriorityElevationScale",
                    0,
                    4,
                    0.1,
                    1,
                  )}
                  ${this.rangeInput(
                    "Vector sharpness",
                    "wildernessVectorSharpness",
                    0,
                    4,
                    0.05,
                    2,
                  )}
                  ${this.rangeInput(
                    "Preview distance",
                    "wildernessDirectionalPreviewDistance",
                    1,
                    128,
                    1,
                    0,
                  )}
                  ${this.rangeInput(
                    "Preview sharpness",
                    "wildernessDirectionalPreviewSharpness",
                    0,
                    4,
                    0.05,
                    2,
                  )}
                  ${this.rangeInput(
                    "Preview contrast",
                    "wildernessDirectionalPreviewContrast",
                    0,
                    5,
                    0.05,
                    2,
                  )}
                  ${this.rangeInput(
                    "Preview falloff",
                    "wildernessDirectionalPreviewFalloff",
                    0,
                    24,
                    0.5,
                    1,
                  )}
                  ${this.rangeInput(
                    "Front capacity",
                    "wildernessFrontCapacity",
                    500,
                    50000,
                    500,
                    0,
                  )}
                  ${this.rangeInput(
                    "Loss per tile",
                    "wildernessAttackerLossPerTile",
                    0,
                    100,
                    1,
                    0,
                  )}
                  ${this.rangeInput(
                    "Tile budget mult",
                    "wildernessTilesPerTickMultiplier",
                    0.1,
                    8,
                    0.1,
                    1,
                  )}
                `,
              )}
            </div>
          </div>

          <hud-stack class="reset-actions">
            <hud-button
              class="danger-action"
              variant="danger"
              ?disabled=${this.loading}
              @click=${this.resetDefaults}
            >
              Reset Defaults
            </hud-button>
          </hud-stack>
        </aside>

        <section class="workspace" aria-label="Foundation generated game board">
          <header class="statusbar">
            <div>
              <strong
                >${snapshot
                  ? `${snapshot.map.width} x ${snapshot.map.height}`
                  : "pending"}</strong
              >
              <span>seed ${this.tuningSettings.seed}</span>
            </div>
            <div>
              <span>${this.status.text}</span>
              <span>${formatTroops(snapshot?.player.troops)} troops</span>
            </div>
          </header>

          <hud-surface class="map-panel">
            <hud-surface-header>
              <div class="panel-head-content">
                <h2>Foundation</h2>
                <span>live game board</span>
              </div>
            </hud-surface-header>
            <hud-surface-body class="canvas-frame-host">
              <div class="canvas-frame">
                ${this.renderRuntimeOverlay(snapshot)}
                <canvas aria-label="Foundation generated game board"></canvas>
                ${this.renderResourceLayerOverlay()}
                ${this.renderBoardStateOverlay()}
              </div>
            </hud-surface-body>
          </hud-surface>
        </section>
      </main>
    `;
  }

  private renderRuntimeOverlay(snapshot: FoundationRuntimeSnapshot | null) {
    return html`
      <hud-surface
        class="runtime-overlay"
        aria-label="Foundation runtime state"
      >
        <hud-surface-header>
          <span class="runtime-title">Runtime</span>
          <span class="runtime-header-tools">
            <hud-icon-button
              label=${this.paused ? "Play simulation" : "Pause simulation"}
              title=${this.paused ? "Play simulation" : "Pause simulation"}
              ?disabled=${this.loading || !this.runtime}
              @click=${this.togglePlayPause}
            >
              ${renderLucideIcon(this.paused ? Play : Pause, "control-icon")}
            </hud-icon-button>
            <hud-icon-button
              label="Restart simulation"
              title="Restart simulation"
              ?disabled=${this.loading || !this.runtime}
              @click=${this.handleRestartSimulation}
            >
              ${renderLucideIcon(RotateCcw, "control-icon")}
            </hud-icon-button>
            <hud-pill class="runtime-status-pill" tone=${this.statusPillTone()}
              >${this.status.tone}</hud-pill
            >
          </span>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stat-grid columns="2">
            <hud-stat
              label="Player"
              value=${snapshot?.player.placed ? "placed" : "unplaced"}
            ></hud-stat>
            <hud-stat
              label="Selected tile"
              value=${formatSelectedTile(snapshot)}
            ></hud-stat>
            <hud-stat
              label="Claimed tiles"
              value=${snapshot?.player.claimedTileCount.toLocaleString() ?? "0"}
            ></hud-stat>
            <hud-stat
              label="Troops"
              value=${formatTroops(snapshot?.player.troops)}
            ></hud-stat>
            <hud-stat
              label="Max troops"
              value=${formatTroops(snapshot?.player.maxTroops)}
            ></hud-stat>
            <hud-stat
              label="Troop rate"
              value=${formatTroopRate(snapshot?.player.troopIncreaseRate)}
            ></hud-stat>
            <hud-stat
              label="Exploring"
              value=${formatTroops(snapshot?.player.exploringTroops)}
            ></hud-stat>
            <hud-stat
              label="Tick"
              value=${snapshot?.tick.toLocaleString() ?? "0"}
            ></hud-stat>
            <hud-stat
              label="Updates"
              value=${snapshot?.updateCount.toLocaleString() ?? "0"}
            ></hud-stat>
          </hud-stat-grid>
          <hud-alert compact tone=${this.statusAlertTone()}>
            ${this.status.text}
          </hud-alert>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderResourceLayerOverlay(): TemplateResult | null {
    const preparedWorld = this.currentPreparedWorld;
    const resourceLayers = resourceLayersForPreparedMap(preparedWorld);
    if (!preparedWorld || !resourceLayers) {
      this.resourceLayerPreviewWorld = null;
      this.resourceLayerPreviewItems = [];
      return null;
    }

    const items = this.resourceLayerPreviewItemsFor(preparedWorld);

    return html`
      <hud-surface class="resource-layer-overlay" aria-label="Resource layers">
        <hud-surface-header>
          <span class="resource-layer-title">Resources</span>
        </hud-surface-header>
        <hud-surface-body>
          <div class="resource-layer-grid">
            ${items.map(({ label, src }) => {
              return html`
                <div class="resource-layer-tile">
                  <img src=${src} alt=${`${label} potential`} />
                  <span>${label}</span>
                </div>
              `;
            })}
          </div>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private resourceLayerPreviewItemsFor(
    preparedWorld: FoundationPreparedMap,
  ): readonly FoundationResourceLayerPreviewItem[] {
    if (this.resourceLayerPreviewWorld === preparedWorld) {
      return this.resourceLayerPreviewItems;
    }

    const resourceLayers = resourceLayersForPreparedMap(preparedWorld);
    if (!resourceLayers) {
      this.resourceLayerPreviewWorld = null;
      this.resourceLayerPreviewItems = [];
      return this.resourceLayerPreviewItems;
    }

    const width = preparedWorld.map.width();
    const height = preparedWorld.map.height();
    this.resourceLayerPreviewWorld = preparedWorld;
    this.resourceLayerPreviewItems = FOUNDATION_RESOURCE_LAYER_DEFINITIONS.map(
      ({ key, label, palette }) => ({
        key,
        label,
        src: scalarLayerDataUrl(resourceLayers[key], width, height, palette),
      }),
    );
    return this.resourceLayerPreviewItems;
  }

  private renderBoardStateOverlay(): TemplateResult | null {
    if (this.loading) {
      return html`
        <div class="board-state-overlay" aria-live="polite">
          <div class="board-state-panel">
            <hud-loading-state label="Generating world"></hud-loading-state>
            <div class="board-state-step">${this.loadingStepLabel}</div>
            <p>Inputs are locked while the terrain and renderer are rebuilt.</p>
          </div>
        </div>
      `;
    }

    if (this.runtime !== null) {
      return null;
    }

    return html`
      <div class="board-state-overlay" aria-live="polite">
        <div class="board-state-panel">
          <strong>World not generated</strong>
          <p>${this.status.text}</p>
        </div>
      </div>
    `;
  }

  private readonly preventPageGestureZoom = (event: Event): void => {
    event.preventDefault();
  };

  private readonly handleCanvasWheel = (event: WheelEvent): void => {
    event.preventDefault();

    const zoomDelta = foundationZoomDeltaFromWheelEvent(event);
    if (zoomDelta === null || !this.renderer) {
      return;
    }

    const zoomDenominator = 1 + zoomDelta / 600;
    if (zoomDenominator <= 0) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.renderer.zoomAtScreen(1 / zoomDenominator, {
      screenX: event.clientX - rect.left,
      screenY: event.clientY - rect.top,
    });
    this.requestUpdate();
  };

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.loading || !this.renderer) {
      return;
    }

    this.dragPointerId = event.pointerId;
    this.dragLastX = event.clientX;
    this.dragLastY = event.clientY;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragMoved = false;
    this.canvas.style.cursor = "grabbing";
  };

  private readonly handleCanvasPointerMove = (event: PointerEvent): void => {
    if (!this.renderer) {
      return;
    }

    if (this.dragPointerId !== event.pointerId) {
      this.updateDirectionalBorderPreviewForPointer(event);
      return;
    }

    const deltaX = event.clientX - this.dragLastX;
    const deltaY = event.clientY - this.dragLastY;
    const totalDrag =
      Math.abs(event.clientX - this.dragStartX) +
      Math.abs(event.clientY - this.dragStartY);

    this.dragLastX = event.clientX;
    this.dragLastY = event.clientY;

    if (!this.dragMoved && totalDrag < FOUNDATION_DRAG_THRESHOLD_PX) {
      return;
    }

    this.dragMoved = true;
    event.preventDefault();

    const zoom = this.renderer.getCameraState().zoom;
    if (zoom <= 0) {
      return;
    }

    const worldPerCssPx = (window.devicePixelRatio || 1) / zoom;
    this.renderer.panBy(-deltaX * worldPerCssPx, -deltaY * worldPerCssPx);
    this.clearDirectionalBorderPreview();
  };

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }

    this.dragPointerId = null;
    this.canvas.style.cursor = "crosshair";

    if (this.dragMoved) {
      this.suppressNextCanvasClick = true;
      this.dragMoved = false;
      event.preventDefault();
    }
  };

  private readonly handleCanvasClick = (event: MouseEvent): void => {
    if (this.suppressNextCanvasClick) {
      this.suppressNextCanvasClick = false;
      event.preventDefault();
      return;
    }

    if (this.loading || !this.runtime || !this.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const tile = this.renderer.screenToTile({
      screenX: event.clientX - rect.left,
      screenY: event.clientY - rect.top,
    });

    if (tile === null) {
      this.status = {
        tone: "error",
        text: "Click landed outside the map bounds.",
      };
      return;
    }

    const currentSnapshot = this.snapshot ?? this.runtime.snapshot();
    const wasPlacingPlayer = !currentSnapshot.player.placed;
    const result = this.runtime.dispatch(
      currentSnapshot.player.placed
        ? createGrowTerritoryCommand({
            targetTileRef: tile.ref,
            turnNumber: currentSnapshot.tick,
            troopRatio: this.tuningSettings.attackRatio,
          })
        : createPlacePlayerCommand({
            tileRef: tile.ref,
            turnNumber: currentSnapshot.tick,
          }),
    );

    this.applyMapUpdate(result.update.map);
    this.clearDirectionalBorderPreview();
    this.snapshot = this.runtime.snapshot();
    this.status = this.statusFromCommandResult(result, tile);
    if (result.ok && wasPlacingPlayer) {
      this.paused = false;
    }
  };

  private readonly advanceRuntimeTick = (): void => {
    if (this.paused || !this.runtime || !this.renderer) return;
    const update = this.runtime.advanceTick();
    this.applyMapUpdate(update.map);
    this.snapshot = this.runtime.snapshot();

    const growthEvent = update.events.find(
      (event) => event.type === "foundation.territory_grown",
    );
    const completed = update.events.some(
      (event) => event.type === "foundation.wilderness_exploration_completed",
    );
    if (growthEvent) {
      const claimedTileCount =
        typeof growthEvent.payload === "object" &&
        growthEvent.payload !== null &&
        "claimedTileCount" in growthEvent.payload
          ? Number(growthEvent.payload.claimedTileCount)
          : 0;
      const exploringTroops = renderTroops(
        update.metrics?.exploringTroops ?? 0,
      );
      this.status = {
        tone: "ok",
        text: `Expanded ${claimedTileCount.toLocaleString()} tiles. Exploring troops: ${exploringTroops}.`,
      };
      return;
    }

    if (completed) {
      this.status = {
        tone: "idle",
        text: "Wilderness exploration completed.",
      };
    }
  };

  private readonly togglePlayPause = (): void => {
    this.paused = !this.paused;
    this.status = {
      tone: this.paused ? "idle" : "ok",
      text: this.paused ? "Simulation paused." : "Simulation running.",
    };
  };

  private readonly handleRestartSimulation = (): void => {
    if (this.loading || !this.runtime) return;
    this.paused = true;
    void this.restartSimulationWithCurrentWorld();
  };

  private readonly handleGenerate = (): void => {
    if (this.generateWorldButtonDisabled()) return;
    void this.generateWorld("Generated world with current parameters.", {
      force: true,
    });
  };

  private readonly resetDefaults = (): void => {
    this.tuningSettings = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      mapGenerator: "world-engine",
    };
    saveFoundationTuningSettings(this.tuningSettings);
    this.inputDrafts = {};
    this.paused = true;
    void this.generateWorld("Parameters reset to defaults.", { force: true });
  };

  private readonly randomizeSeed = (): void => {
    if (this.loading) return;
    const seed = Math.floor(Math.random() * 2_000_000_000);
    this.updateSettings(
      { seed, mapGenerator: "world-engine" },
      { generateOnCommit: true },
    );
  };

  private readonly copyParameters = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(this.tuningSettings, null, 2),
      );
      this.status = {
        tone: "ok",
        text: "Parameters copied as JSON.",
      };
    } catch {
      this.status = {
        tone: "error",
        text: "Could not copy parameters.",
      };
    }
  };

  private readonly handleAutoGenerateToggle = (event: Event): void => {
    const checked =
      (event.currentTarget as { checked?: boolean }).checked === true;
    this.updateSettings(
      { autoGenerateWorld: checked },
      { generateOnCommit: checked },
    );
    if (checked) {
      void this.maybeAutoGenerateWorld();
    }
  };

  private readonly handleControlTabChange = (
    event: CustomEvent<{ id: string }>,
  ): void => {
    this.activeControlTab =
      event.detail.id === "mechanics"
        ? "mechanics"
        : event.detail.id === "river"
          ? "river"
          : "world";
  };

  private controlSection(
    title: string,
    content: TemplateResult,
  ): TemplateResult {
    return html`
      <hud-surface class="control-section">
        <hud-surface-header>
          <span class="section-title">${title}</span>
        </hud-surface-header>
        <hud-surface-body>
          <div class="control-table" role="table" aria-label=${title}>
            <div class="control-table-head" role="row">
              <span role="columnheader">Variable</span>
              <span role="columnheader">Value</span>
            </div>
            ${content}
          </div>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderControlName(
    label: string,
    key: keyof FoundationTuningSettings,
  ): TemplateResult {
    if (!FOUNDATION_MECHANIC_BREAKDOWNS[key]) {
      return html` <span class="control-name" role="cell">${label}</span> `;
    }

    const open = this.openMechanicKeys.includes(key);
    return html`
      <span class="control-name" role="cell">
        <button
          type="button"
          class="mechanic-toggle"
          aria-expanded=${open ? "true" : "false"}
          @click=${() => this.toggleMechanicBreakdown(key)}
        >
          <span>${label}</span>
        </button>
      </span>
    `;
  }

  private numberInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
  ) {
    return html`
      <div class="control-row" role="row">
        ${this.renderControlName(label, key)}
        <span class="control-widget" role="cell">
          <hud-input
            type="number"
            min=${String(min)}
            max=${String(max)}
            step=${String(step)}
            .value=${this.numberInputValue(key)}
            ?disabled=${this.loading}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.handleNumberDraft(event, key)}
            @keydown=${(event: KeyboardEvent) =>
              this.handleNumberKeydown(event, key)}
          ></hud-input>
        </span>
      </div>
      ${this.renderMechanicBreakdown(key)}
    `;
  }

  private seedInput(): TemplateResult {
    return html`
      <div class="control-row" role="row">
        <span class="control-name" role="cell">Seed</span>
        <span class="control-widget" role="cell">
          <span class="inline-input-action">
            <hud-input
              type="number"
              min=${String(-2147483648)}
              max=${String(2147483647)}
              step="1"
              .value=${this.numberInputValue("seed")}
              ?disabled=${this.loading}
              @value-change=${(
                event: CustomEvent<{ value: string | number }>,
              ) => this.handleNumberDraft(event, "seed")}
              @keydown=${(event: KeyboardEvent) =>
                this.handleNumberKeydown(event, "seed")}
            ></hud-input>
            <hud-icon-button
              label="Generate random seed"
              title="Generate random seed"
              ?disabled=${this.loading}
              @click=${this.randomizeSeed}
            >
              ${renderLucideIcon(Dice5, "control-icon")}
            </hud-icon-button>
          </span>
        </span>
      </div>
    `;
  }

  private rangeInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
    precision: number,
  ) {
    const value = Number(this.tuningSettings[key]);
    return html`
      <div class="control-row" role="row">
        ${this.renderControlName(label, key)}
        <span class="control-widget" role="cell">
          <span class="slider-value-control">
            <hud-range
              label=${label}
              .min=${min}
              .max=${max}
              .step=${step}
              .value=${value}
              ?disabled=${this.loading}
              @value-change=${(event: CustomEvent<{ value: number }>) =>
                this.handleNumberValue(event, key)}
              @pointerup=${() => this.handleControlCommit(key)}
              @keyup=${(event: KeyboardEvent) =>
                this.handleRangeKeyup(event, key)}
            ></hud-range>
            <span class="slider-value-text">
              ${formatControlValue(value, precision)}
            </span>
          </span>
        </span>
      </div>
      ${this.renderMechanicBreakdown(key)}
    `;
  }

  private percentRangeInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
  ) {
    const value = Math.round(Number(this.tuningSettings[key]) * 100);
    return html`
      <div class="control-row" role="row">
        ${this.renderControlName(label, key)}
        <span class="control-widget" role="cell">
          <span class="slider-value-control">
            <hud-range
              label=${label}
              .min=${min}
              .max=${max}
              .step=${step}
              .value=${value}
              ?disabled=${this.loading}
              @value-change=${(event: CustomEvent<{ value: number }>) =>
                this.handlePercentValue(event, key)}
              @pointerup=${() => this.handleControlCommit(key)}
              @keyup=${(event: KeyboardEvent) =>
                this.handleRangeKeyup(event, key)}
            ></hud-range>
            <span class="slider-value-text">${value}%</span>
          </span>
        </span>
      </div>
      ${this.renderMechanicBreakdown(key)}
    `;
  }

  private renderMechanicBreakdown(
    key: keyof FoundationTuningSettings,
  ): TemplateResult | null {
    const breakdown = FOUNDATION_MECHANIC_BREAKDOWNS[key];
    if (!breakdown || !this.openMechanicKeys.includes(key)) {
      return null;
    }

    return html`
      <div class="mechanic-detail" role="note">
        <table class="mechanic-table">
          <tbody>
            <tr>
              <th scope="row">Does</th>
              <td>${breakdown.does}</td>
            </tr>
            <tr>
              <th scope="row">Why</th>
              <td>${breakdown.exists}</td>
            </tr>
            <tr>
              <th scope="row">Dynamic</th>
              <td>${breakdown.represents}</td>
            </tr>
            <tr>
              <th scope="row">Increase</th>
              <td>${breakdown.increase}</td>
            </tr>
            <tr>
              <th scope="row">Decrease</th>
              <td>${breakdown.decrease}</td>
            </tr>
            <tr>
              <th scope="row">Formula</th>
              <td>
                <span class="mechanic-formula">${breakdown.formula}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private toggleMechanicBreakdown(key: keyof FoundationTuningSettings): void {
    this.openMechanicKeys = this.openMechanicKeys.includes(key)
      ? this.openMechanicKeys.filter((openKey) => openKey !== key)
      : [...this.openMechanicKeys, key];
  }

  private numberInputValue(key: keyof FoundationTuningSettings): string {
    return this.inputDrafts[key] ?? String(this.tuningSettings[key]);
  }

  private handleNumberDraft(
    event: CustomEvent<{ value: string | number }>,
    key: keyof FoundationTuningSettings,
  ): void {
    this.inputDrafts = {
      ...this.inputDrafts,
      [key]: String(event.detail.value),
    };
  }

  private handleNumberKeydown(
    event: KeyboardEvent,
    key: keyof FoundationTuningSettings,
  ): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    this.commitNumberInput(key);
  }

  private commitNumberInput(key: keyof FoundationTuningSettings): void {
    const draft = this.inputDrafts[key];
    if (draft === undefined) return;
    const value = Number(draft);
    if (!Number.isFinite(value)) return;
    const nextDrafts = { ...this.inputDrafts };
    delete nextDrafts[key];
    this.inputDrafts = nextDrafts;
    this.updateSettings(
      {
        [key]: value,
      },
      {
        generateOnCommit: true,
      },
    );
  }

  private handleNumberValue(
    event: CustomEvent<{ value: string | number }>,
    key: keyof FoundationTuningSettings,
  ): void {
    this.updateSettings({
      [key]: Number(event.detail.value),
    });
  }

  private handlePercentValue(
    event: CustomEvent<{ value: number }>,
    key: keyof FoundationTuningSettings,
  ): void {
    this.updateSettings({
      [key]: Number(event.detail.value) / 100,
    });
  }

  private handleRangeKeyup(
    event: KeyboardEvent,
    key: keyof FoundationTuningSettings,
  ): void {
    if (event.key === "Enter" || event.key === " ") {
      this.handleControlCommit(key);
    }
  }

  private handleControlCommit(key: keyof FoundationTuningSettings): void {
    if (!FOUNDATION_MAP_SETTING_KEYS.has(key)) return;
    void this.maybeAutoGenerateWorld();
  }

  private statusPillTone(): "blue" | "green" | "red" {
    if (this.status.tone === "ok") return "green";
    if (this.status.tone === "error") return "red";
    return "blue";
  }

  private statusAlertTone(): "neutral" | "green" | "red" {
    if (this.status.tone === "ok") return "green";
    if (this.status.tone === "error") return "red";
    return "neutral";
  }

  private updateSettings(
    patch: Partial<FoundationTuningSettings>,
    options: { generateOnCommit?: boolean } = {},
  ): void {
    const changedKeys = Object.keys(
      patch,
    ) as (keyof FoundationTuningSettings)[];
    this.tuningSettings = normalizeFoundationTuningSettings({
      ...this.tuningSettings,
      ...patch,
    });
    saveFoundationTuningSettings(this.tuningSettings);
    this.configureTickTimer();
    this.runtime?.updateParameters(this.tuningSettings);
    if (
      changedKeys.includes("wildernessVectorSharpness") ||
      changedKeys.includes("wildernessDirectionalPreviewDistance") ||
      changedKeys.includes("wildernessDirectionalPreviewSharpness") ||
      changedKeys.includes("wildernessDirectionalPreviewContrast") ||
      changedKeys.includes("wildernessDirectionalPreviewFalloff")
    ) {
      this.updateDirectionalBorderIntent(this.directionalBorderPreview);
    }

    const requiresRestart = changedKeys.some((key) =>
      FOUNDATION_RESTART_SETTING_KEYS.has(key),
    );
    this.status = {
      tone: "idle",
      text: requiresRestart
        ? this.restartSettingStatusText()
        : "Mechanics applied to the running simulation.",
    };

    if (
      options.generateOnCommit &&
      changedKeys.some((key) => FOUNDATION_MAP_SETTING_KEYS.has(key))
    ) {
      void this.maybeAutoGenerateWorld();
    }
  }

  private initialGenerationStatus(
    hasCachedMap: boolean,
  ): FoundationClientStatus {
    if (hasCachedMap) {
      return {
        tone: "idle",
        text: "Loading generated world from local cache.",
      };
    }
    if (this.shouldAutoGenerateCurrentMap()) {
      return {
        tone: "idle",
        text: "Generating saved world parameters.",
      };
    }
    return {
      tone: "idle",
      text: this.restartSettingStatusText(),
    };
  }

  private restartSettingStatusText(): string {
    if (
      this.tuningSettings.autoGenerateWorld &&
      !this.mapWithinAutoGenerateLimit()
    ) {
      return `Auto generation pauses above ${FOUNDATION_AUTO_GENERATE_MAX_DIMENSION} x ${FOUNDATION_AUTO_GENERATE_MAX_DIMENSION}. Use Generate World.`;
    }
    return this.tuningSettings.autoGenerateWorld
      ? "Setup parameters saved. World regenerates after committed edits."
      : "Setup parameters saved. Generate World to apply.";
  }

  private generateWorldButtonDisabled(): boolean {
    return (
      this.loading ||
      (this.tuningSettings.autoGenerateWorld &&
        this.mapWithinAutoGenerateLimit())
    );
  }

  private shouldAutoGenerateCurrentMap(): boolean {
    return (
      this.tuningSettings.autoGenerateWorld && this.mapWithinAutoGenerateLimit()
    );
  }

  private mapWithinAutoGenerateLimit(): boolean {
    return (
      this.tuningSettings.width <= FOUNDATION_AUTO_GENERATE_MAX_DIMENSION &&
      this.tuningSettings.height <= FOUNDATION_AUTO_GENERATE_MAX_DIMENSION
    );
  }

  private async maybeAutoGenerateWorld(): Promise<void> {
    if (!this.tuningSettings.autoGenerateWorld) return;
    if (
      this.currentWorldSignature ===
      foundationGeneratedMapSignature(this.tuningSettings)
    ) {
      return;
    }
    if (!this.mapWithinAutoGenerateLimit()) {
      this.status = {
        tone: "idle",
        text: this.restartSettingStatusText(),
      };
      return;
    }
    await this.generateWorld("Generated world with current parameters.");
  }

  private async restartSimulationWithCurrentWorld(): Promise<void> {
    const signature = foundationGeneratedMapSignature(this.tuningSettings);
    if (this.currentPreparedWorld && this.currentWorldSignature === signature) {
      this.resetRuntime(
        "Simulation restarted with current parameters.",
        clonePreparedMap(this.currentPreparedWorld, "current"),
      );
      return;
    }

    await this.generateWorld("Simulation restarted with current parameters.", {
      force: true,
    });
  }

  private updateDirectionalBorderIntent(
    preview: FoundationDirectionalBorderPreview | null,
  ): void {
    if (!preview || !this.runtime || !this.renderer) {
      this.renderer?.setDirectionalBorderIntent(null);
      return;
    }

    const map = this.runtime.map();
    const originX = map.x(preview.originTile) + 0.5;
    const originY = map.y(preview.originTile) + 0.5;
    const targetX = map.x(preview.targetTile) + 0.5;
    const targetY = map.y(preview.targetTile) + 0.5;
    const rawDx = targetX - originX;
    const rawDy = targetY - originY;
    const distance = Math.hypot(rawDx, rawDy);
    if (distance <= 0) {
      this.renderer.setDirectionalBorderIntent(null);
      return;
    }

    this.renderer.setDirectionalBorderIntent({
      ownerId: this.runtime.player().ownerId,
      originX,
      originY,
      directionX: rawDx / distance,
      directionY: rawDy / distance,
      distance,
      sharpness: this.tuningSettings.wildernessVectorSharpness,
      previewDistance: this.tuningSettings.wildernessDirectionalPreviewDistance,
      heatMap: this.createDirectionalBorderHeatMap(preview, distance),
    });
  }

  private createDirectionalBorderHeatMap(
    preview: FoundationDirectionalBorderPreview,
    clickDistance: number,
  ): Uint8Array {
    const runtime = this.runtime;
    if (!runtime) {
      return new Uint8Array();
    }

    const map = runtime.map();
    const heatMap = new Uint8Array(map.width() * map.height());
    heatMap.fill(FOUNDATION_DIRECTIONAL_BORDER_BASELINE_HEAT);

    const player = runtime.player();
    const placement = player.placement;
    if (!placement) {
      return heatMap;
    }

    const borderTiles = new Set<number>();
    for (const tile of placement.claimedTiles) {
      if (this.isOwnedBorderTile(tile)) {
        borderTiles.add(tile);
      }
    }
    if (!borderTiles.has(preview.originTile)) {
      borderTiles.add(preview.originTile);
    }
    if (borderTiles.size === 0) {
      return heatMap;
    }

    const distances = new Map<number, number>();
    const queue: number[] = [preview.originTile];
    distances.set(preview.originTile, 0);
    let maxDistance = 0;

    for (let head = 0; head < queue.length; head += 1) {
      const tile = queue[head];
      const distance = distances.get(tile) ?? 0;
      this.forEachNeighbor(tile, (neighbor) => {
        if (!borderTiles.has(neighbor) || distances.has(neighbor)) {
          return;
        }

        const nextDistance = distance + 1;
        distances.set(neighbor, nextDistance);
        maxDistance = Math.max(maxDistance, nextDistance);
        queue.push(neighbor);
      });
    }

    const focus = clampFoundationNumber(
      (clickDistance /
        Math.max(1, this.tuningSettings.wildernessDirectionalPreviewDistance)) *
        this.tuningSettings.wildernessDirectionalPreviewSharpness,
      0,
      1,
    );
    const contrast =
      focus * this.tuningSettings.wildernessDirectionalPreviewContrast;
    const concentrationFalloff =
      1 + focus * this.tuningSettings.wildernessDirectionalPreviewFalloff;
    const maxConnectedDistance = Math.max(1, maxDistance);

    for (const tile of borderTiles) {
      const perimeterDistance = distances.get(tile);
      const normalizedDistance =
        perimeterDistance === undefined
          ? 1
          : perimeterDistance / maxConnectedDistance;
      const concentration = Math.exp(
        -normalizedDistance * concentrationFalloff,
      );
      const heat = clampFoundationNumber(
        0.5 + (concentration - 0.5) * contrast,
        0,
        1,
      );
      heatMap[tile] = Math.round(heat * 255);
    }

    return heatMap;
  }

  private updateDirectionalBorderPreviewForPointer(event: PointerEvent): void {
    if (this.loading || !this.runtime || !this.renderer || !this.canvas) {
      this.clearDirectionalBorderPreview();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    if (
      screenX < 0 ||
      screenY < 0 ||
      screenX >= rect.width ||
      screenY >= rect.height
    ) {
      this.clearDirectionalBorderPreview();
      return;
    }

    const targetTile = this.renderer.screenToTile({ screenX, screenY });
    if (targetTile === null) {
      this.clearDirectionalBorderPreview();
      return;
    }

    const preview = this.createDirectionalBorderPreview(targetTile.ref);
    if (preview === null) {
      this.clearDirectionalBorderPreview();
      return;
    }

    if (
      this.directionalBorderPreview?.originTile === preview.originTile &&
      this.directionalBorderPreview.targetTile === preview.targetTile
    ) {
      return;
    }

    this.directionalBorderPreview = preview;
    this.updateDirectionalBorderIntent(preview);
  }

  private createDirectionalBorderPreview(
    targetTile: number,
  ): FoundationDirectionalBorderPreview | null {
    if (!this.runtime) {
      return null;
    }

    const map = this.runtime.map();
    const player = this.runtime.player();
    if (
      !player.placement ||
      !map.isValidRef(targetTile) ||
      ownerIdFromState(map.stateBuffer()[targetTile]) === player.ownerId
    ) {
      return null;
    }

    const originTile = this.closestOwnedBorderTile(targetTile);
    if (originTile === null) {
      return null;
    }

    return { originTile, targetTile };
  }

  private closestOwnedBorderTile(targetTile: number): number | null {
    if (!this.runtime) {
      return null;
    }

    const map = this.runtime.map();
    const player = this.runtime.player();
    const placement = player.placement;
    if (!placement) {
      return null;
    }

    const targetX = map.x(targetTile);
    const targetY = map.y(targetTile);
    let closestTile: number | null = null;
    let closestDistanceSq = Number.POSITIVE_INFINITY;

    for (const tile of placement.claimedTiles) {
      if (!this.isOwnedBorderTile(tile)) {
        continue;
      }

      const dx = map.x(tile) - targetX;
      const dy = map.y(tile) - targetY;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < closestDistanceSq) {
        closestTile = tile;
        closestDistanceSq = distanceSq;
      }
    }

    return closestTile ?? placement.selectedTile;
  }

  private isOwnedBorderTile(tile: number): boolean {
    if (!this.runtime) {
      return false;
    }

    const map = this.runtime.map();
    const player = this.runtime.player();
    if (ownerIdFromState(map.stateBuffer()[tile]) !== player.ownerId) {
      return false;
    }

    const x = map.x(tile);
    const y = map.y(tile);
    if (x === 0 || y === 0 || x + 1 === map.width() || y + 1 === map.height()) {
      return true;
    }

    let border = false;
    this.forEachCardinalNeighbor(tile, (neighbor) => {
      if (
        !border &&
        ownerIdFromState(map.stateBuffer()[neighbor]) !== player.ownerId
      ) {
        border = true;
      }
    });
    return border;
  }

  private forEachNeighbor(
    tile: number,
    callback: (neighbor: number) => void,
  ): void {
    if (!this.runtime) {
      return;
    }

    const map = this.runtime.map();
    const x = map.x(tile);
    const y = map.y(tile);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= map.width() || ny >= map.height()) {
          continue;
        }

        callback(map.ref(nx, ny));
      }
    }
  }

  private forEachCardinalNeighbor(
    tile: number,
    callback: (neighbor: number) => void,
  ): void {
    if (!this.runtime) {
      return;
    }

    const map = this.runtime.map();
    const x = map.x(tile);
    const y = map.y(tile);
    if (x > 0) callback(map.ref(x - 1, y));
    if (x + 1 < map.width()) callback(map.ref(x + 1, y));
    if (y > 0) callback(map.ref(x, y - 1));
    if (y + 1 < map.height()) callback(map.ref(x, y + 1));
  }

  private clearDirectionalBorderPreview(): void {
    if (this.directionalBorderPreview === null) {
      return;
    }
    this.directionalBorderPreview = null;
    this.renderer?.setDirectionalBorderIntent(null);
  }

  private async generateWorld(
    statusText: string,
    options: { force?: boolean } = {},
  ): Promise<void> {
    if (this.loading) return;
    if (!options.force && !this.shouldAutoGenerateCurrentMap()) return;
    this.paused = true;
    this.loading = true;
    this.loadingStepLabel = "Preparing world generation...";
    this.status = {
      tone: "idle",
      text: this.loadingStepLabel,
    };
    await this.updateComplete;
    await nextAnimationFrame();

    try {
      const foundationMap = await this.createMapForCurrentSettings();
      await this.showGenerationStep("Uploading terrain to WebGL...");
      this.resetRuntime(statusText, foundationMap);
      if (foundationMap.source === "cache") {
        this.status = {
          tone: "idle",
          text: "Loaded generated world from local cache.",
        };
      } else if (foundationMap.source === "current") {
        this.status = {
          tone: "idle",
          text: "Reused current generated world.",
        };
      }
    } catch (error) {
      this.status = {
        tone: "error",
        text:
          error instanceof Error
            ? `World generation failed: ${error.message}`
            : "World generation failed.",
      };
    } finally {
      this.loading = false;
      this.loadingStepLabel = "Preparing world generation...";
    }
  }

  private statusFromCommandResult(
    result: ReturnType<FoundationRuntime["dispatch"]>,
    tile: { x: number; y: number },
  ): FoundationClientStatus {
    if (result.ok) {
      const explorationStartedEvent = result.update.events.find(
        (event) => event.type === "foundation.wilderness_exploration_started",
      );
      if (explorationStartedEvent) {
        const committedTroops =
          typeof explorationStartedEvent.payload === "object" &&
          explorationStartedEvent.payload !== null &&
          "committedTroops" in explorationStartedEvent.payload
            ? Number(explorationStartedEvent.payload.committedTroops)
            : 0;
        return {
          tone: "ok",
          text: `Exploring toward ${tile.x}, ${tile.y} with ${renderTroops(
            committedTroops,
          )} troops.`,
        };
      }

      return {
        tone: "ok",
        text: `Placed player at ${tile.x}, ${tile.y}.`,
      };
    }

    return {
      tone: "error",
      text:
        result.error === "exploration_already_active"
          ? "Wilderness exploration is already active."
          : result.error === "target_already_owned"
            ? "Click unclaimed wilderness to explore."
            : result.error === "water_tile"
              ? "Water tiles cannot be placed on or explored yet."
              : `Command rejected: ${result.error ?? "unknown"}.`,
    };
  }

  private applyMapUpdate(mapUpdate: FoundationMapUpdate | undefined): void {
    if (!this.runtime || !this.renderer || !mapUpdate) return;
    const changedTiles = mapUpdate.changedTiles;
    const changedTileStates = mapUpdate.changedTileStates;
    if (!changedTiles || !changedTileStates || changedTiles.length === 0) {
      return;
    }

    const deltas: BaseMapTileStateDelta[] = [];
    for (let i = 0; i < changedTiles.length; i++) {
      deltas.push({
        ref: changedTiles[i],
        state: changedTileStates[i],
      });
    }
    this.renderer.applyTileStateDeltas(
      this.runtime.map().stateBuffer(),
      deltas,
    );
  }

  private resizeRenderer(): void {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);
  }

  private resetRuntime(
    statusText: string,
    foundationMap: FoundationPreparedMap,
  ): void {
    this.directionalBorderPreview = null;
    this.updateDirectionalBorderIntent(null);
    this.renderer?.dispose();
    this.renderer = null;
    const preparedWorld = clonePreparedMap(foundationMap, foundationMap.source);
    this.currentPreparedWorld = preparedWorld;
    this.currentWorldSignature = foundationGeneratedMapSignature(
      this.tuningSettings,
    );
    const runtimeWorld = clonePreparedMap(preparedWorld, preparedWorld.source);
    this.runtime = createFoundationRuntime({
      map: runtimeWorld.map,
      parameters: this.tuningSettings,
    });
    this.snapshot = this.runtime.snapshot();

    const map = this.runtime.map();
    this.renderer = new BaseMapWebGLAdapter({
      width: map.width(),
      height: map.height(),
      terrainBytes: map.terrainBuffer(),
      terrainColors: runtimeWorld.terrainColors,
      tileState: map.stateBuffer(),
      palette: FOUNDATION_PLAYER_PALETTE,
      canvas: this.canvas,
    });
    this.resizeRenderer();
    this.renderer.fitMap();
    this.status = {
      tone: "idle",
      text: statusText,
    };
  }

  private async createMapForCurrentSettings(): Promise<FoundationPreparedMap> {
    const signature = foundationGeneratedMapSignature(this.tuningSettings);
    if (this.currentPreparedWorld && this.currentWorldSignature === signature) {
      await this.showGenerationStep("Reusing current generated world...");
      saveGeneratedMapCache(signature, this.currentPreparedWorld);
      return clonePreparedMap(this.currentPreparedWorld, "current");
    }

    const cached = loadGeneratedMapCache(signature);
    if (cached !== null) {
      await this.showGenerationStep("Loading generated world from cache...");
      return {
        ...cached,
        source: "cache",
      };
    }

    const generated =
      this.tuningSettings.mapGenerator === "world-engine"
        ? await this.createWorldEngineFoundationMapWithProgress()
        : await this.createFoundationMapWithProgress();
    await this.showGenerationStep("Saving generated world cache...");
    saveGeneratedMapCache(signature, generated);
    return {
      ...generated,
      source: "generated",
    };
  }

  private async createFoundationMapWithProgress(): Promise<
    Omit<FoundationPreparedMap, "source">
  > {
    await this.showGenerationStep("Generating terrain map...");
    return {
      map: createFoundationMap({
        width: this.tuningSettings.width,
        height: this.tuningSettings.height,
        elevation: this.tuningSettings.elevation,
      }),
      terrainColors: undefined,
    };
  }

  private async createWorldEngineFoundationMapWithProgress(): Promise<
    Omit<FoundationPreparedMap, "source">
  > {
    const normalized = normalizeFoundationWorldEngineMapConfig(
      this.tuningSettings,
    );

    await this.showGenerationStep("Generating elevation map...");
    const elevation = generateWorldEngineElevation(normalized);

    await this.showGenerationStep("Generating oceans...");
    const ocean = deriveWorldEngineOcean(elevation, normalized);

    await this.showGenerationStep("Calculating temperature...");
    const { data: temperature, mountainThreshold } =
      generateWorldEngineTemperature(elevation, ocean, normalized);

    await this.showGenerationStep("Generating rainfall...");
    const precipitation = generateWorldEnginePrecipitation(
      elevation,
      ocean,
      temperature,
      normalized,
    );

    await this.showGenerationStep("Calculating sea depth...");
    const seaDepth = deriveWorldEngineSeaDepth(elevation, ocean, normalized);

    await this.showGenerationStep("Calculating hydrology...");
    const { watermap, lakes } = generateWorldEngineWatermap(
      elevation,
      ocean,
      precipitation,
      normalized,
    );

    await this.showGenerationStep("Normalizing river flow...");
    const normalizedWatermap = normalizeWorldEngineLand(watermap, ocean);

    await this.showGenerationStep("Calculating irrigation...");
    const irrigation = generateWorldEngineIrrigation(
      watermap,
      ocean,
      normalized,
    );

    await this.showGenerationStep("Calculating humidity...");
    const humidity = generateWorldEngineHumidity(
      precipitation,
      irrigation,
      ocean,
    );

    await this.showGenerationStep("Classifying biomes...");
    const biome = generateWorldEngineBiome(ocean, temperature, humidity);

    await this.showGenerationStep("Calculating resource potentials...");
    const permeability = generateWorldEnginePermeability(ocean, normalized);
    const resources = generateWorldEngineResourceMaps(
      {
        elevation,
        ocean,
        temperature,
        precipitation,
        seaDepth,
        normalizedWatermap,
        irrigation,
        humidity,
        permeability,
        mountainThreshold,
      },
      {
        ...normalized,
        ...deriveFoundationWorldEngineResourceConfig(normalized.seed),
      },
    );

    await this.showGenerationStep("Painting terrain...");
    const terrain = new Uint8Array(normalized.width * normalized.height);
    for (let i = 0; i < elevation.length; i++) {
      terrain[i] =
        ocean[i] || lakes[i]
          ? foundationWaterTerrainByteForElevation(elevation[i])
          : foundationLandTerrainByteForElevation(elevation[i]);
    }

    await this.showGenerationStep("Coloring terrain...");
    const terrainColors = buildWorldEngineTerrainColors(
      elevation,
      ocean,
      temperature,
      precipitation,
      seaDepth,
      normalizedWatermap,
      humidity,
      biome,
      lakes,
      normalized,
    );

    await this.showGenerationStep("Building game board...");
    return {
      map: new FoundationEngineTileMap(
        normalized.width,
        normalized.height,
        terrain,
        undefined,
        elevation,
      ),
      terrainColors,
      worldEngineLayers: {
        elevation,
        ocean,
        temperature,
        precipitation,
        seaDepth,
        watermap,
        normalizedWatermap,
        lakes,
        irrigation,
        humidity,
        permeability,
        biome,
        mountainThreshold,
        resources,
      },
      resourceLayers: resources,
    };
  }

  private async showGenerationStep(label: string): Promise<void> {
    this.loadingStepLabel = label;
    this.status = {
      tone: "idle",
      text: label,
    };
    await this.updateComplete;
    await nextAnimationFrame();
  }

  private configureTickTimer(): void {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
    }
    this.tickTimer = window.setInterval(
      this.advanceRuntimeTick,
      this.tuningSettings.tickIntervalMs,
    );
  }
}

function foundationTuningOverridesFromLocation(): {
  elevation?: "flat" | "rolling";
  mapGenerator?: "foundation" | "world-engine";
} {
  const params = new URLSearchParams(window.location.search);
  const overrides: {
    elevation?: "flat" | "rolling";
    mapGenerator?: "foundation" | "world-engine";
  } = { mapGenerator: "world-engine" };
  const elevation = params.get("elevation");
  if (elevation === "rolling" || elevation === "flat") {
    overrides.elevation = elevation;
  }
  const generator = params.get("generator") ?? params.get("map");
  if (generator === "foundation" || generator === "world-engine") {
    overrides.mapGenerator = generator;
  }
  return overrides;
}

function formatSelectedTile(
  snapshot: FoundationRuntimeSnapshot | null,
): string {
  if (
    snapshot?.player.selectedTile === null ||
    snapshot?.player.selectedTile === undefined
  ) {
    return "none";
  }
  return snapshot.player.selectedTile.toLocaleString();
}

function formatTroops(value: number | undefined): string {
  return renderTroops(value ?? 0);
}

function formatTroopRate(value: number | undefined): string {
  return `${renderTroops((value ?? 0) * 10)}/s`;
}

function formatControlValue(value: number, precision: number): string {
  return precision === 0
    ? Math.round(value).toLocaleString()
    : value.toFixed(precision);
}

function foundationZoomDeltaFromWheelEvent(event: WheelEvent): number | null {
  if (event.ctrlKey) {
    return Math.abs(event.deltaY) <= 10 ? event.deltaY * 10 : null;
  }

  return Math.abs(event.deltaY) < 2 ? null : event.deltaY;
}

function clampFoundationNumber(
  value: number,
  min: number,
  max: number,
): number {
  return Math.max(min, Math.min(max, value));
}

export function foundationGeneratedMapSignature(
  settings: FoundationTuningSettings,
): string {
  return JSON.stringify({
    mapGenerator: settings.mapGenerator,
    elevation: settings.elevation,
    seed: settings.seed,
    width: settings.width,
    height: settings.height,
    seaLevel: settings.seaLevel,
    continentScale: settings.continentScale,
    mountainStrength: settings.mountainStrength,
    coastFalloff: settings.coastFalloff,
    coastRoughness: settings.coastRoughness,
    latitudeEffect: settings.latitudeEffect,
    elevationCooling: settings.elevationCooling,
    rainNoise: settings.rainNoise,
    warmthRainfall: settings.warmthRainfall,
    riverFlowRetention: settings.riverFlowRetention,
    lakeWaterThreshold: settings.lakeWaterThreshold,
    lakeElevationRange: settings.lakeElevationRange,
    riverWeakThreshold: settings.riverWeakThreshold,
    riverStrongThreshold: settings.riverStrongThreshold,
  });
}

export function loadGeneratedMapCache(
  signature: string,
): Omit<FoundationPreparedMap, "source"> | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(
    FOUNDATION_GENERATED_MAP_STORAGE_KEY,
  );
  if (stored === null) return null;

  try {
    const cache = JSON.parse(stored) as FoundationGeneratedMapCache;
    if (cache.signature !== signature) return null;
    const terrain = base64ToUint8Array(cache.terrain);
    const expectedLength = cache.width * cache.height;
    if (terrain.length !== expectedLength) return null;
    const elevation =
      typeof cache.elevation16 === "string"
        ? base64ToNormalizedFloat32Array(cache.elevation16)
        : typeof cache.elevation === "string"
          ? base64ToFloat32Array(cache.elevation)
          : undefined;
    if (elevation !== undefined && elevation.length !== expectedLength) {
      return null;
    }
    const terrainColors =
      typeof cache.terrainColorsRgb === "string"
        ? rgbBase64ToRgbaUint8Array(cache.terrainColorsRgb)
        : typeof cache.terrainColors === "string"
          ? base64ToUint8Array(cache.terrainColors)
          : undefined;
    if (
      terrainColors !== undefined &&
      terrainColors.length !== expectedLength * 4
    ) {
      return null;
    }
    const resourceLayers = decodeCachedResourceLayers(
      cache.resourceLayers8,
      expectedLength,
    );
    return {
      map: new FoundationEngineTileMap(
        cache.width,
        cache.height,
        terrain,
        undefined,
        elevation,
      ),
      terrainColors,
      resourceLayers,
    };
  } catch {
    return null;
  }
}

function hasGeneratedMapCache(signature: string): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(
    FOUNDATION_GENERATED_MAP_STORAGE_KEY,
  );
  if (stored === null) return false;
  try {
    return (
      (JSON.parse(stored) as FoundationGeneratedMapCache).signature ===
      signature
    );
  } catch {
    return false;
  }
}

function saveGeneratedMapCache(
  signature: string,
  generated: Omit<FoundationPreparedMap, "source">,
): void {
  if (typeof window === "undefined") return;
  const width = generated.map.width();
  const height = generated.map.height();
  if (
    width > FOUNDATION_AUTO_GENERATE_MAX_DIMENSION ||
    height > FOUNDATION_AUTO_GENERATE_MAX_DIMENSION
  ) {
    return;
  }

  try {
    const cache: FoundationGeneratedMapCache = {
      version: 3,
      signature,
      width,
      height,
      terrain: uint8ArrayToBase64(generated.map.terrainBuffer()),
      elevation16: normalizedFloat32ArrayToBase64(
        generated.map.elevationBuffer(),
      ),
      terrainColors:
        generated.terrainColors === undefined ? undefined : undefined,
      terrainColorsRgb:
        generated.terrainColors === undefined
          ? undefined
          : rgbaUint8ArrayToRgbBase64(generated.terrainColors),
      resourceLayers8: encodeCachedResourceLayers(
        resourceLayersForPreparedMap(generated),
      ),
    };
    window.localStorage.setItem(
      FOUNDATION_GENERATED_MAP_STORAGE_KEY,
      JSON.stringify(cache),
    );
  } catch {
    window.localStorage.removeItem(FOUNDATION_GENERATED_MAP_STORAGE_KEY);
  }
}

function clonePreparedMap(
  prepared: FoundationPreparedMap,
  source: FoundationPreparedMap["source"],
): FoundationPreparedMap {
  const map = prepared.map;
  return {
    source,
    map: new FoundationEngineTileMap(
      map.width(),
      map.height(),
      new Uint8Array(map.terrainBuffer()),
      undefined,
      new Float32Array(map.elevationBuffer()),
    ),
    terrainColors:
      prepared.terrainColors === undefined
        ? undefined
        : new Uint8Array(prepared.terrainColors),
    worldEngineLayers:
      prepared.worldEngineLayers === undefined
        ? undefined
        : cloneWorldEngineLayers(prepared.worldEngineLayers),
    resourceLayers:
      prepared.resourceLayers === undefined
        ? undefined
        : cloneWorldEngineResourceMaps(prepared.resourceLayers),
  };
}

function resourceLayersForPreparedMap(
  prepared:
    | Pick<FoundationPreparedMap, "worldEngineLayers" | "resourceLayers">
    | null
    | undefined,
): WorldEngineResourceMaps | undefined {
  return prepared?.worldEngineLayers?.resources ?? prepared?.resourceLayers;
}

function cloneWorldEngineLayers(
  layers: FoundationWorldEngineLayers,
): FoundationWorldEngineLayers {
  return {
    elevation: new Float32Array(layers.elevation),
    ocean: new Uint8Array(layers.ocean),
    temperature: new Float32Array(layers.temperature),
    precipitation: new Float32Array(layers.precipitation),
    seaDepth: new Float32Array(layers.seaDepth),
    watermap: new Float32Array(layers.watermap),
    normalizedWatermap: new Float32Array(layers.normalizedWatermap),
    lakes: new Uint8Array(layers.lakes),
    irrigation: new Float32Array(layers.irrigation),
    humidity: new Float32Array(layers.humidity),
    permeability: new Float32Array(layers.permeability),
    biome: new Uint8Array(layers.biome),
    mountainThreshold: layers.mountainThreshold,
    resources: cloneWorldEngineResourceMaps(layers.resources),
  };
}

function cloneWorldEngineResourceMaps(
  resources: WorldEngineResourceMaps,
): WorldEngineResourceMaps {
  return {
    crop: new Float32Array(resources.crop),
    basin: new Float32Array(resources.basin),
    oil: new Float32Array(resources.oil),
    metal: new Float32Array(resources.metal),
  };
}

function encodeCachedResourceLayers(
  resources: WorldEngineResourceMaps | undefined,
): Partial<Record<FoundationResourceLayerKey, string>> | undefined {
  if (resources === undefined) return undefined;
  return {
    crop: normalizedFloat32ArrayToByteBase64(resources.crop),
    basin: normalizedFloat32ArrayToByteBase64(resources.basin),
    oil: normalizedFloat32ArrayToByteBase64(resources.oil),
    metal: normalizedFloat32ArrayToByteBase64(resources.metal),
  };
}

function decodeCachedResourceLayers(
  encoded: Partial<Record<FoundationResourceLayerKey, string>> | undefined,
  expectedLength: number,
): WorldEngineResourceMaps | undefined {
  if (encoded === undefined) return undefined;
  const decoded: Partial<WorldEngineResourceMaps> = {};
  for (const key of FOUNDATION_RESOURCE_LAYER_KEYS) {
    const value = encoded[key];
    if (typeof value !== "string") return undefined;
    const layer = base64ToNormalizedByteFloat32Array(value);
    if (layer.length !== expectedLength) return undefined;
    decoded[key] = layer;
  }
  return decoded as WorldEngineResourceMaps;
}

function normalizedFloat32ArrayToByteBase64(values: Float32Array): string {
  const bytes = new Uint8Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    bytes[i] = Math.round(Math.max(0, Math.min(1, values[i])) * 255);
  }
  return uint8ArrayToBase64(bytes);
}

function base64ToNormalizedByteFloat32Array(value: string): Float32Array {
  const bytes = base64ToUint8Array(value);
  const values = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    values[i] = bytes[i] / 255;
  }
  return values;
}

function normalizedFloat32ArrayToBase64(values: Float32Array): string {
  const quantized = new Uint16Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    quantized[i] = Math.round(Math.max(0, Math.min(1, values[i])) * 65535);
  }
  return uint8ArrayToBase64(new Uint8Array(quantized.buffer.slice(0)));
}

function base64ToNormalizedFloat32Array(value: string): Float32Array {
  const bytes = base64ToUint8Array(value);
  if (bytes.byteLength % 2 !== 0) {
    throw new Error("invalid quantized elevation cache");
  }
  const quantized = new Uint16Array(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  const values = new Float32Array(quantized.length);
  for (let i = 0; i < quantized.length; i += 1) {
    values[i] = quantized[i] / 65535;
  }
  return values;
}

function rgbaUint8ArrayToRgbBase64(values: Uint8Array): string {
  if (values.length % 4 !== 0) {
    throw new Error("invalid RGBA terrain color buffer");
  }
  const rgb = new Uint8Array((values.length / 4) * 3);
  for (let source = 0, target = 0; source < values.length; source += 4) {
    rgb[target] = values[source];
    rgb[target + 1] = values[source + 1];
    rgb[target + 2] = values[source + 2];
    target += 3;
  }
  return uint8ArrayToBase64(rgb);
}

function rgbBase64ToRgbaUint8Array(value: string): Uint8Array {
  const rgb = base64ToUint8Array(value);
  if (rgb.length % 3 !== 0) {
    throw new Error("invalid RGB terrain color cache");
  }
  const rgba = new Uint8Array((rgb.length / 3) * 4);
  for (let source = 0, target = 0; source < rgb.length; source += 3) {
    rgba[target] = rgb[source];
    rgba[target + 1] = rgb[source + 1];
    rgba[target + 2] = rgb[source + 2];
    rgba[target + 3] = 255;
    target += 4;
  }
  return rgba;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return window.btoa(binary);
}

function base64ToUint8Array(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function float32ArrayToBase64(values: Float32Array): string {
  return uint8ArrayToBase64(new Uint8Array(values.buffer.slice(0)));
}

function base64ToFloat32Array(value: string): Float32Array {
  const bytes = base64ToUint8Array(value);
  return new Float32Array(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
}

function scalarLayerDataUrl(
  values: Float32Array,
  width: number,
  height: number,
  palette: FoundationScalarLayerPalette,
): string {
  if (typeof document === "undefined" || values.length !== width * height) {
    return "";
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  const image = context.createImageData(width, height);
  for (let i = 0; i < values.length; i += 1) {
    const [r, g, b] = scalarLayerColor(values[i], palette);
    const offset = i * 4;
    image.data[offset] = r;
    image.data[offset + 1] = g;
    image.data[offset + 2] = b;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function scalarLayerColor(
  value: number,
  palette: FoundationScalarLayerPalette,
): FoundationLayerColor {
  const normalized = clampFoundationNumber(value, 0, 1);
  for (let i = 0; i < palette.length - 1; i += 1) {
    const left = palette[i];
    const right = palette[i + 1];
    if (normalized <= right[0]) {
      const t = (normalized - left[0]) / Math.max(0.0001, right[0] - left[0]);
      return [
        Math.round(left[1][0] + (right[1][0] - left[1][0]) * t),
        Math.round(left[1][1] + (right[1][1] - left[1][1]) * t),
        Math.round(left[1][2] + (right[1][2] - left[1][2]) * t),
      ];
    }
  }
  return palette[palette.length - 1][1];
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "foundation-page": FoundationPage;
  }
}
