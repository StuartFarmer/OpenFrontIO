import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import {
  Boxes,
  ChevronRight,
  Copy,
  Dice5,
  Fuel,
  Gem,
  Hammer,
  Package,
  Pause,
  Play,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Warehouse,
  Wheat,
  type IconNode,
} from "lucide";
import "../../../client/hud/ui";
import type { HudSelectOption } from "../../../client/hud/ui/HudComponents";
import { renderLucideIcon } from "../../../client/hud/ui/LucideIcon";
import {
  BaseMapWebGLAdapter,
  type BaseMapPalette,
  type BaseMapTileStateDelta,
} from "../../../client/render/base-map";
import { renderTroops } from "../../../client/Utils";
import {
  FoundationEngineTileMap,
  applyLogisticProductionModifier,
  buildWorldEngineTerrainColors,
  createFoundationMap,
  deriveFoundationWorldEngineResourceConfig,
  deriveWorldEngineOcean,
  deriveWorldEngineSeaDepth,
  distanceFrontWeight,
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
  isFoundationLandTerrainByte,
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
  FOUNDATION_GAME_MECHANIC_PRESET_KEYS,
  FOUNDATION_WORLD_GENERATION_PRESET_KEYS,
  FOUNDATION_WORLD_MAP_PRESET_KEYS,
  applyGameMechanicPresetData,
  applyWorldGenerationPresetData,
  applyWorldMapPresetData,
  createFoundationPreset,
  loadFoundationPresets,
  saveFoundationPresets,
  type FoundationPresetKind,
  type FoundationStoredPreset,
} from "./FoundationPresets";
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
  originX: number;
  originY: number;
  targetTile: number;
}

interface FoundationContextMenuItem {
  id: string;
  label: string;
  icon: IconNode;
  meta?: string;
  disabled?: boolean;
  children?: FoundationContextMenuItem[];
}

interface FoundationContextMenuPosition {
  left: number;
  top: number;
}

interface FoundationContextMenuLayout {
  compact: boolean;
  main: FoundationContextMenuPosition;
  sub: FoundationContextMenuPosition;
  detail: FoundationContextMenuPosition;
}

interface FoundationPlacedBuilding {
  id: string;
  label: string;
  tileRef: number;
}

const FOUNDATION_DIRECTIONAL_BORDER_BASELINE_HEAT = 0;
const FOUNDATION_BORDER_HEAT_BUCKETS = 100;
const FOUNDATION_VECTOR_LINE_BASE_ALPHA = 0.025;
const FOUNDATION_VECTOR_LINE_WEIGHT_ALPHA = 0.22;
const FOUNDATION_CONTEXT_MENU_MAIN_WIDTH = 160;
const FOUNDATION_CONTEXT_MENU_SUBMENU_WIDTH = 160;
const FOUNDATION_CONTEXT_MENU_BUILDING_WIDTH = 210;
const FOUNDATION_CONTEXT_MENU_GAP = 0;
const FOUNDATION_CONTEXT_MENU_EDGE_GAP = 8;
const FOUNDATION_BUILDING_TILE_SIZE = 4;
const FOUNDATION_BUILDING_CENTER_OFFSET = Math.floor(
  FOUNDATION_BUILDING_TILE_SIZE / 2,
);

const FOUNDATION_STORAGE_BUILDINGS: readonly FoundationContextMenuItem[] = [
  { id: "grain-silo", label: "Grain Silo", icon: Wheat, meta: "Food" },
  { id: "oil-tank", label: "Oil Tank", icon: Fuel, meta: "Fuel" },
  {
    id: "mineral-stockpile",
    label: "Mineral Stockpile",
    icon: Gem,
    meta: "Ore",
  },
];

const FOUNDATION_CONTEXT_BUILD_MENU: FoundationContextMenuItem = {
  id: "build",
  label: "Build",
  icon: Hammer,
  children: [
    {
      id: "storage",
      label: "Storage",
      icon: Warehouse,
      children: [...FOUNDATION_STORAGE_BUILDINGS],
    },
  ],
};

const FOUNDATION_CONTEXT_ROOT_MENU: readonly FoundationContextMenuItem[] = [
  FOUNDATION_CONTEXT_BUILD_MENU,
  { id: "section-two", label: "Section 2", icon: Package, disabled: true },
  { id: "section-three", label: "Section 3", icon: Boxes, disabled: true },
  { id: "section-four", label: "Section 4", icon: Warehouse, disabled: true },
];

const FOUNDATION_BUILDING_COLOR_BY_ID: Readonly<Record<string, string>> = {
  "grain-silo": "rgb(214 162 58)",
  "oil-tank": "rgb(5 7 8)",
  "mineral-stockpile": "rgb(185 193 199)",
};

type FoundationControlTab = "world" | "river" | "combat" | "ecology";
type FoundationYieldResource = "food" | "oil" | "metal";

const FOUNDATION_CONTROL_TABS = [
  { id: "world", label: "World" },
  { id: "river", label: "River" },
  { id: "combat", label: "Combat" },
  { id: "ecology", label: "Ecology" },
];

interface FoundationYieldResourceDefinition {
  resource: FoundationYieldResource;
  label: string;
  inputLabel: string;
  minKey: keyof FoundationTuningSettings;
  maxKey: keyof FoundationTuningSettings;
  kKey: keyof FoundationTuningSettings;
}

const FOUNDATION_YIELD_RESOURCE_DEFINITIONS: readonly FoundationYieldResourceDefinition[] =
  [
    {
      resource: "food",
      label: "Food",
      inputLabel: "crop",
      minKey: "foodYieldMin",
      maxKey: "foodYieldMax",
      kKey: "foodYieldK",
    },
    {
      resource: "oil",
      label: "Oil",
      inputLabel: "oil",
      minKey: "oilYieldMin",
      maxKey: "oilYieldMax",
      kKey: "oilYieldK",
    },
    {
      resource: "metal",
      label: "Metal",
      inputLabel: "metal",
      minKey: "metalYieldMin",
      maxKey: "metalYieldMax",
      kKey: "metalYieldK",
    },
  ];

