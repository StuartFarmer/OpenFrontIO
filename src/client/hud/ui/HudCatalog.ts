export type HudCatalogStatus =
  | "stable"
  | "draft"
  | "legacy"
  | "needs-catalog"
  | "deprecated";

export type HudCatalogCategory =
  | "foundation"
  | "atom"
  | "control"
  | "indicator"
  | "row"
  | "surface"
  | "overlay"
  | "feedback"
  | "menu"
  | "recipe"
  | "internal";

export interface HudCatalogApiField {
  name: string;
  type: string;
  description: string;
}

export interface HudCatalogEntry {
  name: string;
  tagName?: string;
  category: HudCatalogCategory;
  status: HudCatalogStatus;
  sourcePath: string;
  summary: string;
  props?: HudCatalogApiField[];
  attributes?: HudCatalogApiField[];
  slots?: HudCatalogApiField[];
  events?: HudCatalogApiField[];
  states?: string[];
  cssVars?: HudCatalogApiField[];
  examples: string[];
  migrationNotes?: string;
}

export interface HudIconCatalogEntry {
  name: string;
  assetPath: string;
  kind: "image" | "mask";
  usage: string;
  preferredSize: "sm" | "md" | "lg" | "xl";
  toneCompatible: boolean;
}

export const hudCatalogStatuses: HudCatalogStatus[] = [
  "stable",
  "draft",
  "legacy",
  "needs-catalog",
  "deprecated",
];

export const hudCatalogCategories: HudCatalogCategory[] = [
  "foundation",
  "atom",
  "control",
  "indicator",
  "row",
  "surface",
  "overlay",
  "feedback",
  "menu",
  "recipe",
  "internal",
];

const hudComponentsPath = "src/client/hud/ui/HudComponents.ts";

const valueChangeEvent = {
  name: "value-change",
  type: "CustomEvent<{ value: string | number }>",
  description: "Emitted when a control value changes.",
};

const defaultSlot = {
  name: "default",
  type: "slot",
  description: "Primary slotted content.",
};

export const hudIconCatalog: HudIconCatalogEntry[] = [
  {
    name: "Troops",
    assetPath: "images/SoldierIcon.svg",
    kind: "image",
    usage: "Troop counts, troop rates, troop capacity.",
    preferredSize: "sm",
    toneCompatible: true,
  },
  {
    name: "Sword",
    assetPath: "images/SwordIcon.svg",
    kind: "image",
    usage: "Attack actions, attack rows, attack ratio controls.",
    preferredSize: "sm",
    toneCompatible: true,
  },
  {
    name: "Gold",
    assetPath: "images/GoldCoinIcon.svg",
    kind: "image",
    usage: "Gold totals, economy pills, trade feedback.",
    preferredSize: "sm",
    toneCompatible: false,
  },
  {
    name: "Biomass",
    assetPath: "icons/biomass-icon.svg",
    kind: "mask",
    usage: "Food/biomass resource controls and blend labels.",
    preferredSize: "sm",
    toneCompatible: true,
  },
  {
    name: "Fuels",
    assetPath: "icons/fuel-icon.svg",
    kind: "mask",
    usage: "Energy/fuels resource controls and blend labels.",
    preferredSize: "sm",
    toneCompatible: true,
  },
  {
    name: "Metals",
    assetPath: "icons/metal-icon.svg",
    kind: "mask",
    usage: "Materials/metals resource controls and blend labels.",
    preferredSize: "sm",
    toneCompatible: true,
  },
  {
    name: "Settings",
    assetPath: "images/SettingIconWhite.svg",
    kind: "image",
    usage: "Toolbar command for settings and preferences.",
    preferredSize: "md",
    toneCompatible: true,
  },
  {
    name: "Close",
    assetPath: "images/XIcon.svg",
    kind: "image",
    usage: "Dismiss, close, cancel, and destructive compact actions.",
    preferredSize: "sm",
    toneCompatible: true,
  },
  {
    name: "Leaderboard",
    assetPath: "images/LeaderboardIconSolidWhite.svg",
    kind: "image",
    usage: "Leaderboard toolbar buttons and menu items.",
    preferredSize: "md",
    toneCompatible: true,
  },
  {
    name: "Chat",
    assetPath: "images/ChatIconWhite.svg",
    kind: "image",
    usage: "Chat feed, chat modal, and chat filter controls.",
    preferredSize: "md",
    toneCompatible: true,
  },
];

