# Heroes of History — Battle Lab desktop UI specification

> **Status:** v0.1 — canonical UI design specification. **This file is the primary source of truth for the prototype and for subsequent UI implementation in the real Heroes of History extension.**
>
> Mock content, odds, build costs and income in this repository are illustrative only. They are not verified against the game or native simulation.

## 1. Product goal

Provide a dense, readable, desktop-application-style workspace for inspecting a Heroes of History account and planning battle improvements. The interface is a *read-only* game companion: inspect imported state, prepare hypothetical changes, verify proposed changes with the native simulation engine when connected, and save a plan. **Never spend resources or modify heroes in the real game automatically.**

The product answers five questions:
1. What heroes, equipment, relics, and resources do I own?
2. Which recorded battles did I lose or finish with fewer than three stars?
3. Against each current Arena or Elite Arena opponent, which saved formation performs best, and what new formation is worth testing?
4. What is the lowest-cost *verified* collection of improvements to clear my outstanding battles, including shared upgrades useful across battles?
5. How much of each resource will I need, how much do I have, and how many additional days of farming does the plan require?

## 2. Interaction and framing

- Render as an app taking **100vw × 100vh**: `html`, `body`, `#app` and root shell use those exact viewport dimensions, `overflow:hidden` at the root.
- Fixed 56px titlebar, 216px navigation rail, flexible central workspace, fixed 29px status strip. Top-level page scroll is forbidden. Each table and details inspector scrolls independently.
- Dark navy palette, quiet teal highlight, dark table surfaces, fine borders. Dense desktop rows and actionable details panes, no conventional marketing website features.
- Reusable detail inspector on the right for selected hero, recorded battle, or Arena opponent. Selection in a table must never navigate away from the workspace.
- Top level sidebar sections: **Workspace** and **Optimization**. Workspace contains Overview, Heroes, Equipment, Relics, Resources, Battle records. Optimization contains Arena optimizer and Upgrade planner.
- Minimum target desktop width 1280px. Below 850px allow stacked inspectors and icon-only navigation; retain the 100vh/100vw shell.
- Tables are the primary presentation for account data; sorting, searching, filters, stable selection and sticky headers are required. Cells are compact, legible and meaningful.
- Use explicit states: fixture/prototype, stale import, verified engine result, provisional simulation, and insufficient data. **Do not present simulated win probabilities as measured truth without sufficient samples.**

## 3. Information architecture

| View | Primary user action | Table data | Detail/secondary region |
| --- | --- | --- | --- |
| Overview | Choose the next improvement | Prioritized sub-three-star battles | Opponent summary, roster and draft costs |
| Heroes | Inspect and draft upgrades | Hero name, stars, role, level, power, attack, health, five-slot equipment summary, relic | Hero stats, level slider, five slot cards with item selection + stat details, set bonuses, relic selection, incremental upgrade cost |
| Equipment | Review inventory and assignments | Instance name, rarity/stars, slot, level, all stat rolls, set, owner | Future: compare equipment builds and equipment set bonuses |
| Relics | Review owned relics | Name, rarity, type, level, effect, copies | Future: relic upgrade and swap candidate details |
| Resources | Audit farm constraints | Type, owned, earned/day, needed, missing, days | Summary totals and most constraining resource |
| Battle records | Inspect losses, plan fixes | Name, mode, result, stars, recording date, seed, days to fix | Last formation, target, candidate changes and costs |
| Arena optimizer | Pick a counter lineup | Opponent, rank, saved lineup, current measured win %, best predicted lineup, samples/confidence | Current opponent information, lineup portraits, win-rate comparison |
| Upgrade planner | Review and save accumulated hypothetical changes | Hero, baseline vs target, equipment/relic changes, costs | Resource gap, bottleneck days, candidate battle improvements, saved plans |

## 4. Canonical reusable UI components

**HeroRow / HeroSummary** — portrait token; name and faction/role; rarity; level / legal cap; stat columns; five occupied equipment slots (e.g. `5/5`), combined stat bonus summary and relic; inline changed indicator. Portrait is an icon/initials fallback until real hero assets are imported. Hero row click selects hero without changing the game.

**EquipmentRow / EquipmentDetails** — instance icon, name, set, rarity, stars, slot position, level, **all individual stat rolls** (flat values and percentages), current owner and calculated set contribution. Show a compact multi-line stat preview in the table, and full stat lines with quantities / optional progress tracks in the detail inspector. Ownership, loadout assignment and upgrade level must be separate data fields; item type IDs are not unique inventory-instance IDs.

**RelicRow** — icon, rarity, relic type, level, effect, owned copies. Production must model unique inventory item instances and legal equip restrictions.

**ResourceValue / ResourceChip** — game icon; resource name; compact numerical quantity; optional signed delta, enough/short indicator, and explanatory tooltip. Share this component between tables, battle costs and the planner. `resourcePerDay` is an estimate imported from a farm model with explicit evidence.

**BattleRow** — mode, named encounter, seed, date, measured outcome, stars, legal-formation restrictions, cheapest verified improvement and farm time. Treasure Hunt sequences require an explicit multi-battle model; they must not appear as standalone single-battle optimization targets unless sequence validity is modeled.

