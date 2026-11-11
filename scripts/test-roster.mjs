import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {heroes,equipment,equipmentSets,equipmentSlots,resources,squads,opponents,battles,recipes,relics,formatNum} from '../src/mock-data.js';

const storage=new Map();
const document={getElementById:()=>({innerHTML:''}),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),addEventListener:()=>{}};
const context=vm.createContext({heroes,equipment,equipmentSets,equipmentSlots,resources,squads,opponents,battles,recipes,relics,formatNum,document,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  structuredClone,clearTimeout,setTimeout:()=>0,console});
const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
  .replace(/^import .*?from '\.\/mock-data\.js';\n/,'').replace(/^import .*?from '\.\/replay-simulation\.js';\n/,'').replace(/\nrender\(\);\s*$/,'');
vm.runInContext(source,context);
const ev=code=>vm.runInContext(code,context);
const names=()=>Array.from(ev('visibleHeroes().map(x=>x.id)'));
const changeTypes=id=>Array.from(ev(`heroDiff('${id}').map(x=>x.kind)`));
const diffTexts=id=>Array.from(ev(`heroDiff('${id}').map(x=>x.label+': '+x.before+' → '+x.after)`));

assert.equal(ev('changedHeroes().length'),0,'Baseline has no changed heroes');
assert(ev('heroesView().includes("Changed only")'),'Roster filter missing');
assert(ev('heroesView().includes("Draft changes")'),'Roster diff column missing');
assert(ev('heroInspector().includes("No changes in current draft")'));

// Level and relic comparisons must be based on actual before/after values.
ev("changeHero('cleopatra','level',186)");
assert.deepEqual(changeTypes('cleopatra'),['LEVEL']);
assert(diffTexts('cleopatra').includes('Level: 180 → 186'));
assert(ev('heroesView().includes("hero-draft-tag")'));
ev("state.selectedHero='cleopatra'");
assert(ev('heroInspector().includes("Changes from snapshot")'));
assert(ev('heroInspector().includes("180") && heroInspector().includes("186")'));
ev("changeHero('cleopatra','relic','valor')");
assert.deepEqual(changeTypes('cleopatra'),['LEVEL','RELIC']);
assert(diffTexts('cleopatra').includes('Relic: Serpent Sigil → Medallion of Valor'));
ev("changeHero('cleopatra','level',180);changeHero('cleopatra','relic','serpent')");
assert.equal(ev('changedHeroes().length'),0,'Reverting to baseline removes the changed indicator');

// A gear transfer changes BOTH owners and the tooltips/inspector show named items.
ev("moveItem('achilles','weapon','scientist-pen')");
assert.deepEqual(names().filter(id=>ev(`hasHeroDraft('${id}')`)).sort(),['achilles','cleopatra']);
assert(diffTexts('cleopatra').some(x=>x.includes('Scientist’s Pen → Empty')));
assert(diffTexts('achilles').some(x=>x.includes('Myth Blade → Scientist’s Pen')));
ev('state.heroChangedOnly=true');
assert.deepEqual(names().sort(),['achilles','cleopatra']);
assert(ev('heroesView().includes("2</b>")'),'Changed-only control must show total changed count');
ev("state.search='cleo'");
assert.deepEqual(names(),['cleopatra']);
ev("state.search='does-not-exist'");
assert.equal(names().length,0);
assert(ev('heroesView().includes("No heroes match this filter")'));
ev("state.search=''");

// Item upgrades follow the currently equipped unique item, not its old owner.
ev("changeItemLevel('scientist-pen',16)");
assert(changeTypes('achilles').includes('ITEM'));
assert(!changeTypes('cleopatra').includes('ITEM'));
assert(diffTexts('achilles').some(x=>x.includes('Scientist’s Pen: Lv 12 → Lv 16')));
ev("moveItem('cleopatra','weapon','scientist-pen')");
assert(changeTypes('cleopatra').includes('ITEM'));
assert(!changeTypes('achilles').includes('ITEM'));
ev("resetHeroDraft('achilles')");
ev("changeItemLevel('scientist-pen',12)");
assert.equal(ev('changedHeroes().length'),0);

// Upgraded, unassigned equipment must not invent an edited hero.
ev("moveItem('cleopatra','weapon',null)");
ev("changeItemLevel('scientist-pen',15)");
assert.deepEqual(changeTypes('cleopatra'),['SLOT']);
assert.equal(ev('changedHeroes().length'),1);
ev("resetHeroDraft('cleopatra')");
assert.equal(ev('changedHeroes().length'),0);
assert.equal(names().length,0,'Changed-only filter shows empty result after resetting last changed hero');
assert(ev('heroesView().includes("Show all heroes")'));
ev("act('showAllHeroes')");
assert.equal(ev('state.heroChangedOnly'),false);
assert.equal(names().length,heroes.length);

// Reload from saved plan/snapshot and resetting all must recompute against the immutable baseline.
ev("state.changes={cleopatra:{level:186}};state.assignments={achilles:{weapon:'scientist-pen'},cleopatra:{weapon:null}};state.itemLevels={'scientist-pen':16}");
assert.equal(ev('changedHeroes().length'),2);
ev("state.heroChangedOnly=true;state.selectedHero='leonardo'");
assert(ev('heroesView().includes("Draft changes")'));
assert(names().includes(ev('state.selectedHero')),'Filtered selection must land on a changed hero');
ev("act('resetChanges')");
assert.equal(ev('changedHeroes().length'),0);
assert.equal(names().length,0);
assert(storage.has('hoh-desktop-prototype-v2'));
console.log('Roster changed-only filtering, baseline comparisons, item transfers, item upgrades, selection, empty states, and resets: OK');
