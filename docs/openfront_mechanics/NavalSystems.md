# Naval Systems

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Naval mechanics cover transport ships, boat attacks, ports, trade ships, warships, shells, retreat, docking, and healing.

## Transport Ships

Transport ships use `TransportShipExecution` and carry troops plus a target tile. Boat attack troop amount defaults to `floor(attacker.troops() / 5)` through `Config.boatAttackAmount()`.

Transport ships are player-buildable but have cost 0 in `Config.unitInfo()`; their real cost is committed troops.

## Warship Target Priority

`WarshipExecution` chooses targets in this order:

1. Shoot transport ships in range (`WarshipExecution.ts:100`).
2. Fight enemy warships in range (`WarshipExecution.ts:107`).
3. Hunt trade ships only when no higher-priority target is active (`WarshipExecution.ts:114`).
4. Patrol (`WarshipExecution.ts:120`).

Warships have max health 1000 (`Config.ts:309`) and are healed near ports. Passive healing checks owned ports within `warshipPassiveHealingRange()` (`WarshipExecution.ts:123`) and applies active docked healing when the state is `docked` (`WarshipExecution.ts:147`).

## Repair Retreat And Docking

Repair retreat starts only while patrolling, after manual move suppression has expired, below `warshipRetreatHealthThreshold()`, and when the owner has at least one port (`WarshipExecution.ts:160`).

The retreat state is set with a target retreat port (`WarshipExecution.ts:319`). Manual patrol override cancels repair retreat and records a suppression tick (`WarshipExecution.ts:338`). While retreating, a warship can still aggro and fire back (`WarshipExecution.ts:357`) before continuing toward port.

Docking occurs when the warship is within `warshipDockingRange()` of the retreat port and the port has healing capacity (`WarshipExecution.ts:379`). If no route or valid port remains, retreat is canceled or retargeted (`WarshipExecution.ts:421`).

## Shells

Warships and defense posts create shell executions. Shell base damage comes from `Config.unitInfo(UnitType.Shell).damage`, which is 250 (`Config.ts:312`). `ShellExecution` scales damage by a randomized multiplier around that base.

## Evidence Tests

- `tests/Warship.test.ts` covers passive healing, trade-ship targeting, movement, retreat, docking, firing while retreating, and stale target behavior.
- `tests/WarshipMultiSelection.test.ts` covers multi-warship move orders and ownership checks.
- `tests/client/controllers/WarshipSelectionController.test.ts` covers client-side selection behavior.
