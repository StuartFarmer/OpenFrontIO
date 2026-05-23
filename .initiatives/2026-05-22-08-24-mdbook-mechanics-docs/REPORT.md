# Analysis Report: mdBook Mechanics Documentation

## Executive Summary
- Highest impact: mechanics values are already partly centralized in `Config`, but not in a docs-friendly or balance-friendly model.
- Second: adjustable lobby parameters have a schema/UI surface, but their bounds and meanings are duplicated across schema, helpers, and modals.
- Third: several mechanics still live outside `Config`, so generated docs need a broader extraction strategy than one-file scraping.
- Fourth: mdBook can fit cleanly, but it should be treated as a rendering layer; the important work is code-owned mechanics metadata and drift checks.
- Fifth: existing docs are useful but static, and the new untracked economy doc shows why generated values are needed before the docs become authoritative.

## Findings

### 1. `Config` is the main mechanics hub, but it mixes formulas, accessors, and literals
- Evidence:
  - `src/core/configuration/Config.ts` defines core constants such as defense debuff parameters, default spawn immunity, troop growth, and biomass share at lines 74-78.
  - The same file returns many literal balance knobs through methods: city troop increase, factory capacity, SAM/silo cooldowns, defense post bonuses, train values, structure costs, donation cooldowns, alliance durations, win thresholds, spawn phase lengths, attack formulas, troop/resource caps, nuke magnitudes, SAM/warship ranges, and shell timings across lines 109-1155.
  - Unit costs and build durations are embedded in a switch in `unitInfo()` at lines 289-430.
- Impact:
  - This is good for deterministic access, but poor for documentation because values are not represented as named, categorized metadata.
  - Balance changes require reading executable formulas and switch branches instead of scanning a mechanics table.
  - A naive docs generator would have to parse arbitrary TypeScript bodies, which is brittle.
- Recommendation:
  - Create a typed mechanics catalog that `Config` consumes for simple values and tables. Keep complex formulas as functions, but attach metadata such as category, description, units, source file, and example outputs.
  - Start with high-value surfaces already concentrated in `Config`: unit costs, cooldowns, win thresholds, spawn timing, troop/resource growth, nukes, SAMs, defense posts, warships, and donations.
- Risk:
  - Moving too much too quickly can change simulation behavior. The first pass should preserve `Config` public methods and add tests that compare old method outputs to catalog-backed outputs.

### 2. Adjustable parameters exist, but bounds and UI defaults are not a single source of truth
- Evidence:
  - `GameConfigSchema` declares configurable fields and validation bounds for nations, bots, timers, spawn immunity, disabled units, gold multipliers, starting gold, and host cheats at `src/core/Schemas.ts` lines 217-277.
  - Single-player defaults and control bounds are declared in `src/client/SinglePlayerModal.ts` lines 41-62 and 201-253.
  - Host-lobby state and option toggles live in `src/client/HostLobbyModal.ts` lines 59-88 and input validation repeats bounds such as gold multiplier `0.1-1000` at lines 804-807.
  - Helper behavior for compact maps and slider conversion lives in `src/client/utilities/GameConfigHelpers.ts` lines 4-120.
- Impact:
  - The code knows which parameters are adjustable, but docs would need to reconcile schema bounds, UI defaults, and derived helper behavior.
  - Drift is likely when a balance option is added to a modal but not documented or vice versa.
- Recommendation:
  - Model adjustable parameters as typed metadata next to `GameConfigSchema` or as a companion `GameConfigMetadata` export. Include label key, default, min/max, units, visibility, and gameplay effect.
  - Generate an mdBook "Adjustable Parameters" page from this metadata and have UI/schema consume the same definitions where practical.
- Risk:
  - Client UI imports must not pull server-only or docs-only dependencies into the bundle. Keep metadata pure TypeScript and side-effect free.

### 3. Not all mechanics are in `Config`
- Evidence:
  - Attack retreat penalty is a file-local constant in `src/core/execution/AttackExecution.ts` line 19, while combat relation penalties are hard-coded by difficulty at lines 149-168.
  - Nuke boundary behavior has file-local constants and randomization details in `src/core/execution/NukeExecution.ts` lines 20 and 73-84.
  - Donation relation thresholds and scaling live inside `DonateGoldExecution` lines 93-123 and `DonateTroopExecution` lines 91-123.
  - Resource regeneration primitives are in `src/core/game/Resources.ts` lines 103-123, and trade blend calculations are in `src/core/game/ResourceTrade.ts` lines 19-95.
- Impact:
  - A documentation project that only inventories `Config` will miss real mechanics.
  - Balance knobs are split by execution ownership, which is understandable for code locality but weak for global balancing.
