# W3. Root App Modal Migration

## Goal

Convert root application modals and account-related surfaces to the shared modal and form primitives.

## Tickets

- `S3.1-shared-modal-shell.md`
- `S3.2-account-store-auth.md`
- `S3.3-help-news-language.md`
- `S3.4-flags-patterns-cosmetics.md`

## Dependencies

- W1 shared primitives.
- Prefer W2 modal patterns for consistency where available.

## Order

Complete `S3.1` first. `S3.2`, `S3.3`, and `S3.4` can proceed in parallel after that.

## Done Criteria

- Root modal styling and structure uses shared components.
- Existing translations, close handling, and submit/cancel flows remain unchanged.
- Nonessential homepage/store features remain behind their current product decisions.

## Completion Notes

- Hardened `o-modal` lifecycle coverage around shared close control and body scroll locking.
- Migrated NewsBox shell/type/dismiss controls to shared primitives.
- Migrated Help troubleshooting action to `ui-button`.
- Migrated account login panel and subscription panel surfaces/actions to shared primitives.
- Migrated flag and territory pattern search controls to `ui-input`.
- Left specialized cosmetic purchase animations and rich selection cards intact for a later focused pass.

## Validation

- `npx tsc --noEmit`
- `npx vitest run tests/client/components/UiComponents.test.ts tests/client/components/HomepagePlayFlow.test.ts tests/client/components/NewsBox.test.ts tests/client/NewsMarkdown.test.ts`
