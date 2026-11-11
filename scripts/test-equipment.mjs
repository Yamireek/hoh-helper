import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { heroes, equipment, equipmentSets, equipmentSlots, resources, squads, opponents, battles, recipes, relics, formatNum } from '../src/mock-data.js';

const fixtureIds=new Set(equipment.map(item=>item.id));
assert.equal(fixtureIds.size,equipment.length,'Every equipment instance must have unique ID');
assert.equal(equipmentSlots.length,5,'A hero must have exactly five slot positions');
for(const hero of heroes){
  assert.deepEqual(Object.keys(hero.equipmentSlots),equipmentSlots.map(slot=>slot.id),'Hero has five canonical slots');
  for(const [slot,id] of Object.entries(hero.equipmentSlots)){
    assert.equal(equipment.find(x=>x.id===id)?.slot,slot,`Illegal slot on ${hero.id}`);
    assert(equipment.find(x=>x.id===id)?.stats.length>=2,`Multi-stat equipment missing ${id}`);
  }
}
const pen=equipment.find(item=>item.id==='scientist-pen');
assert.deepEqual(pen.stats.map(x=>x.value),[33,80,2.04,2.8]);
assert(equipmentSets.some(x=>x.id==='scientist'&&x.required===2&&x.bonuses[0].value===5));

const storage=new Map();
const app={innerHTML:''};
const document={getElementById:()=>app,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),addEventListener:()=>{}};
const context=vm.createContext({heroes,equipment,equipmentSets,equipmentSlots,resources,squads,opponents,battles,recipes,relics,formatNum,
  document,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  structuredClone,clearTimeout,setTimeout:()=>0,console});
let code=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
code=code.replace(/^import .*?from '\.\/mock-data\.js';\n/,'').replace(/^import .*?from '\.\/replay-simulation\.js';\n/,'').replace(/\nrender\(\);\s*$/,'');
vm.runInContext(code,context);
const evaluate=expr=>vm.runInContext(expr,context);
assert.equal(evaluate("setProgress('cleopatra').find(x=>x.id==='scientist').count"),2);
assert.equal(evaluate("heroGear('cleopatra').weapon"),'scientist-pen');
assert(evaluate("heroInspector().includes('Base DMG')"));
assert(evaluate("heroesView().includes('Equipment stats')"));
assert(evaluate("heroInspector().includes('data-action=\"openEquipmentPicker\"')"),'Equipment dialog launcher missing');
assert(!evaluate("heroInspector().includes('id=\"slot-equipment\"')"),'Native equipment dropdown must be removed');
evaluate("state.selectedHero='cleopatra';state.activeSlot='wrist';equipmentPicker={heroId:'cleopatra',slotId:'wrist',search:'',rarity:'All',set:'All',ownership:'All',sort:'Highest level'}");
assert.equal(evaluate("filteredPickerItems().length"),17,'Picker filters by the active slot');
assert(evaluate("filteredPickerItems().every(item=>item.slot==='wrist')"));
evaluate("equipmentPicker.search='def'");
assert(evaluate("filteredPickerItems().every(item=>item.stats.some(s=>s.label.toLowerCase().includes('def')))"));
evaluate("equipmentPicker.search='';equipmentPicker.ownership='Other heroes'");
assert(evaluate("filteredPickerItems().every(item=>equipmentOwner(item.id)?.heroId!=='cleopatra'&&equipmentOwner(item.id))"));
evaluate("equipmentPicker.ownership='Unassigned'");
assert(evaluate("filteredPickerItems().every(item=>!equipmentOwner(item.id))"));
evaluate("equipmentPicker.ownership='All';equipmentPicker.sort='Name A–Z'");
assert(evaluate("filteredPickerItems().every((item,i,items)=>!i||items[i-1].name.localeCompare(item.name)<=0)"));
assert(evaluate("pickerCard(filteredPickerItems()[0]).includes('picker-card-stats')"));
assert(evaluate("pickerCard(filteredPickerItems()[0]).includes('picker-card-owner')"));
evaluate('equipmentPicker=null');

assert(evaluate("inventoryView('equipment').includes('Scientist’s Pen')"));
evaluate("moveItem('cleopatra','weapon','')");
assert.equal(evaluate("setProgress('cleopatra').find(x=>x.id==='scientist').count"),1);
assert.equal(evaluate("heroGear('cleopatra').weapon"),null);
evaluate("moveItem('cleopatra','weapon','scientist-pen')");
assert.equal(evaluate("setProgress('cleopatra').find(x=>x.id==='scientist').count"),2);
evaluate("moveItem('achilles','weapon','scientist-pen')");
assert.equal(evaluate("heroGear('cleopatra').weapon"),null);
assert.equal(evaluate("heroGear('achilles').weapon"),'scientist-pen');
assert.equal(evaluate("equipmentOwner('scientist-pen').heroId"),'achilles');
evaluate("resetHeroDraft('achilles')");
assert.equal(evaluate("heroGear('achilles').weapon"),'achilles-weapon');
assert.equal(evaluate("heroGear('cleopatra').weapon"),'scientist-pen');
evaluate("changeItemLevel('scientist-pen',17)");
assert.equal(evaluate('upgradedItems().length'),1);
assert.equal(evaluate('allCosts().ore'),50);
assert.equal(evaluate('allCosts().scrolls'),15);
evaluate("moveItem('achilles','weapon','scientist-pen')");
assert.equal(evaluate('allCosts().ore'),50,'Moving upgraded item must not double-count its cost');
assert(evaluate('plannerView().includes("Equipment level changes")'));
assert(storage.has('hoh-desktop-prototype-v2'));
console.log('Five-slot equipment fixtures, set activation, unique assignment, reset, farming cost, and rendering contract: OK');