**OpponentRow / ArenaRecommendation** — opponent identity and rank, current opponent composition/snapshot, existing saved formation, measured success ratio, alternative formation, sample count and uncertainty. If no evidence, show “Untested” instead of a percentage.

**UpgradeChange** — target entity, baseline value, desired value, incremental costs, reversibility, reason and dependent battles. Merge shared changes *once*, avoiding duplicate costs for the same upgrade.

**FarmEstimate** — per-resource demand, available stock, missing amount, daily yield, independent deficit days, and maximum bottleneck in days; label assumptions. Better models may consider farm calendars, energy caps, concurrency and resource competition.

**Status / ValidationFeedback** — `proposed`, `simulating`, `verified`, `impossible`, `unsupported`, `stale`, `fixture`. Do not use green verified indicators for untested estimates.

## 5. Layout anatomy

```text
┌────────────────────────────── TITLE BAR (56px) ──────────────────────────────────┐
│ Battle Lab                           Offline / Imported snapshot              │
├──────── SIDEBAR ───────┬──────────────────── WORKSPACE ──────────────────────────┤
│ Workspace              │ Breadcrumb + title                         Actions    │
│  Overview              ├────────────────────────────────────────────────────────┤
│  Heroes                │ Search · Filters · Summary                 15 records │
│  Equipment             ├─────────────────────────────┬──────────────────────────┤
│  Relics                │ Data table with sticky cols  │ Contextual inspector     │
│  Resources             │ / row selection              │ Stats / build / costs    │
│  Battle records        │                              │                          │
│ Optimization           │                              │                          │
│  Arena optimizer       │                              │                          │
│  Upgrade planner       │                              │                          │
├────────────────────────┴─────────────────────────────┴──────────────────────────┤
│ Status strip · Data source · Record counts · Engine state                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 6. Arena optimization behavior

1. Read a current snapshot of the Arena / Elite Arena opponent and its battle rules. Opponent snapshots are versioned; stale snapshots clearly marked.
2. List saved formation trials by opponent ID and game mode, with seed, battle configuration hash, number of trials, wins, stars, remaining health, team changes and native WASM version.
3. Show the best *verified* saved lineup for each opponent based on user objective (default highest win probability, secondary highest remaining health). Keep legality and hero-class constraints as hard constraints.
4. Generate new candidate lineups via a deterministic search with seeded simulations; compare on **identical seeds** and sufficient repetitions. Show trials, confidence intervals, sample counts and evaluation budget. For Elite Arena, search a valid three-team lineup (15 distinct hero positions with legality and overlap rules).
5. Never quietly replace stored formations. “Use recommended formation” sets a local plan; an independent action may export the configuration for manual in-game use.
6. The demo uses static fixture probabilities and names; its “Optimize” and “Use formation” actions do **not** run native simulation or interact with the game.

## 7. Battle improvement optimization

- Scope: all losses and battles below 3 stars, plus an explicit user-defined subset. Filter out complete battles by default.
- The native battle engine is the outcome authority. A recommendation is **verified only if the exact captured configuration, selected seed set, formation constraints and complete battle outcome can be replayed**.
- Candidate changes can include hero levels, equipment assignment/levels, relic changes/levels, skill choices and relevant Pantheon bonuses; only show changes the user can afford or farm legally.
- Find improvements benefiting **multiple target battles at once**, reducing total acquisition cost. Use a portfolio objective rather than simply summing independently optimized battles.
- Optimize primarily for minimum additional **farming days**, then total resources, then total upgrade actions. Allow targeting 1-star, victory, or 3-star separately. Return frontier alternatives when the cheapest plan trades confidence for days.
- Calculate a shared resource budget for one complete hypothetical plan. Baselines can come from saved game snapshots. Do not double-charge already-owned equipment or replacement heroes.
- Do not rely on a battle engine's unverified win boolean: validate objectives and rule compliance, inspect legal hero slots, battle-specific restrictions and the actual finished state.
- **Demo limitation:** one illustrative recipe per incomplete battle, not a real solver. The mock “lowest cost” names are UI labels only and are not proven optimal.

## 8. Farm forecast

For each required resource `r`:

```
missing[r] = max(0, plannedCost[r] - owned[r])
days[r] = missing[r] / confirmedAverageIncomePerDay[r]
additionalDays = max(days[r])
```

This is a **simple independent-resource lower-bound estimate**. If income is zero with a shortfall, mark the plan as unavailable/infinite. The future engine must handle daily caps, regeneration, event-only materials, time gates, crafting prerequisites, limited purchases, resource dependency chains and overlapping activities. Expose assumptions in UI. Estimates should update immediately when a draft is changed.

## 9. User flows

**Explore / edit**: Heroes → select hero row → inspect exactly five equipped item slots → select/reassign individual items and draft item levels → review all per-item stat rolls and active set bonuses → adjust hero level and relic → observe estimated resource cost and stat deltas → open Upgrade planner → name and save draft locally.

**Recover a battle**: Battle records → filter incomplete → choose battle → inspect actual recorded formation and candidate → add changes to draft → planner merges changes for all targets → save plan → later verify using native WASM.

**Counter Arena opponents**: Arena optimizer → choose Arena / Elite Arena → select opponent → inspect known successful saved formation vs recommended candidate → review proposed roster → store selected recommendation locally → verify before marking as playable.

**Plan resources**: Upgrade planner → review all changes → inspect each demand and owned balance → identify maximum farm shortfall → adjust priorities / undo items → save named plan.

## 10. Mock dataset and persistence

- `src/mock-data.js` contains all static fixtures for heroes, five equipment slots, uniquely identified equipment item instances with stat arrays and sets, resources, squads, opponents, battle records, and illustrative improvement recipes.
- Prototype user changes are held in memory and stored under `hoh-desktop-prototype-v2` in `localStorage` (a separate key to prevent obsolete one-equipment-slot drafts from being misread). Saved plans remain browser-local.
- No external APIs, game credentials, cookies, game writes, remote analytics, or background jobs.
- On a normal refresh, last draft and named plans reload from local storage. “Reset demo” clears prototype storage.
- When imported game data is connected, place mappers and validators in a **non-UI domain module**; replace fixture repository, not components. Use typed TypeScript for production code.

## 11. Engineering architecture for the real extension

Recommended layers:

```text
packages/game-import/       # Parsed snapshots, normalization, validation
packages/battle-engine/     # Native WASM adapter, deterministic battle replay
packages/optimization/      # Arena search, multi-battle portfolio, cost ranking
packages/farming/           # Resource flow and scheduling, time-to-target
packages/shared-models/     # TypeScript domain types, DTOs, constraints
apps/extension/src/ui/      # Reusable presentation components & app shell
apps/extension/src/state/   # View models, draft actions, selectors
```

The demo is a standalone dependency-free browser app for previewing layouts; it is **not** a replacement for the existing extension and must not be confused with the native engine. The production integration should implement a typed interface between snapshot repositories, pure selectors, optimizers, and React UI components; no direct fixture imports in the production UI.

## 12. Design synchronization contract

1. **Edit `docs/DESIGN.md` first.** This file owns product terminology, navigation, shared component semantics, screen layout, and interaction contracts.
2. Update shared component definitions and view implementations to match the design. Any intentional divergence must be documented here in the same change.
3. In the real Heroes of History extension, reuse the same interaction contracts and visual tokens; integrate with actual data/solvers behind interfaces, not via fixture imports.
4. For each changed view: capture desktop screenshots, run layout overflow checks at 1440×900 and 1920×1080, check keyboard behavior, and run the existing extension build and simulation tests.
5. Do not implement UI features claiming verified stats without engine evidence. Keep data-source labels visible.
6. Each UI pull request should say which sections of this document it implements, what remains mock/unverified, and whether the real game UI has been synchronized.
7. When the real extension is available, use the production repo’s `AGENTS.md` to find the actual integration points, and copy this document into its docs tree or maintain a clearly documented linked source of truth.

## 13. Proposed next milestones

- **P0:** Replace demo fixtures with read-only imported snapshots and actual hero/item/resource icons; preserve exact validity/rarity rules.
- **P0:** Add native seeded battle verification, legal squad validation, reliable objective/stars check, evidence badges, sample sizes.
- **P1:** Multi-target cheapest-victory optimizer with merged costs, farming days, shared equipment/relic optimization and Pareto alternatives.
- **P1:** Arena saved-formation persistence per opponent, multiple lineup trials with identical seed sets, three-team Elite Arena validation.
- **P2:** Workspace persistence (column sizing/order, inspector width, filters, layouts); diff previews and build-plan comparisons.

## 14. Visual tokens

| Token | Value |
| --- | --- |
| Window background | `#0d131d` |
| Sidebar / top bar | `#121b28` |
| Panel | `#151e2b` |
| Table header | `#1b2737` |
| Border | `#283548` |
| Primary foreground | `#e3e9f3` |
| Secondary foreground | `#8898ab` |
| Primary teal | `#5dcbbd` |
| Success | `#77d9bd` |
| Defeat | `#f18f96` |
| Farm warning | `#e7bb72` |
| Detail inspector | 320px default |
| Main radius | 9px |
| Table density | 11px body text; 9px uppercase headers |

