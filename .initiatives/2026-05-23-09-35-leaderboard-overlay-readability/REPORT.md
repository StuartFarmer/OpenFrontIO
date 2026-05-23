# Analysis Report: Leaderboard Overlay Readability

## Executive Summary
- The in-game leaderboard overlay is concentrated in `src/client/hud/layers/Leaderboard.ts`; most requested changes can be made locally through Tailwind classes and fixed column sizing.
- The companion `src/client/hud/layers/TeamStats.ts` should be treated as part of the same overlay family, because it renders adjacent tabular team stats with similar rounded, spacious styling.
- Numeric scanability is currently limited by centered proportional text and mixed column widths; monospace plus tabular numbers should be applied deliberately to numeric cells, not just the outer container.
- Compactness should come from smaller row padding, tighter line-height, smaller border radius, and right-aligned numeric columns rather than reducing font size alone.
- The broader overlay basis should be extracted as a small local convention after the first pass, because the repo already uses light DOM and Tailwind utility strings for HUD components.

## Findings

### 1. The target overlay is a light-DOM Lit component with all layout encoded inline
- Evidence: `src/client/hud/layers/Leaderboard.ts:68` registers `<leader-board>`, `createRenderRoot()` returns `this` at `src/client/hud/layers/Leaderboard.ts:101`, and the main table markup is emitted from `render()` at `src/client/hud/layers/Leaderboard.ts:418`.
- Evidence: `index.html:352` includes a top-level `<leader-board>`, while `src/client/hud/layers/GameLeftSidebar.ts:195` renders the active sidebar instance with `.visible=${this.isLeaderboardShow}`.
- Impact: The safest implementation path is to change the component's Tailwind class strings and inline grid template directly. A Shadow DOM style block or global stylesheet would be inconsistent with the current pattern.
- Recommendation: Make the first pass in `Leaderboard.ts`, using a compact class vocabulary that can later be mirrored or factored for other overlays.
- Risk: Because the component uses light DOM and Tailwind class scanning, dynamically composed class strings need to stay visible to the build pipeline.

### 2. The current player leaderboard is rounded and vertically loose
- Evidence: The leaderboard grid uses `rounded-lg overflow-hidden` at `src/client/hud/layers/Leaderboard.ts:427`.
- Evidence: Header and row cells use `py-1 md:py-2` throughout `src/client/hud/layers/Leaderboard.ts:431-522`.
- Evidence: The expand button uses `rounded-md` and its own top margin at `src/client/hud/layers/Leaderboard.ts:530-533`.
- Impact: The current appearance reads as a soft card rather than a dense data overlay. The vertical padding also reduces the number of rows that fit before scrolling.
- Recommendation: Move the grid container to `rounded-sm` or `rounded-[3px]`, reduce cells to `py-0.5` or `py-[2px]`, add `leading-tight`, and tighten the expand button to the same radius and vertical rhythm.
- Risk: Very small padding can hurt touch and readability on mobile. If one compact style is too dense for all breakpoints, keep a slightly larger mobile row height and tighten from `md` upward.

### 3. Numeric columns are centered and proportional, which weakens comparison
- Evidence: Rank, owned, gold, and max troops cells all use `text-center` in `src/client/hud/layers/Leaderboard.ts:484-522`.
- Evidence: The outer leaderboard does not use `font-mono`, and numeric cells do not use `tabular-nums`; only the separate economy metric value uses `tabular-nums` at `src/client/hud/layers/Leaderboard.ts:615`.
- Evidence: Other HUD code already uses numeric alignment utilities, for example `tabular-nums` in `src/client/hud/layers/ControlPanel.ts:548` and monospace numeric display in `src/client/hud/layers/SendResourceModal.ts:280`.
- Impact: Percentages, gold values, and troop values do not line up by digit width, so players cannot easily scan deltas across rows.
- Recommendation: Apply `font-mono tabular-nums` to the grid or at least all numeric cells, use `text-right` for score/gold/troop columns, reserve `text-left` for player names, and keep rank centered or right-aligned in a fixed-width column.
- Risk: Fully monospace player names may be visually heavier and can truncate earlier. A good compromise is monospace for the whole table if analysis is the priority, or monospace numeric columns plus a compact sans player column if name recognition is the priority.

### 4. The grid already has fixed column intent but needs more analytical column sizing
- Evidence: `src/client/hud/layers/Leaderboard.ts:428` defines five grid columns: rank, player, owned, gold, and max troops using `minmax(...)` widths.
- Evidence: Player names are centered and truncated at `src/client/hud/layers/Leaderboard.ts:492-498`, while metric columns have different maximum widths.
- Impact: The current layout protects against overflow, but mixed max widths and centered content make columns feel uneven when numbers change length.
- Recommendation: Keep CSS grid, but tune columns around character widths: a narrow rank column, a fixed or minmax player column, and `ch`-based numeric columns. Use `justify-self:end` or `text-right pr-1` for numeric cells.
- Risk: `ch` sizing depends on the chosen font. Validate in the browser with longest translated headers and large rendered values.

