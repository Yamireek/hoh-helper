// Pure, deterministic *synthetic* combat trace generator for the UI prototype.
// This is NOT Heroes of History game mechanics or a native Unity/WASM replay.
// API deliberately operates on plain data, so a verified native trace can replace it.

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round1 = n => Math.round(n * 10) / 10;

function seedRandom(seed) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function baseStat() { return { damage: 0, taken: 0, healing: 0, abilities: 0, kills: 0 }; }
function cloneStats(items) { return items.map(value => ({ ...value })); }

/**
 * @param {{id:string,name:string,seed:string|number,team:string,mode:string}} battle
 * @param {{id:string,name:string,heroes:string[]}} formation
 * @param {Array<{id:string,name:string,portrait:string,role:string,attack:number,health:number}>} heroDefinitions
 */
export function simulateMockBattle(battle, formation, heroDefinitions) {
  if (!battle || !formation || !Array.isArray(formation.heroes)) throw Error('A battle and formation are required');
  const random = seedRandom(battle.seed);
  const heroById = new Map(heroDefinitions.map(hero => [hero.id, hero]));
  const roster = formation.heroes.map((id, i) => {
    const hero = heroById.get(id);
    if (!hero) throw Error(`Unknown mock hero: ${id}`);
    return {
      id:`ally-${id}`, heroId:id, name:hero.name, short:hero.portrait || hero.name.slice(0,2),
      team:'ally', role:hero.role, slot:i,
      maxHp: Math.max(350, Math.round(hero.health * 0.044)),
      attack: Math.max(24, Math.round(hero.attack * 0.027)),
      initialX: [31,19,19,31,19][i] ?? 20, initialY:[24,17,50,72,82][i] ?? 50
    };
  });
  const enemies = ['Vanguard','Sentinel','Arcanist','Raider','Warlord'].map((name, i) => ({
    id:`enemy-${i}`,heroId:null,name,short:['VG','SE','AR','RA','WL'][i],team:'enemy',role: i===2?'Caster':i===4?'Boss':'Enemy',slot:i,
    maxHp:Math.round((890 + random()*450) * (battle.result==='Defeat'?1.13:1)),
    attack:Math.round((52+random()*30) * (battle.result==='Defeat'?1.18:1)),
    initialX:[69,81,81,69,81][i],initialY:[24,17,50,72,82][i]
  }));
  const units=[...roster,...enemies];
  const hp=units.map(u=>u.maxHp),stats=units.map(baseStat);
  const next=units.map((u,i)=>round1(0.65+i*0.07+random()*0.8));
  const casts=units.map(()=>0);
  const events=[],frames=[];
  const frame = (time)=>({ time: round1(time), hp:hp.slice(), stats:cloneStats(stats), eventCount:events.length });
  frames.push(frame(0));
  let end=0;
  for(let tick=1;tick<=320;tick++){
    const time=round1(tick*0.2);
    const order=units.map((_,i)=>i).sort((a,b)=>next[a]-next[b]||a-b);
    for(const i of order){
      if(hp[i]<=0 || next[i]>time+0.0001) continue;
      const unit=units[i];
      const enemyIndices=units.map((u,index)=>u.team!==unit.team&&hp[index]>0?index:-1).filter(index=>index>=0);
      if(!enemyIndices.length)break;
      casts[i]++;
      const ability=unit.team==='ally'&&casts[i]%5===0 || unit.team==='enemy'&&casts[i]%7===0;
      const heal=unit.team==='ally'&&(/support|healer/i.test(unit.role))&&ability;
      if(heal){
        const targets=units.map((u,index)=>u.team===unit.team&&hp[index]>0?index:-1).filter(index=>index>=0);
        const target=targets.reduce((best,index)=>hp[index]/units[index].maxHp<hp[best]/units[best].maxHp?index:best,targets[0]);
        const amount=Math.min(units[target].maxHp-hp[target],Math.round(unit.attack*(0.7+random()*0.45)));
        hp[target]+=amount;stats[i].healing+=amount;stats[i].abilities++;
        events.push({time,source:i,target,kind:'heal',ability:'Synthetic support pulse',amount,hpAfter:hp[target]});
      }else{
        const target=enemyIndices[Math.floor(random()*enemyIndices.length)];
        const raw=Math.round(unit.attack*(0.69+random()*0.58)*(ability?1.65:1));
        const amount=Math.min(hp[target],raw);
        hp[target]-=amount;stats[i].damage+=amount;stats[target].taken+=amount;
        if(ability)stats[i].abilities++;
        if(hp[target]===0)stats[i].kills++;
        events.push({time,source:i,target,kind:ability?'ability':'attack',ability:ability?'Synthetic power strike':null,amount,hpAfter:hp[target],defeated:hp[target]===0});
      }
      next[i]=round1(time+(unit.team==='ally'?0.83:1.08)+random()*(unit.team==='ally'?0.82:1.06));
    }
    frames.push(frame(time));
    end=time;
    if(!hp.slice(0,roster.length).some(v=>v>0)||!hp.slice(roster.length).some(v=>v>0))break;
  }
  const alliesAlive=hp.slice(0,roster.length).filter(v=>v>0).length;
  const enemiesAlive=hp.slice(roster.length).filter(v=>v>0).length;
  const outcome=enemiesAlive===0?'Victory':alliesAlive===0?'Defeat':'Time limit';
  return {kind:'synthetic',battleId:battle.id,seed:String(battle.seed),formationId:formation.id,units,events,frames,
    duration:end,outcome,step:0.2,recordedResult:battle.result};
}

/** A single authoritative time projection; all UI statistics are based on this frame. */
export function mockReplayAt(trace, requestedTime) {
  const time=clamp(Number(requestedTime)||0,0,trace.duration);
  const index=clamp(Math.floor((time+0.000001)/trace.step),0,trace.frames.length-1);
  const frame=trace.frames[index];
  const units=trace.units.map((unit,i)=>({...unit,hp:frame.hp[i],stats:{...frame.stats[i]},alive:frame.hp[i]>0}));
  const team=(side)=>{
    const members=units.filter(u=>u.team===side);
    return {alive:members.filter(u=>u.alive).length, total:members.length,
      currentHp:members.reduce((n,u)=>n+u.hp,0),maxHp:members.reduce((n,u)=>n+u.maxHp,0),
      damage:members.reduce((n,u)=>n+u.stats.damage,0),healing:members.reduce((n,u)=>n+u.stats.healing,0),
      kills:members.reduce((n,u)=>n+u.stats.kills,0),abilities:members.reduce((n,u)=>n+u.stats.abilities,0)};
  };
  return {time,frameTime:frame.time,units,ally:team('ally'),enemy:team('enemy'),
    events:trace.events.slice(0,frame.eventCount),
    recent:trace.events.slice(0,frame.eventCount).filter(ev=>time-ev.time>=-0.001&&time-ev.time<0.76)};
}