## 15. Equipment model and five-slot hero loadout — screenshot-driven update (2026-11-11)

The reference game screenshots show **five pieces equipped simultaneously** per hero: **two visual positions to the left of the portrait and three to the right**. A selected item has **multiple stat lines**, not one generic effect. The displayed example is a purple level-12 five-star **Scientist’s Pen**, with `ATK 33`, `HP 80`, `Base DMG % 2.04%`, `DEF % 2.8%` and an active **Scientist’s Set 2/2 → Hit Points +5%**. These visible numbers are reference-only for that example; other items can carry different stat lists and units. Progress bars beneath rolled stats may be shown as indicative grading bars when known; do not invent actual game roll caps or imply an unknown bar is exact.

### Data contract

- Each hero has **exactly five equip positions** in the UI. For this prototype, use clear descriptive slot labels `Weapon`, `Body`, `Head`, `Neck` and `Wrist`; these are **provisional UI labels** based on the screenshot positions, not verified official game slot names. Keep positions stable in the record as slot IDs, with `Weapon`/`Body` on left and `Head`/`Neck`/`Wrist` on right.
- Store each **inventory item instance** under a stable unique `id`, distinct from its name/type; each has `slot`, `rarity`, `stars`, `level`, `maxLevel` (mock), `setId`, optional `owner`, optional `icon`, and `stats: [{ key, label, value, unit: 'flat' | 'percent', ... }]`. Preserve the independent stat entries and decimal precision; never collapse into one `bonus` string.
- The baseline hero fixture owns a five-position equipment map `equipmentSlots: { weapon: itemId|null, body: ..., head: ..., neck: ..., wrist: ... }`. A missing piece is explicitly shown as an empty slot; avoid treating an equipment set/type as a slot assignment. A hero can equip no more than one item in each slot and the same item **instance** cannot be assigned to multiple heroes simultaneously.
- Set definitions provide `setId`, name, required piece count and a list of bonus stat effects. Recompute set counts for the **current draft**. Example: 2/2 Scientist grants Hit Points +5% and remains active while both matching pieces are equipped. Display a disabled/progress state for 1/2. Do not assume every set uses the same threshold or bonus.
- A hypothetical item level change is stored by item instance ID in an `itemLevels` draft map; do not update the base item or multiply costs per hero. Show per-item stat values as **static mock rolls** unless the actual game's scaling formula is known; do not fabricate level-based stat gains.
- When discarding changes for a hero who has borrowed a piece, restore the hero's baseline gear, return borrowed items to their baseline owner where that original slot is empty, and maintain global instance uniqueness. An item already equipped elsewhere is never silently duplicated during reset.
- Equipment assignment is a **zero-cost draft rearrangement** in this prototype; planned level increases have illustrative ore/scroll costs. Replacing an item in a slot displaces the prior instance to unassigned, and moving an item from a different hero/slot also unequips it from its previous location. Display which hero loses a piece when a cross-hero assignment is requested.
- The upgrade planner must aggregate hero level costs, relic changes, and **unique item-level upgrades only once**, even when the item is moved between heroes. Show each equipment swap separately from upgrade expenses. Local saved plans persist both assignments and item level targets. The save-plan modal must submit the typed plan name without the enclosing backdrop intercepting form clicks; only an actual backdrop click or explicit close control closes that modal.