### 5. Sort indicators add non-monospace visual noise inside constrained headers
- Evidence: Sort indicators are emoji arrows appended in header cells at `src/client/hud/layers/Leaderboard.ts:443-470`.
- Impact: Emoji arrows have inconsistent width and color rendering across platforms. They also compete with compact headers once padding and column widths are reduced.
- Recommendation: Replace them during implementation with plain text symbols, CSS pseudo content, or small fixed-width spans such as `↑` and `↓` inside `inline-block w-[1ch]`.
- Risk: Symbols need enough contrast and a clear empty state so sortability remains discoverable.

### 6. Team stats should follow the same overlay treatment
- Evidence: `src/client/hud/layers/TeamStats.ts:133` uses `rounded-lg`, `text-xs md:text-sm`, and a table-like grid.
- Evidence: Its header cells use `p-1.5 md:p-2.5` at `src/client/hud/layers/TeamStats.ts:142-180`, and data rows use centered `py-1.5` cells at `src/client/hud/layers/TeamStats.ts:196-229`.
- Evidence: `src/client/hud/layers/GameLeftSidebar.ts:192-199` can render player leaderboard and team stats together in the same sidebar area.
- Impact: Updating only the player leaderboard would create a visual mismatch when both overlays are visible.
- Recommendation: Mirror the compact radius, font, tabular numeric treatment, and numeric alignment in `TeamStats.ts` after the player leaderboard direction is settled.
- Risk: Team labels and translated unit headers may require more horizontal space than player stats. Compactness should not assume English-only labels.

### 7. Economy alternate view is part of the same component but not the same table
- Evidence: `Leaderboard.ts` switches to `renderEconomyView()` when `economyMode` is active at `src/client/hud/layers/Leaderboard.ts:415-416`.
- Evidence: The economy container also uses `rounded-lg` and loose spacing at `src/client/hud/layers/Leaderboard.ts:560-595`.
- Impact: A leaderboard-only change will leave alternate-view styling inconsistent inside the same custom element.
- Recommendation: Treat economy view as a follow-up overlay-family pass unless the first implementation is explicitly scoped to every state of `<leader-board>`.
- Risk: Economy view has progress bars and labels, so aggressive monospacing everywhere may make it less readable than the leaderboard table.

### 8. The global theme lacks a dedicated mono token, but Tailwind's existing utilities are enough
- Evidence: `src/client/styles.css:6-38` defines the Tailwind theme and only adds `--font-display`; it does not define a project-specific monospace font token.
- Evidence: The codebase already uses Tailwind `font-mono` and `tabular-nums` utilities in several client components.
- Impact: Adding global theme tokens is unnecessary for the first pass.
- Recommendation: Use `font-mono`, `tabular-nums`, `tracking-normal`, and `leading-tight` locally. Consider a named utility only if several overlay components converge on the same dense data-table style.
- Risk: Browser default monospace stacks vary. If pixel-perfect consistency matters later, the project may need an explicit mono font stack.

## Quick Wins
- Change leaderboard container radius from `rounded-lg` to `rounded-sm` or `rounded-[3px]`.
- Add `font-mono tabular-nums leading-tight` to the leaderboard grid.
- Reduce cell padding from `py-1 md:py-2` to a tighter consistent value.
- Right-align owned, gold, and max-troop values; left-align player names.
- Replace emoji sort arrows with fixed-width monospace indicators.

## Medium Changes
- Tune the leaderboard grid template with `ch`-based numeric columns.
- Apply the same compact treatment to `TeamStats.ts`.
- Add a small helper or constant for repeated compact cell class strings if duplication becomes noisy.
- Validate compact rendering with long localized labels and large numeric values.

## High-Risk Decisions
- Making the entire overlay monospace, including player names, could reduce name recognizability and increase truncation.
- Applying compact styling equally on touch-sized mobile screens could reduce usability.
- Converting the grid to a semantic `<table>` would improve tabular semantics, but it is a larger rewrite than needed for the first overlay modification.

## Guardrails
- Keep leaderboard behavior, sorting, click-to-player navigation, and show-top-five behavior unchanged.
- Preserve the light-DOM Tailwind convention used by existing HUD components.
- Do not use a global CSS reset or broad font override for all HUD elements.
- Check player and team leaderboards together, since the sidebar can show both.
- Check at least one non-English locale or artificially long header text before finalizing compact widths.
