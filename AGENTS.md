# Agent instructions — Heroes of History Battle Lab desktop prototype

## Mandatory design-first UI workflow (NO EXCEPTIONS)

**`docs/DESIGN.md` is the sole source of truth for how the application UI must look and behave.** This rule applies to every UI change, including small visual adjustments, table layout, navigation, interactions, usability fixes, and UI refactors.

1. **FIRST update `docs/DESIGN.md`** to specify the requested change, including the relevant screen/component, layout, states, interaction and responsive behavior. Make the design update before touching UI implementation files.
2. **ONLY AFTER the design has been updated**, change the UI code to implement that documented design.
3. **The final UI MUST fully match the updated design.** Check every affected screen, state, and shared component; do not leave implementation/design inconsistencies.
4. **NEVER update UI code without first updating `docs/DESIGN.md`.** Do not treat a direct UI request, screenshot, issue, mock fixture, or code comment as permission to skip the design update.
5. If implementation reveals a necessary design adjustment, **revise `docs/DESIGN.md` first again**, then modify the UI accordingly. Do not change the implementation and retroactively document it.
6. Before declaring the work complete, verify the design-to-UI match and report any remaining discrepancy as incomplete work rather than silently diverging from the design.

This ordering is mandatory for agents and human contributors alike: **DESIGN → UI implementation → verification**.

## Project entry points

- `index.html`: browser entry (ES modules for development); `standalone.html`: generated single-file HTML preview.
- `src/styles.css`: desktop shell, shared colors, density, responsive behavior.
- `src/main.js`: screen presentation, shared table and inspector primitives, interactions, demo storage. This is intentionally lightweight vanilla JS for a static prototype; new production code should use TypeScript.
- `src/mock-data.js`: **illustrative fixtures only**, not real game source data.
- `docs/DESIGN.md`: layout, domain requirements, user flows, status semantics, real extension integration contract.
- `scripts/check.mjs`: static project invariants; `scripts/build.mjs` creates a dependency-free single-file HTML build.

## Hard UI rules

1. Entire window fills `100vw` and `100vh`. No browser page scrolling; scroll per workspace table, panel or inspector.
2. Desktop-first dense tables; topbar, sidebar, title area, bottom statusbar; full-width Heroes roster with a compact accessible Details icon button in an ordinary non-sticky column and a large editor dialog; Equipment/Relics keep right-side inspectors.
3. Share canonical components/semantics across Heroes, Equipment, Relics, Resources, Battles, Arena and Planner. Every hero has five equipment slots; each unique item instance has an array of independent stats, level, rarity, and set affiliation. The UI must show ALL stat lines and recompute set activation on assignment changes.
4. Use a single upgrade-draft state feeding incremental hero costs, combined resource budget and additional farming days.
5. Draft and saved plans must never change real game state. This extension is read-only.
6. Keep optimistic, estimated, and verified results clearly separated. Mock percentages and costs must be marked mock.
7. Respect actual game caps, class bans, formation constraints, modes and stars. No claims of a valid victory without exact native replay and independent rule validation.
8. Arena optimizer must preserve evidence from saved formations and be able to propose new tested formations; Elite Arena requires a legal 3-team configuration.
9. Multi-battle improvement minimizes *additional days farming* across combined plans, not independently minimized battle costs added together.
10. Keep imports, normalization, simulation, farming, optimization and UI separate in the production application.

## Workflow for UI requests

1. Review relevant section(s) of `docs/DESIGN.md` and existing behavior.
2. Update `docs/DESIGN.md` **before any UI source edits**, describing every requested visual/behavior change and affected states.
3. Implement components/screens to **fully match that updated specification**, adapting mock data only as necessary.
4. Run `npm run check`, `npm run test`, `npm run build` (no third-party dependencies required).
5. Verify rendering at 1440×900 and 1920×1080 using a screenshot / browser automation where available; test viewport overflow, table scrolling, selection, sorting, search, save/reset, keyboard navigation.
6. When integrating the real `hoh-battle-extension` repository, locate the current version and existing React/messaging/worker patterns. **Do not blindly overwrite existing production UI.** Port design tokens/components incrementally behind adapter interfaces. Run the native engine tests and original extension build before committing.
7. Update design/source-of-truth documentation and describe implementation gaps in the PR.

## Important limitations in this prototype

- Arena probabilities are static fixture values, not native simulation results or statistically valid estimates.
- Hero power deltas, resource expenses and farming rates are illustrative UI models.
- Battle improvement recipes are not verified or globally optimal.
- No dynamic opponent retrieval, Unity WASM, MV3 integration, service worker, capture hooks, or game file import is included.
- Data persists only in this browser via local storage; no remote or game changes.

## Source of truth precedence

Verified native game mechanics and actual imported user state are authoritative for *game facts*. `docs/DESIGN.md` is authoritative for *UI experience and presentation*. Mock fixtures are authoritative for neither.