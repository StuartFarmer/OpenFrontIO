# Maintenance

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

This guide intentionally documents canonical `main`, not necessarily the current working branch. Keep that distinction visible whenever the active branch contains mechanics changes.

## Safe Canonical Inspection

Use a detached worktree or an explicit `git show main:path` style read. Do not check out `main` over a dirty feature branch.

Recommended local pattern:

```sh
git worktree add --detach /private/tmp/openfront-main-analysis main
```

Then inspect files from that worktree:

```sh
rg "attackLogic" /private/tmp/openfront-main-analysis/src/core
nl -ba /private/tmp/openfront-main-analysis/src/core/configuration/Config.ts
```

If the canonical baseline changes, update the baseline string in every canonical mechanics chapter and rerun `npm run docs:build`.

## Source Reference Policy

- Use `main@782702c1d6c8614f2c44590584b0b34c1016020d` for all source claims in this guide.
- Prefer exact file and line references for formulas, schema fields, and execution order.
- For behavior that is spread across files, cite both the formula owner and the execution/state owner.
- For edge cases, cite tests in addition to runtime source.

## Build Verification

Run:

```sh
npm run docs:build
```

This verifies mdBook summary links and Markdown rendering. It does not verify gameplay behavior. Use targeted Vitest tests only when guide work uncovers a code/doc contradiction that needs runtime confirmation.

## Known Limits

- This guide is source-backed but not fully generated. Numeric tables can drift if canonical source changes and the docs are not refreshed.
- The map appendix is scaffolded but not yet generated into a full 80-map table.
- Some advanced behavior, especially nation AI, nuke targeting, rail pathfinding, and warship retreat, is summarized at implementation-map depth rather than reproduced line by line.
- UI command surfaces are mapped to likely runtime handling, but deeper client-to-server transport tracing remains future work.

## Future Extraction Opportunities

- Generate unit cost/duration tables from `Config.unitInfo()`.
- Generate map appendix data from `resources/maps/**/manifest.json`.
- Generate schema tables from `GameConfigSchema` and intent schemas.
- Add source-link checking or a docs drift check when the canonical baseline is intentionally updated.