- Recommendation:
  - Use an explicit mechanics registration/export pattern rather than AST scraping. Each mechanics module can export a small metadata object next to its executable logic.
  - Add a docs generator that imports the pure metadata exports and writes mdBook Markdown tables plus formula notes.
- Risk:
  - Importing full execution modules in a generator can trigger unintended transitive imports. Prefer small metadata-only files or side-effect-free exports.

### 4. mdBook installation should be thin and pinned; generation should remain TypeScript-native
- Evidence:
  - `package.json` has no mdBook scripts today; the only docs script is `docs:map-generator` at line 12.
  - The repo already uses npm scripts for build, test, lint, format, and generation at lines 3-23.
  - CI currently installs Node 24 and runs npm commands for build/test/lint/prettier, with Go only for generated maps in `.github/workflows/ci.yml` lines 23-47 and 75-90.
- Impact:
  - mdBook itself is not a Node dependency, so adding it as if it were part of the npm lockfile would be awkward.
  - Developers still need one obvious command for docs.
- Recommendation:
  - Add `book.toml`, `docs/src/SUMMARY.md`, and npm scripts such as `docs:build`, `docs:serve`, `docs:generate`, and `docs:check` that shell out to an installed `mdbook` binary and TypeScript generator.
  - Pin mdBook in CI through a dedicated setup step or checked bootstrap script. Keep the docs generator in TypeScript and run it through existing `tsx`.
  - Document local install options separately: Homebrew for macOS contributors, `cargo install mdbook --locked` for Rust users, or a project bootstrap script that fetches a pinned binary.
- Risk:
  - An unpinned mdBook install can make CI inconsistent. A pinned binary or pinned setup action matters more than the local install path.

### 5. Existing docs are static and mechanics docs are already beginning to drift risk
- Evidence:
  - Existing tracked docs are `docs/Architecture.md`, `docs/API.md`, and `docs/Auth.md`.
  - `docs/Architecture.md` correctly describes deterministic core simulation and intent execution at lines 1-28.
  - There is an untracked `docs/Economy.md` in the current worktree describing resource and troop-growth mechanics in prose, while the live constants and formulas are in `Config.ts` and `Resources.ts`.
- Impact:
  - Static prose is useful for explanation, but it is not enough for balance work when values are changing.
  - The economy write-up is a good candidate for mdBook, but it should eventually receive generated tables for constants such as growth rate, capacity formulas, resource weights, and regeneration equations.
- Recommendation:
  - Convert explanatory docs into mdBook chapters and reserve generated partials for values, formulas, and source links.
  - Add a drift check that fails when generated mechanics pages are stale.
- Risk:
  - If generated content is too verbose, docs become noisy. Prefer concise tables grouped by player-facing mechanic and link to source for deeper inspection.

## Quick Wins
- Add `book.toml` and `docs/src/SUMMARY.md` while preserving current Markdown docs as mdBook chapters.
- Add npm scripts for `docs:build`, `docs:serve`, `docs:generate`, and `docs:check`.
- Create a first generated page from manually curated metadata for `Config.unitInfo()` and simple cooldown/duration methods.
- Add source links in generated docs using relative paths and line anchors where possible.
- Add CI docs check after the generator exists and is stable.

## Medium Changes
- Introduce a typed mechanics metadata shape with categories, units, descriptions, defaults, formulas, and balance notes.
- Move simple literals from `Config` into catalog data while keeping existing `Config` methods as the runtime API.
- Add metadata for `GameConfigSchema` adjustable parameters so UI, validation, and docs can converge.
- Split complex formulas into named functions with documented inputs and sampled example outputs.
- Generate docs for units, structures, economy, combat, diplomacy, nukes/SAMs, spawning, and lobby settings from the same metadata.

## High-Risk Decisions
- Whether to centralize mechanics in TypeScript metadata, JSON, YAML, or a hybrid. TypeScript fits executable formulas best; JSON/YAML is easier to inspect but weaker for deterministic formulas.
- Whether docs generation should import code directly or consume a generated manifest. Direct imports are simpler but can create bundling/side-effect issues.
- Whether mdBook output should be committed or generated only in CI. Committed output helps static hosting; generated-only output reduces churn.
- How aggressively to migrate existing formulas out of execution files. Over-centralization can reduce code locality and obscure ownership.

## Guardrails
- Keep `src/core` deterministic and avoid runtime dependencies introduced only for documentation.
- Preserve existing `Config` method names until call sites and tests prove a cleaner API is safe.
- Treat generated docs as derived artifacts from a typed source, not as the source of game behavior.
- Check docs drift in CI once generation exists.
- Keep local mdBook setup optional for ordinary game development; docs commands should fail with a clear install message when `mdbook` is missing.
