import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {simulateMockBattle,mockReplayAt} from '../src/replay-simulation.js';
import {heroes,equipment,equipmentSets,equipmentSlots,resources,squads,opponents,battles,recipes,relics,formatNum} from '../src/mock-data.js';

const findSquad=b=>squads.find(s=>s.id===b.team);
for(const b of battles){
  const a=simulateMockBattle(b,findSquad(b),heroes);
  const twin=simulateMockBattle(b,findSquad(b),heroes);
  assert.deepEqual(a,twin,`Seed ${b.seed} must produce the same trace`);
  assert.equal(a.kind,'synthetic');
  assert.equal(a.units.length,10);
  assert(a.duration>0&&a.duration<=64);
  assert.equal(a.frames.at(-1).time,a.duration);
  assert.equal(a.frames.length,Math.round(a.duration/.2)+1);
  assert(a.events.length>0);
  assert(a.events.every((e,i)=>e.time>=0&&e.time<=a.duration&&(i===0||e.time>=a.events[i-1].time)));
  const start=mockReplayAt(a,0),mid=mockReplayAt(a,a.duration/2),end=mockReplayAt(a,a.duration);
  assert.equal(start.ally.damage,0);
  assert.equal(start.ally.healing,0);
  assert.equal(start.ally.alive,5);
  assert.equal(start.enemy.alive,5);
  assert(mid.ally.damage<=end.ally.damage);
  assert(mid.ally.healing<=end.ally.healing);
  assert.equal(end.events.length,a.events.length);
  assert(end.units.every(u=>u.hp>=0&&u.hp<=u.maxHp));
  assert.equal(end.ally.damage,end.units.filter(u=>u.team==='ally').reduce((n,u)=>n+u.stats.damage,0));
  assert.equal(end.enemy.damage,end.units.filter(u=>u.team==='enemy').reduce((n,u)=>n+u.stats.damage,0));
  assert.equal(end.ally.damage,a.events.filter(e=>a.units[e.source].team==='ally'&&e.kind!=='heal').reduce((n,e)=>n+e.amount,0));
  assert.equal(end.ally.healing,a.events.filter(e=>a.units[e.source].team==='ally'&&e.kind==='heal').reduce((n,e)=>n+e.amount,0));
  assert.equal(end.enemy.kills,5-end.ally.alive);
  assert.equal(end.ally.kills,5-end.enemy.alive);
  assert.equal(end.ally.currentHp,end.units.filter(u=>u.team==='ally').reduce((n,u)=>n+u.hp,0));
  const afterEnd=mockReplayAt(a,a.duration+999);
  assert.equal(afterEnd.frameTime,end.frameTime);
  assert.equal(mockReplayAt(a,-12).ally.damage,0);
  let consumed=0;
  const remaining=a.units.map(u=>u.maxHp);
  for(const event of a.events){
    remaining[event.target]=event.kind==='heal'?Math.min(a.units[event.target].maxHp,remaining[event.target]+event.amount):remaining[event.target]-event.amount;
    assert.equal(remaining[event.target],event.hpAfter);
    assert(event.amount>=0);
    consumed++;
  }
  assert.equal(consumed,a.events.length);
  assert.deepEqual(remaining,end.units.map(u=>u.hp));
}
const first=simulateMockBattle(battles[0],findSquad(battles[0]),heroes);
const other=simulateMockBattle({...battles[0],seed:'349864'},findSquad(battles[0]),heroes);
assert.notDeepEqual(first.events,other.events,'Different seeds should yield different events');

const document={getElementById:()=>({innerHTML:''}),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),addEventListener:()=>{},activeElement:null};
const context=vm.createContext({heroes,equipment,equipmentSets,equipmentSlots,resources,squads,opponents,battles,recipes,relics,formatNum,
 simulateMockBattle,mockReplayAt,document,
 localStorage:{getItem:()=>null,setItem:()=>{}},structuredClone,clearTimeout,setTimeout:()=>0,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},console});
let source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
  .replace(/^import .*?from '.\/mock-data\.js';\n/,'')
  .replace(/^import .*?from '.\/replay-simulation\.js';\n/,'');
vm.runInContext(source,context);
const ev=s=>vm.runInContext(s,context);
ev("state.view='battles';state.battleFilter='All'");
const table=ev('battlesView()');
assert.equal((table.match(/data-open-battle-replay=/g)||[]).length,battles.length);
assert(!table.includes('position:sticky;right:0'));
assert(table.includes('width:64px'));
assert(table.includes('aria-label="Open replay for Sparta'));
ev("openBattleReplay('b1')");
assert.equal(ev('replaySession.id'),'b1');
assert.equal(ev('replaySession.time'),0);
const modal=ev('replayModalMarkup()');
assert(modal.includes('role="dialog"')&&modal.includes('aria-modal="true"'));
assert(modal.includes('Mock simulation'));
assert(modal.includes('Synthetic')||modal.includes('SYNTHETIC'));
assert(modal.includes('id="replay-time"')&&modal.includes('data-replay-action="play"'));
assert(modal.includes('id="replay-stats"')&&modal.includes('id="replay-scene"'));
assert(!modal.includes('Verified Unity result'));
assert(ev('replayStatsMarkup(mockReplayAt(replaySession.trace,0)).includes("Team damage")'));
assert(ev('replayEventsMarkup(replaySession.trace,mockReplayAt(replaySession.trace,0)).includes("Events appear")'));
ev("replayControl('play')");
assert.equal(ev('replaySession.playing'),true);
ev('replayTick(1000)');ev('replayTick(1040)');
assert(ev('replaySession.time>0'));
ev("replayControl('back')");
assert.equal(ev('replaySession.playing'),false);
ev("replayControl('forward')");
assert(ev('replaySession.time>=0.2'));
ev("replayControl('restart')");
assert.equal(ev('replaySession.time'),0);
ev('closeBattleReplay()');
assert.equal(ev('replaySession'),null);
assert.equal(ev('replayFrameHandle'),null);
ev("openBattleReplay('b2')");
assert.equal(ev('replaySession.id'),'b2');
ev("goto('arena')");
assert.equal(ev('replaySession'),null);
assert.equal(ev('state.view'),'arena');
console.log('Synthetic engine deterministic, event-accounted replay, modal and time controls: OK');
