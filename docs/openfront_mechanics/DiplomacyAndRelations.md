# Diplomacy And Relations

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Diplomacy is mechanical. It gates trade, donations, targeting, attack side effects, AI decisions, traitor penalties, and nuke alliance breaks.

## Relations

`PlayerImpl.relation()` converts a hidden numeric score into relation buckets (`PlayerImpl.ts:651`):

| Numeric score | Relation |
| ---: | --- |
| `< -50` | Hostile |
| `< 0` | Distrustful |
| `< 50` | Neutral |
| `>= 50` | Friendly |

`updateRelation()` clamps relation deltas to `[-100, 100]` (`PlayerImpl.ts:682`).

## Traitor State

`isTraitor()` returns true while `getTraitorRemainingTicks()` is positive (`PlayerImpl.ts:620`). `markTraitor()` records current tick, increments betrayal count, and records stats (`PlayerImpl.ts:632`). Combat reads traitor state in `Config.attackLogic()` and applies defense/speed debuffs.

## Alliances

Alliance request, reject, extension, and break behavior lives in `src/core/execution/alliance/**`. `PlayerImpl.createAllianceRequest()` rejects duplicate-allied requests and delegates creation to `GameImpl` (`PlayerImpl.ts:644`). Alliance duration, extension prompt offset, request cooldown, and traitor duration are configured in `Config`.

Nukes can reject pending alliance requests and break active alliances when blast effects exceed the nuke alliance threshold.

## Donations

`donateTroops()` removes troops from sender and adds them to recipient, then records donation tick and display messages (`PlayerImpl.ts:839`).

`donateGold()` removes resources equivalent to the requested gold amount, adds equivalent resources to the recipient, records donation tick, and emits display messages (`PlayerImpl.ts:861`).

Donation cooldown is configured by `Config.donateCooldown()`.

## Embargoes And Trade

`canEmbargoAll()` requires cooldown to have elapsed and at least one eligible non-self, non-bot, non-teammate player (`PlayerImpl.ts:896`). `canTrade()` returns false if either player embargoes the other, or if both ids are the same (`PlayerImpl.ts:922`).

Embargoes therefore affect trade eligibility, not only UI state.

## Evidence Tests

- `tests/AllianceRequestExecution.test.ts`
- `tests/AllianceExtensionExecution.test.ts`
- `tests/AllianceDonation.test.ts`
- `tests/Donate.test.ts`
- `tests/Attack.test.ts`
- `tests/Team.test.ts`
- `tests/TeamAssignment.test.ts`