### Screens and reusable components

- **Heroes table:** replace the single Equipment column with `Slots` (`5/5`, `4/5`) and `Equipment stats` (compact combined flat/percent breakdown). A selected hero's inspector shows a compact **five-slot equipment loadout** modeled on the screenshot: visual left/right slot positions when space permits, but in a narrow inspector a 2-column grid ordered by slot. Display rarity, stars, level and item icon for every occupied slot; clicking a slot opens its stats and editable assignment. A visually prominent **selected item details card** uses a muted **purple rarity header with gold star accents** and dark readable stat rows (a desktop-friendly nod to the game card). It lists every stat roll (ATK, HP, Base DMG %, DEF % etc.) and active set bonuses, separate from level/cost controls.
- **Equipment table:** show a row per inventory instance with slot, stars, level, a multi-line concise **all stats** cell, set progress indicator and actual or draft owner. Selecting a row opens the same selected-item details card and set explanation as in the hero inspector. Show at least one unassigned instance and items with different numbers of stats.
- **Window draft indicator:** count both heroes with changed levels/relics/slot assignments and unique item-level upgrades; do not misleadingly show “0 unsaved heroes” when only equipment is edited.
- **Upgrade planner:** show a readable five-slot change summary per hero, the changes from source to target assignment, equipment level upgrades and combined resource/farm forecast. Display a cost breakdown with mock source labels. Do not count assignment changes as paid upgrades unless supported by actual game data.
- **Arena / Battles:** when recommending equipment changes, reference **item instance and slot** rather than a single generic equipment label. In this mock prototype, illustrative battle recipes that previously referenced an equipment type now produce a valid single-slot equipment suggestion when an appropriate instance exists, or just level/relic changes otherwise. A demo recommendation is never labelled an engine-verified outcome.
- **Read-only guarantee:** all five-slot assignment edits and upgrades change only local planned state, never the real game.

### Validation scenarios

1. Cleopatra with five occupied slots displays `5/5`, each item's independent stat lines, and `Scientist’s Set 2/2 — Hit Points +5%` when both Scientist pieces remain assigned.
2. Removing one Scientist piece changes set progress to `1/2`, deactivating the bonus; restore it to reactivate the bonus.
3. Assigning an item already worn by another hero explicitly moves that unique instance, so its old owner becomes `4/5`.
4. Increase an item level from the mock baseline to the maximum; it appears once in the planned costs, and the cost estimate updates if its assignment changes.
5. No 100vw/100vh root overflow; equipment stat detail and slot controls remain scrollable at 1440×900 and 1920×1080.
6. Saving, loading, discarding or resetting a draft restores both equipment positions and item-level edits correctly.


## 16. Equipment picker dialog and desktop scrollbars — usability update (2026-11-11)

