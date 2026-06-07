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

## Problem Statement

`src/core/systems` was intended to become the code/runtime layer under systems, while the dynamics editor was intended to be a front end for creating and simulating those systems. The two approaches have drifted. The current Foundation dynamics editor has strong editing, simulation, save, and load behavior, but its active model is Foundation-specific and evaluates graph formulas directly. The core systems layer has a stock-flow runtime and a gameplay scheduler, but no current checked-in portable dynamics compiler that converts saved editor graphs into canonical runtime models.

## Success Definition

This analysis succeeds if it clearly explains:

- how the current core systems layer works;
- how the current dynamics graph/editor layer works;
- how both differ from the earlier portable dynamics architecture visible in git history;
- which reconciliation direction should be treated as canonical;
- which decisions require user input before planning implementation.

## Non-Goals

- Do not implement the reconciliation.
- Do not recreate deleted dynamics compiler files.
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

- The user's reference to `src/core/systems/dynamics` refers to the portable dynamics graph system that existed in commit `a02a9365`, plus the current Foundation dynamics editor under `src/games/foundation/dynamics`.
- The current checked-in tree intentionally reflects the latest work, even though it removed the earlier portable dynamics compiler/simulator.
- Dynamics should become canonical for stock-flow style mechanics first, not for every discrete gameplay system.

## Risk Posture

Medium-high. The editor path is productive and should be kept, but making it canonical without reintroducing a typed compiler and runtime contract would increase formula drift. Forcing all gameplay systems through dynamics graphs would also be risky because commands, units, territory mutation, projectiles, AI, and update emission need phaseful imperative systems.

## Next Step

Run planning for this initiative after the open questions in `REPORT.md` are answered.
