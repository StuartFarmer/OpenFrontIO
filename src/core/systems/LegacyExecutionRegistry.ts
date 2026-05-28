export type LegacyExecutionStatus =
  | "system-owned"
  | "compatibility-shim"
  | "retained-engine";

export interface LegacyExecutionRecord {
  readonly family: string;
  readonly status: LegacyExecutionStatus;
  readonly executions: readonly string[];
  readonly systemOwner?: string;
  readonly reason: string;
}

export const LEGACY_EXECUTION_REGISTRY: readonly LegacyExecutionRecord[] = [
  {
    family: "player-economy-upkeep",
    status: "system-owned",
    executions: ["PlayerExecution"],
    systemOwner: "PlayerEconomySystem, PlayerUpkeepSystem",
    reason:
      "PlayerExecution is retained as the compatibility entry point while economy and upkeep calculations are delegated to native systems.",
  },
  {
    family: "attack-territory-conquest",
    status: "system-owned",
    executions: ["AttackExecution"],
    systemOwner:
      "AttackCommandSystem, BattleResolutionSystem, TerritoryConquestSystem",
    reason:
      "AttackExecution is retained for client/API compatibility and delegates attack setup, battle resolution, and conquest behavior to systems.",
  },
  {
    family: "structures",
    status: "system-owned",
    executions: [
      "ConstructionExecution",
      "UpgradeStructureExecution",
      "CityExecution",
      "PortExecution",
      "RailStationExecution",
      "MissileSiloExecution",
      "DefensePostExecution",
      "SAMLauncherExecution",
    ],
    systemOwner: "StructureSystem",
    reason:
      "Construction and structure lifecycle entry points remain legacy-compatible while construction costs, activation, upgrades, and structure side effects are system-owned.",
  },
  {
    family: "mobile-units",
    status: "system-owned",
    executions: [
      "MoveWarshipExecution",
      "TransportShipExecution",
      "TradeShipExecution",
      "TrainExecution",
      "TrainStationExecution",
      "WarshipExecution",
    ],
    systemOwner: "MobileUnitSystem",
    reason:
      "Movement setup and lifecycle helpers are delegated to MobileUnitSystem; long-lived per-unit engines remain retained until full unit schedulers replace them.",
  },
  {
    family: "projectiles",
    status: "system-owned",
    executions: ["NukeExecution", "MirvExecution", "ShellExecution"],
    systemOwner: "ProjectileSystem",
    reason:
      "Projectile creation, motion, and cleanup helper behavior is system-owned; MIRV warhead fanout remains an intentional compatibility shim.",
  },
  {
    family: "client-command-surface",
    status: "compatibility-shim",
    executions: [
      "IntentCommandSurface",
      "AiCommandSurface",
      "ExecutionManager",
    ],
    reason:
      "Client, AI, tribe, and nation commands are normalized through command surfaces that preserve legacy execution payloads and tick ordering.",
  },
  {
    family: "spawn-and-simulation-lifecycle",
    status: "retained-engine",
    executions: [
      "SpawnExecution",
      "SpawnTimerExecution",
      "NationExecution",
      "TribeExecution",
      "WinCheckExecution",
      "RecomputeRailClusterExecution",
    ],
    reason:
      "Lifecycle executions are intentionally retained pending dedicated spawn, AI, and game-rule systems.",
  },
  {
    family: "social-and-display-actions",
    status: "retained-engine",
    executions: [
      "AllianceRequestExecution",
      "AllianceExtensionExecution",
      "AllianceRejectExecution",
      "BreakAllianceExecution",
      "DonateGoldExecution",
      "DonateTroopsExecution",
      "EmojiExecution",
      "EmbargoExecution",
      "EmbargoAllExecution",
      "QuickChatExecution",
      "TargetPlayerExecution",
      "PauseExecution",
      "MarkDisconnectedExecution",
      "DeleteUnitExecution",
    ],
    reason:
      "These remain direct compatibility actions with no duplicate native system owner yet.",
  },
];