**Status: required for the prototype and all later production UI implementations.** The native equipment `<select>` in the hero inspector is replaced with a dedicated, searchable, filterable **equipment card picker**. The five equipment positions and item model from §15 are unchanged. No UI source files may be modified before this section is present, per `AGENTS.md`.

### 16.1 Opening and layout

- The hero inspector retains the five clickable slot tiles and the selected item's multi-stat details. Selecting a slot changes the inspector's details. Immediately beside/below the selected slot label, display a prominent **Change equipment** button (or **Equip item** when empty); this button opens the picker for **the currently selected hero and that particular slot**. Eliminate all native equipment `<select>` controls from the inspector.
- Present a centered, dark, app-native dialog using the application's navigation and surface tokens, not a browser select/dropdown. On desktop target roughly `min(960px, viewport width − 48px)` wide and at most `min(760px, viewport height − 60px)` tall; never extend outside the 100vw × 100vh shell. On smaller widths, reduce card columns without causing horizontal page scroll.
- Header: `Choose [slot] equipment`, target hero, a small matching-items count, and a close button. Toolbar: accessible search field plus compact **Rarity**, **Set**, and **Ownership** filters and **Sort** control. Search matches item name, set name, stat names, and owner hero name. Slot compatibility is fixed to the slot used to open the picker (do not offer incompatible items).
- Dialog body: responsive 2–3 column **equipment card grid**, with the card collection as the *only primary scroll region*. Each card shows item artwork/icon or fallback; item name; rarity/stars; current/draft level; set name; **all independent stat names and values**; draft owner (or `Unassigned`); and a short owner transfer warning for items currently owned by other heroes. Show an explicit **Currently equipped** visual for the target slot's item. Empty/search-zero state includes clear filter affordance.
- Clicking a card assigns that unique item to the target slot using the existing draft move rule, closes the dialog, updates the selected slot and the stat panel, and refreshes set counts, item owners, upgrade costs, and planner totals. Do not duplicate borrowed instances. Show an owner-transfer notice when moving an item away from another hero.
- Dialog footer stays visible: **Unequip slot** (clears the target slot, if occupied) and **Cancel** (makes no changes). Close by `Escape` or backdrop click. Clicking inside the dialog or filters must not close it. When opened, focus search; on dismissal, restore focus to the launcher. Keyboard Tab order remains usable and focus must not escape the open modal. The page behind is noninteractive during the modal.
- The equipment inventory table continues to select/inspect instances without silently moving them. Optionally expose a secondary **Assign to selected hero** action in that view only if the chosen hero and slot are unambiguous; this is not required for the prototype. All changes remain *local hypothetical drafts*.

### 16.2 Scrollbar treatment

- Apply the same understated desktop-app scrollbar design to every real scroll area (tables, inspectors, navigation, modal card grid, and any overflow panels), including Chromium/WebKit and Firefox where supported. Use approximately **7px** thickness, a transparent or near-panel track, medium-slate rounded thumb, and brighter thumb on hover/drag. Avoid white default browser scrollbars on dark surfaces; do not remove the scroll indication completely.
- Tables, inspectors and modal grid scroll within their own containers. Root `html/body/#app` never scroll; horizontal page overflow is forbidden at supported desktop sizes. Fixed dialog header/filters/footer must not scroll away with cards.
- Maintain visible keyboard focus and sufficient contrast on controls; the scrollbar is an affordance rather than the only cue that more content exists.

### 16.3 Required acceptance checks

1. No native equipment selection dropdown is visible in Heroes inspector. Opening the picker for `Wrist` shows only wrist-compatible cards, with working search, rarity/set/owner filters and sorting.
2. A wrist item currently on another hero is visibly marked as owned; assigning it removes it from that hero, updates slot counts and sets, and updates the target hero's item details and draft indicator.
3. `Unequip slot` removes the item and updates bonuses; `Cancel`, `Escape` and backdrop click do not change assignments.
4. Clicking a search box, filters, card, or scrollbar does not unintentionally dismiss the picker. Keyboard navigation stays within the dialog and focus returns after close.
5. Test modal with enough items to require scrolling at **1440×900** and **1920×1080**, with no outer page scrollbar, unclipped footer or horizontal overflow.
6. Verify all scrollable panels use subtle dark themed scrollbars (including the picker, hero inspector, and table), not native white tracks.

## 17. Hero roster draft visibility and changed-only filter (2026-11-11)

**Status: mandatory design-first update.** The Heroes screen must make every hypothetical modification visible at a glance, without requiring the user to inspect the upgrade planner. This section is the source of truth for implementation and tests; it precedes any roster UI change.

### 17.1 Canonical definition of a changed hero

- Compare against the **loaded baseline hero and baseline equipment instance data**, not against whether a `changes` or `assignments` object happens to contain a key. A hero is changed if **at least one effective difference** exists:
  1. Hero level differs from the original level.
  2. Equipped relic differs from the original relic (including a removal).
  3. Any of the five equipment instance assignments differs from its original slot (including unequipping, receiving an item from another hero, or losing an item to another hero).
  4. Any **currently equipped** equipment instance's draft level differs from that item's baseline level, even if the hero's equipment slots have not changed.
