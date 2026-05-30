# Combat And Conquest

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Land combat combines an attack execution, an attack object, terrain-specific formulas, defender modifiers, and tile-by-tile conquest.

## Attack Amount

`Config.attackAmount()` is at `Config.ts:799`:

- Bots send `attacker.troops() / 20`.
- Humans and nations send `attacker.troops() / 5`.

Boat attacks use `Config.boatAttackAmount()` with `floor(attacker.troops() / 5)` at `Config.ts:779`.

## Base Terrain Values

`Config.attackLogic()` starts at `Config.ts:639` and chooses base magnitude and speed by terrain:

| Terrain | Magnitude | Speed | Source |
| --- | ---: | ---: | --- |
| Plains | 80 | 16.5 | `Config.ts:654` |
| Highland | 100 | 20 | `Config.ts:658` |
| Mountain | 120 | 25 | `Config.ts:662` |

Only these land terrain types are supported by the formula. Unsupported terrain throws (`Config.ts:666`).

## Defender Modifiers

If the defender is a player, nearby owned defense posts multiply magnitude by `defensePostDefenseBonus()` and speed by `defensePostSpeedBonus()` (`Config.ts:669`). If the tile has fallout, both magnitude and speed are multiplied by `falloutDefenseModifier(falloutRatio)` (`Config.ts:683`).

Player-vs-player special cases:

- If the defender is disconnected and on the same team, magnitude becomes 0 (`Config.ts:689`).
- If a human or nation attacks a bot, magnitude is multiplied by 0.7 (`Config.ts:694`).

## Player Defender Formula

For player defenders, the code computes:

- `defenseSig = 1 - sigmoid(defender.numTilesOwned(), DEFENSE_DEBUFF_DECAY_RATE, DEFENSE_DEBUFF_MIDPOINT)` (`Config.ts:703`).
- `largeDefenderSpeedDebuff = 0.7 + 0.3 * defenseSig` (`Config.ts:712`).
- `largeDefenderAttackDebuff = 0.7 + 0.3 * defenseSig` (`Config.ts:713`).
- If the attacker owns more than 100,000 tiles, `largeAttackBonus = sqrt(100000 / attackerTiles) ** 0.7` (`Config.ts:715`) and `largeAttackerSpeedBonus = (100000 / attackerTiles) ** 0.6` (`Config.ts:719`).
- Defender troop loss per conquered tile is `defender.troops() / defender.numTilesOwned()` (`Config.ts:724`).
- If the defender is a traitor, `traitorDefenseDebuff()` modifies attacker loss and `traitorSpeedDebuff()` modifies tile speed (`Config.ts:725`, `Config.ts:746`).

Attacker troop loss has two blended terms:

```text
currentAttackerLoss =
  within(defenderTroops / attackTroops, 0.6, 2)
  * mag
  * 0.8
  * largeDefenderAttackDebuff
  * largeAttackBonus
  * traitorMod

altAttackerLoss = 1.3 * defenderTroopLoss * (mag / 100) * traitorMod

attackerTroopLoss = 0.6 * currentAttackerLoss + 0.4 * altAttackerLoss
```

These terms are implemented at `Config.ts:726` through `Config.ts:736`.

Tiles-per-tick used against player defenders is:

```text
within(defenderTroops / (5 * attackTroops), 0.2, 1.5)
* speed
* largeDefenderSpeedDebuff
* largeAttackerSpeedBonus
* traitorSpeedModifier
```

Source: `Config.ts:741`.

## Tile Capture Throughput

`Config.attackTilesPerTick()` starts at `Config.ts:762`.

- Against player defenders: `within(((5 * attackTroops) / defenderTroops) * 2, 0.01, 0.5) * adjacentEnemyTiles * 3`.
- Against `TerraNullius`: `adjacentEnemyTiles * 2`.

## Attack Execution Responsibilities

`AttackExecution` owns runtime behavior:

- initialization and validation
- stats tracking
- relation penalties
- tile-frontier selection
- calls into `Config.attackTilesPerTick()` and `Config.attackLogic()`
- tile conquest through `owner.conquer(tile)`
- full-player conquest through `GameImpl.conquerPlayer()`

The attack object itself lives in `AttackImpl`, which handles retreat ordering and retreat execution.

## Evidence Tests

- `tests/Attack.test.ts` covers alliance race conditions and cancellation behavior.
- `tests/AttackStats.test.ts` covers stats side effects.
- `tests/TerritoryCapture.test.ts` covers basic conquest ownership.
