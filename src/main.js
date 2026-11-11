import {heroes,equipment,equipmentSlots,equipmentSets,relics,resources,squads,opponents,battles,recipes,formatNum} from './mock-data.js';

const app=document.getElementById('app');
const STORAGE='hoh-desktop-prototype-v2';
const baseChanges={};
// Local files and privacy modes may deny storage. The UI must still boot in-memory.
const load=()=>{try{const data=JSON.parse(localStorage.getItem(STORAGE)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return {}}};
let persisted=load();
const state={view:'overview',search:'',heroChangedOnly:false,heroDialogOpen:false,sortKey:'',sortDir:1,selectedHero:'leonardo',selectedBattle:'b1',selectedOpponent:'opp1',battleFilter:'Needs improvement',arenaMode:'All',changes:persisted.changes||{},assignments:persisted.assignments||{},itemLevels:persisted.itemLevels||{},plans:persisted.plans||[],selectedItem:'scientist-pen',selectedRelic:'guardian-lion',activeSlot:'weapon',activeTab:'Details',toast:'',sidebarCollapsed:false};
const icons={overview:'▦',heroes:'♜',equipment:'⚒',relics:'◇',resources:'◉',battles:'⚑',arena:'♟',planner:'◷'};
const menus=[['overview','Overview'],['heroes','Heroes'],['equipment','Equipment'],['relics','Relics'],['resources','Resources'],['battles','Battle records'],['arena','Arena optimizer'],['planner','Upgrade planner']];
const h=id=>heroes.find(x=>x.id===id);
const eq=id=>equipment.find(x=>x.id===id);
const rel=id=>relics.find(x=>x.id===id);
const squad=id=>squads.find(x=>x.id===id);
const res=id=>resources.find(x=>x.id===id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>formatNum(n||0);
const stars=n=>`<span class="stars">${'★'.repeat(n)}<span class="stars-empty">${'☆'.repeat(3-n)}</span></span>`;
const portrait=(hero,size='normal')=>`<span class="portrait ${size}" style="--portrait:${hero.color}">${hero.portrait}</span>`;
const heroLabel=(hero,sub=true)=>`<span class="entity-line">${portrait(hero)}<span><strong>${esc(hero.name)}</strong>${sub?`<small>${esc(hero.faction)} · ${esc(hero.role)}</small>`:''}</span></span>`;
const badge=(text,type='neutral')=>`<span class="badge ${type}">${esc(text)}</span>`;
const delta=(n,unit='')=>`<span class="positive">+${fmt(n)}${unit}</span>`;
const btn=(label,action,variant='secondary',extra='')=>`<button type="button" class="btn ${variant}" data-action="${action}" ${extra}>${label}</button>`;
const note=(value)=>`<span class="muted">${esc(value)}</span>`;
const baseLoadout = () => Object.fromEntries(heroes.map(hero=>[hero.id,{...hero.equipmentSlots}]));
const fullLoadout = () => {
  const current=baseLoadout();
  for (const [id,slots] of Object.entries(state.assignments||{})) if(current[id])Object.assign(current[id],slots);
  return current;
};
const heroGear = id => fullLoadout()[id]||{};
const itemLevel = id => state.itemLevels[id]??eq(id)?.level??0;
const equipmentOwner = (id, loadout=fullLoadout()) => {
  for(const [heroId,slots] of Object.entries(loadout)) for(const [slot,itemId] of Object.entries(slots))if(itemId===id)return {heroId,slot};
  return null;
};
const setProgress=(heroId)=>{
  const ids=Object.values(heroGear(heroId)).filter(Boolean);
  const counts={};
  for(const id of ids){const set=eq(id)?.setId;if(set)counts[set]=(counts[set]||0)+1}
  return Object.entries(counts).map(([id,count])=>({...equipmentSets.find(x=>x.id===id),count})).filter(x=>x.id);
};
const statText = stat => `${stat.label} +${Number(stat.value).toLocaleString('en-US',{maximumFractionDigits:2})}${stat.unit==='percent'?'%':''}`;
const itemStatPreview = item => (item?.stats||[]).map(stat=>`<span>${esc(statText(stat))}</span>`).join('');
const gearSummary = id => {
  const equipped=Object.values(heroGear(id)).filter(Boolean).map(eq).filter(Boolean);
  const stats={};
  for(const item of equipped)for(const s of item.stats){const key=`${s.key}:${s.unit}`;stats[key]=(stats[key]||0)+s.value}
  return ['atk:flat','hp:flat','baseDmg:percent','def:percent'].filter(k=>stats[k]!=null).map(k=>`${({atk:'ATK',hp:'HP',baseDmg:'DMG',def:'DEF'})[k.split(':')[0]]} +${+stats[k].toFixed(2)}${k.endsWith('percent')?'%':''}`).join(' · ');
};
const slotsChanged=id=>equipmentSlots.filter(slot=>heroGear(id)[slot.id]!==h(id).equipmentSlots[slot.id]);
// Effective changes from the immutable snapshot: the single source for roster badges,
// change descriptions, changed-only filtering, inspector and top-bar counts (DESIGN §17).
function heroDiff(id){
  const baseline=h(id),current=currentHero(id),result=[];
  if(!baseline)return result;
  if(current.level!==baseline.level)result.push({kind:'LEVEL',label:'Level',before:String(baseline.level),after:String(current.level)});
  if(current.relic!==baseline.relic)result.push({kind:'RELIC',label:'Relic',before:rel(baseline.relic)?.name||'None',after:rel(current.relic)?.name||'None'});
  for(const slot of equipmentSlots){
    const before=baseline.equipmentSlots[slot.id],after=current.equipmentSlots[slot.id];
    if(before!==after)result.push({kind:'SLOT',slotId:slot.id,label:slot.label,before:eq(before)?.name||'Empty',after:eq(after)?.name||'Empty'});
  }
  const equipped=new Set(Object.values(current.equipmentSlots).filter(Boolean));
  for(const id of equipped){
    const item=eq(id);
    if(item&&itemLevel(id)!==item.level)result.push({kind:'ITEM',itemId:id,label:item.name,before:`Lv ${item.level}`,after:`Lv ${itemLevel(id)}`});
  }
  return result;
}
const hasHeroDraft=id=>heroDiff(id).length>0;
const changedHeroes=()=>heroes.filter(hero=>hasHeroDraft(hero.id));
const draftStatus=()=>`${changedHeroes().length} hero changes · ${upgradedItems().length} item upgrades`;
const upgradedItems=()=>equipment.filter(item=>itemLevel(item.id)>item.level);
const currentHero = id => ({...h(id),...(state.changes[id]||{}),equipmentSlots:heroGear(id)});
function itemDetail(itemId, options={}){
  const item=eq(itemId), owner=equipmentOwner(itemId);
  if(!item)return '<div class="empty-note">Choose an equipment item to inspect its stats.</div>';
  const set=equipmentSets.find(x=>x.id===item.setId);
  const progress=owner?setProgress(owner.heroId).find(x=>x.id===item.setId):null;
  const count=progress?.count||0,active=set&&count>=set.required;
  return `<div class="item-detail-head"><span class="equipment-art ${item.rarity.toLowerCase()}">${esc(item.icon)}<small>${itemLevel(item.id)}</small></span><div><div class="item-rarity">${esc(item.rarity)} · ${item.stars} stars</div><h3>${esc(item.name)}</h3><div class="item-starline">${'★'.repeat(item.stars)}</div><p class="muted">${esc(equipmentSlots.find(s=>s.id===item.slot)?.label||item.slot)} · ${owner?esc(h(owner.heroId)?.name):'Unassigned'} · ${badge('Mock stats','demo')}</p></div></div>
  <div class="item-stat-list">${item.stats.map(stat=>`<div class="item-stat"><span>${esc(stat.label)}</span><strong>${Number(stat.value).toLocaleString('en-US',{maximumFractionDigits:2})}${stat.unit==='percent'?'%':''}</strong></div>`).join('')}</div>
  ${set?`<div class="set-effect ${active?'set-active':'set-inactive'}"><strong>${esc(set.name)} ${count}/${set.required} ${active?'✓':''}</strong>${set.bonuses.map(s=>`<span>${esc(s.label)} +${s.value}${s.unit==='percent'?'%':''} ${active?'· active':'· inactive'}</span>`).join('')}</div>`:''}
  <div class="item-upgrade"><label class="field-label" for="item-level">Planned item level <span>${itemLevel(item.id)} / ${item.maxLevel}</span></label><input type="range" id="item-level" data-item-id="${item.id}" min="${item.level}" max="${item.maxLevel}" value="${itemLevel(item.id)}" step="1"/><small class="muted">Original level ${item.level} · stat rolls remain static in this mock · ${itemLevel(item.id)>item.level?'Cost: '+(itemLevel(item.id)-item.level)*10+' ore, '+(itemLevel(item.id)-item.level)*3+' scrolls':'No upgrade cost'}</small></div>`;
}
function storeLoadout(current){
  state.assignments={};
  for(const hero of heroes){
    const changed={};
    for(const slot of equipmentSlots)if(current[hero.id][slot.id]!==hero.equipmentSlots[slot.id])changed[slot.id]=current[hero.id][slot.id];
    if(Object.keys(changed).length)state.assignments[hero.id]=changed;
  }
}
function resetHeroDraft(id){
  const current=fullLoadout(),baseline=h(id).equipmentSlots;
  const oldItems=[...Object.values(current[id]),...Object.values(baseline)].filter(Boolean);
  // Return borrowed pieces to their original owners when those slots are empty.
  for(const itemId of Object.values(current[id]).filter(Boolean)){
    const owner=heroes.find(hero=>Object.values(hero.equipmentSlots).includes(itemId));
    if(owner&&owner.id!==id){const slot=eq(itemId).slot;if(!current[owner.id][slot])current[owner.id][slot]=itemId;}
  }
  for(const [slot,itemId] of Object.entries(baseline)){
    if(itemId){const occupant=equipmentOwner(itemId,current);if(occupant&&occupant.heroId!==id)current[occupant.heroId][occupant.slot]=null;}
    current[id][slot]=itemId;
  }
  delete state.changes[id];
  for(const itemId of oldItems)delete state.itemLevels[itemId];
  storeLoadout(current);saveDraft();render();
}
function moveItem(heroId,slotId,itemId){
  const item=itemId?eq(itemId):null;
  if(itemId&&(!item||item.slot!==slotId))return toast('Equipment must match the selected slot');
  const current=fullLoadout(), oldOwner=item?equipmentOwner(itemId,current):null;
  if(oldOwner){current[oldOwner.heroId][oldOwner.slot]=null}
  current[heroId][slotId]=itemId||null;
  storeLoadout(current);
  state.selectedItem=itemId||null;
  saveDraft();render();
  if(oldOwner&&oldOwner.heroId!==heroId)toast(`${item.name} moved from ${h(oldOwner.heroId).name}; their ${slotId} slot is now empty`);
}
function changeItemLevel(itemId,level){
  const item=eq(itemId);if(!item)return;
  const target=Math.max(item.level,Math.min(item.maxLevel,Number(level)));
  if(target===item.level)delete state.itemLevels[itemId];else state.itemLevels[itemId]=target;
  saveDraft();render();
}
// Revert exactly one independently identified draft change; preserve all unrelated edits.
function revertHeroChange(heroId,kind,key=''){
  const baseline=h(heroId);
  if(!baseline||!state.heroDialogOpen||state.selectedHero!==heroId)return false;
  const change=heroDiff(heroId).find(c=>c.kind===kind&&(c.slotId||c.itemId||'')===key);
  if(!change)return false;
  if(kind==='LEVEL'||kind==='RELIC'){
    const field=kind.toLowerCase();
    if(state.changes[heroId]){
      delete state.changes[heroId][field];
      if(Object.keys(state.changes[heroId]).length===0)delete state.changes[heroId];
    }
  }else if(kind==='SLOT'){
    const current=fullLoadout();
    const original=baseline.equipmentSlots[key]||null;
    if(original){
      const owner=equipmentOwner(original,current);
      if(owner&&(owner.heroId!==heroId||owner.slot!==key))current[owner.heroId][owner.slot]=null;
    }
    current[heroId][key]=original;
    storeLoadout(current);
    if(state.activeSlot===key)state.selectedItem=original;
  }else if(kind==='ITEM'){
    delete state.itemLevels[key];
  }else return false;
  saveDraft();render();
  return true;
}
const equipmentCost=()=>upgradedItems().reduce((out,item)=>mergeCost(out,{ore:(itemLevel(item.id)-item.level)*10,scrolls:(itemLevel(item.id)-item.level)*3}),{});
const gearChangesText=id=>slotsChanged(id).map(slot=>{
  const before=eq(h(id).equipmentSlots[slot.id]),after=eq(heroGear(id)[slot.id]);
  return `${slot.label}: ${before?.name||'Empty'} → ${after?.name||'Empty'}`;
}).join(' • ');

const costFor=(original,updated)=>{
  const levels=Math.max(0,updated.level-original.level),out={};
  if(levels){out.gold=levels*42000;out.xp=levels*1850;out.medals=levels*4;if(updated.level>=190&&original.level<190)out.essence=18}
  if(updated.relic!==original.relic){out.shards=(out.shards||0)+18}
  return out;
};
const mergeCost=(a,b)=>{for(const [k,v] of Object.entries(b))a[k]=(a[k]||0)+v;return a};
const allCosts=()=>mergeCost(heroes.reduce((acc,x)=>mergeCost(acc,costFor(x,currentHero(x.id))),{}),equipmentCost());
const farmDays=cost=>Math.max(0,...Object.entries(cost).map(([k,v])=>{const r=res(k);return r?.perDay?Math.max(0,(v-r.owned)/r.perDay):Infinity}));
const farmGap=(id,amount)=>Math.max(0,amount-(res(id)?.owned||0));
const costChips=cost=>Object.keys(cost).length?Object.entries(cost).map(([key,value])=>`<span class="resource-chip" title="${esc(res(key)?.name||key)}"><span style="color:${res(key)?.color||'#fff'}">${res(key)?.icon||'◈'}</span> ${fmt(value)} <span class="muted">${esc(res(key)?.name||key)}</span></span>`).join(''):'<span class="muted">No resource cost</span>';
const saveDraft=()=>{try{localStorage.setItem(STORAGE,JSON.stringify({changes:state.changes,assignments:state.assignments,itemLevels:state.itemLevels,plans:state.plans}));}catch{/* Keep the current draft in memory when storage is unavailable. */}};
let timer;
const toast=msg=>{state.toast=msg;renderToast();clearTimeout(timer);timer=setTimeout(()=>{state.toast='';renderToast()},2900)};
function renderToast(){document.querySelector('#toast')?.replaceChildren();if(state.toast){const el=document.createElement('div');el.className='toast-message';el.textContent=state.toast;document.querySelector('#toast')?.append(el)}}
function goto(view){state.heroDialogOpen=false;state.view=view;state.search='';state.sortKey='';state.selectedHero=state.selectedHero||'leonardo';render()}
const statusDot=t=>t==='Defeat'?'danger':t==='Victory'?'success':'warning';
const titleFor=()=>({overview:['Command center','Your battle performance and the next lowest-cost improvements'],heroes:['Hero roster','Inspect stats, experiment with upgrades, and save a draft build'],equipment:['Equipment inventory','Compare items, bonuses, and current assignment'],relics:['Relic vault','Inspect individual relic stats, abilities and equipped heroes'],resources:['Resources & farming','Available currency, estimated income, and upgrade shortages'],battles:['Battle records','Prioritize failed and sub-3-star battles by farming time'],arena:['Arena optimizer','Select the best saved formation or generate a candidate'],planner:['Upgrade planner','Review all drafted changes and their combined farming costs']})[state.view];
function shell(){return `<div class="app-shell">
  <header class="topbar"><div class="product"><span class="product-mark">✣</span><span><b>BATTLE LAB</b><small>HEROES OF HISTORY</small></span></div><div class="top-center"><span class="connected"><i></i> Offline prototype</span><span class="top-divider"></span><span>Mock snapshot <strong>11 Nov 2026</strong></span></div><div class="top-actions">${badge('DEMO DATA','demo')}<span class="top-divider"></span><span class="profile-icon">P</span></div></header>
  <aside class="sidebar"><div class="nav-caption">WORKSPACE</div>${menus.slice(0,6).map(([id,label])=>`<button class="nav-item ${state.view===id?'selected':''}" data-nav="${id}"><span class="nav-icon">${icons[id]}</span><span>${label}</span>${id==='battles'?`<span class="nav-count">${battles.filter(x=>x.stars<3).length}</span>`:''}</button>`).join('')}
    <div class="nav-caption second">OPTIMIZATION</div>${menus.slice(6).map(([id,label])=>`<button class="nav-item ${state.view===id?'selected':''}" data-nav="${id}"><span class="nav-icon">${icons[id]}</span><span>${label}</span>${id==='planner'&&Object.keys(state.changes).length?`<span class="nav-count">${Object.keys(state.changes).length}</span>`:''}</button>`).join('')}
    <div class="sidebar-bottom"><div class="mock-box"><span class="muted overline">SIMULATION ENGINE</span><div class="small-row"><span class="offline-indicator"></span><strong>Not connected</strong></div><p>Win rates and costs are illustrative. No game file is loaded.</p></div><button class="sidebar-link" data-action="resetAll">↺ <span>Reset demo</span></button></div></aside>
  <main class="workspace"><div class="view-header"><div><div class="breadcrumb">BATTLE LAB <span> / </span> ${state.view.toUpperCase()}</div><h1>${titleFor()[0]}</h1><p>${titleFor()[1]}</p></div><div class="header-actions">${state.view==='heroes'||state.view==='planner'?`<span class="draft-indicator">● ${draftStatus()}</span>${btn('Save plan','savePlan','primary')}`:state.view==='arena'?btn('Optimize all opponents','optimizeAll','primary'):state.view==='battles'?btn('View upgrade plan','goPlanner','primary'):btn('Upgrade planner','goPlanner','secondary')}</div></div><div id="view-content" class="view-content">${renderView()}</div></main>
  <footer class="statusbar"><span><i class="status-led"></i> Prototype · local mock data</span><span>${heroes.length} heroes <span class="separator">·</span> ${battles.length} battles <span class="separator">·</span> ${opponents.length} opponents</span><span>100% local <span class="separator">·</span> v0.1.0</span></footer><div id="toast"></div><div id="hero-modal-root"></div><div id="modal-root"></div></div>`}
function toolbar(placeholder,extra=''){return `<div class="table-toolbar"><label class="search-box"><span>⌕</span><input id="global-search" placeholder="${esc(placeholder)}" value="${esc(state.search)}" /></label>${extra}<span class="toolbar-spacer"></span><span class="record-count" id="record-count"></span></div>`}
function table(columns,rows,empty='No results'){return `<div class="table-scroller"><table class="data-table"><thead><tr>${columns.map(c=>`<th class="${c.align||''}" ${c.width?`style="width:${c.width}"`:''} data-sort="${c.key||''}">${c.label} ${c.key?'<span class="sort-arrow">↕</span>':''}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${columns.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`}
function sortedFiltered(items,searchText,selectors){let arr=items.filter(x=>selectors(x).toLowerCase().includes(searchText.toLowerCase()));if(state.sortKey)arr=[...arr].sort((a,b)=>{const av=state.sortKey.split('.').reduce((v,k)=>v?.[k],a)??'',bv=state.sortKey.split('.').reduce((v,k)=>v?.[k],b)??'';return (typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv)))*state.sortDir});return arr}
function overview(){const needs=battles.filter(x=>x.stars<3);const lowest=[...needs].sort((a,b)=>farmDays(recipes[a.plan].cost)-farmDays(recipes[b.plan].cost));return `<div class="overview-layout"><div class="metrics-grid">
  ${[['Heroes owned',heroes.length,'4 factions ready','heroes'],['Arena opportunities',opponents.length,'3 saved matchups below 80%','arena'],['Battles to improve',needs.length,'Lost or fewer than 3 stars','battles'],['Upgrade draft',`${Math.ceil(farmDays(allCosts())*10)/10}d`,'Estimated additional farming','planner']].map(([label,value,desc,target])=>`<button class="metric" data-nav="${target}"><div class="metric-label">${label}<span>↗</span></div><div class="metric-value">${value}</div><div class="metric-desc">${desc}</div></button>`).join('')}</div>
  <div class="overview-columns"><section class="panel"><div class="panel-heading"><div><span class="section-kicker">PRIORITY QUEUE</span><h2>Fastest battle improvements</h2></div>${btn('View all','goBattles')}</div><div class="priority-list">${lowest.slice(0,5).map((b,i)=>`<button class="priority-row" data-battle="${b.id}"><span class="rank">0${i+1}</span><span class="priority-main"><strong>${esc(b.name)}</strong><small>${b.result==='Defeat'?'Defeat':`${b.stars} / 3 stars`} · ${esc(recipes[b.plan].suggested)}</small></span><span class="priority-time">${farmDays(recipes[b.plan].cost).toFixed(1)}d <small>farm gap</small></span><span class="chevron">›</span></button>`).join('')}</div></section>
  <section class="panel"><div class="panel-heading"><div><span class="section-kicker">ARENA INTELLIGENCE</span><h2>Opponent recommendations</h2></div>${btn('Open arena','goArena')}</div><div class="arena-brief">${opponents.slice(0,4).map(o=>`<button data-opponent="${o.id}" class="arena-brief-row"><span class="opponent-emblem">${o.name.split(' ').map(x=>x[0]).join('')}</span><span><strong>${o.name}</strong><small>${o.traits}</small></span><span class="brief-percent">${o.predicted}%<small>candidate win</small></span></button>`).join('')}</div></section></div>
  <div class="overview-columns bottom"><section class="panel compact"><div class="panel-heading"><div><span class="section-kicker">ROSTER</span><h2>Highest power heroes</h2></div>${btn('View roster','goHeroes')}</div><div class="portrait-strip">${[...heroes].sort((a,b)=>b.power-a.power).slice(0,8).map(hero=>`<button class="portrait-tile" data-hero="${hero.id}">${portrait(hero,'large')}<strong>${hero.name.split(' ')[0]}</strong><small>Lv ${hero.level}</small></button>`).join('')}</div></section><section class="panel compact"><div class="panel-heading"><div><span class="section-kicker">UPGRADE FINANCES</span><h2>Current draft cost</h2></div>${btn('Open planner','goPlanner')}</div><div class="overview-cost">${costChips(allCosts())}</div><p class="muted hint">Resource balances and income are mock values. The planner deducts owned stock before calculating farming days.</p></section></div></div>`}
const visibleHeroes=()=>sortedFiltered(state.heroChangedOnly?changedHeroes():heroes,state.search,x=>`${x.name} ${x.faction} ${x.role} ${x.rarity}`);
const heroDiffLine=change=>`<span class="hero-diff-line"><b class="hero-diff-type">${esc(change.kind==='SLOT'?change.label:change.kind==='ITEM'?`ITEM · ${change.label}`:change.label)}</b><span class="hero-diff-before">${esc(change.before)}</span><span class="hero-diff-arrow" aria-label="changes to">→</span><strong class="hero-diff-after">${esc(change.after)}</strong></span>`;
const heroDiffRevertLine=(heroId,change)=>{
  const stableKey=change.slotId||change.itemId||'';
  const title=`Revert ${change.label} to ${change.before}`;
  return `<div class="hero-diff-entry">${heroDiffLine(change)}<button type="button" class="hero-change-revert" data-revert-hero="${esc(heroId)}" data-revert-kind="${esc(change.kind)}" data-revert-key="${esc(stableKey)}" aria-label="${esc(title)}" title="${esc(title)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 10H4V5"/><path d="M4 10a8 8 0 1 1 2.8 6.1"/></svg></button></div>`;
};
function heroesView(){
  const list=visibleHeroes(),changedCount=changedHeroes().length;
  if(!state.heroDialogOpen&&list.length&&!list.some(hero=>hero.id===state.selectedHero)){state.selectedHero=list[0].id;state.activeSlot='weapon';}
  const changedToggle=`<label class="changed-only-control ${state.heroChangedOnly?'is-active':''}" for="hero-changed-only"><input id="hero-changed-only" type="checkbox" ${state.heroChangedOnly?'checked':''}><span class="changed-switch" aria-hidden="true"><i></i></span><span>Changed only</span><b class="changed-total">${changedCount}</b></label>`;
  const rows=list.map(hero=>{
    const x=currentHero(hero.id),count=Object.values(x.equipmentSlots).filter(Boolean).length,diff=heroDiff(hero.id),edited=diff.length>0;
    const preview=diff.slice(0,3).map(heroDiffLine).join('');
    const extra=diff.length>3?`<span class="hero-diff-more" title="${esc(diff.map(x=>`${x.label}: ${x.before} → ${x.after}`).join(' • '))}">+${diff.length-3} more · see details</span>`:'';
    return `<tr data-hero="${hero.id}" class="clickable hero-roster-row ${edited?'draft-edited':''} ${state.selectedHero===hero.id?'active-row':''}"><td><div class="hero-identity-cell">${heroLabel(hero)}${edited?'<span class="hero-draft-tag">EDITED</span>':''}</div></td><td class="hero-change-cell">${edited?`<div class="hero-diff-stack">${preview}${extra}</div>`:'<span class="muted">—</span>'}</td><td>${badge('★'.repeat(hero.rarity),'rarity')}</td><td>${badge(x.role)}</td><td class="number">${edited&&x.level!==hero.level?`<span class="roster-level-previous">${hero.level} → </span>`:''}${x.level} <span class="muted">/ ${x.max}</span></td><td class="number">${fmt(x.power+(x.level-hero.level)*175)}</td><td class="number">${fmt(x.attack)}</td><td class="number">${fmt(x.health)}</td><td>${badge(`${count}/5`,count===5?'success':'warning')}</td><td class="gear-summary">${esc(gearSummary(hero.id))}</td><td>${esc(rel(x.relic)?.name||'None')}</td><td class="hero-roster-open"><button type="button" class="hero-detail-open" data-open-hero="${hero.id}" aria-label="Open details for ${esc(hero.name)}" title="Open details for ${esc(hero.name)}"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13 5h6v6m0-6-9 9"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg></button></td></tr>`;
  });
  return `<section class="panel table-panel hero-roster-panel hero-roster-full">${toolbar('Search hero, role, faction...',changedToggle)}${!list.length?`<div class="roster-empty-tools"><span>No heroes match this filter</span><button type="button" class="btn secondary" data-action="showAllHeroes">Show all heroes</button></div>`:''}${table([
    {label:'Hero',key:'name'},{label:'Draft changes'},{label:'Rarity',key:'rarity'},{label:'Role',key:'role'},
    {label:'Level',key:'level',align:'number'},{label:'Power',key:'power',align:'number'},
    {label:'Attack',key:'attack',align:'number'},{label:'Health',key:'health',align:'number'},
    {label:'Slots'},{label:'Equipment stats'},{label:'Relic'},{label:'Details',width:'64px',align:'hero-roster-actions-head'}
  ],rows,'No heroes match your search or Changed only filter.')}</section>`;
}
function heroInspector(){
  const hero=h(state.selectedHero),edited=currentHero(hero.id),cost=costFor(hero,edited),level=Number(edited.level);
  const slots=equipmentSlots.map(slot=>{
    const id=edited.equipmentSlots[slot.id],item=eq(id),selected=state.activeSlot===slot.id;
    return `<button type="button" class="gear-slot ${selected?'selected':''} ${item?'filled':'empty'}" data-select-slot="${slot.id}" data-for-hero="${hero.id}"><span class="gear-slot-label">${esc(slot.label)}</span><span class="gear-slot-main"><span class="gear-mini-icon">${esc(item?.icon||slot.icon)}</span><span class="gear-slot-text"><strong>${esc(item?.name||'Empty slot')}</strong><small>${item?`Lv ${itemLevel(item.id)} · ${'★'.repeat(item.stars)}`:'Tap to assign'}</small></span></span></button>`;
  }).join('');
  const selectedSlot=equipmentSlots.find(x=>x.id===state.activeSlot)||equipmentSlots[0];
  const selectedId=edited.equipmentSlots[selectedSlot.id];
    const activeSets=setProgress(hero.id);
  return `<div class="inspector-heading"><span>HERO DETAILS · FIVE-SLOT LOADOUT</span><button class="icon-button" title="Reset this hero" data-action="resetHero">↺</button></div>
  <div class="inspector-section hero-level-card"><div class="section-head"><b>Hero level</b>${badge('Local draft','demo')}</div><label class="field-label" for="hero-level">Planned level <span>${level} / ${hero.max}</span></label><input id="hero-level" type="range" min="${hero.level}" max="${hero.max}" step="1" value="${level}" data-hero-id="${hero.id}"/><div class="range-labels"><span>Snapshot ${hero.level}</span><span>Maximum ${hero.max}</span></div></div>
  <div class="inspector-section hero-draft-inspector"><div class="section-head"><b id="hero-changes-heading" tabindex="-1">Changes from snapshot</b>${heroDiff(hero.id).length?badge(`${heroDiff(hero.id).length} changes`,'warning'):badge('Unchanged','neutral')}</div>${heroDiff(hero.id).length?`<div class="inspector-diff-stack">${heroDiff(hero.id).map(change=>heroDiffRevertLine(hero.id,change)).join('')}</div>`:'<p class="hero-diff-empty">No changes in current draft</p>'}<p class="hero-diff-hint">Hypothetical edits only · nothing is changed in the game.</p></div>
  <div class="inspector-section"><div class="section-head"><b>Base attributes</b>${badge(`Lv ${level}`)}</div><div class="attribute-grid"><div><small>POWER (MOCK)</small><strong>${fmt(hero.power+(level-hero.level)*175)}</strong></div><div><small>ATTACK</small><strong>${fmt(hero.attack)}</strong></div><div><small>HEALTH</small><strong>${fmt(hero.health)}</strong></div><div><small>MAX LEVEL</small><strong>${hero.max}</strong></div></div></div>
  <div class="inspector-section"><div class="section-head"><b>Equipment · ${Object.values(edited.equipmentSlots).filter(Boolean).length}/5 slots</b>${badge('Local draft','demo')}</div><div class="gear-slot-grid">${slots}</div>
  ${activeSets.map(set=>`<div class="set-inline ${set.count>=set.required?'active':''}"><b>${esc(set.name)} ${set.count}/${set.required}</b><span>${set.bonuses.map(x=>`${esc(x.label)} +${x.value}%`).join(', ')} ${set.count>=set.required?'active':'inactive'}</span></div>`).join('')}
  <div class="slot-assignment-head"><div><div class="field-label">${esc(selectedSlot.label)} assignment</div><div class="assignment-summary">${selectedId?esc(eq(selectedId)?.name):'No equipment assigned'}</div></div><button type="button" class="btn primary picker-launch" data-action="openEquipmentPicker">${selectedId?'Change equipment':'Equip item'} <span aria-hidden="true">▦</span></button></div>
  ${selectedId?itemDetail(selectedId):'<div class="empty-note">Select an item to see its individual stats and set bonus.</div>'}
  </div><div class="inspector-section"><div class="section-head"><b>Relic</b></div><div class="relic-assignment"><div class="slot-assignment-head"><div><div class="field-label">Equipped relic</div><div class="assignment-summary">${esc(rel(edited.relic)?.name||'Empty relic slot')}</div></div><button type="button" class="btn primary picker-launch" data-action="openRelicPicker">${edited.relic?'Change relic':'Equip relic'} <span aria-hidden="true">◇</span></button></div>${edited.relic?`<div class="relic-assigned-card"><span class="relic-assigned-icon">${esc(rel(edited.relic)?.icon||'◇')}</span><div><strong>${esc(rel(edited.relic)?.name||'Unknown relic')}</strong><small>${esc(rel(edited.relic)?.rarity||'')} · ${esc(rel(edited.relic)?.type||'')} · Lv ${rel(edited.relic)?.level||0}</small><span>${esc(rel(edited.relic)?.effect||'')}</span></div></div>`:'<div class="relic-assigned-empty">No relic equipped in the current draft.</div>'}</div></div>
  <div class="inspector-section costs-section"><div class="section-head"><b>Incremental hero cost</b></div><div class="chip-grid">${costChips(cost)}</div><div class="estimate-line"><span>Whole draft farm shortfall</span><strong>${farmDays(allCosts()).toFixed(1)} days</strong></div><p class="muted hint">Gear swaps cost 0 in this mock; unique item upgrades are included in the whole plan.</p></div>
  <div class="inspector-actions">${btn('Review combined plan','goPlanner','primary')}${btn('Discard this hero changes','resetHero')}</div>`;
}
// Relic vault detail — docs/DESIGN.md §19. Read-only; type ownership is shared in mock fixtures.
function relicDetailInspector(item){
  if(!item)return `<div class="inspector-heading">RELIC DETAILS ${badge('Mock data','demo')}</div><div class="relic-detail-empty"><span aria-hidden="true">◇</span><strong>No relic selected</strong><p>Choose a relic from the table, or clear the search filter.</p></div>`;
  const users=relicUsers(item.id);
  const stats=Array.isArray(item.stats)?item.stats:[];
  const knownMax=Number.isFinite(item.maxLevel);
  const fullLevel=knownMax?`${item.level}/${item.maxLevel}`:`${item.level} / —`;
  const starsLine=Number.isFinite(item.stars)?`<span class="relic-detail-stars" aria-label="${item.stars} stars">${'★'.repeat(item.stars)}</span>`:'';
  const statLines=stats.length?stats.map(stat=>`<div class="relic-detail-stat"><span>${esc(stat.label)}</span><strong>${fmt(stat.value)}${stat.unit==='percent'?'%':''}</strong></div>`).join(''):`<div class="relic-missing-stats"><b>Stats not captured</b><small>This relic's ATK, DEF and other attributes are not present in the mock snapshot.</small></div>`;
  return `<div class="inspector-heading">RELIC DETAILS ${badge('Mock data','demo')}</div>
    <div class="inspector-section relic-detail-body">
      <div class="relic-detail-identity ${esc(item.rarity.toLowerCase())}">
        <div class="relic-detail-art" aria-label="Illustrative icon, not game artwork"><span aria-hidden="true">${esc(item.icon)}</span><small>Icon preview</small></div>
        <div class="relic-detail-title"><small>${esc(item.rarity)} · ${esc(item.type)}</small><h2>${esc(item.name)}</h2>${starsLine}<strong class="relic-detail-level">LVL. ${fullLevel}</strong></div>
      </div>
      <div class="relic-detail-stat-panel"><div class="relic-detail-section-label">BASE ATTRIBUTES</div>${statLines}</div>
      <div class="relic-ability-panel"><div class="relic-detail-section-label">ABILITY / EFFECT</div><div class="relic-ability-heading"><strong>${esc(item.abilityName||'Effect')}</strong>${Number.isFinite(item.cooldownSeconds)?`<span>${item.cooldownSeconds.toFixed(2)}s cooldown</span>`:''}</div><p>${esc(item.abilityDescription||item.effect)}</p></div>
      <div class="relic-detail-metadata"><div><span>Level</span><strong>${fullLevel}</strong></div><div><span>Mock copies</span><strong>${item.charges}</strong></div><div><span>Transcendence</span><strong>${knownMax&&item.level>=item.maxLevel?'Max level · transcendence unverified':'Not captured'}</strong></div></div>
    </div>
    <div class="inspector-section relic-users-section"><div class="section-head"><b>Equipped by (${users.length})</b>${badge('Draft assignments')}</div>
      ${users.length?users.map(hero=>`<button type="button" class="relic-user-row" data-relic-user="${esc(hero.id)}"><span>${portrait(hero)}<span><strong>${esc(hero.name)}</strong><small>${esc(hero.faction)} · ${esc(hero.role)}</small></span></span><span class="relic-user-arrow">Open hero ›</span></button>`).join(''):'<p class="muted hint">No heroes currently use this relic type.</p>'}
      <p class="muted relic-readonly-hint">Read-only preview. Relic upgrades, transcendence costs and real copy ownership are not connected; selecting a relic here never changes game data.</p>
    </div>`;
}
function inventoryView(type){
  if(type==='relics'){
    const filtered=sortedFiltered(relics,state.search,x=>`${x.name} ${x.rarity} ${x.type} ${x.effect} ${(x.stats||[]).map(s=>s.label+' '+s.value).join(' ')} ${relicUsers(x.id).map(h=>h.name).join(' ')}`);
    if(filtered.length&&!filtered.some(item=>item.id===state.selectedRelic))state.selectedRelic=filtered[0].id;
    const selected=filtered.find(item=>item.id===state.selectedRelic)||null;
    return `<div class="split-view equipment-view relic-vault-view"><section class="panel table-panel">${toolbar('Search relic, ability or hero...')}${table([
      {label:'Relic',key:'name'},{label:'Rarity',key:'rarity'},{label:'Type',key:'type'},{label:'Level',key:'level',align:'number'},
      {label:'Effect'},{label:'Mock copies',key:'charges',align:'number'},{label:'Used by'}
    ],filtered.map(item=>{
      const users=relicUsers(item.id);
      return `<tr class="clickable relic-table-row ${selected?.id===item.id?'active-row':''}" data-relic="${esc(item.id)}" tabindex="0" aria-selected="${selected?.id===item.id}"><td><span class="entity-line"><span class="item-icon relic-icon">${esc(item.icon)}</span><span><strong>${esc(item.name)}</strong><small>${item.stars?'★'.repeat(item.stars)+' · ':''}${esc(item.abilityName||item.type)}</small></span></span></td><td>${badge(item.rarity,item.rarity==='Legendary'?'rarity':'neutral')}</td><td>${esc(item.type)}</td><td class="number">${item.level}${item.maxLevel?` / ${item.maxLevel}`:''}</td><td class="relic-effect-preview">${esc(item.effect)}</td><td class="number">${item.charges}</td><td>${users.length?users.map(hero=>esc(hero.name)).join(', '):'<span class="muted">Unassigned</span>'}</td></tr>`;
    }), 'No relics match this search')}</section><aside class="inspector relic-detail-inspector">${relicDetailInspector(selected)}</aside></div>`;
  }
  const filtered=sortedFiltered(equipment,state.search,x=>`${x.name} ${x.slot} ${x.setId} ${x.rarity} ${x.stats.map(statText).join(' ')}`);
  return `<div class="split-view equipment-view"><section class="panel table-panel">${toolbar('Search equipment, stat, set...')}${table([
    {label:'Equipment',key:'name'},{label:'Rarity',key:'rarity'},{label:'Slot',key:'slot'},
    {label:'Stars'},{label:'Level',key:'level',align:'number'},{label:'All item stats'},
    {label:'Set progress'},{label:'Equipped by'}
  ],filtered.map(item=>{
    const owner=equipmentOwner(item.id),set=equipmentSets.find(x=>x.id===item.setId),progress=owner?setProgress(owner.heroId).find(x=>x.id===item.setId):null;
    return `<tr class="clickable ${state.selectedItem===item.id?'active-row':''}" data-item="${item.id}"><td><span class="entity-line"><span class="item-icon">${esc(item.icon)}</span><span><strong>${esc(item.name)}</strong><small>Instance ${esc(item.id)}</small></span></span></td><td>${badge(item.rarity,item.rarity==='Legendary'?'rarity':'neutral')}</td><td>${esc(equipmentSlots.find(s=>s.id===item.slot)?.label)}</td><td class="stars">${'★'.repeat(item.stars)}</td><td class="number">${itemLevel(item.id)}</td><td><div class="stat-preview">${itemStatPreview(item)}</div></td><td>${set?`<span class="${progress&&progress.count>=set.required?'positive':'muted'}">${esc(set.name)} ${progress?.count||0}/${set.required}</span>`:'—'}</td><td>${owner?esc(h(owner.heroId)?.name):'<span class="muted">Unassigned</span>'}</td></tr>`;
  }))}</section><aside class="inspector"><div class="inspector-heading">EQUIPMENT DETAILS ${badge('Mock values','demo')}</div><div class="inspector-section">${itemDetail(state.selectedItem||'scientist-pen')}<div class="inspector-actions inline-actions">${equipmentOwner(state.selectedItem)?`<button class="btn secondary" data-hero="${equipmentOwner(state.selectedItem).heroId}">Open owning hero</button>`:''}</div></div></aside></div>`;
}
function resourceView(){const cost=allCosts(),filtered=sortedFiltered(resources,state.search,x=>`${x.name} ${x.type}`);return `<div class="resource-layout"><div class="resource-summary">${[['Total resource types',resources.length],['Draft resource types',Object.keys(cost).length],['Longest shortfall',`${farmDays(cost).toFixed(1)} days`]].map(([k,v])=>`<div class="summary-tile"><small>${k}</small><strong>${v}</strong></div>`).join('')}</div><section class="panel table-panel full-panel">${toolbar('Search resource...')}${table([{label:'Resource',key:'name'},{label:'Category',key:'type'},{label:'Owned',key:'owned',align:'number'},{label:'Income / day',key:'perDay',align:'number'},{label:'Draft cost',align:'number'},{label:'Missing',align:'number'},{label:'Additional farm days',align:'number'}],filtered.map(x=>`<tr><td><span class="entity-line"><span class="resource-orb" style="--res:${x.color}">${x.icon}</span><strong>${esc(x.name)}</strong></span></td><td>${esc(x.type)}</td><td class="number">${fmt(x.owned)}</td><td class="number positive">+${fmt(x.perDay)}</td><td class="number">${fmt(cost[x.id]||0)}</td><td class="number ${farmGap(x.id,cost[x.id]||0)?'negative':''}">${fmt(farmGap(x.id,cost[x.id]||0))}</td><td class="number">${((farmGap(x.id,cost[x.id]||0))/x.perDay).toFixed(1)} d</td></tr>`))}</section></div>`}
function battlesView(){const filtered=sortedFiltered(battles.filter(x=>state.battleFilter==='Needs improvement'?x.stars<3:state.battleFilter==='Defeats'?x.result==='Defeat':true),state.search,x=>`${x.name} ${x.mode} ${x.result} ${x.seed}`);return `<div class="split-view"><section class="panel table-panel">${toolbar('Search battle, seed, mode...',`<select class="toolbar-select" id="battle-filter"><option ${state.battleFilter==='Needs improvement'?'selected':''}>Needs improvement</option><option ${state.battleFilter==='Defeats'?'selected':''}>Defeats</option><option ${state.battleFilter==='All'?'selected':''}>All</option></select>`)}${table([{label:'Battle'},{label:'Result',key:'result'},{label:'Stars',key:'stars'},{label:'Recorded'},{label:'Recommended farm',align:'number'},{label:'Seed'}],filtered.map(b=>`<tr data-battle="${b.id}" class="clickable ${state.selectedBattle===b.id?'active-row':''}"><td><strong>${esc(b.name)}</strong><div class="cell-sub">${esc(b.mode)}</div></td><td>${badge(b.result,b.result==='Defeat'?'danger':'success')}</td><td>${stars(b.stars)}</td><td>${esc(b.last)}</td><td class="number">${b.plan?`${farmDays(recipes[b.plan].cost).toFixed(1)} d`:'—'}</td><td class="mono">${b.seed}</td></tr>`))}</section><aside class="inspector">${battleInspector()}</aside></div>`}
function battleInspector(){const b=battles.find(x=>x.id===state.selectedBattle),r=b.plan?recipes[b.plan]:null,hero=r?h(r.hero):null;return `<div class="inspector-heading">BATTLE ANALYSIS <span>${badge(b.result,b.result==='Defeat'?'danger':'success')}</span></div><div class="inspector-section battle-top"><h2>${esc(b.name)}</h2><div class="muted">${esc(b.mode)} · Seed ${b.seed}</div><div class="battle-stars">${stars(b.stars)} <span class="muted">${b.stars} / 3 stars</span></div><div class="info-pairs"><span>Saved formation</span><strong>${esc(squad(b.team).name)}</strong><span>Last recorded</span><strong>${esc(b.last)}</strong><span>Target</span><strong>${esc(b.target)}</strong></div></div>${r?`<div class="inspector-section"><div class="section-head"><b>Lowest-cost candidate</b>${badge('Estimate','demo')}</div><div class="recommend-box"><div class="recommend-title">${heroLabel(hero,false)}</div><p>${esc(r.description)}</p><div class="recommend-arrow">Level ${hero.level} → ${r.level} <span>·</span> ${esc(r.suggested)}</div></div></div><div class="inspector-section costs-section"><div class="section-head"><b>Candidate costs</b></div><div class="chip-grid">${costChips(r.cost)}</div><div class="estimate-line"><span>Additional farming</span><strong>${farmDays(r.cost).toFixed(1)} days</strong></div><p class="muted hint">This candidate is illustrative, not a verified 3-star native simulation.</p></div><div class="inspector-actions">${btn('Add changes to draft','applyBattle','primary')}${btn('Open upgrade planner','goPlanner')}</div>`:`<div class="inspector-section"><div class="success-note">✓ This recorded battle already has 3 stars.</div></div>`}`}
function arenaView(){const list=opponents.filter(x=>state.arenaMode==='All'||x.mode===state.arenaMode).filter(x=>`${x.name} ${x.mode} ${x.traits}`.toLowerCase().includes(state.search.toLowerCase()));const o=opponents.find(x=>x.id===state.selectedOpponent);return `<div class="split-view"><section class="panel table-panel">${toolbar('Find opponent...',`<select id="arena-mode" class="toolbar-select">${['All','Arena','Elite Arena'].map(x=>`<option ${x===state.arenaMode?'selected':''}>${x}</option>`).join('')}</select>`)}${table([{label:'Opponent'},{label:'Rank',align:'number'},{label:'Saved formation'},{label:'Saved win %',align:'number'},{label:'Suggested formation'},{label:'Predicted win %',align:'number'},{label:'Confidence'}],list.map(x=>`<tr class="clickable ${state.selectedOpponent===x.id?'active-row':''}" data-opponent="${x.id}"><td><span class="entity-line"><span class="opponent-emblem">${x.name.split(' ').map(v=>v[0]).join('')}</span><span><strong>${esc(x.name)}</strong><small>${esc(x.mode)} · ${esc(x.traits)}</small></span></span></td><td class="number">#${x.rank}</td><td>${esc(squad(x.current).name)}</td><td class="number ${x.win<70?'negative':''}">${x.win}%</td><td>${esc(squad(x.alternative).name)}</td><td class="number"><strong class="positive">${x.predicted}%</strong> ${x.predicted>x.win?`<small class="positive">+${x.predicted-x.win} pp</small>`:''}</td><td>${badge(x.confidence,x.confidence==='High'?'success':x.confidence==='Low'?'warning':'neutral')}</td></tr>`))}</section><aside class="inspector">${arenaInspector(o)}</aside></div>`}
function arenaInspector(o){const saved=squad(o.current),candidate=squad(o.alternative);return `<div class="inspector-heading">OPPONENT INTELLIGENCE ${badge(o.mode)}</div><div class="inspector-section"><div class="opponent-profile"><span class="opponent-emblem big">${o.name.split(' ').map(v=>v[0]).join('')}</span><div><h2>${esc(o.name)}</h2><div class="muted">Rank #${o.rank} · ${fmt(o.power)} power</div></div></div><div class="opponent-tags">${badge(o.traits)} ${badge(`${o.confidence} confidence`)}</div><div class="info-pairs"><span>Observed wins</span><strong>${o.record}</strong><span>Saved formation</span><strong>${esc(saved.name)}</strong></div></div><div class="inspector-section"><div class="section-head"><b>Recommended formation</b>${badge('Mock ranking','demo')}</div><div class="comparison"><div><small>Current</small><strong>${o.win}%</strong></div><div class="comparison-arrow">→</div><div><small>Suggested</small><strong class="positive">${o.predicted}%</strong></div></div><div class="squad-name">${esc(candidate.name)} <span>${badge(candidate.tag)}</span></div><div class="squad-portraits">${candidate.heroes.map(id=>`<span title="${esc(h(id).name)}">${portrait(h(id),'squad')}</span>`).join('')}</div><p class="muted hint">Win percentages are static fixture values, not real battle samples or confidence intervals.</p></div><div class="inspector-section"><div class="section-head"><b>Alternatives</b></div><div class="alternative-row"><span>${esc(saved.name)}</span><strong>${o.win}%</strong></div><div class="alternative-row"><span>${esc(candidate.name)}</span><strong class="positive">${o.predicted}%</strong></div></div><div class="inspector-actions">${btn('Use recommended formation','useFormation','primary')}${btn('Inspect roster','goHeroes')}</div>`}
function plannerView(){
  const costs=allCosts(),days=farmDays(costs),changed=heroes.filter(x=>hasHeroDraft(x.id)),upgrades=upgradedItems();
  const needed=battles.filter(b=>b.plan).map(b=>({...b,days:farmDays(recipes[b.plan].cost)})).sort((a,b)=>a.days-b.days);
  return `<div class="planner-layout"><div class="planner-main"><div class="planner-metrics"><div class="summary-tile"><small>Edited heroes</small><strong>${changed.length}</strong></div><div class="summary-tile"><small>Item level upgrades</small><strong>${upgrades.length}</strong></div><div class="summary-tile"><small>Est. additional farming</small><strong>${days.toFixed(1)} days</strong></div></div>
  <section class="panel"><div class="panel-heading"><div><span class="section-kicker">EDITABLE BUILD PLAN</span><h2>Hero & equipment changes</h2></div><div>${btn('Add hero','goHeroes')}${btn('Clear all','resetChanges')}</div></div>
  ${table([{label:'Hero'},{label:'Original → target level'},{label:'Five-slot assignment changes'},{label:'Relic'},{label:'Hero cost'},{label:''}],changed.map(hero=>{
    const x=currentHero(hero.id),c=costFor(hero,x),swaps=gearChangesText(hero.id);
    return `<tr><td>${heroLabel(hero,false)}</td><td>${hero.level} → ${x.level}</td><td class="gear-change-summary">${swaps?esc(swaps):'<span class="muted">No slot changes · 5 slots retained</span>'}</td><td>${esc(rel(hero.relic)?.name)} → ${esc(rel(x.relic)?.name)}</td><td><div class="compact-chips">${costChips(c)}</div></td><td><button class="text-button" data-reset-hero="${hero.id}">Remove</button></td></tr>`;
  }), 'No hero changes yet. Select a hero or apply a battle recommendation.')}</section>
  <section class="panel"><div class="panel-heading"><div><span class="section-kicker">ITEM UPGRADES · EACH INSTANCE ONCE</span><h2>Equipment level changes</h2></div></div>${table([{label:'Item'},{label:'Equipped by'},{label:'Level'},{label:'Incremental cost'},{label:''}],upgrades.map(item=>{
    const owner=equipmentOwner(item.id),count=itemLevel(item.id)-item.level;
    return `<tr><td><span class="entity-line"><span class="item-icon">${esc(item.icon)}</span><strong>${esc(item.name)}</strong></span></td><td>${owner?esc(h(owner.heroId).name):'Unassigned'}</td><td>${item.level} → ${itemLevel(item.id)}</td><td>${costChips({ore:count*10,scrolls:count*3})}</td><td><button class="text-button" data-reset-item="${item.id}">Remove</button></td></tr>`;
  }),'No equipment level upgrades in the draft.')}</section>
  <section class="panel"><div class="panel-heading"><div><span class="section-kicker">RESOURCE FORECAST · MOCK COSTS</span><h2>Farming requirements</h2></div></div><div class="farm-grid">${Object.entries(costs).length?Object.entries(costs).map(([id,cost])=>{
    const r=res(id),gap=farmGap(id,cost),d=r.perDay?gap/r.perDay:Infinity;
    return `<div class="farm-card"><div class="farm-name"><span style="color:${r.color}">${r.icon}</span> ${esc(r.name)}</div><div class="farm-values"><b>${fmt(cost)}</b><span>need · ${fmt(r.owned)} owned</span></div><div class="progress-track"><i style="width:${Math.min(100,r.owned/Math.max(1,cost)*100)}%"></i></div><div class="farm-footer"><span>${fmt(gap)} missing</span><strong>${Number.isFinite(d)?d.toFixed(1)+'d':'Unavailable'}</strong></div></div>`;
  }).join(''):'<div class="empty-note">No farming required until you add a change.</div>'}</div></section></div>
  <aside class="planner-aside"><section class="panel"><div class="panel-heading"><div><span class="section-kicker">NEXT TARGETS · MOCK RECIPES</span><h2>Cheapest battle fixes</h2></div></div><div class="planner-recs">${needed.slice(0,7).map((b,i)=>`<div class="planner-rec"><span class="rec-number">${i+1}</span><div><strong>${esc(b.name)}</strong><small>${esc(recipes[b.plan].description)}</small><button data-apply-recipe="${b.id}" class="text-button">Add recommendation</button></div><span class="rec-days">${b.days.toFixed(1)}d</span></div>`).join('')}</div></section><section class="panel saved-plans"><div class="panel-heading"><div><span class="section-kicker">LOCAL STORAGE</span><h2>Saved plans</h2></div></div>${state.plans.length?state.plans.map((p,i)=>`<div class="saved-row"><span><strong>${esc(p.name)}</strong><small>${esc(p.created)} · ${p.count} changes</small></span><button class="text-button" data-load-plan="${i}">Load</button></div>`).join(''):'<p class="muted saved-empty">Save your draft locally. It does not modify the game.</p>'}${btn('Save current plan','savePlan','primary')}</section></aside></div>`;
}
// Hero detail is a large, self-contained dialog; source-of-truth DESIGN.md §20.
let heroDialogReturnId=null;
function heroDialogMarkup(){
  const hero=h(state.selectedHero);
  if(!hero)return '';
  const changes=heroDiff(hero.id);
  return `<div class="modal-backdrop hero-dialog-backdrop" data-hero-backdrop><section class="hero-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="hero-dialog-title" aria-describedby="hero-dialog-subtitle" tabindex="-1">
      <header class="hero-dialog-heading">
        <div class="hero-dialog-identity">${portrait(hero,'large')}<div class="hero-dialog-titles"><span class="section-kicker">HERO PROFILE · LOCAL DRAFT</span><h2 id="hero-dialog-title">${esc(hero.name)}</h2><div class="hero-dialog-subline"><span class="hero-dialog-stars" aria-label="${hero.stars} stars">${'★'.repeat(hero.stars)}</span><p id="hero-dialog-subtitle">${esc(hero.faction)} · ${esc(hero.role)} · Level ${currentHero(hero.id).level}/${hero.max} · Mock data</p></div></div></div>
        <div class="hero-dialog-header-actions">${badge('MOCK DATA','demo')}${changes.length?badge(`${changes.length} changes · EDITED`,'warning'):badge('Unchanged','success')}<button type="button" class="hero-dialog-close" data-action="closeHeroDialog" aria-label="Close hero details">×</button></div>
      </header>
      <div class="hero-dialog-scroll" tabindex="0" aria-label="Hero details and equipment"><div class="hero-dialog-editor">${heroInspector()}</div></div>
      <footer class="hero-dialog-footer"><span>Changes are local only · farming estimates are illustrative</span><div>${btn('Review combined plan','goPlanner')}${btn('Discard hero changes','resetHero')}${btn('Close','closeHeroDialog','primary')}</div></footer>
  </section></div>`;
}
function syncOverlayInert(){
  const overlay=state.heroDialogOpen||Boolean(equipmentPicker)||Boolean(relicPicker);
  for(const el of document.querySelectorAll('.topbar,.sidebar,.workspace,.statusbar'))overlay?el.setAttribute('inert',''):el.removeAttribute('inert');
  const parent=document.querySelector('#hero-modal-root');
  if(parent){if(equipmentPicker||relicPicker)parent.setAttribute('inert','');else parent.removeAttribute('inert');}
}
function showHeroDialog(scroll=0){
  const root=document.querySelector('#hero-modal-root');
  if(!root)return;
  root.innerHTML=state.heroDialogOpen&&state.view==='heroes'?heroDialogMarkup():'';
  const editor=root.querySelector('.hero-dialog-editor');
  if(editor){
    // Build independent level/summary and equipment stacks from canonical heroInspector sections.
    // This avoids forced empty rows beneath the shorter left-hand summary cards.
    const blocks=[...editor.children];
    if(blocks.length===8){
      const left=document.createElement('div'),right=document.createElement('div');
      left.className='hero-dialog-column hero-dialog-summary';
      right.className='hero-dialog-column hero-dialog-loadout';
      left.append(blocks[1],blocks[3],blocks[2],blocks[6]);
      right.append(blocks[4],blocks[5]);
      editor.replaceChildren(left,right);
    }
  }
  const body=root.querySelector('.hero-dialog-scroll');if(body)body.scrollTop=scroll;
  syncOverlayInert();
}
function openHeroDialog(heroId){
  if(!h(heroId))return;
  heroDialogReturnId=heroId;
  state.selectedHero=heroId;
  state.activeSlot='weapon';
  state.selectedItem=heroGear(heroId).weapon;
  if(state.view!=='heroes'){state.search='';state.sortKey='';}
  state.view='heroes';state.heroDialogOpen=true;
  render();
  document.querySelector('[data-action="closeHeroDialog"]')?.focus();
}
function closeHeroDialog(){
  if(!state.heroDialogOpen)return;
  const restoreId=heroDialogReturnId||state.selectedHero;
  state.heroDialogOpen=false;
  render();
  (document.querySelector(`[data-open-hero="${restoreId}"]`)||document.querySelector('[data-nav="heroes"]'))?.focus();
}
function focusInDialog(dialog,e){
  const nodes=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
  if(!nodes.length)return;
  const first=nodes[0],last=nodes.at(-1);
  if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){e.preventDefault();first.focus()}
}
function renderView(){return ({overview,heroes:heroesView,equipment:()=>inventoryView('equipment'),relics:()=>inventoryView('relics'),resources:resourceView,battles:battlesView,arena:arenaView,planner:plannerView})[state.view]()}
function render(){
  const body=document.querySelector('.hero-dialog-scroll');
  const scroll=body?.scrollTop||0;
  const active=document.activeElement;
  const activeInHero=Boolean(body?.contains(active));
  const activeId=activeInHero&&active?.id||'';
  const activeAction=activeInHero&&active?.dataset?.action||'';
  const activeSlot=activeInHero&&active?.dataset?.selectSlot||'';
  app.innerHTML=shell();syncRecordCount();renderToast();showHeroDialog(scroll);
  if(activeInHero&&state.heroDialogOpen){
    const target=activeId?document.getElementById(activeId):activeAction?document.querySelector(`.hero-detail-dialog [data-action="${activeAction}"]`):activeSlot?document.querySelector(`.hero-detail-dialog [data-select-slot="${activeSlot}"]`):null;
    target?.focus({preventScroll:true});
  }
}
function syncRecordCount(){const node=document.querySelector('#record-count'),tableRows=document.querySelectorAll('.data-table tbody tr');if(node)node.textContent=state.view==='heroes'?`${visibleHeroes().length} of ${heroes.length} heroes`:`${tableRows.length} records`}
function changeHero(id,field,value){const base=h(id),prior=state.changes[id]||{};const next={...prior,[field]:field==='level'?Math.min(base.max,Math.max(base.level,Number(value))):value};if(Object.keys(next).every(k=>next[k]===base[k]))delete state.changes[id];else state.changes[id]=next;saveDraft();render()}
function applyRecipe(battleId){
  const b=battles.find(x=>x.id===battleId),r=b&&recipes[b.plan];if(!r)return;
  const hero=h(r.hero),current=state.changes[r.hero]||{};
  state.changes[r.hero]={...current,level:Math.min(hero.max,Math.max(hero.level,current.level||0,r.level)),relic:r.relic};
  // These two recipe items are unique unassigned instances in the mock catalog.
  if(r.equipment==='lance'||r.equipment==='aegis'){
    const item=eq(r.equipment);if(item)moveItem(r.hero,item.slot,item.id);
  }
  saveDraft();toast('Mock recommendation added to local draft');render();
}

// Equipment picker dialog — DESIGN.md §16. Kept separate from persistent draft state.
let equipmentPicker=null;
let pickerLauncher=null;
const pickerOptions=['All','Unassigned','Other heroes','This hero'];
function filteredPickerItems(){
  if(!equipmentPicker)return [];
  const p=equipmentPicker;
  const q=p.search.trim().toLocaleLowerCase();
  return equipment.filter(item=>item.slot===p.slotId).filter(item=>{
    const set=equipmentSets.find(x=>x.id===item.setId);
    const owner=equipmentOwner(item.id);
    const ownerName=owner?h(owner.heroId)?.name||'':'';
    const haystack=[item.name,item.rarity,set?.name,ownerName,...item.stats.map(s=>s.label),...item.stats.map(statText)].join(' ').toLocaleLowerCase();
    if(q&&!haystack.includes(q))return false;
    if(p.rarity!=='All'&&item.rarity!==p.rarity)return false;
    if(p.set!=='All'&&item.setId!==p.set)return false;
    if(p.ownership==='Unassigned'&&owner)return false;
    if(p.ownership==='Other heroes'&&(!owner||owner.heroId===p.heroId))return false;
    if(p.ownership==='This hero'&&(!owner||owner.heroId!==p.heroId))return false;
    return true;
  }).sort((a,b)=>{
    if(p.sort==='Name A–Z')return a.name.localeCompare(b.name);
    if(p.sort==='Most stars')return b.stars-a.stars||itemLevel(b.id)-itemLevel(a.id);
    return itemLevel(b.id)-itemLevel(a.id)||b.stars-a.stars||a.name.localeCompare(b.name);
  });
}
function pickerCard(item){
  const p=equipmentPicker;
  const owner=equipmentOwner(item.id);
  const current=heroGear(p.heroId)[p.slotId]===item.id;
  const other=owner&&owner.heroId!==p.heroId;
  const set=equipmentSets.find(x=>x.id===item.setId);
  const ownerLabel=other?`Equipped by ${h(owner.heroId)?.name}`:owner?`Equipped on ${h(p.heroId)?.name}`:'Unassigned';
  return `<button type="button" class="picker-card ${current?'is-equipped':''} ${other?'is-borrowed':''}" data-pick-item="${esc(item.id)}" aria-label="Equip ${esc(item.name)}${other?' from '+esc(h(owner.heroId)?.name):''}">
    <div class="picker-card-header"><span class="picker-card-art equipment-art ${esc(item.rarity.toLowerCase())}">${esc(item.icon)}<small>${itemLevel(item.id)}</small></span><span class="picker-card-identity"><strong>${esc(item.name)}</strong><small>${esc(item.rarity)} · Lv ${itemLevel(item.id)}</small><span class="picker-card-stars">${'★'.repeat(item.stars)}</span></span>${current?'<span class="picker-current">Equipped</span>':''}</div>
    <div class="picker-card-set">${esc(set?.name||'No set')}</div>
    <div class="picker-card-stats">${item.stats.map(s=>`<span class="picker-stat"><span>${esc(s.label)}</span><b>+${Number(s.value).toLocaleString('en-US',{maximumFractionDigits:2})}${s.unit==='percent'?'%':''}</b></span>`).join('')}</div>
    <div class="picker-card-owner ${other?'warning':''}"><span>${other?'↗':'◉'}</span><span>${esc(ownerLabel)}${other?' · will unequip':''}</span></div>
  </button>`;
}
function renderPickerCards(){
  if(!equipmentPicker)return;
  const list=filteredPickerItems();
  const count=document.querySelector('#picker-count');
  const grid=document.querySelector('#equipment-picker-grid');
  if(count)count.textContent=`${list.length} matching · ${equipment.filter(x=>x.slot===equipmentPicker.slotId).length} in slot`;
  if(grid)grid.innerHTML=list.length?list.map(pickerCard).join(''):`<div class="picker-empty"><strong>No matching equipment</strong><p>Try different search terms or filters.</p><button class="btn secondary" type="button" data-picker-clear>Clear filters</button></div>`;
}
function openEquipmentPicker(launcher){
  if(state.view!=='heroes')return;
  const slot=equipmentSlots.find(s=>s.id===state.activeSlot)||equipmentSlots[0];
  const hero=h(state.selectedHero);
  pickerLauncher=launcher||null;
  equipmentPicker={heroId:hero.id,slotId:slot.id,search:'',rarity:'All',set:'All',ownership:'All',sort:'Highest level'};
  const compatible=equipment.filter(item=>item.slot===slot.id);
  const rarityOptions=['All',...new Set(compatible.map(x=>x.rarity))];
  const sets=[...new Set(compatible.map(x=>x.setId).filter(Boolean))].map(id=>equipmentSets.find(x=>x.id===id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
  const select=(id,label,items)=>`<label class="picker-filter"><span>${label}</span><select id="${id}" aria-label="${label}">${items.map(([value,text])=>`<option value="${esc(value)}">${esc(text)}</option>`).join('')}</select></label>`;
  const html=`<div class="modal-backdrop picker-backdrop" data-picker-backdrop><section class="equipment-picker" role="dialog" aria-modal="true" aria-labelledby="picker-title" aria-describedby="picker-subtitle" tabindex="-1">
    <div class="picker-heading"><div><span class="section-kicker">EQUIPMENT INVENTORY · MOCK DATA</span><h2 id="picker-title">Choose ${esc(slot.label)} equipment</h2><p id="picker-subtitle">For ${esc(hero.name)} · unique items · swaps are draft-only</p></div><button type="button" class="picker-close" data-picker-close aria-label="Close equipment picker">×</button></div>
    <div class="picker-toolbar"><label class="picker-search"><span aria-hidden="true">⌕</span><input id="picker-search" type="search" placeholder="Search item, stat, set or hero..." aria-label="Search equipment" autocomplete="off"></label>
      ${select('picker-rarity','Rarity',rarityOptions.map(x=>[x,x]))}
      ${select('picker-set','Set',[['All','All sets'],...sets.map(set=>[set.id,set.name])])}
      ${select('picker-ownership','Ownership',pickerOptions.map(x=>[x,x==='Other heroes'?'Other heroes':x==='This hero'?'This hero':x]))}
      ${select('picker-sort','Sort',[['Highest level','Highest level'],['Most stars','Most stars'],['Name A–Z','Name A–Z']])}
    </div>
    <div class="picker-subheading"><strong>Compatible ${esc(slot.label.toLowerCase())} items</strong><span id="picker-count" aria-live="polite"></span></div>
    <div id="equipment-picker-grid" class="picker-grid-scroll" tabindex="0" aria-label="Equipment cards"></div>
    <div class="picker-footer"><div class="picker-footer-hint">Selecting an item updates the local draft and may move it from another hero.</div><button type="button" class="btn secondary" data-picker-unequip ${heroGear(hero.id)[slot.id]?'':'disabled'}>Unequip slot</button><button type="button" class="btn secondary" data-picker-close>Cancel</button></div>
  </section></div>`;
  document.querySelector('#modal-root').innerHTML=html;
  for(const el of document.querySelectorAll('.topbar,.sidebar,.workspace,.statusbar'))el.setAttribute('inert','');
  syncOverlayInert();
  renderPickerCards();
  document.querySelector('#picker-search')?.focus();
}
function closeEquipmentPicker(){
  if(!equipmentPicker)return;
  equipmentPicker=null;
  document.querySelector('#modal-root').innerHTML='';
  syncOverlayInert();
  const restore=pickerLauncher?.isConnected?pickerLauncher:document.querySelector('[data-action="openEquipmentPicker"]');
  pickerLauncher=null;
  restore?.focus();
}
function choosePickerItem(itemId){
  if(!equipmentPicker)return;
  const {heroId,slotId}=equipmentPicker;
  closeEquipmentPicker();
  moveItem(heroId,slotId,itemId);
  document.querySelector('[data-action="openEquipmentPicker"]')?.focus();
}

// Relic picker — docs/DESIGN.md §18. Relic fixtures are shared types, not unique instances.
let relicPicker=null;
const relicUsers=id=>heroes.filter(hero=>currentHero(hero.id).relic===id);
function filteredRelicItems(){
  if(!relicPicker)return [];
  const p=relicPicker,q=p.search.trim().toLocaleLowerCase();
  const rarityRank={'Legendary':4,'Epic':3,'Rare':2,'Common':1};
  return relics.filter(item=>{
    const users=relicUsers(item.id),names=users.map(hero=>hero.name);
    const haystack=[item.name,item.effect,item.type,item.rarity,...names].join(' ').toLocaleLowerCase();
    if(q&&!haystack.includes(q))return false;
    if(p.type!=='All'&&item.type!==p.type)return false;
    if(p.rarity!=='All'&&item.rarity!==p.rarity)return false;
    if(p.assignment==='Equipped by this hero'&&!users.some(x=>x.id===p.heroId))return false;
    if(p.assignment==='Equipped by others'&&!users.some(x=>x.id!==p.heroId))return false;
    if(p.assignment==='Unassigned'&&users.length)return false;
    return true;
  }).sort((a,b)=>{
    if(p.sort==='Name A–Z')return a.name.localeCompare(b.name);
    if(p.sort==='Rarity')return (rarityRank[b.rarity]||0)-(rarityRank[a.rarity]||0)||b.level-a.level||a.name.localeCompare(b.name);
    return b.level-a.level||a.name.localeCompare(b.name);
  });
}
function relicPickerCard(item){
  const p=relicPicker,users=relicUsers(item.id),current=currentHero(p.heroId).relic===item.id;
  const owners=users.length?`Equipped by ${users.map(hero=>hero.name).join(', ')}`:'Unassigned';
  return `<button type="button" class="picker-card relic-picker-card ${current?'is-equipped':''}" data-pick-relic="${esc(item.id)}" aria-label="Choose relic ${esc(item.name)}">
    <div class="picker-card-header"><span class="relic-card-art ${esc(item.rarity.toLowerCase())}">${esc(item.icon)}</span><span class="picker-card-identity"><strong>${esc(item.name)}</strong><small>${esc(item.rarity)} · Lv ${item.level}</small><span class="relic-card-type">${esc(item.type)}</span></span>${current?'<span class="picker-current">Equipped</span>':''}</div>
    <div class="relic-card-effect"><span>Effect</span><strong>${esc(item.effect)}</strong></div>
    <div class="relic-card-meta"><span>Mock copies</span><b>${item.charges}</b></div>
    <div class="picker-card-owner"><span aria-hidden="true">◇</span><span>${esc(owners)}</span></div>
  </button>`;
}
function renderRelicPickerCards(){
  if(!relicPicker)return;
  const list=filteredRelicItems(),count=document.querySelector('#relic-picker-count'),grid=document.querySelector('#relic-picker-grid');
  if(count)count.textContent=`${list.length} matching · ${relics.length} relic types`;
  if(grid)grid.innerHTML=list.length?list.map(relicPickerCard).join(''):`<div class="picker-empty"><strong>No matching relics</strong><p>Try different search terms or filters.</p><button class="btn secondary" type="button" data-relic-picker-clear>Clear filters</button></div>`;
}
function openRelicPicker(launcher){
  if(state.view!=='heroes')return;
  const hero=h(state.selectedHero);
  pickerLauncher=launcher||null;
  relicPicker={heroId:hero.id,search:'',type:'All',rarity:'All',assignment:'All',sort:'Highest level'};
  const select=(id,label,items)=>`<label class="picker-filter"><span>${label}</span><select id="${id}" aria-label="${label}">${items.map(([value,text])=>`<option value="${esc(value)}">${esc(text)}</option>`).join('')}</select></label>`;
  const types=[...new Set(relics.map(x=>x.type))].sort();
  const rarities=[...new Set(relics.map(x=>x.rarity))];
  const assignmentOptions=['All','Equipped by this hero','Equipped by others','Unassigned'];
  const html=`<div class="modal-backdrop picker-backdrop" data-relic-picker-backdrop><section class="equipment-picker relic-picker" role="dialog" aria-modal="true" aria-labelledby="relic-picker-title" aria-describedby="relic-picker-subtitle" tabindex="-1">
    <div class="picker-heading"><div><span class="section-kicker">RELIC VAULT · MOCK DATA</span><h2 id="relic-picker-title">Choose relic</h2><p id="relic-picker-subtitle">For ${esc(hero.name)} · mock relic types · local draft only</p></div><button type="button" class="picker-close" data-relic-picker-close aria-label="Close relic picker">×</button></div>
    <div class="picker-toolbar"><label class="picker-search"><span aria-hidden="true">⌕</span><input id="relic-picker-search" type="search" placeholder="Search relic, effect, type or hero..." aria-label="Search relics" autocomplete="off"></label>
      ${select('relic-picker-type','Type',[['All','All types'],...types.map(x=>[x,x])])}
      ${select('relic-picker-rarity','Rarity',[['All','All rarities'],...rarities.map(x=>[x,x])])}
      ${select('relic-picker-assignment','Assignment',assignmentOptions.map(x=>[x,x]))}
      ${select('relic-picker-sort','Sort',[['Highest level','Highest level'],['Name A–Z','Name A–Z'],['Rarity','Rarity']])}
    </div>
    <div class="picker-subheading"><strong>Relics in collection</strong><span id="relic-picker-count" aria-live="polite"></span></div>
    <div id="relic-picker-grid" class="picker-grid-scroll" tabindex="0" aria-label="Relic cards"></div>
    <div class="picker-footer"><div class="picker-footer-hint">This mock lists relic types, not individual items. Choosing one changes only this hero's local draft.</div><button type="button" class="btn secondary" data-relic-picker-unequip ${currentHero(hero.id).relic?'':'disabled'}>Unequip relic</button><button type="button" class="btn secondary" data-relic-picker-close>Cancel</button></div>
  </section></div>`;
  document.querySelector('#modal-root').innerHTML=html;
  for(const el of document.querySelectorAll('.topbar,.sidebar,.workspace,.statusbar'))el.setAttribute('inert','');
  syncOverlayInert();
  renderRelicPickerCards();
  document.querySelector('#relic-picker-search')?.focus();
}
function closeRelicPicker(){
  if(!relicPicker)return;
  relicPicker=null;
  document.querySelector('#modal-root').innerHTML='';
  syncOverlayInert();
  const restore=pickerLauncher?.isConnected?pickerLauncher:document.querySelector('[data-action="openRelicPicker"]');
  pickerLauncher=null;
  restore?.focus();
}
function chooseRelicPickerItem(itemId){
  if(!relicPicker)return;
  const {heroId}=relicPicker;
  if(itemId!==null&&!relics.some(x=>x.id===itemId))return;
  closeRelicPicker();
  changeHero(heroId,'relic',itemId||'');
  document.querySelector('[data-action="openRelicPicker"]')?.focus();
}

function savePlanModal(){const root=document.getElementById('modal-root');root.innerHTML=`<div class="modal-backdrop" data-action="closeModal"><form id="save-form" class="modal" role="dialog" aria-modal="true" aria-label="Save plan"><div class="modal-head"><h2>Save upgrade plan</h2><button type="button" class="icon-button" data-action="closeModal">×</button></div><p>Your current changes will be saved locally in this browser, not applied to the game.</p><label class="field-label" for="plan-name">Plan name</label><input id="plan-name" name="name" required maxlength="60" value="Battle improvements ${new Date().toLocaleDateString('en-GB')}"/><div class="modal-actions"><button type="button" class="btn secondary" data-action="closeModal">Cancel</button><button type="submit" class="btn primary">Save locally</button></div></form></div>`;root.querySelector('#plan-name')?.focus()}
function act(action){
  if(action.startsWith('go')){goto(({goPlanner:'planner',goArena:'arena',goHeroes:'heroes',goBattles:'battles'})[action]);return}
  if(action==='closeHeroDialog'){closeHeroDialog();return}
  if(action==='showAllHeroes'){state.heroChangedOnly=false;state.search='';render();return}
  if(action==='resetHero'){resetHeroDraft(state.selectedHero);toast('Hero draft reset');return;}
  if(action==='resetChanges'){state.changes={};state.assignments={};state.itemLevels={};saveDraft();render();toast('Draft cleared');return}
  if(action==='resetAll'){try{localStorage.removeItem(STORAGE)}catch{}state.changes={};state.assignments={};state.itemLevels={};state.plans=[];render();toast('Demo reset');return}
  if(action==='openEquipmentPicker'){openEquipmentPicker(document.querySelector('[data-action="openEquipmentPicker"]'));return}
  if(action==='openRelicPicker'){openRelicPicker(document.querySelector('[data-action="openRelicPicker"]'));return}
  if(action==='savePlan'){savePlanModal();return}
  if(action==='closeModal'){document.querySelector('#modal-root').innerHTML='';return}
  if(action==='applyBattle'){applyRecipe(state.selectedBattle);return}
  if(action==='useFormation'){const o=opponents.find(x=>x.id===state.selectedOpponent);toast(`Selected ${squad(o.alternative).name} for ${o.name} (demo only)`);return}
  if(action==='optimizeAll'){toast('Candidate formations already ranked in the mock arena table');return}
}
document.addEventListener('click',e=>{
  if(relicPicker){
    const card=e.target.closest('[data-pick-relic]');if(card){chooseRelicPickerItem(card.dataset.pickRelic);return}
    if(e.target.closest('[data-relic-picker-unequip]')){chooseRelicPickerItem(null);return}
    if(e.target.closest('[data-relic-picker-close]')||e.target.hasAttribute('data-relic-picker-backdrop')){closeRelicPicker();return}
    if(e.target.closest('[data-relic-picker-clear]')){Object.assign(relicPicker,{search:'',type:'All',rarity:'All',assignment:'All',sort:'Highest level'});document.querySelector('#relic-picker-search').value='';for(const field of ['type','rarity','assignment','sort'])document.querySelector('#relic-picker-'+field).value=relicPicker[field];renderRelicPickerCards();document.querySelector('#relic-picker-search')?.focus();return}
    return;
  }
  if(equipmentPicker){
    const card=e.target.closest('[data-pick-item]');if(card){choosePickerItem(card.dataset.pickItem);return}
    if(e.target.closest('[data-picker-unequip]')){choosePickerItem(null);return}
    if(e.target.closest('[data-picker-close]')||(e.target.hasAttribute('data-picker-backdrop'))){closeEquipmentPicker();return}
    if(e.target.closest('[data-picker-clear]')){Object.assign(equipmentPicker,{search:'',rarity:'All',set:'All',ownership:'All',sort:'Highest level'});document.querySelector('#picker-search').value='';for(const field of ['rarity','set','ownership','sort'])document.querySelector('#picker-'+field).value=equipmentPicker[field];renderPickerCards();document.querySelector('#picker-search')?.focus();return}
    return; // Ignore all page interactions beneath a modal.
  }
  const revert=e.target.closest('[data-revert-kind]');
  if(revert){
    const {revertHero:heroId,revertKind:kind,revertKey:key=''}=revert.dataset;
    const changes=heroDiff(heroId);
    const index=changes.findIndex(c=>c.kind===kind&&(c.slotId||c.itemId||'')===key);
    const change=changes[index];
    if(index<0||!revertHeroChange(heroId,kind,key)){toast('This draft change is no longer available');return}
    const remaining=[...document.querySelectorAll('.hero-detail-dialog [data-revert-kind]')];
    const focusTarget=remaining[Math.min(index,remaining.length-1)]||document.querySelector('#hero-changes-heading');
    focusTarget?.focus({preventScroll:true});
    toast(`${change.label} restored to snapshot`);
    return;
  }
  const heroBackdrop=e.target.closest('[data-hero-backdrop]');
  if(heroBackdrop&&heroBackdrop===e.target){closeHeroDialog();return}
  const openDetail=e.target.closest('[data-open-hero]');if(openDetail){openHeroDialog(openDetail.dataset.openHero);return}
  const slot=e.target.closest('[data-select-slot]');if(slot){state.activeSlot=slot.dataset.selectSlot;state.selectedItem=heroGear(slot.dataset.forHero)[state.activeSlot];render();return}
  const item=e.target.closest('[data-item]');if(item){state.selectedItem=item.dataset.item;render();return}
  const relicRow=e.target.closest('[data-relic]');if(relicRow){state.selectedRelic=relicRow.dataset.relic;render();return}
  const relicUser=e.target.closest('[data-relic-user]');if(relicUser){state.heroChangedOnly=false;openHeroDialog(relicUser.dataset.relicUser);return}
  const resetItem=e.target.closest('[data-reset-item]');if(resetItem){delete state.itemLevels[resetItem.dataset.resetItem];saveDraft();render();return}
  const nav=e.target.closest('[data-nav]');if(nav){goto(nav.dataset.nav);return}
  const hero=e.target.closest('[data-hero]');if(hero){
    if(state.view!=='heroes'){openHeroDialog(hero.dataset.hero);return}
    state.selectedHero=hero.dataset.hero;state.activeSlot='weapon';state.selectedItem=heroGear(state.selectedHero).weapon;render();return;
  }
  const battle=e.target.closest('[data-battle]');if(battle){state.selectedBattle=battle.dataset.battle;goto('battles');return}
  const opp=e.target.closest('[data-opponent]');if(opp){state.selectedOpponent=opp.dataset.opponent;goto('arena');return}
  const remove=e.target.closest('[data-reset-hero]');if(remove){resetHeroDraft(remove.dataset.resetHero);return}
  const add=e.target.closest('[data-apply-recipe]');if(add){applyRecipe(add.dataset.applyRecipe);return}
  const loadPlan=e.target.closest('[data-load-plan]');if(loadPlan){const plan=state.plans[Number(loadPlan.dataset.loadPlan)];state.changes=structuredClone(plan.changes||{});state.assignments=structuredClone(plan.assignments||{});state.itemLevels=structuredClone(plan.itemLevels||{});saveDraft();render();toast('Saved plan loaded');return}
  const sort=e.target.closest('th[data-sort]');if(sort?.dataset.sort){const key=sort.dataset.sort;state.sortDir=state.sortKey===key?-state.sortDir:1;state.sortKey=key;render();return}
  const action=e.target.closest('[data-action]');if(action){if(action.dataset.action==='closeModal'&&action.classList.contains('modal-backdrop')&&e.target!==action)return;act(action.dataset.action)}
});
document.addEventListener('input',e=>{
  if(relicPicker&&e.target.id==='relic-picker-search'){relicPicker.search=e.target.value;renderRelicPickerCards();return}
  if(equipmentPicker&&e.target.id==='picker-search'){equipmentPicker.search=e.target.value;renderPickerCards();return}
  if(e.target.id==='global-search'){
    const start=e.target.selectionStart;state.search=e.target.value;const view=document.querySelector('#view-content');
    if(view){view.innerHTML=renderView();syncRecordCount();const input=document.querySelector('#global-search');input?.focus();input?.setSelectionRange(start,start)}return;
  }
  if(e.target.id==='hero-level'){const label=e.target.closest('.inspector-section')?.querySelector('.field-label span');if(label)label.textContent=`${e.target.value} / ${h(e.target.dataset.heroId)?.max||''}`;return}
  if(e.target.id==='item-level'){const label=e.target.closest('.item-upgrade')?.querySelector('.field-label span');if(label)label.textContent=`${e.target.value} / ${eq(e.target.dataset.itemId)?.maxLevel||''}`;return}
});
document.addEventListener('change',e=>{
  if(e.target.id==='hero-level'){changeHero(e.target.dataset.heroId,'level',e.target.value);return}
  if(e.target.id==='item-level'){changeItemLevel(e.target.dataset.itemId,e.target.value);return}
  if(relicPicker&&['relic-picker-type','relic-picker-rarity','relic-picker-assignment','relic-picker-sort'].includes(e.target.id)){relicPicker[e.target.id.replace('relic-picker-','')]=e.target.value;renderRelicPickerCards();return}
  if(equipmentPicker&&['picker-rarity','picker-set','picker-ownership','picker-sort'].includes(e.target.id)){
    equipmentPicker[e.target.id.replace('picker-','')]=e.target.value;renderPickerCards();return;
  }
  if(e.target.id==='hero-changed-only'){state.heroChangedOnly=e.target.checked;render();return}
  if(e.target.id==='battle-filter'){state.battleFilter=e.target.value;render()}
  if(e.target.id==='arena-mode'){state.arenaMode=e.target.value;render()}
});
document.addEventListener('keydown',e=>{
  if(!equipmentPicker&&!relicPicker){
    if(state.heroDialogOpen&&e.key==='Escape'){e.preventDefault();closeHeroDialog();return}
    if(state.heroDialogOpen&&e.key==='Tab'){const dialog=document.querySelector('.hero-detail-dialog');if(dialog){focusInDialog(dialog,e);return}}
    if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[data-relic]')){e.preventDefault();state.selectedRelic=e.target.dataset.relic;render();document.querySelector('[data-relic=\"'+state.selectedRelic+'\"]')?.focus();}
    return;
  }
  if(e.key==='Escape'){e.preventDefault();if(relicPicker)closeRelicPicker();else closeEquipmentPicker();return}
  if(e.key!=='Tab')return;
  const modal=document.querySelector('.equipment-picker');if(modal)focusInDialog(modal,e);
});
document.addEventListener('submit',e=>{if(e.target.id!=='save-form')return;e.preventDefault();const name=e.target.elements.name.value.trim();if(!name)return;state.plans.unshift({name,created:new Date().toLocaleDateString('en-GB'),count:Object.keys(state.changes).length+Object.keys(state.assignments).length+Object.keys(state.itemLevels).length,changes:structuredClone(state.changes),assignments:structuredClone(state.assignments),itemLevels:structuredClone(state.itemLevels)});state.plans=state.plans.slice(0,20);saveDraft();render();toast(`Saved plan: ${name}`)});
// Keep failures visible even if initialization fails before the UI can render.
try{render()}catch(error){
  console.error('Battle Lab failed to start',error);
  const escaped=String(error?.message||error||'Unknown startup error').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  app.innerHTML=`<div class="boot-fallback"><strong>Battle Lab could not start</strong><p>${escaped}</p><p>Rebuild the standalone HTML with <code>npm run build</code> or refresh after clearing local site data.</p></div>`;
}