- Item-level upgrades of equipment that is **currently unassigned** still appear in Upgrade planner and the global item-upgrade count, but must **not** falsely mark a particular hero as edited. Cross-hero transfers mark **both** affected heroes because both loadouts differ.
- The same diff calculation powers row styling, counts, filter results, inspector and plan status; it recomputes after edits, transfers, unequips, item upgrades, recipe application, loading saved drafts, and resets. No invented stat changes from unknown equipment scaling formulas.

### 17.2 Roster table and controls

- Add a plainly labelled, keyboard-accessible **`Changed only`** toggle beside the hero search input, with a live count of **changed heroes across the entire roster** (e.g. `Changed only · 3`). Default **off**; toggling on shows only heroes with at least one effective change. Search and changed-only filtering combine; clearing the search does not disable the toggle. Turning it off restores the full roster.
- Put a **`Draft changes`** column directly after `Hero`, visible in the horizontal table scrolling area. Changed rows get a subtle accent background and left-side marker. Next to the hero name, display a clearly readable `EDITED` badge, not merely an unexplained dot near the level. Unchanged rows show `—` in the changes column.
- In the `Draft changes` cell, render a compact stack of **typed, before → after** descriptions, using short descriptive labels: `LEVEL 160 → 165`, `RELIC Old → New`, `WEAPON Old → New`, `WRIST Old → Empty`, `ITEM Scientist’s Pen Lv 12 → 15`, etc. Display the first **three** changes by default; if more exist show `+N more · see details` with a full-text native tooltip. Ensure long item names wrap cleanly without obscuring their before/after meaning. Never display meaningless same-value changes.
- Keep existing roster columns (rarity, role, level, power, attack, health, slots, combined equipment stats, relic) and dense desktop table behavior. Numeric level remains the **draft** level and may also render a compact old → new comparison when edited. Record count reflects the currently filtered heroes, not an unrelated table count.
- When changed-only mode hides the currently selected hero, select the first visible changed hero. If no hero meets the active filters, show a meaningful empty roster state and an inspector message such as **`No heroes match this filter`** with a **`Show all heroes`** action. Do not show an unchanged hero inspector while the table says `Changed only`.

### 17.3 Selected hero detail

- Immediately below the hero profile, show a **`Changes from snapshot`** comparison section for edited heroes. List **all** effective changes (no three-line cap) with type, before and after, using the same ordered diff model as the roster table. Include equipment-level changes for currently equipped items and identify equipment slots by their stable labels.
- For an unchanged hero, show a clear `No changes in current draft` status, not an empty section. This comparison is hypothetical and does not modify the real game. Existing five-slot equipment picker, stat-roll panel, set progress and upgrade controls remain intact.
- `Discard this hero changes` and global `Clear all` update badges, counts, diff descriptions, and filter immediately. If the last changed hero is reset while the changed-only filter is active, show the documented empty state. Saved-plan load and demo reset follow the same rule.

### 17.4 Acceptance criteria

1. Changing only a hero level yields an `EDITED` row, a visible `LEVEL old → new`, a matching inspector diff, and inclusion in the changed-only filter. Restoring baseline removes them.
2. Changing a relic, changing/clearing a slot, and borrowing a unique item produce accurate named before/after rows; both the donor and recipient are marked after a transfer.
3. Leveling a currently equipped item marks its current hero as changed even if no hero fields or assignments changed. Moving the upgraded item updates which hero shows the item-level diff. Unassigned item upgrades do not mark a hero.
4. Toggle the filter with zero and several edits, combine with text search, load a saved plan, reset individual/global changes, and confirm the table, inspector, counts, and filter stay consistent.
5. Validate the unchanged 100vw × 100vh shell and the readable changes column at 1440×900 and 1920×1080; the table may scroll **inside its pane**, while the overall page must not overflow.

## 18. Relic card-picker dialog — matching equipment selection (2026-11-11)

**Status: mandatory.** Before modifying the UI, specify relic selection here. The native `#hero-relic` `<select>` in the Heroes inspector must be removed. Relic selection must use the same dark, centered, fixed-shell dialog language and subtle scrollbars as the equipment picker defined in §16.

### 18.1 Inspector entry point and current assignment

- Under **Hero and relic draft**, retain the hero-level control, then show the relic's current name (or **Empty relic slot**) and a concise card-like preview of its icon, rarity, type, level and complete effect text. Mark differences from the imported snapshot using the existing roster/inspector diff system from §17.
- Add a conspicuous **Change relic** button (or **Equip relic** if empty), matching the equipment picker's action button. Clicking it opens the relic picker for the selected hero. No native relic dropdown is permitted in this inspector.
- Relic choices are *hypothetical and local*. Choosing or removing a relic must update the inspector, roster relic column, changed badges/`Changed only` filter, planner resource budget and local saved-plan state immediately.

### 18.2 Modal composition and interactions

