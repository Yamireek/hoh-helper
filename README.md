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

![Changed-only hero roster with before/after comparisons](docs/previews/hero-roster-changed-1440x900.png)

![Filterable equipment card picker dialog](docs/previews/equipment-picker-1440x900.png)

![Equipment inventory and full item stats](docs/previews/equipment-desktop.png)

See also [1920×1080 changed-only roster](docs/previews/hero-roster-changed-1920x1080.png) and [hero equipment details](docs/previews/hero-equipment-details.png). Screenshots illustrate the mock prototype; the equipment picker is documented in §16 and roster change visibility in §17 of `docs/DESIGN.md`. Dark themed scrollbars are used throughout the application.  `docs/DESIGN.md` is authoritative if a screenshot and specification differ.

## Demo workflows

- **Heroes:** use **Changed only** to show edited heroes, with the roster’s before → after diff summary and a complete comparison in the selected hero inspector. Edited heroes include level and relic changes, slot swaps (both sides of a transfer), and level upgrades on currently equipped items. Click a hero and inspect its five equipment slots. Select a slot and press **Change equipment** to open a desktop-style card picker with search, rarity/set/ownership filters and sorting. Cards display all stats and the current owner; clicking one moves that *unique* item into the local draft, warning when it comes from another hero. Use **Unequip slot** to clear a slot, or **Cancel** / **Esc** to close without changes. The inspector continues to show per-item stats, set bonuses, hero/item levels, relics and draft costs.
- **Equipment:** browse 85 unique mock inventory instances, each with multiple flat/percentage stats, rarity, stars, level, assigned owner and active set progress; click a row for full details. **Relics / Resources:** searchable, sortable tables.
- **Battle records:** filter losses and sub-3-star results, open a record, add its illustrative recommendation to the common draft.
- **Arena optimizer:** review current opponents, saved lineup, suggested lineup, fixture win percentages and hero portraits. No actual optimization is executed.
- **Upgrade planner:** see all five-slot swaps, uniquely charged equipment level upgrades, combined costs, per-resource shortages, bottleneck farming days, and save/load named plans in browser local storage.

**Example from the reference screenshots:** Cleopatra has a level-12 five-star Scientist’s Pen with ATK 33, HP 80, Base DMG +2.04%, DEF +2.8%, and a two-piece Scientist’s Set bonus (Hit Points +5%). The screenshot values are reference examples; generated equipment stats and upgrade economics are illustrative. Slot names are provisional UI labels.

## Key limitations

Mock values are **not** scraped from your game account; probabilities are not measured and recommendations are not tested with the native game engine. This repository intentionally contains no capture system, credentials, API access, in-game click automation, or production optimizer. The planner must not be used for real-game spending decisions without integrating the verified production engine and data.

## GitHub repository setup

```bash
git init
git add .
git commit -m "Create Battle Lab desktop prototype and design specification"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/hoh-desktop-prototype.git
git push -u origin main
```

Create the empty repository on GitHub first, replacing `YOUR_ACCOUNT`. This prototype is a separate repository so it cannot overwrite or regress `hoh-battle-extension`. Later implementation should port the design documented in `docs/DESIGN.md` into the real extension through its own version control workflow.