export const hudCatalogEntries: HudCatalogEntry[] = [
  {
    name: "HUD Tokens",
    category: "foundation",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary:
      "Shared tone names, sizing, radius, typography, density, and numeric formatting conventions.",
    examples: ["foundation-tokens"],
    migrationNotes:
      "Use these tokens before adding ad hoc color, radius, or density values to live HUD layers.",
  },
  {
    name: "Icon Registry",
    category: "foundation",
    status: "draft",
    sourcePath: "src/client/hud/ui/HudCatalog.ts",
    summary: "Named HUD icon assets with intended usage and tone behavior.",
    examples: ["icon-registry"],
  },
  {
    name: "Icon",
    tagName: "hud-icon",
    category: "atom",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Image icon with HUD sizing and semantic tone support.",
    attributes: [
      { name: "src", type: "string", description: "Image asset URL." },
      { name: "size", type: "sm | md | lg | xl", description: "Icon size." },
      { name: "tone", type: "HudAtomTone", description: "Semantic color." },
    ],
    examples: ["icon-sizes", "icon-tones", "icon-gallery"],
  },
  {
    name: "Mask Icon",
    tagName: "hud-mask-icon",
    category: "atom",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Monochrome masked icon that inherits current text color.",
    attributes: [
      { name: "src", type: "string", description: "Mask asset URL." },
      {
        name: "size",
        type: "string",
        description: "Tailwind-like size token mapped to pixels.",
      },
    ],
    examples: ["resource-mask-icons"],
  },
  {
    name: "Label",
    tagName: "hud-label",
    category: "atom",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Compact text label with HUD tone support.",
    slots: [defaultSlot],
    attributes: [
      { name: "tone", type: "HudAtomTone", description: "Semantic color." },
    ],
    examples: ["label-tones"],
  },
  {
    name: "Number",
    tagName: "hud-number",
    category: "atom",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Tabular numeric value with optional compact formatting.",
    attributes: [
      { name: "value", type: "number | string", description: "Value to show." },
      { name: "format", type: "boolean", description: "Use compact units." },
    ],
    examples: ["number-formatting"],
  },
  {
    name: "Color Swatch",
    tagName: "hud-color-swatch",
    category: "atom",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Tiny color/tone preview used by catalog and settings surfaces.",
    examples: ["color-swatches"],
  },
  {
    name: "Timer Label",
    tagName: "hud-timer-label",
    category: "atom",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Compact timer display for toolbar contexts.",
    examples: ["toolbar-timer"],
  },
  {
    name: "Button",
    tagName: "hud-button",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Compact text command button.",
    slots: [defaultSlot],
    states: ["default", "active", "danger", "disabled", "focus"],
    examples: ["button-variants"],
  },
  {
    name: "Icon Button",
    tagName: "hud-icon-button",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Icon-only command button with an accessible label.",
    slots: [defaultSlot],
    attributes: [
      { name: "label", type: "string", description: "Accessible label." },
    ],
    examples: ["icon-button-toolbar"],
  },
  {
    name: "Action Group",
    tagName: "hud-action-group",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Inline group for compact commands.",
    slots: [defaultSlot],
    examples: ["event-actions"],
  },
  {
    name: "Toolbar",
    tagName: "hud-toolbar",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Horizontal toolbar shell for icon and text controls.",
    slots: [defaultSlot],
    examples: ["compact-toolbar"],
  },
  {
    name: "Input",
    tagName: "hud-input",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Compact HUD text input.",
    events: [valueChangeEvent],
    examples: ["form-controls"],
  },
  {
    name: "Select",
    tagName: "hud-select",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Compact HUD select control.",
    props: [
      {
        name: "options",
        type: "HudSelectOption[]",
        description: "Options rendered by the control.",
      },
    ],
    events: [valueChangeEvent],
    examples: ["form-controls"],
  },
  {
    name: "Range",
    tagName: "hud-range",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Single-value range input.",
    events: [valueChangeEvent],
    examples: ["range-controls"],
  },
  {
    name: "Dual Range",
    tagName: "hud-dual-range",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Two-handle percentage range.",
    events: [
      {
        name: "range-change",
        type: "CustomEvent<{ start: number; end: number; changed: string }>",
        description: "Emitted when either handle changes.",
      },
    ],
    examples: ["dual-range"],
  },
  {
    name: "Blend Slider",
    tagName: "hud-blend-slider",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Three-segment resource blend slider.",
    events: [
      {
        name: "blend-change",
        type: "CustomEvent<{ first: number; second: number; changed: string }>",
        description: "Emitted when either blend handle changes.",
      },
    ],
    examples: ["blend-slider"],
  },
  {
    name: "Segmented Control",
    tagName: "hud-segmented-control",
    category: "control",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Button-group selector for compact mode and metric changes.",
    events: [
      {
        name: "selection-change",
        type: "CustomEvent<{ id: string }>",
        description: "Emitted when a new segment is selected.",
      },
    ],
    examples: ["segmented-control"],
  },
  {
    name: "Tabs",
    tagName: "hud-tabs",
    category: "control",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary:
      "Tab-list wrapper for compact panel switching; uses the same item model as segmented controls.",
    events: [
      {
        name: "selection-change",
        type: "CustomEvent<{ id: string }>",
        description: "Emitted when a tab is selected.",
      },
    ],
    examples: ["tabs-control"],
  },
  {
    name: "Command Choice",
    tagName: "hud-command-choice",
    category: "control",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Generic selectable command item with icon, label, and meta slots.",
    slots: [
      defaultSlot,
      { name: "icon", type: "slot", description: "Leading icon." },
      { name: "meta", type: "slot", description: "Trailing status or count." },
    ],
    states: ["default", "selected", "disabled", "locked"],
    examples: ["command-choice"],
  },
  {
    name: "Pill",
    tagName: "hud-pill",
    category: "indicator",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Semantic chip for counts, statuses, and rates.",
    examples: ["pill-tones"],
  },
  {
    name: "Meter",
    tagName: "hud-meter",
    category: "indicator",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Single, stacked, or mini progress meter.",
    props: [
      {
        name: "segments",
        type: "HudMeterSegment[]",
        description: "Segment widths and tones.",
      },
    ],
    examples: ["meter-variants"],
  },
  {
    name: "Stat Grid",
    tagName: "hud-stat-grid",
    category: "indicator",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Dense metric grid for panel summaries.",
    examples: ["stat-grid"],
  },
  {
    name: "Stat",
    tagName: "hud-stat",
    category: "indicator",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Label/value metric cell.",
    examples: ["stat-grid"],
  },
  {
    name: "Table",
    tagName: "hud-table",
    category: "row",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Compact aligned table shell.",
    examples: ["compact-table"],
  },
  {
    name: "List Row",
    tagName: "hud-list-row",
    category: "row",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Generic dense row with leading, content, meta, and actions slots.",
    slots: [
      { name: "leading", type: "slot", description: "Leading icon or rank." },
      defaultSlot,
      { name: "meta", type: "slot", description: "Trailing metadata." },
      { name: "actions", type: "slot", description: "Trailing commands." },
    ],
    examples: ["list-row"],
  },
  {
    name: "Event Row",
    tagName: "hud-event-row",
    category: "row",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Feed row with meta, text, and actions.",
    examples: ["event-row"],
  },
  {
    name: "Attack Row",
    tagName: "hud-attack-row",
    category: "row",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Attack feed row with icons, amount, label, and action slot.",
    examples: ["attack-row"],
  },
  {
    name: "Player Identity",
    tagName: "hud-player-identity",
    category: "row",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Media-object-style identity row for player name and team info.",
    examples: ["player-identity"],
  },
  {
    name: "Surface",
    tagName: "hud-surface",
    category: "surface",
    status: "stable",
    sourcePath: hudComponentsPath,
    summary: "Panel shell with standard HUD radius and background.",
    slots: [defaultSlot],
    examples: ["surface-shell"],
  },
  {
    name: "Surface Footer",
    tagName: "hud-surface-footer",
    category: "surface",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Footer slot for surface action rows.",
    slots: [defaultSlot],
    examples: ["surface-footer"],
  },
  {
    name: "Layout Helpers",
    category: "surface",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Stack, row, grid, split, scroll, and safe-area composition helpers.",
    examples: ["layout-helpers"],
  },
  {
    name: "Empty State",
    tagName: "hud-empty-state",
    category: "surface",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Reusable empty/unavailable state for panel bodies.",
    examples: ["empty-loading-states"],
  },
  {
    name: "Loading State",
    tagName: "hud-loading-state",
    category: "surface",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Reusable loading state for panel bodies.",
    examples: ["empty-loading-states"],
  },
  {
    name: "Modal Shell",
    tagName: "hud-modal-shell",
    category: "overlay",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Reusable modal shell with backdrop and content slots.",
    slots: [defaultSlot],
    events: [
      {
        name: "dismiss",
        type: "CustomEvent<void>",
        description: "Emitted when backdrop or escape dismissal is requested.",
      },
    ],
    examples: ["modal-shell"],
  },
  {
    name: "Popover",
    tagName: "hud-popover",
    category: "overlay",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Small contextual overlay shell.",
    examples: ["popover-shell"],
  },
  {
    name: "Alert",
    tagName: "hud-alert",
    category: "feedback",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Persistent inline feedback block with tone and actions.",
    examples: ["feedback-alerts"],
  },
  {
    name: "Toast",
    tagName: "hud-toast",
    category: "feedback",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Compact transient feedback shell.",
    examples: ["feedback-toasts"],
  },
  {
    name: "Confirm Actions",
    tagName: "hud-confirm-actions",
    category: "feedback",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Small primary/secondary/destructive action row.",
    examples: ["confirm-actions"],
  },
  {
    name: "Menu",
    tagName: "hud-menu",
    category: "menu",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Dropdown-style command list shell.",
    examples: ["menu-dropdown"],
  },
  {
    name: "Menu Item",
    tagName: "hud-menu-item",
    category: "menu",
    status: "draft",
    sourcePath: hudComponentsPath,
    summary: "Single menu command row with icon, label, and meta slots.",
    examples: ["menu-dropdown"],
  },
  {
    name: "Composition Recipes",
    category: "recipe",
    status: "draft",
    sourcePath: "src/client/hud/demo/HudPanelWorkbench.ts",
    summary:
      "Small copyable recipes built only from catalog elements, not finished live composites.",
    examples: [
      "resource-control-row",
      "compact-toolbar",
      "modal-action-footer",
      "feed-row-actions",
    ],
  },
];

export function hudCatalogEntriesByCategory(category: HudCatalogCategory) {
  return hudCatalogEntries.filter((entry) => entry.category === category);
}

export function hudCatalogEntriesWithTagName() {
  return hudCatalogEntries.filter(
    (entry): entry is HudCatalogEntry & { tagName: string } =>
      entry.tagName !== undefined,
  );
}
