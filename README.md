# Battle Lab — Heroes of History desktop UI prototype

A dependency-free desktop-style, browser-rendered prototype of a Heroes of History optimizer using **static mock data**. It fills the viewport (`100vw` × `100vh`) and feels like a data-dense desktop utility rather than a website.

**The design contract is in [`docs/DESIGN.md`](docs/DESIGN.md). Every UI change MUST begin by updating that document BEFORE editing the UI. The implementation MUST match the updated design.** [`AGENTS.md`](AGENTS.md) contains instructions for coding agents and later porting this design to the real extension.

## Run locally

Requires Node.js 20+ for the development server, or open the generated `standalone.html` directly in a browser.

```bash
npm run dev
```

Open the printed local URL (normally `http://localhost:5173`). For a distributable static build:

```bash
npm run check
npm run test
npm run build
npm run preview
```

`npm run build` produces both `dist/index.html` and a self-contained `standalone.html` that can be opened with `file://` without a server. The `dist/` folder can be hosted on GitHub Pages or any static host. Source `index.html` should be served via `npm run dev` (ES module imports are not generally allowed by `file://`).

## Visual previews

The working prototype is available in [`standalone.html`](standalone.html) and the editable sources are in [`src/`](src/). For layout and interaction details, read [`docs/DESIGN.md`](docs/DESIGN.md), especially sections 16 and 17.

The original desktop screenshots are currently distributed with the downloadable prototype archive, rather than committed to this repository.

## Demo workflows

- **Heroes:** use **Changed only** to show edited heroes, with the roster’s before → after diff summary and a complete comparison in the full-size hero detail dialog. Edited heroes include level and relic changes, slot swaps (both sides of a transfer), and level upgrades on currently equipped items. Click **Open details** in a hero row to inspect its five equipment slots in a spacious dialog. Select a slot and press **Change equipment** to open a desktop-style card picker with search, rarity/set/ownership filters and sorting. Cards display all stats and the current owner; clicking one moves that *unique* item into the local draft, warning when it comes from another hero. Use **Unequip slot** to clear a slot, or **Cancel** / **Esc** to close without changes. The hero dialog shows per-item stats, set bonuses, hero/item levels, relics and draft costs; edits and picker selections keep the dialog open.
- **Equipment:** browse 85 unique mock inventory instances, each with multiple flat/percentage stats, rarity, stars, level, assigned owner and active set progress; click a row for full details. **Relics / Resources:** searchable, sortable tables.
- **Battle records:** filter losses and sub-3-star results, open a record, add its illustrative recommendation to the common draft.
- **Arena optimizer:** review current opponents, saved lineup, suggested lineup, fixture win percentages and hero portraits. No actual optimization is executed.
- **Upgrade planner:** see all five-slot swaps, uniquely charged equipment level upgrades, combined costs, per-resource shortages, bottleneck farming days, and save/load named plans in browser local storage.

**Example from the reference screenshots:** Cleopatra has a level-12 five-star Scientist’s Pen with ATK 33, HP 80, Base DMG +2.04%, DEF +2.8%, and a two-piece Scientist’s Set bonus (Hit Points +5%). The screenshot values are reference examples; generated equipment stats and upgrade economics are illustrative. Slot names are provisional UI labels.

## Key limitations

Mock values are **not** scraped from your game account; probabilities are not measured and recommendations are not tested with the native game engine. This repository intentionally contains no capture system, credentials, API access, in-game click automation, or production optimizer. The planner must not be used for real-game spending decisions without integrating the verified production engine and data.

## Clone this repository

```bash
git clone https://github.com/Yamireek/hoh-helper.git
cd hoh-helper
npm run check
npm test
npm run build
npm run dev
```


## Hero details dialog (DESIGN §20)

The full-width Heroes roster now provides an **Open details** button on each row. It opens a large desktop dialog with hero attributes, complete before/after changes, all five equipment slots, item/set details, relic picker, and farming costs. The equipment/relic card pickers open above this dialog and return to it on selection or cancel. Draft and saved-plan semantics stay local-only; the prototype never changes in-game data.

See the source-of-truth contract in [docs/DESIGN.md](docs/DESIGN.md) and the mandatory design-first rules in [AGENTS.md](AGENTS.md).

### Single hero identity and top-level level editor

The Heroes dialog renders the portrait, name, faction, role, stars and level once in its fixed header. The planned level slider is the first card in the dialog, immediately above attributes and draft changes; Relic is a separate right-column card. See `docs/DESIGN.md` §22.

### Revert individual hero changes

Each entry under Heroes → Open details → Changes from snapshot has a per-row curved-arrow revert button restoring only the identified change. Unique equipment transfers return the original item without duplication. See `docs/DESIGN.md` §23.

### Opening standalone HTML directly

The built `standalone.html` is fully self-contained. Open it directly from your filesystem, without a server. If startup fails, a visible error panel appears. Builds and CI check its embedded CSS, JavaScript syntax, complete source equality, and initial offline rendering with local storage denied.
