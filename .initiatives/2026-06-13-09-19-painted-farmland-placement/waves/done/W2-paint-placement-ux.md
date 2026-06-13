# W2: Paint Placement UX

**Status**: DOING
**Entry**: Farmland is a valid buildable with render/preview support.
**Exit**: Paint mode supports brush cursor, hold-to-paint placement, stroke duplicate suppression, and cancellation.
**Parallelization**: Sequential (1 owner), because `InputHandler`, `UIState`, and `BuildPreviewController` are shared hotspots.
**Deliverables**: D3

## Tickets

- S2.1-placement-mode-state.md
- S2.2-paint-input-routing.md
- S2.3-paint-controller-placement.md
- S2.4-paint-cursor-and-cancel.md

## Exit Criteria

- [x] Paint mode is explicit and only applies to paintable 1x1 placeables.
- [x] Left-drag paints valid newly visited tiles without panning the camera.
- [x] Mouse release ends the stroke while keeping the selected paint tool active.
- [x] Right-click and Escape cancel paint mode and clear brush cursor state.

## Working Notes

- Added explicit placement-mode metadata for Farmland.
- Added paint-stroke input events and controller placement handling.
- Added inline brush cursor and cancellation cleanup through existing ghost clear path.