interface FoundationUpdateSettingsOptions {
  generateOnCommit?: boolean;
  forceGenerateOnCommit?: boolean;
}

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
  startingFoodStorage: {
    does: "Sets the food stock when a new runtime is created.",
    exists: "Lets scenarios start with empty or pre-stocked food reserves.",
    represents: "Initial food stock available to the settlement.",
    increase: "Gives the player more reserve food at the start.",
    decrease: "Makes the player start closer to empty.",
    formula: "initialFoodStock = startingFoodStorage",
  },
  baseFoodStorageCapacity: {
    does: "Caps the food stock before storage buildings are counted.",
    exists:
      "Turns surplus into a bounded stock instead of an unlimited number.",
    represents: "Starter granary and warehouse capacity.",
    increase: "Allows more surplus food to be saved before overflow is lost.",
    decrease: "Makes surplus food overflow sooner.",
    formula: "foodStockCapacity = baseFoodStorageCapacity + storageBuildings",
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
      "troopDelta = min(troops + (regenBase + troops^regenExponent / regenDivisor) * (1 - troops / foodSupportedTroops), foodSupportedTroops) - troops",
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
      "troopDelta = min(troops + (regenBase + troops^regenExponent / regenDivisor) * (1 - troops / foodSupportedTroops), foodSupportedTroops) - troops",
  },
  troopRegenDivisor: {
    does: "Divides the current-troop scaling term in the regen formula.",
    exists: "Provides a direct brake on compounding troop growth.",
    represents: "Recruitment friction, logistics, or administrative drag.",
    increase: "Slows troop growth from the scaling term.",
    decrease: "Accelerates scaling growth and can make recovery much faster.",
    formula:
      "troopDelta = min(troops + (regenBase + troops^regenExponent / regenDivisor) * (1 - troops / foodSupportedTroops), foodSupportedTroops) - troops",
  },
  maxTroopMultiplier: {
    does: "Multiplies the whole food production formula.",
    exists:
      "Provides one global handle for how much food a territory can produce.",
    represents: "Overall agricultural capacity of the society.",
    increase: "Raises food support at every territory size.",
    decrease: "Lowers food support and makes the capacity damping hit sooner.",
    formula:
      "foodProduction = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  maxTroopTileExponent: {
    does: "Sets how strongly owned tile count curves into food production.",
    exists:
      "Controls whether land rewards flatten or accelerate as empires grow.",
    represents: "Economies of scale from holding more territory.",
    increase:
      "Makes large territories gain much more food production from extra land.",
    decrease: "Makes each additional tile add less long-term food advantage.",
    formula:
      "foodProduction = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  maxTroopTileScale: {
    does: "Scales the land-based part of food production.",
    exists: "Separates land value from the fixed base capacity.",
    represents: "How productive each controlled tile is for supporting troops.",
    increase: "Makes territorial growth raise food production more strongly.",
    decrease: "Makes the base cap dominate and reduces the reward for land.",
    formula:
      "foodProduction = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  maxTroopBase: {
    does: "Adds fixed food production before the global food multiplier is applied.",
    exists: "Gives small settlements a minimum food output.",
    represents: "Core settlement infrastructure independent of land area.",
    increase: "Raises the minimum food support, especially early in the game.",
    decrease: "Makes small territories hit food limits sooner.",
    formula:
      "foodProduction = maxTroopMultiplier * (tileCount^maxTroopTileExponent * maxTroopTileScale + maxTroopBase)",
  },
  foodYieldMin: {
    does: "Sets food per tick when a tile's crop suitability is 0.",
    exists:
      "Keeps poor farmland tunable instead of forcing bad land to produce nothing.",
    represents: "Minimum crop yield from controlled land.",
    increase: "Raises the floor for marginal, dry, steep, or cold farm tiles.",
    decrease: "Makes weak crop land less useful for food production.",
    formula: "tileFood = logisticModifier(crop, minYield, maxYield, k)",
  },
  foodYieldMax: {
    does: "Sets food per tick when a tile's crop suitability is 1.",
    exists: "Defines the production ceiling for ideal farmland.",
    represents: "Maximum crop yield from controlled land.",
    increase: "Makes high-crop tiles more valuable.",
    decrease: "Compresses the difference between good and poor farmland.",
    formula: "tileFood = logisticModifier(crop, minYield, maxYield, k)",
  },
  foodYieldK: {
    does: "Controls the bend between poor and excellent crop suitability.",
    exists:
      "Lets crop value move between linear scaling and sharp threshold behavior.",
    represents:
      "How strongly food yield accelerates around medium crop suitability.",
    increase:
      "Creates a steeper midpoint knee where good land pulls away faster.",
    decrease: "Moves the curve toward a linear crop-to-food conversion.",
    formula: "k = 0: linear; k > 0: normalized logistic curve",
  },
  oilYieldMin: {
    does: "Sets oil per tick when a tile's oil suitability is 0.",
    exists: "Uses the same yield curve abstraction as food.",
    represents: "Minimum oil yield from controlled oil-producing land.",
    increase: "Raises low-quality oil tile output.",
    decrease: "Makes weak oil tiles less productive.",
    formula: "tileOil = logisticModifier(oil, minYield, maxYield, k)",
  },
  oilYieldMax: {
    does: "Sets oil per tick when a tile's oil suitability is 1.",
    exists: "Defines the production ceiling for ideal oil deposits.",
    represents: "Maximum oil yield from controlled oil-producing land.",
    increase: "Makes high-oil tiles more valuable.",
    decrease: "Compresses oil output across deposit quality.",
    formula: "tileOil = logisticModifier(oil, minYield, maxYield, k)",
  },
  oilYieldK: {
    does: "Controls the bend between poor and excellent oil suitability.",
    exists: "Uses one shared curve shape for resource output.",
    represents: "How sharply oil output accelerates around medium suitability.",
    increase: "Creates a steeper midpoint knee for oil deposits.",
    decrease: "Moves oil yield toward linear scaling.",
    formula: "k = 0: linear; k > 0: normalized logistic curve",
  },
  metalYieldMin: {
    does: "Sets metal per tick when a tile's metal suitability is 0.",
    exists: "Uses the same yield curve abstraction as food.",
    represents: "Minimum metal yield from controlled metal-producing land.",
    increase: "Raises low-quality metal tile output.",
    decrease: "Makes weak metal tiles less productive.",
    formula: "tileMetal = logisticModifier(metal, minYield, maxYield, k)",
  },
  metalYieldMax: {
    does: "Sets metal per tick when a tile's metal suitability is 1.",
    exists: "Defines the production ceiling for ideal metal deposits.",
    represents: "Maximum metal yield from controlled metal-producing land.",
    increase: "Makes high-metal tiles more valuable.",
    decrease: "Compresses metal output across deposit quality.",
    formula: "tileMetal = logisticModifier(metal, minYield, maxYield, k)",
  },
  metalYieldK: {
    does: "Controls the bend between poor and excellent metal suitability.",
    exists: "Uses one shared curve shape for resource output.",
    represents:
      "How sharply metal output accelerates around medium suitability.",
    increase: "Creates a steeper midpoint knee for metal deposits.",
    decrease: "Moves metal yield toward linear scaling.",
    formula: "k = 0: linear; k > 0: normalized logistic curve",
  },
  wildernessBaseSpeed: {
    does: "Sets the flat-terrain reference used when slope scales frontier velocity.",
    exists: "Anchors the terrain speed calculation before slope modifiers.",
    represents: "Baseline travel difficulty through unsettled land.",
    increase: "Makes the same slope multiplier compare against a higher base.",
    decrease: "Makes the same slope multiplier compare against a lower base.",
    formula:
      "frontVelocity = wildernessTilesPerTickMultiplier * min(frontTroops / wildernessFrontCapacity, 1) * slopeMultiplier",
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
  wildernessDistanceFocus: {
    does: "Sharpens the Gaussian distance falloff from border tiles to the cursor.",
    exists:
      "Makes close clicks create narrow launch fronts while distant clicks stay broad.",
    represents: "Focus multiplier applied to direct Euclidean cursor distance.",
    increase: "Concentrates troops on the closest border tiles to the cursor.",
    decrease: "Spreads troops across a wider section of the border.",
    formula:
      "weight(tile) = exp(-0.5 * (distance(tile, cursor) * distanceFocus)^2)",
  },
  wildernessFrontCapacity: {
    does: "Sets the troop mass where a frontier tile reaches terminal velocity.",
    exists: "Separates wave endurance from maximum immediate push speed.",
    represents:
      "The number of troops needed on a front tile to move at max speed.",
    increase:
      "Requires more troops on a tile before it reaches terminal velocity.",
    decrease: "Lets smaller allocated troop groups reach terminal velocity.",
    formula:
      "terminalTroopFactor = min(frontTroops / wildernessFrontCapacity, 1)",
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
    does: "Sets the max per-tick velocity for each active frontier tile.",
    exists: "Controls how quickly terminal-velocity fronts move across land.",
    represents: "Maximum physical push speed across the active frontier.",
    increase: "Moves saturated fronts farther per tick.",
    decrease: "Makes saturated fronts take more ticks per tile.",
    formula:
      "progress += wildernessTilesPerTickMultiplier * terminalTroopFactor * slopeMultiplier",
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
  @query("canvas.board-canvas")
  private canvas!: HTMLCanvasElement;

  @query("canvas.vector-overlay")
  private vectorOverlayCanvas!: HTMLCanvasElement;

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
  private activeYieldResource: FoundationYieldResource = "food";

  @state()
  private inputDrafts: Partial<Record<keyof FoundationTuningSettings, string>> =
    {};

  @state()
  private openMechanicKeys: (keyof FoundationTuningSettings)[] = [];

  @state()
  private presets: FoundationStoredPreset[] = [];

  @state()
  private selectedWorldPresetId = "";

  @state()
  private selectedWorldMapPresetId = "";

  @state()
  private selectedMechanicPresetId = "";

  @state()
  private contextMenuOpen = false;

  @state()
  private contextMenuX = 0;

  @state()
  private contextMenuY = 0;

  @state()
  private contextMenuActiveRootId = "";

  @state()
  private contextMenuActiveBuildId = "";

  @state()
  private selectedContextBuilding = "Grain Silo";

  @state()
  private activeBuildPlacementItem: FoundationContextMenuItem | null = null;

  @state()
  private buildPlacementTileRef: number | null = null;

  @state()
  private placedBuildings: FoundationPlacedBuilding[] = [];

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

    .preset-section {
      display: block;
      margin-bottom: 14px;
      --hud-radius: 8px;
      --hud-surface-header-min-height: 36px;
      --hud-surface-header-padding: 9px 12px;
      --hud-surface-body-padding: 10px 12px;
    }

    .preset-section::part(surface) {
      border: 1px solid rgb(48 56 61 / 0.86);
      background: rgb(24 29 32 / 0.78);
    }

    .preset-tools {
      display: grid;
      grid-template-columns: minmax(0, 1fr) repeat(3, auto);
      align-items: center;
      gap: 6px;
    }

    .preset-tools hud-select {
      min-width: 0;
    }

    .preset-inline-tools {
      display: grid;
      grid-template-columns: minmax(0, 1fr) repeat(3, auto);
      align-items: center;
      gap: 6px;
      min-width: 0;
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

    .modifier-curve-row {
      grid-column: 1 / -1;
      display: grid;
      gap: 8px;
      min-width: 0;
      margin-top: 2px;
      border: 1px solid rgb(48 56 61 / 0.72);
      border-radius: 6px;
      background: rgb(16 20 22 / 0.48);
      padding: 8px;
    }

    .modifier-curve-chart {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 3 / 1;
      overflow: visible;
    }

    .modifier-curve-axis {
      stroke: rgb(157 170 177 / 0.34);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }

    .modifier-curve-guide {
      stroke: rgb(157 170 177 / 0.18);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }

    .modifier-curve-line {
      fill: none;
      stroke: var(--accent);
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    .modifier-curve-points {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      min-width: 0;
    }

    .modifier-curve-point {
      min-width: 0;
      border: 1px solid rgb(48 56 61 / 0.72);
      border-radius: 5px;
      background: rgb(32 38 42 / 0.68);
      padding: 6px;
      overflow: hidden;
    }

    .modifier-curve-point-label {
      display: block;
      color: var(--muted);
      font-size: 8px;
      font-weight: 800;
      line-height: 1;
      text-transform: uppercase;
    }

    .modifier-curve-point-value {
      display: block;
      margin-top: 4px;
      color: var(--text);
      font-size: 10px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      overflow: hidden;
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

    .vector-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      background: transparent;
      image-rendering: auto;
    }

    .context-menu-layer {
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
    }

    .context-menu-panel {
      position: absolute;
      width: var(--foundation-context-menu-width);
      pointer-events: auto;
    }

    hud-menu.context-menu-menu {
      width: 100%;
      --hud-menu-min-width: 0;
      --hud-menu-radius: 0;
      --hud-menu-item-font-size: 10px;
      --hud-menu-item-gap: 6px;
      --hud-menu-item-padding: 4px 6px;
      --hud-menu-item-radius: 0;
    }

    hud-menu.context-menu-menu hud-surface-header {
      --hud-surface-header-min-height: 22px;
      --hud-surface-header-padding: 4px 6px;
    }

    hud-menu.context-menu-menu hud-menu-item {
      --hud-menu-item-selected-background: rgb(125 200 166 / 0.16);
    }

    .context-menu-title,
    .context-menu-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      color: var(--accent);
    }

    .context-menu-title {
      color: var(--muted);
      font-size: 9px;
      font-weight: 800;
      line-height: 1;
      text-transform: uppercase;
    }

    .context-menu-svg {
      width: 13px;
      height: 13px;
      flex: 0 0 auto;
    }

    .context-menu-indent-1 {
      --hud-menu-item-padding: 4px 6px 4px 18px;
    }

    .context-menu-indent-2 {
      --hud-menu-item-padding: 4px 6px 4px 32px;
    }

    .build-placement-preview {
      position: absolute;
      z-index: 4;
      border: 1px solid rgb(230 191 99 / 0.95);
      background: rgb(230 191 99 / 0.18);
      box-shadow:
        0 0 0 1px rgb(5 7 8 / 0.8),
        inset 0 0 10px rgb(230 191 99 / 0.22);
      pointer-events: none;
    }

    .build-placement-label {
      position: absolute;
      left: 0;
      top: -22px;
      max-width: 180px;
      overflow: hidden;
      border: 1px solid rgb(157 170 177 / 0.42);
      background: rgb(16 20 22 / 0.95);
      color: var(--accent-2);
      font-size: 10px;
      font-weight: 800;
      line-height: 1;
      padding: 4px 6px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .placed-building {
      position: absolute;
      z-index: 3;
      display: grid;
      place-items: center;
      border: 1px solid rgb(157 170 177 / 0.58);
      background:
        linear-gradient(rgb(255 255 255 / 0.07), rgb(255 255 255 / 0)),
        var(--foundation-building-color, rgb(28 35 35));
      box-shadow:
        inset 0 0 0 1px rgb(5 7 8 / 0.72),
        0 1px 0 rgb(255 255 255 / 0.06);
      pointer-events: none;
      transform: translateZ(0);
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
    this.contextMenuOpen = false;
    this.tuningSettings = loadFoundationTuningSettings(
      foundationTuningOverridesFromLocation(),
    );
    this.presets = loadFoundationPresets();

    this.canvas.addEventListener("click", this.handleCanvasClick);
    this.canvas.addEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.addEventListener("wheel", this.handleCanvasWheel, {
      passive: false,
    });
    window.addEventListener("pointermove", this.handleCanvasPointerMove);
    window.addEventListener("pointerup", this.handleCanvasPointerUp);
    window.addEventListener("pointercancel", this.handleCanvasPointerUp);
    window.addEventListener("keydown", this.handleWindowKeydown);
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
    window.removeEventListener("keydown", this.handleWindowKeydown);
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
    this.clearVectorOverlay();
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
              ${this.renderPresetControls("world-generation")}
              ${this.controlSection(
                "World",
                html`
                  ${this.renderPresetTableRow("world-map", "Saved maps")}
                  ${this.seedInput()}
                  ${this.numberInput("Width", "width", 32, 1024, 1)}
                  ${this.numberInput("Height", "height", 32, 1024, 1)}
                `,
              )}
              ${this.controlSection(
                "Elevation",
                html`
                  ${this.rangeInput(
                    "Sea level",
                    "seaLevel",
                    0.2,
                    0.75,
                    0.01,
                    2,
                  )}
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
              ?hidden=${this.activeControlTab !== "combat"}
            >
              ${this.renderPresetControls("game-mechanics")}
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
                    "Food multiplier",
                    "maxTroopMultiplier",
                    0.1,
                    6,
                    0.1,
                    1,
                  )}
                  ${this.rangeInput(
                    "Food tile exponent",
                    "maxTroopTileExponent",
                    0,
                    1.5,
                    0.01,
                    2,
                  )}
                  ${this.rangeInput(
                    "Food tile scale",
                    "maxTroopTileScale",
                    0,
                    5000,
                    100,
                    0,
                  )}
                  ${this.rangeInput(
                    "Food base",
                    "maxTroopBase",
                    0,
                    200000,
                    1000,
                    0,
                  )}
                `,
              )}
              ${this.controlSection(
                "Front Mechanics",
                html`
                  ${this.logRangeInput(
                    "Distance focus",
                    "wildernessDistanceFocus",
                    0.001,
                    10000,
                    0.001,
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
                `,
              )}
              ${this.controlSection(
                "Tile Costs",
                html`
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

            <div
              class="control-panel"
              ?hidden=${this.activeControlTab !== "ecology"}
            >
              ${this.renderPresetControls("game-mechanics")}
              ${this.controlSection(
                "Yields",
                html`
                  ${this.renderYieldResourceSelect()}
                  ${this.rangeInput(
                    "Min yield",
                    this.activeYieldResourceDefinition().minKey,
                    0,
                    100,
                    0.25,
                    2,
                  )}
                  ${this.rangeInput(
                    "Max yield",
                    this.activeYieldResourceDefinition().maxKey,
                    0,
                    100,
                    0.25,
                    2,
                  )}
                  ${this.rangeInput(
                    "Yield k",
                    this.activeYieldResourceDefinition().kKey,
                    0,
                    30,
                    0.1,
                    1,
                  )}
                  ${this.renderYieldCurve()}
                `,
              )}
              ${this.controlSection(
                "Food Stock",
                html`
                  ${this.rangeInput(
                    "Starting food",
                    "startingFoodStorage",
                    0,
                    100000,
                    500,
                    0,
                  )}
                  ${this.rangeInput(
                    "Base capacity",
                    "baseFoodStorageCapacity",
                    0,
                    200000,
                    1000,
                    0,
                  )}
                `,
              )}
              ${this.controlSection(
                "Wilderness Exploration",
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
              <div
                class="canvas-frame"
                @pointerdown=${this.handleCanvasFramePointerDown}
                @contextmenu=${this.handleCanvasContextMenu}
              >
                ${this.renderRuntimeOverlay(snapshot)}
                <canvas
                  class="board-canvas"
                  aria-label="Foundation generated game board"
                ></canvas>
                <canvas class="vector-overlay" aria-hidden="true"></canvas>
                ${this.renderContextMenu()}
                ${this.renderBuildPlacementPreview()}
                ${this.renderPlacedBuildings()}
                ${this.renderResourceLayerOverlay()}
                ${this.renderBoardStateOverlay()}
              </div>
            </hud-surface-body>
          </hud-surface>
        </section>
      </main>
    `;
  }

  private renderContextMenu(): TemplateResult | null {
    if (!this.contextMenuOpen) {
      return null;
    }

    const layout = this.contextMenuLayout();
    const buildItems =
      this.contextMenuActiveRootId === "build"
        ? FOUNDATION_CONTEXT_BUILD_MENU.children
        : [];
    const buildingItems =
      this.contextMenuActiveRootId === "build" &&
      this.contextMenuActiveBuildId === "storage"
        ? FOUNDATION_STORAGE_BUILDINGS
        : [];

    return html`
      <div class="context-menu-layer">
        ${layout.compact
          ? this.renderCompactContextMenu(layout)
          : html`
              ${this.renderContextMenuPanel(
                "Sections",
                FOUNDATION_CONTEXT_ROOT_MENU,
                FOUNDATION_CONTEXT_MENU_MAIN_WIDTH,
                layout.main,
                this.contextMenuActiveRootId,
                (item) => this.selectContextRoot(item),
              )}
              ${buildItems?.length
                ? this.renderContextMenuPanel(
                    "Build",
                    buildItems,
                    FOUNDATION_CONTEXT_MENU_SUBMENU_WIDTH,
                    layout.sub,
                    this.contextMenuActiveBuildId,
                    (item) => this.selectContextBuild(item),
                  )
                : null}
              ${buildingItems.length
                ? this.renderContextMenuPanel(
                    "Storage",
                    buildingItems,
                    FOUNDATION_CONTEXT_MENU_BUILDING_WIDTH,
                    layout.detail,
                    "",
                    () => {},
                  )
                : null}
            `}
      </div>
    `;
  }

  private renderBuildPlacementPreview(): TemplateResult | null {
    if (
      !this.activeBuildPlacementItem ||
      this.buildPlacementTileRef === null ||
      !this.runtime ||
      !this.renderer ||
      !this.canvas
    ) {
      return null;
    }

    const bounds = this.tileOverlayBounds(this.buildPlacementTileRef);
    if (!bounds) {
      return null;
    }

    return html`
      <div
        class="build-placement-preview"
        style="left: ${bounds.left}px; top: ${bounds.top}px; width: ${bounds.width}px; height: ${bounds.height}px;"
      >
        <span class="build-placement-label"
          >${this.activeBuildPlacementItem.label}</span
        >
      </div>
    `;
  }

  private renderPlacedBuildings(): TemplateResult | null {
    if (!this.runtime || !this.renderer || this.placedBuildings.length === 0) {
      return null;
    }

    return html`
      ${this.placedBuildings.map((building) => {
        const bounds = this.tileOverlayBounds(building.tileRef);
        const color = FOUNDATION_BUILDING_COLOR_BY_ID[building.id];
        if (!bounds || !color) {
          return null;
        }

        return html`
          <div
            class="placed-building"
            title=${building.label}
            aria-label=${building.label}
            style="--foundation-building-color: ${color}; left: ${bounds.left}px; top: ${bounds.top}px; width: ${bounds.width}px; height: ${bounds.height}px;"
          ></div>
        `;
      })}
    `;
  }

  private renderCompactContextMenu(
    layout: FoundationContextMenuLayout,
  ): TemplateResult {
    return html`
      <div
        class="context-menu-panel"
        style="--foundation-context-menu-width: min(${FOUNDATION_CONTEXT_MENU_BUILDING_WIDTH}px, calc(100% - 16px)); left: ${layout
          .main.left}px; top: ${layout.main.top}px;"
      >
        <hud-menu class="context-menu-menu">
          <hud-surface-header>
            <span class="context-menu-title">
              ${renderLucideIcon(Hammer, "context-menu-svg")} Sections
            </span>
          </hud-surface-header>
          ${FOUNDATION_CONTEXT_ROOT_MENU.map((item) =>
            this.renderCompactContextMenuItem(item, 0, () =>
              this.selectContextRoot(item),
            ),
          )}
          ${this.contextMenuActiveRootId === "build"
            ? FOUNDATION_CONTEXT_BUILD_MENU.children?.map((item) =>
                this.renderCompactContextMenuItem(item, 1, () =>
                  this.selectContextBuild(item),
                ),
              )
            : null}
          ${this.contextMenuActiveRootId === "build" &&
          this.contextMenuActiveBuildId === "storage"
            ? FOUNDATION_STORAGE_BUILDINGS.map((item) =>
                this.renderCompactContextMenuItem(item, 2, () => {}),
              )
            : null}
        </hud-menu>
      </div>
    `;
  }

  private renderCompactContextMenuItem(
    item: FoundationContextMenuItem,
    depth: number,
    onHover: () => void,
  ): TemplateResult {
    const selected = item.label === this.selectedContextBuilding;
    const active =
      item.id === this.contextMenuActiveRootId ||
      item.id === this.contextMenuActiveBuildId;
    return html`
      <hud-menu-item
        class=${depth > 0 ? `context-menu-indent-${depth}` : ""}
        ?disabled=${item.disabled}
        ?selected=${selected || active}
        @pointerenter=${onHover}
        @menu-select=${() => {
          if (!item.children) this.selectContextBuilding(item);
        }}
      >
        <span slot="icon" class="context-menu-icon">
          ${renderLucideIcon(item.icon, "context-menu-svg")}
        </span>
        ${item.label}
        ${item.children
          ? html`<span slot="meta">
              ${renderLucideIcon(ChevronRight, "context-menu-svg")}
            </span>`
          : html`<span slot="meta">${item.meta ?? ""}</span>`}
      </hud-menu-item>
    `;
  }

  private renderContextMenuPanel(
    title: string,
    items: readonly FoundationContextMenuItem[],
    width: number,
    position: FoundationContextMenuPosition,
    activeId: string,
    onHover: (item: FoundationContextMenuItem) => void,
  ): TemplateResult {
    return html`
      <div
        class="context-menu-panel"
        style="--foundation-context-menu-width: ${width}px; left: ${position.left}px; top: ${position.top}px;"
      >
        <hud-menu class="context-menu-menu">
          <hud-surface-header>
            <span class="context-menu-title">${title}</span>
          </hud-surface-header>
          ${items.map((item) => {
            const active = item.id === activeId;
            const selected = item.label === this.selectedContextBuilding;
            return html`
              <hud-menu-item
                ?disabled=${item.disabled}
                ?selected=${active || selected}
                @pointerenter=${() => onHover(item)}
                @menu-select=${() => {
                  if (!item.children) this.selectContextBuilding(item);
                }}
              >
                <span slot="icon" class="context-menu-icon">
                  ${renderLucideIcon(item.icon, "context-menu-svg")}
                </span>
                ${item.label}
                ${item.children
                  ? html`<span slot="meta">
                      ${renderLucideIcon(ChevronRight, "context-menu-svg")}
                    </span>`
                  : html`<span slot="meta">${item.meta ?? ""}</span>`}
              </hud-menu-item>
            `;
          })}
        </hud-menu>
      </div>
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
              label="Food support"
              value=${formatTroops(snapshot?.player.foodSupportedTroops)}
            ></hud-stat>
            <hud-stat
              label="Food surplus"
              value=${formatFoodDelta(
                snapshot?.player.foodSurplus,
                snapshot?.player.foodDeficit,
              )}
            ></hud-stat>
            <hud-stat
              label="Food stock"
              value=${formatFoodStock(
                snapshot?.player.foodStock,
                snapshot?.player.foodStockCapacity,
              )}
            ></hud-stat>
            <hud-stat
              label="Food flow"
              value=${formatFoodStockFlow(snapshot)}
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

  private readonly handleCanvasContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (this.activeBuildPlacementItem) {
      this.cancelBuildPlacement();
      return;
    }
    if (this.contextMenuOpen) {
      this.closeContextMenu();
      return;
    }
    if (this.eventPathIncludesContextMenu(event)) {
      return;
    }
    const frame = this.canvas.parentElement;
    const rect = (frame ?? this.canvas).getBoundingClientRect();
    this.contextMenuX = event.clientX - rect.left;
    this.contextMenuY = event.clientY - rect.top;
    this.contextMenuOpen = true;
    this.contextMenuActiveRootId = "";
    this.contextMenuActiveBuildId = "";
  };

  private readonly handleCanvasFramePointerDown = (
    event: PointerEvent,
  ): void => {
    if (event.button === 2) {
      return;
    }

    if (this.eventPathIncludesContextMenu(event)) {
      return;
    }

    if (this.contextMenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      if (event.composedPath().includes(this.canvas)) {
        this.suppressNextCanvasClick = true;
      }
      this.closeContextMenu();
    }
  };

  private eventPathIncludesContextMenu(event: Event): boolean {
    return event.composedPath().some((target) => {
      return (
        target instanceof HTMLElement &&
        target.classList.contains("context-menu-panel")
      );
    });
  }

  private selectContextRoot(item: FoundationContextMenuItem): void {
    if (item.disabled) {
      this.contextMenuActiveRootId = "";
      this.contextMenuActiveBuildId = "";
      return;
    }
    this.contextMenuActiveRootId = item.id;
    this.contextMenuActiveBuildId = "";
  }

  private selectContextBuild(item: FoundationContextMenuItem): void {
    if (item.disabled) return;
    this.contextMenuActiveBuildId = item.id;
  }

  private selectContextBuilding(item: FoundationContextMenuItem): void {
    if (item.disabled || item.children) return;
    this.selectedContextBuilding = item.label;
    this.startBuildPlacement(item);
  }

  private closeContextMenu(): void {
    this.contextMenuOpen = false;
    this.contextMenuActiveRootId = "";
    this.contextMenuActiveBuildId = "";
  }

  private startBuildPlacement(item: FoundationContextMenuItem): void {
    this.closeContextMenu();
    this.activeBuildPlacementItem = item;
    this.updateBuildPlacementPreviewFromLastPointer();
    this.canvas.style.cursor = "crosshair";
    this.status = {
      tone: "idle",
      text: `${item.label} placement selected.`,
    };
  }

  private cancelBuildPlacement(): void {
    const label = this.activeBuildPlacementItem?.label;
    this.activeBuildPlacementItem = null;
    this.buildPlacementTileRef = null;
    this.canvas.style.cursor = "";
    if (label) {
      this.status = {
        tone: "idle",
        text: `${label} placement cancelled.`,
      };
    }
  }

  private confirmBuildPlacement(tile: { x: number; y: number; ref: number }) {
    const item = this.activeBuildPlacementItem;
    if (!item) return;
    const anchorTile = this.anchorTileForBuilding(tile);
    if (!anchorTile) {
      return;
    }
    this.activeBuildPlacementItem = null;
    this.buildPlacementTileRef = null;
    this.selectedContextBuilding = item.label;
    this.placedBuildings = [
      ...this.placedBuildings.filter(
        (building) => building.tileRef !== anchorTile.ref,
      ),
      {
        id: item.id,
        label: item.label,
        tileRef: anchorTile.ref,
      },
    ];
    this.canvas.style.cursor = "";
    this.status = {
      tone: "ok",
      text: `Built ${item.label} at ${anchorTile.x}, ${anchorTile.y}.`,
    };
  }

  private tileOverlayBounds(tileRef: number): {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null {
    if (!this.runtime || !this.renderer || !this.canvas) {
      return null;
    }
    const map = this.runtime.map();
    if (!map.isValidRef(tileRef)) {
      return null;
    }

    const rect = this.canvas.getBoundingClientRect();
    const tileX = map.x(tileRef);
    const tileY = map.y(tileRef);
    const topLeft = this.worldToOverlayScreen(tileX, tileY, rect);
    const bottomRight = this.worldToOverlayScreen(
      tileX + FOUNDATION_BUILDING_TILE_SIZE,
      tileY + FOUNDATION_BUILDING_TILE_SIZE,
      rect,
    );
    return {
      left: Math.min(topLeft.x, bottomRight.x),
      top: Math.min(topLeft.y, bottomRight.y),
      width: Math.max(1, Math.abs(bottomRight.x - topLeft.x)),
      height: Math.max(1, Math.abs(bottomRight.y - topLeft.y)),
    };
  }

  private readonly handleWindowKeydown = (event: KeyboardEvent): void => {
    if (!this.activeBuildPlacementItem) return;
    if (event.key !== "Escape" && event.key !== "Enter") return;
    event.preventDefault();
    this.cancelBuildPlacement();
  };

  private updateBuildPlacementPreviewFromLastPointer(): void {
    if (!this.renderer) return;
    const tile = this.renderer.screenToTile({
      screenX: this.contextMenuX,
      screenY: this.contextMenuY,
    });
    this.buildPlacementTileRef = tile
      ? (this.anchorTileForBuilding(tile)?.ref ?? null)
      : null;
  }

  private updateBuildPlacementPreviewForPointer(event: PointerEvent): void {
    const tile = this.tileFromClientPoint(event.clientX, event.clientY);
    this.buildPlacementTileRef = tile
      ? (this.anchorTileForBuilding(tile)?.ref ?? null)
      : null;
  }

  private anchorTileForBuilding(tile: {
    x: number;
    y: number;
    ref: number;
  }): { x: number; y: number; ref: number } | null {
    if (!this.runtime) {
      return null;
    }
    const map = this.runtime.map();
    const x = clampFoundationNumber(
      tile.x - FOUNDATION_BUILDING_CENTER_OFFSET,
      0,
      Math.max(0, map.width() - FOUNDATION_BUILDING_TILE_SIZE),
    );
    const y = clampFoundationNumber(
      tile.y - FOUNDATION_BUILDING_CENTER_OFFSET,
      0,
      Math.max(0, map.height() - FOUNDATION_BUILDING_TILE_SIZE),
    );
    return { x, y, ref: map.ref(x, y) };
  }

  private tileFromClientPoint(
    clientX: number,
    clientY: number,
  ): { x: number; y: number; ref: number } | null {
    if (!this.renderer || !this.canvas) {
      return null;
    }
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    if (
      screenX < 0 ||
      screenY < 0 ||
      screenX >= rect.width ||
      screenY >= rect.height
    ) {
      return null;
    }
    return this.renderer.screenToTile({ screenX, screenY });
  }

  private contextMenuLayout(): FoundationContextMenuLayout {
    const frame = this.canvas?.parentElement;
    const rect = frame?.getBoundingClientRect();
    const width = rect?.width ?? 900;
    const height = rect?.height ?? 600;
    const fullWidth =
      FOUNDATION_CONTEXT_MENU_MAIN_WIDTH +
      FOUNDATION_CONTEXT_MENU_SUBMENU_WIDTH +
      FOUNDATION_CONTEXT_MENU_BUILDING_WIDTH +
      FOUNDATION_CONTEXT_MENU_GAP * 2;
    const compact = width < fullWidth + FOUNDATION_CONTEXT_MENU_EDGE_GAP * 2;
    const mainHeight = compact ? 138 : 118;
    const top = clampFoundationNumber(
      this.contextMenuY,
      FOUNDATION_CONTEXT_MENU_EDGE_GAP,
      Math.max(
        FOUNDATION_CONTEXT_MENU_EDGE_GAP,
        height - mainHeight - FOUNDATION_CONTEXT_MENU_EDGE_GAP,
      ),
    );

    if (compact) {
      return {
        compact,
        main: {
          left: clampFoundationNumber(
            this.contextMenuX,
            FOUNDATION_CONTEXT_MENU_EDGE_GAP,
            Math.max(
              FOUNDATION_CONTEXT_MENU_EDGE_GAP,
              width -
                FOUNDATION_CONTEXT_MENU_BUILDING_WIDTH -
                FOUNDATION_CONTEXT_MENU_EDGE_GAP,
            ),
          ),
          top,
        },
        sub: { left: FOUNDATION_CONTEXT_MENU_EDGE_GAP, top },
        detail: { left: FOUNDATION_CONTEXT_MENU_EDGE_GAP, top },
      };
    }

    const enoughRight =
      this.contextMenuX + fullWidth <= width - FOUNDATION_CONTEXT_MENU_EDGE_GAP;
    const minLeftForLeftFlyout =
      FOUNDATION_CONTEXT_MENU_EDGE_GAP +
      FOUNDATION_CONTEXT_MENU_BUILDING_WIDTH +
      FOUNDATION_CONTEXT_MENU_GAP +
      FOUNDATION_CONTEXT_MENU_SUBMENU_WIDTH +
      FOUNDATION_CONTEXT_MENU_GAP;
    const maxMainLeft =
      width -
      FOUNDATION_CONTEXT_MENU_MAIN_WIDTH -
      FOUNDATION_CONTEXT_MENU_EDGE_GAP;
    const mainLeft = enoughRight
      ? clampFoundationNumber(
          this.contextMenuX,
          FOUNDATION_CONTEXT_MENU_EDGE_GAP,
          maxMainLeft,
        )
      : clampFoundationNumber(
          this.contextMenuX,
          minLeftForLeftFlyout,
          maxMainLeft,
        );
    const direction = enoughRight ? 1 : -1;
    const subLeft =
      direction === 1
        ? mainLeft +
          FOUNDATION_CONTEXT_MENU_MAIN_WIDTH +
          FOUNDATION_CONTEXT_MENU_GAP
        : mainLeft -
          FOUNDATION_CONTEXT_MENU_SUBMENU_WIDTH -
          FOUNDATION_CONTEXT_MENU_GAP;
    const detailLeft =
      direction === 1
        ? subLeft +
          FOUNDATION_CONTEXT_MENU_SUBMENU_WIDTH +
          FOUNDATION_CONTEXT_MENU_GAP
        : subLeft -
          FOUNDATION_CONTEXT_MENU_BUILDING_WIDTH -
          FOUNDATION_CONTEXT_MENU_GAP;

    return {
      compact,
      main: { left: mainLeft, top },
      sub: { left: subLeft, top },
      detail: { left: detailLeft, top },
    };
  }

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
    this.drawDistanceVectorOverlay(this.directionalBorderPreview);
    this.requestUpdate();
  };

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    if (this.contextMenuOpen) {
      event.preventDefault();
      this.suppressNextCanvasClick = true;
      return;
    }

    if (this.activeBuildPlacementItem) {
      event.preventDefault();
      return;
    }

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

    if (this.activeBuildPlacementItem) {
      this.updateBuildPlacementPreviewForPointer(event);
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
    this.requestUpdate();
  };

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }

    this.dragPointerId = null;
    this.canvas.style.cursor = "";

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

    const tile = this.tileFromClientPoint(event.clientX, event.clientY);

    if (tile === null) {
      this.status = {
        tone: "error",
        text: "Click landed outside the map bounds.",
      };
      return;
    }

    if (this.activeBuildPlacementItem) {
      event.preventDefault();
      this.confirmBuildPlacement(tile);
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
    this.commitNumberInputDrafts(undefined, { generateOnCommit: false });
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
      { generateOnCommit: true, forceGenerateOnCommit: true },
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

  private readonly saveCurrentPreset = (kind: FoundationPresetKind): void => {
    if (this.loading) return;
    this.commitNumberInputDrafts(undefined, { generateOnCommit: false });
    const name = window.prompt(
      presetPromptLabel(kind),
      defaultPresetName(kind),
    );
    if (name === null) {
      return;
    }

    const preset = createFoundationPreset(kind, name, this.tuningSettings);
    this.presets = [...this.presets, preset];
    saveFoundationPresets(this.presets);
    this.setSelectedPresetId(kind, preset.id);
    this.status = {
      tone: "ok",
      text: `${presetStatusLabel(kind)} saved.`,
    };
  };

  private readonly applySelectedPreset = (kind: FoundationPresetKind): void => {
    if (this.loading) return;
    const preset = this.selectedPreset(kind);
    if (!preset) {
      return;
    }

    if (preset.kind === "world-generation") {
      const next = applyWorldGenerationPresetData(
        this.tuningSettings,
        preset.data,
      );
      this.clearInputDraftKeys(FOUNDATION_WORLD_GENERATION_PRESET_KEYS);
      this.updateSettings(presetPatch(this.tuningSettings, next), {
        generateOnCommit: true,
        forceGenerateOnCommit: true,
      });
      this.status = {
        tone: "ok",
        text: "World generation preset applied. Seed and map size were preserved.",
      };
      return;
    }

    if (preset.kind === "world-map") {
      const next = applyWorldMapPresetData(this.tuningSettings, preset.data);
      this.clearInputDraftKeys(FOUNDATION_WORLD_MAP_PRESET_KEYS);
      this.updateSettings(presetPatch(this.tuningSettings, next), {
        generateOnCommit: true,
        forceGenerateOnCommit: true,
      });
      this.status = {
        tone: "ok",
        text: "Saved map applied.",
      };
      return;
    }

    const next = applyGameMechanicPresetData(this.tuningSettings, preset.data);
    this.clearInputDraftKeys(FOUNDATION_GAME_MECHANIC_PRESET_KEYS);
    this.updateSettings(presetPatch(this.tuningSettings, next));
    this.status = {
      tone: "ok",
      text: "Game mechanic preset applied.",
    };
  };

  private readonly deleteSelectedPreset = (
    kind: FoundationPresetKind,
  ): void => {
    if (this.loading) return;
    const preset = this.selectedPreset(kind);
    if (!preset) {
      return;
    }
    if (!window.confirm(`Delete preset "${preset.name}"?`)) {
      return;
    }
    this.presets = this.presets.filter(
      (candidate) => candidate.id !== preset.id,
    );
    saveFoundationPresets(this.presets);
    this.setSelectedPresetId(kind, "");
    this.status = {
      tone: "ok",
      text: `${presetStatusLabel(kind)} deleted.`,
    };
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
      event.detail.id === "ecology"
        ? "ecology"
        : event.detail.id === "combat"
          ? "combat"
          : event.detail.id === "river"
            ? "river"
            : "world";
  };

  private readonly handleYieldResourceChange = (
    event: CustomEvent<{ value: string }>,
  ): void => {
    const next = event.detail.value;
    this.activeYieldResource =
      next === "oil" || next === "metal" ? next : "food";
  };

  private readonly handlePresetSelection = (
    kind: FoundationPresetKind,
    event: CustomEvent<{ value: string }>,
  ): void => {
    this.setSelectedPresetId(kind, event.detail.value);
  };

  private presetsForKind(kind: FoundationPresetKind): FoundationStoredPreset[] {
    return this.presets
      .filter((preset) => preset.kind === kind)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private selectedPreset(
    kind: FoundationPresetKind,
  ): FoundationStoredPreset | null {
    const id = this.selectedPresetId(kind);
    return (
      this.presets.find((preset) => preset.id === id && preset.kind === kind) ??
      null
    );
  }

  private selectedPresetId(kind: FoundationPresetKind): string {
    if (kind === "world-generation") {
      return this.selectedWorldPresetId;
    }
    if (kind === "world-map") {
      return this.selectedWorldMapPresetId;
    }
    return this.selectedMechanicPresetId;
  }

  private setSelectedPresetId(kind: FoundationPresetKind, id: string): void {
    if (kind === "world-generation") {
      this.selectedWorldPresetId = id;
      return;
    }
    if (kind === "world-map") {
      this.selectedWorldMapPresetId = id;
      return;
    }
    this.selectedMechanicPresetId = id;
  }

  private clearInputDraftKeys(
    keys: readonly (keyof FoundationTuningSettings)[],
  ): void {
    const drafts = { ...this.inputDrafts };
    for (const key of keys) {
      delete drafts[key];
    }
    this.inputDrafts = drafts;
  }

  private renderYieldResourceSelect(): TemplateResult {
    return html`
      <div class="control-row" role="row">
        <span class="control-name" role="cell">Resource</span>
        <span class="control-widget" role="cell">
          <hud-select
            .options=${FOUNDATION_YIELD_RESOURCE_DEFINITIONS.map(
              ({ resource, label }) => ({
                label,
                value: resource,
              }),
            )}
            .value=${this.activeYieldResource}
            ?disabled=${this.loading}
            @value-change=${(event: CustomEvent<{ value: string }>) =>
              this.handleYieldResourceChange(event)}
          ></hud-select>
        </span>
      </div>
    `;
  }

  private renderYieldCurve(): TemplateResult {
    const definition = this.activeYieldResourceDefinition();
    const min = Number(this.tuningSettings[definition.minKey]);
    const max = Number(this.tuningSettings[definition.maxKey]);
    const k = Number(this.tuningSettings[definition.kKey]);
    const width = 180;
    const height = 62;
    const left = 8;
    const right = 172;
    const top = 8;
    const bottom = 54;
    const points = Array.from({ length: 80 }, (_, index) => {
      const x = index / 79;
      const value = applyLogisticProductionModifier(x, { min, max, k });
      const t = max === min ? 0.5 : (value - min) / (max - min);
      const px = left + x * (right - left);
      const py = bottom - t * (bottom - top);
      return `${px.toFixed(2)},${py.toFixed(2)}`;
    }).join(" ");
    const samples = [0, 0.5, 1] as const;

    return html`
      <div class="modifier-curve-row" role="row">
        <svg
          class="modifier-curve-chart"
          viewBox="0 0 ${width} ${height}"
          role="img"
          aria-label=${`${definition.label} yield curve`}
          preserveAspectRatio="none"
        >
          <line
            class="modifier-curve-axis"
            x1=${left}
            y1=${bottom}
            x2=${right}
            y2=${bottom}
          ></line>
          <line
            class="modifier-curve-axis"
            x1=${left}
            y1=${top}
            x2=${left}
            y2=${bottom}
          ></line>
          <line
            class="modifier-curve-guide"
            x1=${left}
            y1=${(top + bottom) / 2}
            x2=${right}
            y2=${(top + bottom) / 2}
          ></line>
          <line
            class="modifier-curve-guide"
            x1=${(left + right) / 2}
            y1=${top}
            x2=${(left + right) / 2}
            y2=${bottom}
          ></line>
          <polyline class="modifier-curve-line" points=${points}></polyline>
        </svg>
        <div class="modifier-curve-points">
          ${samples.map((sample) => {
            const value = applyLogisticProductionModifier(sample, {
              min,
              max,
              k,
            });
            return html`
              <div class="modifier-curve-point">
                <span class="modifier-curve-point-label"
                  >${definition.inputLabel}
                  ${formatControlValue(sample, sample === 0.5 ? 1 : 0)}</span
                >
                <span class="modifier-curve-point-value"
                  >${formatControlValue(value, 2)}/tick</span
                >
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private activeYieldResourceDefinition(): FoundationYieldResourceDefinition {
    return (
      FOUNDATION_YIELD_RESOURCE_DEFINITIONS.find(
        ({ resource }) => resource === this.activeYieldResource,
      ) ?? FOUNDATION_YIELD_RESOURCE_DEFINITIONS[0]
    );
  }

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

  private renderPresetControls(kind: FoundationPresetKind): TemplateResult {
    const title =
      kind === "world-generation" ? "Generation Presets" : "Mechanic Presets";
    const selectedId = this.selectedPresetId(kind);
    const selected = this.selectedPreset(kind);
    const noun = presetActionNoun(kind);
    return html`
      <hud-surface class="preset-section">
        <hud-surface-header>
          <span class="section-title">${title}</span>
        </hud-surface-header>
        <hud-surface-body>
          <div class="preset-tools">
            <hud-select
              data-preset-kind=${kind}
              .options=${this.presetOptions(kind)}
              .value=${selectedId}
              ?disabled=${this.loading}
              @value-change=${(event: CustomEvent<{ value: string }>) =>
                this.handlePresetSelection(kind, event)}
            ></hud-select>
            <hud-icon-button
              label=${`Save current ${noun} preset`}
              title=${`Save current ${noun} preset`}
              ?disabled=${this.loading}
              @click=${() => this.saveCurrentPreset(kind)}
            >
              ${renderLucideIcon(Save, "control-icon")}
            </hud-icon-button>
            <hud-icon-button
              label=${`Apply ${noun} preset`}
              title=${`Apply ${noun} preset`}
              ?disabled=${this.loading || !selected}
              @click=${() => this.applySelectedPreset(kind)}
            >
              ${renderLucideIcon(Upload, "control-icon")}
            </hud-icon-button>
            <hud-icon-button
              label=${`Delete ${noun} preset`}
              title=${`Delete ${noun} preset`}
              variant="danger"
              ?disabled=${this.loading || !selected}
              @click=${() => this.deleteSelectedPreset(kind)}
            >
              ${renderLucideIcon(Trash2, "control-icon")}
            </hud-icon-button>
          </div>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderPresetTableRow(
    kind: FoundationPresetKind,
    label: string,
  ): TemplateResult {
    const selectedId = this.selectedPresetId(kind);
    const selected = this.selectedPreset(kind);
    const noun = presetActionNoun(kind);
    return html`
      <div class="control-row" role="row">
        <span class="control-name" role="cell">${label}</span>
        <span class="control-widget" role="cell">
          <span class="preset-inline-tools">
            <hud-select
              data-preset-kind=${kind}
              .options=${this.presetOptions(kind)}
              .value=${selectedId}
              ?disabled=${this.loading}
              @value-change=${(event: CustomEvent<{ value: string }>) =>
                this.handlePresetSelection(kind, event)}
            ></hud-select>
            <hud-icon-button
              label=${`Save current ${noun} preset`}
              title=${`Save current ${noun} preset`}
              ?disabled=${this.loading}
              @click=${() => this.saveCurrentPreset(kind)}
            >
              ${renderLucideIcon(Save, "control-icon")}
            </hud-icon-button>
            <hud-icon-button
              label=${`Apply ${noun} preset`}
              title=${`Apply ${noun} preset`}
              ?disabled=${this.loading || !selected}
              @click=${() => this.applySelectedPreset(kind)}
            >
              ${renderLucideIcon(Upload, "control-icon")}
            </hud-icon-button>
            <hud-icon-button
              label=${`Delete ${noun} preset`}
              title=${`Delete ${noun} preset`}
              variant="danger"
              ?disabled=${this.loading || !selected}
              @click=${() => this.deleteSelectedPreset(kind)}
            >
              ${renderLucideIcon(Trash2, "control-icon")}
            </hud-icon-button>
          </span>
        </span>
      </div>
    `;
  }

  private presetOptions(kind: FoundationPresetKind): HudSelectOption[] {
    const presets = this.presetsForKind(kind);
    if (presets.length === 0) {
      return [
        {
          label: "No presets saved",
          value: "",
          disabled: true,
        },
      ];
    }
    return [
      {
        label: "Select preset...",
        value: "",
        disabled: true,
      },
      ...presets.map((preset) => ({
        label: preset.name,
        value: preset.id,
      })),
    ];
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
            @blur=${() => this.commitNumberInput(key)}
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
              @blur=${() => this.commitNumberInput("seed")}
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

  private logRangeInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
  ) {
    const value = Math.max(
      min,
      Math.min(max, Number(this.tuningSettings[key])),
    );
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logValue = Math.log10(value);
    return html`
      <div class="control-row" role="row">
        ${this.renderControlName(label, key)}
        <span class="control-widget" role="cell">
          <span class="slider-value-control">
            <hud-range
              label=${label}
              .min=${logMin}
              .max=${logMax}
              .step=${step}
              .value=${logValue}
              ?disabled=${this.loading}
              @value-change=${(event: CustomEvent<{ value: number }>) =>
                this.handleLogRangeValue(event, key)}
              @pointerup=${() => this.handleControlCommit(key)}
              @keyup=${(event: KeyboardEvent) =>
                this.handleRangeKeyup(event, key)}
            ></hud-range>
            <span class="slider-value-text">
              ${formatControlValue(
                value,
                value < 0.01 ? 3 : value < 10 ? 2 : 1,
              )}
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
    this.commitNumberInputDrafts([key], {
      generateOnCommit: true,
      forceGenerateOnCommit: true,
    });
  }

  private commitNumberInputDrafts(
    keys?: Iterable<keyof FoundationTuningSettings>,
    options: FoundationUpdateSettingsOptions = {},
  ): void {
    const draftKeys =
      keys ??
      (Object.keys(this.inputDrafts) as (keyof FoundationTuningSettings)[]);
    const nextDrafts = { ...this.inputDrafts };
    const patch: Partial<FoundationTuningSettings> = {};

    for (const key of draftKeys) {
      const draft = this.inputDrafts[key];
      if (draft === undefined) continue;
      const value = Number(draft);
      if (!Number.isFinite(value)) continue;
      delete nextDrafts[key];
      Object.assign(patch, { [key]: value });
    }

    if (Object.keys(patch).length === 0) return;
    this.inputDrafts = nextDrafts;
    this.updateSettings(patch, options);
  }

  private handleNumberValue(
    event: CustomEvent<{ value: string | number }>,
    key: keyof FoundationTuningSettings,
  ): void {
    this.updateSettings({
      [key]: Number(event.detail.value),
    });
  }

  private handleLogRangeValue(
    event: CustomEvent<{ value: number }>,
    key: keyof FoundationTuningSettings,
  ): void {
    this.updateSettings({
      [key]: 10 ** Number(event.detail.value),
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
    void this.generateWorld("Generated world with current parameters.", {
      force: true,
    });
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
    options: FoundationUpdateSettingsOptions = {},
  ): void {
    const changedKeys = (
      Object.keys(patch) as (keyof FoundationTuningSettings)[]
    ).filter((key) => this.tuningSettings[key] !== patch[key]);
    this.tuningSettings = normalizeFoundationTuningSettings({
      ...this.tuningSettings,
      ...patch,
    });
    saveFoundationTuningSettings(this.tuningSettings);
    this.configureTickTimer();
    this.runtime?.updateParameters(this.tuningSettings);
    const requiresRestart = changedKeys.some((key) =>
      FOUNDATION_RESTART_SETTING_KEYS.has(key),
    );
    this.status = {
      tone: "idle",
      text: requiresRestart
        ? this.restartSettingStatusText()
        : "Mechanics applied to the running simulation.",
    };

    if (!options.generateOnCommit) {
      return;
    }
    if (!changedKeys.some((key) => FOUNDATION_MAP_SETTING_KEYS.has(key))) {
      return;
    }
    if (options.forceGenerateOnCommit) {
      void this.generateWorld("Generated world with current parameters.", {
        force: true,
      });
      return;
    }
    void this.maybeAutoGenerateWorld();
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
      this.clearVectorOverlay();
      return;
    }

    const map = this.runtime.map();
    const originX = preview.originX;
    const originY = preview.originY;
    const targetX = map.x(preview.targetTile) + 0.5;
    const targetY = map.y(preview.targetTile) + 0.5;
    const rawDx = targetX - originX;
    const rawDy = targetY - originY;
    const distance = Math.hypot(rawDx, rawDy);
    if (distance <= 0) {
      this.renderer.setDirectionalBorderIntent(null);
      this.clearVectorOverlay();
      return;
    }

    this.renderer.setDirectionalBorderIntent({
      ownerId: this.runtime.player().ownerId,
      originX,
      originY,
      directionX: rawDx / distance,
      directionY: rawDy / distance,
      distance,
      sharpness: 1,
      heatMap: this.createDirectionalBorderHeatMap(preview),
    });
    this.drawDistanceVectorOverlay(preview);
  }

  private createDirectionalBorderHeatMap(
    preview: FoundationDirectionalBorderPreview,
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
    if (borderTiles.size === 0) {
      return heatMap;
    }

    let totalWeight = 0;
    const weights = new Map<number, number>();
    const distances = new Map<number, number>();
    let minDistance = Number.POSITIVE_INFINITY;
    const targetX = map.x(preview.targetTile);
    const targetY = map.y(preview.targetTile);
    for (const tile of borderTiles) {
      const dx = map.x(tile) - targetX;
      const dy = map.y(tile) - targetY;
      const distance = Math.hypot(dx, dy);
      distances.set(tile, distance);
      minDistance = Math.min(minDistance, distance);
    }

    for (const tile of borderTiles) {
      const weight = distanceFrontWeight(
        distances.get(tile) ?? 0,
        this.tuningSettings.wildernessDistanceFocus,
        minDistance,
      );
      weights.set(tile, weight);
      totalWeight += weight;
    }
    if (totalWeight <= 0) {
      return heatMap;
    }

    const meanShare = 1 / borderTiles.size;
    for (const tile of borderTiles) {
      const share = (weights.get(tile) ?? 0) / totalWeight;
      heatMap[tile] = Math.round(
        quantizeBorderHeat(shareToMeanCenteredHeat(share, meanShare)) * 255,
      );
    }

    return heatMap;
  }

  private drawDistanceVectorOverlay(
    preview: FoundationDirectionalBorderPreview | null,
  ): void {
    if (!preview) {
      this.clearVectorOverlay();
      return;
    }

    const runtime = this.runtime;
    const renderer = this.renderer;
    const overlay = this.vectorOverlayCanvas;
    const canvas = this.canvas;
    if (!runtime || !renderer || !overlay || !canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
    const pixelHeight = Math.max(1, Math.round(rect.height * dpr));
    if (overlay.width !== pixelWidth || overlay.height !== pixelHeight) {
      overlay.width = pixelWidth;
      overlay.height = pixelHeight;
    }

    const context = overlay.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, overlay.width, overlay.height);
    context.save();
    context.scale(dpr, dpr);

    const map = runtime.map();
    const placement = runtime.player().placement;
    if (!placement) {
      context.restore();
      return;
    }

    const target = this.worldToOverlayScreen(
      map.x(preview.targetTile) + 0.5,
      map.y(preview.targetTile) + 0.5,
      rect,
    );
    const weightedTiles: { tile: number; weight: number }[] = [];
    const distances = new Map<number, number>();
    let totalWeight = 0;
    let minDistance = Number.POSITIVE_INFINITY;
    const targetX = map.x(preview.targetTile);
    const targetY = map.y(preview.targetTile);

    for (const tile of placement.claimedTiles) {
      if (!this.isOwnedBorderTile(tile)) {
        continue;
      }

      const dx = map.x(tile) - targetX;
      const dy = map.y(tile) - targetY;
      const distance = Math.hypot(dx, dy);
      distances.set(tile, distance);
      minDistance = Math.min(minDistance, distance);
    }

    for (const tile of placement.claimedTiles) {
      if (!this.isOwnedBorderTile(tile)) {
        continue;
      }

      const weight = distanceFrontWeight(
        distances.get(tile) ?? 0,
        this.tuningSettings.wildernessDistanceFocus,
        minDistance,
      );
      weightedTiles.push({ tile, weight });
      totalWeight += weight;
    }

    if (weightedTiles.length === 0 || totalWeight <= 0) {
      context.restore();
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    let maxShare = 0;
    const shares = weightedTiles.map(({ weight }) => {
      const share = weight / totalWeight;
      maxShare = Math.max(maxShare, share);
      return share;
    });
    if (maxShare <= 0) {
      context.restore();
      return;
    }

    const targetWorldX = targetX + 0.5;
    const targetWorldY = targetY + 0.5;
    let centroidWorldX = 0;
    let centroidWorldY = 0;
    let centroidTileCount = 0;
    for (let i = 0; i < weightedTiles.length; i++) {
      const { tile } = weightedTiles[i];
      const share = shares[i];
      const relativeShare = share / maxShare;
      centroidWorldX += map.x(tile) + 0.5;
      centroidWorldY += map.y(tile) + 0.5;
      centroidTileCount++;
      const start = this.worldToOverlayScreen(
        map.x(tile) + 0.5,
        map.y(tile) + 0.5,
        rect,
      );
      const alpha = clampFoundationNumber(
        FOUNDATION_VECTOR_LINE_BASE_ALPHA +
          relativeShare * FOUNDATION_VECTOR_LINE_WEIGHT_ALPHA,
        0.025,
        0.28,
      );
      context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      context.lineWidth = clampFoundationNumber(
        0.75 + relativeShare * 1.25,
        0.75,
        2,
      );
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(target.x, target.y);
      context.stroke();
    }

    if (centroidTileCount === 0) {
      context.restore();
      return;
    }

    const averageStartWorldX = centroidWorldX / centroidTileCount;
    const averageStartWorldY = centroidWorldY / centroidTileCount;
    const averageDx = targetWorldX - averageStartWorldX;
    const averageDy = targetWorldY - averageStartWorldY;
    if (Math.hypot(averageDx, averageDy) > 0.001) {
      const averageStart = this.worldToOverlayScreen(
        averageStartWorldX,
        averageStartWorldY,
        rect,
      );
      const averageEnd = this.worldToOverlayScreen(
        targetWorldX + averageDx * 0.25,
        targetWorldY + averageDy * 0.25,
        rect,
      );

      context.strokeStyle = "rgba(5, 7, 8, 0.88)";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(averageStart.x, averageStart.y);
      context.lineTo(averageEnd.x, averageEnd.y);
      context.stroke();

      context.strokeStyle = "rgba(74, 222, 255, 0.95)";
      context.lineWidth = 2.5;
      context.beginPath();
      context.moveTo(averageStart.x, averageStart.y);
      context.lineTo(averageEnd.x, averageEnd.y);
      context.stroke();
    }

    context.fillStyle = "rgba(255, 255, 255, 0.95)";
    context.strokeStyle = "rgba(5, 7, 8, 0.85)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(target.x, target.y, 4, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  private worldToOverlayScreen(
    worldX: number,
    worldY: number,
    rect: DOMRect,
  ): { x: number; y: number } {
    const camera = this.renderer?.getCameraState();
    if (!camera) {
      return { x: 0, y: 0 };
    }

    const dpr = window.devicePixelRatio || 1;
    return {
      x: (camera.zoom * (worldX - camera.x)) / dpr + rect.width / 2,
      y: (camera.zoom * (worldY - camera.y)) / dpr + rect.height / 2,
    };
  }

  private clearVectorOverlay(): void {
    const overlay = this.vectorOverlayCanvas;
    if (!overlay) {
      return;
    }

    const context = overlay.getContext("2d");
    context?.clearRect(0, 0, overlay.width, overlay.height);
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
      this.directionalBorderPreview.originX === preview.originX &&
      this.directionalBorderPreview.originY === preview.originY &&
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

    const origin = this.averageOwnedBorderOrigin();
    if (origin === null) {
      return null;
    }

    return {
      originTile: origin.tile,
      originX: origin.x,
      originY: origin.y,
      targetTile,
    };
  }

  private averageOwnedBorderOrigin(): {
    tile: number;
    x: number;
    y: number;
  } | null {
    if (!this.runtime) {
      return null;
    }

    const map = this.runtime.map();
    const player = this.runtime.player();
    const placement = player.placement;
    if (!placement) {
      return null;
    }

    let totalX = 0;
    let totalY = 0;
    let count = 0;

    for (const tile of placement.claimedTiles) {
      if (!this.isOwnedBorderTile(tile)) {
        continue;
      }

      totalX += map.x(tile) + 0.5;
      totalY += map.y(tile) + 0.5;
      count++;
    }

    if (count === 0) {
      return {
        tile: placement.selectedTile,
        x: map.x(placement.selectedTile) + 0.5,
        y: map.y(placement.selectedTile) + 0.5,
      };
    }

    const x = totalX / count;
    const y = totalY / count;
    return {
      tile: this.closestOwnedTileToPoint(x, y) ?? placement.selectedTile,
      x,
      y,
    };
  }

  private closestOwnedTileToPoint(x: number, y: number): number | null {
    if (!this.runtime) {
      return null;
    }

    const map = this.runtime.map();
    const placement = this.runtime.player().placement;
    if (!placement) {
      return null;
    }

    let closestTile: number | null = null;
    let closestDistanceSq = Number.POSITIVE_INFINITY;

    for (const tile of placement.claimedTiles) {
      const dx = map.x(tile) + 0.5 - x;
      const dy = map.y(tile) + 0.5 - y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < closestDistanceSq) {
        closestTile = tile;
        closestDistanceSq = distanceSq;
      }
    }

    return closestTile;
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

    let border = false;
    this.forEachCardinalNeighbor(tile, (neighbor) => {
      if (
        !border &&
        isFoundationLandTerrainByte(map.terrainBuffer()[neighbor]) &&
        ownerIdFromState(map.stateBuffer()[neighbor]) !== player.ownerId
      ) {
        border = true;
      }
    });
    return border;
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
    this.clearVectorOverlay();
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
    this.drawDistanceVectorOverlay(this.directionalBorderPreview);
    this.requestUpdate();
  }

  private resetRuntime(
    statusText: string,
    foundationMap: FoundationPreparedMap,
  ): void {
    this.directionalBorderPreview = null;
    this.activeBuildPlacementItem = null;
    this.buildPlacementTileRef = null;
    this.placedBuildings = [];
    this.updateDirectionalBorderIntent(null);
    this.clearVectorOverlay();
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

function formatFoodDelta(
  surplus: number | undefined,
  deficit: number | undefined,
): string {
  const foodSurplus = surplus ?? 0;
  const foodDeficit = deficit ?? 0;
  if (foodDeficit > 0) {
    return `-${renderTroops(foodDeficit)}/tick`;
  }
  return `+${renderTroops(foodSurplus)}/tick`;
}

function formatFoodStock(
  stock: number | undefined,
  capacity: number | undefined,
): string {
  return `${renderTroops(stock ?? 0)} / ${renderTroops(capacity ?? 0)}`;
}

function formatFoodStockFlow(
  snapshot: FoundationRuntimeSnapshot | null,
): string {
  const delta = snapshot?.player.foodStockDelta ?? 0;
  const overflow = snapshot?.player.foodStockOverflow ?? 0;
  if (overflow > 0) {
    return `${formatSignedFood(delta)}, ${renderTroops(overflow)} lost`;
  }
  return formatSignedFood(delta);
}

function formatSignedFood(value: number): string {
  if (value < 0) {
    return `-${renderTroops(Math.abs(value))}`;
  }
  return `+${renderTroops(value)}`;
}

function formatControlValue(value: number, precision: number): string {
  return precision === 0
    ? Math.round(value).toLocaleString()
    : value.toFixed(precision);
}

function presetPatch(
  current: FoundationTuningSettings,
  next: FoundationTuningSettings,
): Partial<FoundationTuningSettings> {
  const patch: Partial<FoundationTuningSettings> = {};
  for (const key of Object.keys(next) as (keyof FoundationTuningSettings)[]) {
    if (current[key] !== next[key]) {
      Object.assign(patch, { [key]: next[key] });
    }
  }
  return patch;
}

function presetPromptLabel(kind: FoundationPresetKind): string {
  if (kind === "world-generation") return "Generation preset name";
  if (kind === "world-map") return "Saved map name";
  return "Game mechanic preset name";
}

function defaultPresetName(kind: FoundationPresetKind): string {
  if (kind === "world-generation") return "Generation preset";
  if (kind === "world-map") return "Saved map";
  return "Mechanic preset";
}

function presetStatusLabel(kind: FoundationPresetKind): string {
  if (kind === "world-generation") return "Generation preset";
  if (kind === "world-map") return "Saved map";
  return "Game mechanic preset";
}

function presetActionNoun(kind: FoundationPresetKind): string {
  if (kind === "world-generation") return "generation";
  if (kind === "world-map") return "map";
  return "mechanic";
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

function quantizeBorderHeat(heat: number): number {
  const clamped = clampFoundationNumber(heat, 0, 1);
  return (
    Math.round(clamped * FOUNDATION_BORDER_HEAT_BUCKETS) /
    FOUNDATION_BORDER_HEAT_BUCKETS
  );
}

function shareToMeanCenteredHeat(share: number, meanShare: number): number {
  if (
    !Number.isFinite(share) ||
    share <= 0 ||
    !Number.isFinite(meanShare) ||
    meanShare <= 0
  ) {
    return 0;
  }

  if (share <= meanShare) {
    return 0.5 * (share / meanShare);
  }

  if (meanShare >= 1) {
    return 1;
  }

  return 0.5 + (0.5 * (share - meanShare)) / (1 - meanShare);
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