- Open a centered, app-styled dialog with the same sizing, layered backdrop, visible fixed header and footer, independent scrollable card grid, and keyboard focus/escape/restore rules as §16. Title: **Choose relic**; subtitle identifies the hero and mock-data nature. Search is focused on open.
- Search by relic name, effect, type, rarity, and current hero users. Filters: **Type**, **Rarity**, **Assignment** (`All`, `Equipped by this hero`, `Equipped by others`, `Unassigned`) and **Sort** (`Highest level`, `Name A–Z`, `Rarity`). Counts show filtered matches and total relic types. A no-results state has a **Clear filters** control.
- Show responsive 2–3-column **relic cards** with icon, name, rarity, type, level, **full effect**, mock owned copies, and currently equipped hero names / a clear unassigned status. Make the selected hero's current relic card prominent with **Equipped**. Card click selects the relic and closes the dialog; footer **Unequip relic** clears the hero's relic (disabled if already empty), **Cancel** closes without changes.
- Close by Escape, Close/Cancel, or backdrop click; not by clicking inside the dialog. Trap Tab focus while open, restore focus to the launcher on Cancel and after a selection, and make the rest of the application inert. Retain the styled scrollbars and **100vw × 100vh, no root scroll** behavior for 1440×900, 1920×1080, and compact widths.

### 18.3 Fixture ownership and production contract

- The current mock `relics[]` fixtures are **relic types**, not unique equipped item instances. Several baseline heroes legitimately reference the same relic ID; `charges` is an illustrative fixture field, not a verified per-hero inventory limit. The prototype may show multiple names in **Equipped by** and must **not** silently unequip other heroes or claim legal copy availability when choosing a type. Do not mislabel these types as unique instances.
- Real-game import must replace this ambiguity with verified instance IDs, owned counts and equip restrictions. Only then may the production optimizer enforce exclusivity or copy limits. Keep planner relic-change cost estimation explicitly mock and unchanged by the dialog itself.
- Preserve existing `changes[heroId].relic` and saved plan format; this is a presentation/selection upgrade, not a data migration.

### 18.4 Acceptance checks

1. Heroes inspector has **no native relic `<select>`**; a button opens the dialog and a current-relic preview remains visible.
2. Cards show complete effects, icon/type/rarity/level, copies and assigned users; search, filters, sorting, zero-results and clear filters work and remain inside the modal.
3. Selecting a relic, unequipping it, and cancelling behave correctly. Changing a relic updates the original → draft difference and `Changed only` roster; reverting to baseline removes the flag. Saved plans preserve the chosen relic.
4. All modal entry/exit pathways maintain keyboard focus and do not trigger background interactions; the dialog and application do not cause document overflow at 1440×900 or 1920×1080.
5. The existing equipment picker and equipment-transfer semantics remain unchanged. Verify `npm run check`, `npm run test`, `npm run build` after implementation.

## 19. Relic Vault — persistent right-hand detail inspector (2026-11-11)

**Design-first change.** The Relics navigation view must use the **same master/detail split layout as the Equipment inventory**, not a full-width table. The inventory remains on the left; a fixed-width independently scrollable detail inspector sits on the right. This is an inventory inspection feature, separate from the Heroes screen's relic picker in §18. Retain the desktop app's 100vw × 100vh shell and thin dark scrollbars.

### 19.1 Table and selection

- Relic inventory rows are selectable. Clicking a row highlights it and updates the right-side detail panel without navigating away. The chosen relic persists while navigating within the app; sorting or searching does not arbitrarily reset it.
- Use a compact table with name/icon, rarity/stars, relic role/type, level (current/max when known), preview of effect, mock copies and the heroes using the type. Search and column sorting work with the same shared table primitives as Equipment.
- Select **Guardian Lion** by default in the prototype so the supplied game reference can be inspected immediately. For a selected relic excluded by search, automatically show the first filtered relic; when there are no results, show a clear empty detail state rather than unrelated details. An empty result should not change the last explicit selection.
- A table row is focusable and can be selected with Enter or Space. Make active selection visually clear and announce its state to assistive technology.

### 19.2 Detail inspector card

- Inspector heading: **RELIC DETAILS** with an explicit **Mock data** label. Use the same right panel width, fixed height, typography hierarchy and independent scrolling as the Equipment detail panel, with an illustrative relic identity header.
- At the top, display a visually prominent *relic identity panel*: icon/art placeholder; full name, rarity, five-star presentation when provided, current level / cap, type and optional transcendence status. Do not pretend the game's artwork has been imported.
- Below the header, show **individual base stats** as separate rows (ATK, DEF and any additional known attributes), preserving their labels and units. If a fixture has no verified numeric stats, render **Stats not captured** rather than inventing them.
- Show the relic's **skill/ability name** (for example **CLEANSE**), full effect description in a distinct readable panel, and cooldown where present. Highlight useful ability keywords while retaining accessible plain text. For relics without a named ability, label the existing effect **Effect**, without inventing an ability.
- Display owned copies as **Mock copies**, current draft users (multiple heroes may share a relic-type ID), and whether a level cap or transcendence state is known. Show a neutral **Max level** status for a relic already at its documented cap; do not provide a fake executable transcendence upgrade.
- A working **Open hero** action is available for one or more assigned heroes; clicking a specific hero switches to that hero's inspector. When multiple users exist, list them in a dedicated users section, with one action per hero. Preserve the existing hypothetical hero-change indicators and relic-picker behavior.
- Include an explicit note that relic-level upgrading, transcendence and resource pricing are not yet connected and no game state is changed by inspection.

