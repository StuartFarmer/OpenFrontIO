# Initiative: Dynamics Systems Reconciliation

## Stack

- Language: TypeScript, with a separate Go map-generator module
- Package manager: npm
- Test runner: Vitest
- Build: Vite plus `tsc --noEmit`
- UI: Lit custom elements, React Flow mounted as an isolated React island
- CI: GitHub workflows inferred from repo conventions; local scripts are in `package.json`

## Goal

Analyze how `src/core/systems` and the Foundation dynamics graph editor currently work, identify where their models diverged, and define the architectural questions that must be resolved before dynamics-authored systems become the general base for gameplay systems.

## Execution Status

Complete. The initiative moved through planning and execution after the initial
analysis. All 5 waves and 16 tickets are in `done`, all deliverable acceptance
checks are complete, and final validation passed.

## Problem Statement

`src/core/systems` was intended to become the code/runtime layer under systems, while the dynamics editor was intended to be a front end for creating and simulating those systems. The two approaches have drifted. The current Foundation dynamics editor has strong editing, simulation, save, and load behavior, but its active model is Foundation-specific and evaluates graph formulas directly. The core systems layer has a stock-flow runtime and a gameplay scheduler, but the current saved dynamics flow does not yet compile into canonical runtime structures used by gameplay.

## Success Definition

This analysis succeeds if it clearly explains:

- how the current core systems layer works;
- how the current dynamics graph/editor layer works;
- why stale references to the old deleted compiler path should not steer implementation;
- which reconciliation direction should be treated as canonical;
- which decisions require user input before planning implementation.

## Non-Goals

- Do not implement the reconciliation.
- Do not recreate the deleted historical compiler module.
- Do not refactor the Foundation dynamics page.
- Do not change game behavior or tests.
- Do not create waves, tickets, or acceptance criteria.

## Constraints

- Existing user edits are present in Foundation files and must not be overwritten.
- The dynamics editor UX is considered valuable and should be preserved.
- Gameplay integration must avoid turning saved graphs into ad hoc runtime glue.
- Core gameplay has both continuous numeric systems and discrete command/entity systems.
- Saved system definitions must stay JSON-serializable and loadable.

## Assumptions

- The current Foundation dynamics save/simulate flow is the base to preserve and reconcile with runtime systems.
- Stale references to the deleted historical compiler module should be removed.
- Dynamics should become canonical for stock-flow style mechanics first, not for every discrete gameplay system.

## Risk Posture

Medium-high. The editor path is productive and should be kept, but making it canonical without reintroducing a typed compiler and runtime contract would increase formula drift. Forcing all gameplay systems through dynamics graphs would also be risky because commands, units, territory mutation, projectiles, AI, and update emission need phaseful imperative systems.

## Next Step

Use the completed scheduler/dynamics contract and Foundation compiled-dynamics
runtime path as the reference for future stock-flow system migrations.