### 19.3 Reference values and data ownership

- The user's Guardian Lion screenshot is an authoritative reference **for that shown example only**: **Guardian Lion**, 5 stars, level **10/10**, **ATK 46**, **DEF 138**, skill **CLEANSE**, granting immunity to being stunned with **9.60 s cooldown**. Its image/art can be represented by a clear icon placeholder. Add this as an illustrative fixture while marking the entire inventory dataset as mock. Do not generalize these attributes to other relics.
- Optional future data fields: `stars`, `maxLevel`, `stats[]` (`label`, `value`, optional `unit`), `abilityName`, `abilityDescription`, `cooldownSeconds`, `transcendenceStatus`. Preserve prior `id`, `name`, `type`, `rarity`, `level`, `effect`, `charges`, `icon` so §18 picker and saved hero plans remain compatible.
- All current relic IDs are **relic types**, not unique instances: `charges` is not a verified inventory count and cannot be used to enforce ownership or transfers. Display all current heroes using the selected type without silently unequipping anyone.

### 19.4 Viewport and acceptance tests

1. Relics screen displays **left inventory table + right detail inspector**, with `data-relic` row selection, active-row highlighting and matching inspector after click, search, sort and navigation.
2. Guardian Lion shows exactly level 10/10, five stars, ATK 46, DEF 138, CLEANSE, stunned immunity and a 9.60 s cooldown, with mock-art caveat.
3. Existing relic types with no captured base stats show a truthful missing-data state, not invented ATK/DEF. Effect strings and names are not truncated in the inspector.
4. The assigned heroes section lists all draft users and **Open hero** navigates to the correct hero without changing that hero's relic or draft.
5. No outer-document overflow at 1440×900 or 1920×1080. Tables, side panels and narrow screens scroll internally; at compact widths the inspector stacks below the table as already specified for Equipment.
6. Equipment view, Heroes relic picker, planner costs and saved plans continue to pass `npm run check`, `npm run test`, `npm run build`.

## 20. Hero roster opens a full-size detail dialog (2026-11-11)

**Supersedes previous Heroes side-inspector requirements.** The Heroes roster occupies the full workspace width and never reserves a narrow side inspector. Equipment and Relics navigation views retain their side inspectors.

### Roster and entry points
- Preserve searchable, sortable roster, Changed only filter/count, EDITED badges and complete before → after summaries.
- Add an explicit, keyboard accessible **Open details** button in a dedicated Details column for each hero. Clicking a row selects/highlights without unexpectedly opening a dialog; Open details opens the correct hero regardless of row selection.
- Heroes reached from Overview portraits, Equipment owning-hero links, and Relics user links must open the same hero dialog after switching to Heroes. Retain table filter/search after dialog close.

### Hero dialog visual layout
- Dark centered desktop dialog, up to **1160px** wide and approximately **90vh** tall, fixed header and footer, a single internally scrollable body with thin styled scrollbars; no outer-document scroll.
- Header identifies portrait, name, faction, role, mock-data status, and current **Edited / Unchanged** change count. Prominent Close; role dialog, accessible title, aria-modal, focus trapping, Escape/backdrop close, and focus restored to the row's Open details button.
- Spacious responsive two-column body: LEFT: base attributes, all before → after draft changes, incremental hero cost and whole-plan farming days. RIGHT: five equipment slots, individual item stats and set bonuses, selected slot's equipment picker launcher, planned hero-level control, relic preview and relic-picker launcher.
- At viewports ≤900px columns stack and remain usable with internal scrolling, without horizontal clipping.
- Persistent footer: Review combined plan (navigates, closing hero dialog), Discard this hero changes, and Close. All changes refresh modal, roster, costs and Edited badge without closing the hero dialog, including after reset when Changed only would hide that hero.

### Nested pickers and data continuity
- Existing searchable equipment/relic picker dialogs open above hero dialog and make the parent inert. Closing a picker with Escape, Cancel or backdrop returns to the same hero dialog/scroll position without changes. Choosing or unequipping an item updates both dialog and roster without leaving the hero editor and returns focus to the corresponding picker launcher.
- Preserve unique equipment transfer rules, relic-type mock semantics, saved-plan format and local-only read-only behavior. Closing the hero modal never discards the draft. Leaving Heroes to Planner or other workspace closes it. Save plans remain accessible after closing.

### Acceptance
1. Full-width Heroes table with per-row Open details buttons; no inline Heroes inspector.
2. Correct hero on every entry path; changed-only filter, diff summaries and actual draft state agree.
3. Level, item upgrades, equipment transfers, relic swaps and hero reset recompute edit badges/costs without dismissing the editor.
4. Nested pickers preserve their existing search, filtering, focus and Escape behavior; no backdrop click-through; parent remains open.
5. Verify at 1440×900, 1920×1080 and narrow viewport without page overflow.
6. Run check, test, build, add dialog-specific automated regression tests.
