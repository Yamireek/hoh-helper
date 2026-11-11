// Fixture content is illustrative. It must never be mistaken for extracted game data.
export const heroes = [
  {id:'leonardo',name:'Leonardo da Vinci',faction:'Renaissance',role:'Manipulator',rarity:5,level:192,max:200,stars:5,power:42890,attack:3810,health:25400,equipment:'clockwork',relic:'insight',portrait:'LD',color:'#7ccbd8'},
  {id:'cleopatra',name:'Cleopatra',faction:'Antiquity',role:'Support',rarity:5,level:180,max:200,stars:5,power:40220,attack:2890,health:31000,equipment:'sunward',relic:'serpent',portrait:'CL',color:'#e9b96c'},
  {id:'alexander',name:'Alexander the Great',faction:'Antiquity',role:'Striker',rarity:5,level:190,max:200,stars:5,power:41350,attack:4110,health:20600,equipment:'conqueror',relic:'valor',portrait:'AG',color:'#c293eb'},
  {id:'joan',name:'Joan of Arc',faction:'Medieval',role:'Tank',rarity:5,level:184,max:200,stars:5,power:39620,attack:2310,health:43200,equipment:'guardian',relic:'aegis',portrait:'JA',color:'#8fb8ff'},
  {id:'tesla',name:'Nikola Tesla',faction:'Industrial',role:'Area striker',rarity:5,level:172,max:200,stars:5,power:37210,attack:3980,health:18700,equipment:'spark',relic:'insight',portrait:'NT',color:'#a6d7fa'},
  {id:'circe',name:'Circe',faction:'Myth',role:'Manipulator',rarity:4,level:152,max:160,stars:4,power:31240,attack:2700,health:23600,equipment:'arcane',relic:'serpent',portrait:'CI',color:'#d8a7f5'},
  {id:'tut',name:'Tutankhamun',faction:'Antiquity',role:'Support',rarity:4,level:160,max:160,stars:4,power:29160,attack:2130,health:27000,equipment:'sunward',relic:'aegis',portrait:'TU',color:'#e9c57a'},
  {id:'achilles',name:'Achilles',faction:'Myth',role:'Striker',rarity:5,level:186,max:200,stars:5,power:39890,attack:4330,health:21300,equipment:'conqueror',relic:'valor',portrait:'AC',color:'#f3ac99'},
  {id:'boudica',name:'Boudica',faction:'Antiquity',role:'Striker',rarity:4,level:146,max:160,stars:4,power:27780,attack:3260,health:18000,equipment:'ranger',relic:'valor',portrait:'BO',color:'#e49ea6'},
  {id:'sun',name:'Sun Tzu',faction:'Antiquity',role:'Manipulator',rarity:5,level:168,max:200,stars:5,power:36520,attack:2860,health:25200,equipment:'arcane',relic:'insight',portrait:'ST',color:'#b5d69e'},
  {id:'hatshepsut',name:'Hatshepsut',faction:'Antiquity',role:'Support',rarity:4,level:154,max:160,stars:4,power:28840,attack:2180,health:29400,equipment:'sunward',relic:'serpent',portrait:'HA',color:'#e7c19f'},
  {id:'spartacus',name:'Spartacus',faction:'Antiquity',role:'Tank',rarity:4,level:155,max:160,stars:4,power:30220,attack:2500,health:36000,equipment:'guardian',relic:'aegis',portrait:'SP',color:'#dd9b89'},
  {id:'marie',name:'Marie Curie',faction:'Industrial',role:'Area striker',rarity:5,level:160,max:200,stars:5,power:34330,attack:3540,health:19200,equipment:'spark',relic:'insight',portrait:'MC',color:'#88cfc0'},
  {id:'william',name:'William Wallace',faction:'Medieval',role:'Striker',rarity:4,level:144,max:160,stars:4,power:26470,attack:3110,health:20300,equipment:'ranger',relic:'valor',portrait:'WW',color:'#adbfde'},
  {id:'zenobia',name:'Zenobia',faction:'Antiquity',role:'Support',rarity:3,level:60,max:60,stars:3,power:12900,attack:1120,health:12800,equipment:'sunward',relic:'serpent',portrait:'ZE',color:'#d9b0ca'},
  {id:'archimedes',name:'Archimedes',faction:'Antiquity',role:'Manipulator',rarity:4,level:150,max:160,stars:4,power:29350,attack:2450,health:23400,equipment:'clockwork',relic:'insight',portrait:'AR',color:'#b2d8c5'}
];
// Static, deterministic illustrative equipment instances. Slot names are provisional UI labels.
export const equipmentSlots = [
  { id:'weapon', label:'Weapon', position:'left-top', icon:'⚔' },
  { id:'body', label:'Body', position:'left-bottom', icon:'♜' },
  { id:'head', label:'Head', position:'right-top', icon:'♛' },
  { id:'neck', label:'Neck', position:'right-middle', icon:'◇' },
  { id:'wrist', label:'Wrist', position:'right-bottom', icon:'◈' }
];
export const equipmentSets = [
  { id:'scientist', name:'Scientist’s Set', required:2, bonuses:[{key:'hpPct',label:'Hit Points',value:5,unit:'percent'}] },
  ...heroes.flatMap(hero=>[
    { id:`${hero.id}-primary`, name:`${hero.faction} Set`, required:2, bonuses:[{key:'attackPct',label:'Attack',value:4,unit:'percent'}] },
    { id:`${hero.id}-secondary`, name:`${hero.role} Set`, required:3, bonuses:[{key:'hpPct',label:'Hit Points',value:6,unit:'percent'}] }
  ])
];
const itemStats = (i,slot)=>{
  const flat = (key,label,value)=>({key,label,value,unit:'flat'});
  const pct = (key,label,value)=>({key,label,value,unit:'percent'});
  const base = [flat('atk','ATK',24+i*3), flat('hp','HP',70+i*11)];
  if(slot==='weapon')return [...base,pct('baseDmg','Base DMG',+(1.4+i*.08).toFixed(2)),pct('def','DEF',+(1.7+i*.09).toFixed(2))];
  if(slot==='body')return [flat('hp','HP',115+i*19),pct('def','DEF',+(2.1+i*.11).toFixed(2)),pct('hpBonus','Hit Points',+(1.1+i*.07).toFixed(2))];
  if(slot==='head')return [flat('atk','ATK',20+i*3),flat('hp','HP',80+i*9),pct('baseDmg','Base DMG',+(1.25+i*.09).toFixed(2))];
  if(slot==='neck')return [pct('baseDmg','Base DMG',+(1.5+i*.1).toFixed(2)),flat('hp','HP',50+i*7),pct('def','DEF',+(1.3+i*.12).toFixed(2))];
  return [flat('atk','ATK',16+i*2),pct('def','DEF',+(2+i*.07).toFixed(2))];
};
const slotNames={weapon:'Blade',body:'Coat',head:'Helm',neck:'Amulet',wrist:'Bracer'};
const slotIcons={weapon:'⚔',body:'♜',head:'♛',neck:'◇',wrist:'◈'};
export const equipment = heroes.flatMap((hero,heroIndex)=>equipmentSlots.map((slot,slotIndex)=>{
  const isScientist=hero.id==='cleopatra' && slotIndex<2;
  const id=isScientist?slotIndex===0?'scientist-pen':'scientist-coat':`${hero.id}-${slot.id}`;
  const setId=isScientist?'scientist':slotIndex<2?`${hero.id}-primary`:`${hero.id}-secondary`;
  const item={
    id, typeId: `${setId}-${slot.id}`, name:isScientist?(slotIndex===0?'Scientist’s Pen':'Scientist’s Coat'):`${hero.faction} ${slotNames[slot.id]}`,
    slot:slot.id, rarity:isScientist?'Epic':hero.rarity===5?'Legendary':'Epic',stars:isScientist?5:Math.min(5,hero.rarity),
    level:isScientist?12:Math.min(20,10+(heroIndex+slotIndex*2)%10), maxLevel:20, setId,
    icon:isScientist?(slotIndex===0?'✒':'🥼'):slotIcons[slot.id],owner:hero.id,
    stats:isScientist&&slotIndex===0?[
      {key:'atk',label:'ATK',value:33,unit:'flat'},
      {key:'hp',label:'HP',value:80,unit:'flat'},
      {key:'baseDmg',label:'Base DMG',value:2.04,unit:'percent'},
      {key:'def',label:'DEF',value:2.8,unit:'percent'}
    ]:itemStats(heroIndex+slotIndex,slot.id)
  };
  return item;
}));
equipment.push(
  {id:'spare-pen',typeId:'scientist-weapon',name:'Scientist’s Pen (spare)',slot:'weapon',rarity:'Epic',stars:4,level:9,maxLevel:20,setId:'scientist',icon:'✒',owner:null,stats:itemStats(3,'weapon')},
  {id:'lance',typeId:'royal-weapon',name:'Royal Lance',slot:'weapon',rarity:'Legendary',stars:5,level:17,maxLevel:20,setId:null,icon:'⚑',owner:null,stats:itemStats(9,'weapon')},
  {id:'aegis',typeId:'aegis-body',name:'Aegis Harness',slot:'body',rarity:'Epic',stars:4,level:14,maxLevel:20,setId:null,icon:'⬢',owner:null,stats:itemStats(5,'body')},
  {id:'crown',typeId:'royal-head',name:'Crown of Dawn',slot:'head',rarity:'Legendary',stars:5,level:19,maxLevel:20,setId:null,icon:'♛',owner:null,stats:itemStats(7,'head')},
  {id:'bronze-bracers',typeId:'bronze-wrist',name:'Bronze Bracers',slot:'wrist',rarity:'Rare',stars:3,level:11,maxLevel:20,setId:null,icon:'◈',owner:null,stats:itemStats(2,'wrist')}
);
for(const hero of heroes){
  hero.equipmentSlots=Object.fromEntries(equipmentSlots.map(slot=>[
    slot.id,equipment.find(item=>item.owner===hero.id&&item.slot===slot.id)?.id||null
  ]));
  delete hero.equipment;
}
export const relics = [
  {id:'insight',name:'Lens of Insight',type:'Offense',rarity:'Legendary',level:8,effect:'Skill power +18%',charges:3,icon:'◇'},
  {id:'serpent',name:'Serpent Sigil',type:'Utility',rarity:'Epic',level:6,effect:'Debuff duration +12%',charges:2,icon:'◉'},
  {id:'valor',name:'Medallion of Valor',type:'Offense',rarity:'Legendary',level:9,effect:'Critical damage +16%',charges:1,icon:'✧'},
  {id:'aegis',name:'Aegis Fragment',type:'Defense',rarity:'Epic',level:7,effect:'Damage reduction +11%',charges:2,icon:'⬡'},
  {id:'frost',name:'Frostbound Seal',type:'Control',rarity:'Epic',level:5,effect:'Slow chance +8%',charges:1,icon:'❄'},
  {id:'ember',name:'Ember Shard',type:'Offense',rarity:'Rare',level:4,effect:'Burn damage +9%',charges:4,icon:'✹'},
  {id:'crownRelic',name:'Lost Crown',type:'Support',rarity:'Legendary',level:8,effect:'Healing received +14%',charges:1,icon:'♛'},
  {id:'clock',name:'Chronos Dial',type:'Utility',rarity:'Epic',level:6,effect:'Cooldown -7%',charges:2,icon:'◷'}
];
export const resources = [
  {id:'gold',name:'Gold',type:'Currency',owned:1820000,perDay:470000,icon:'◉',color:'#e4b969'},
  {id:'food',name:'Food',type:'Currency',owned:640000,perDay:186000,icon:'◈',color:'#8dbb77'},
  {id:'xp',name:'Hero XP',type:'Hero upgrade',owned:38200,perDay:11200,icon:'✦',color:'#91b9f9'},
  {id:'medals',name:'Hero Medals',type:'Hero upgrade',owned:112,perDay:34,icon:'⬡',color:'#d2a5ea'},
  {id:'essence',name:'Ascension Essence',type:'Hero upgrade',owned:64,perDay:18,icon:'◆',color:'#88d4cc'},
  {id:'ore',name:'Refinement Ore',type:'Equipment',owned:230,perDay:48,icon:'⬢',color:'#a8b7c8'},
  {id:'scrolls',name:'Enchantment Scrolls',type:'Equipment',owned:89,perDay:21,icon:'▤',color:'#d5b899'},
  {id:'shards',name:'Relic Shards',type:'Relic',owned:45,perDay:12,icon:'◇',color:'#e3a7d7'},
  {id:'tokens',name:'Arena Tokens',type:'Arena',owned:1280,perDay:110,icon:'◉',color:'#e4ad8c'},
  {id:'energy',name:'Stamina',type:'Battle',owned:97,perDay:150,icon:'ϟ',color:'#87cbd2'}
];
export const squads = [
  {id:'alpha',name:'Control & Sustain',heroes:['leonardo','cleopatra','joan','circe','tesla'],tag:'Control',base:84},
  {id:'beta',name:'Burst Vanguard',heroes:['alexander','achilles','boudica','sun','hatshepsut'],tag:'Burst',base:78},
  {id:'gamma',name:'Fortress Hold',heroes:['joan','spartacus','cleopatra','tut','leonardo'],tag:'Defense',base:83},
  {id:'delta',name:'Storm Response',heroes:['tesla','marie','sun','archimedes','joan'],tag:'Area',base:80},
  {id:'epsilon',name:'Antiquity Five',heroes:['alexander','achilles','cleopatra','sun','spartacus'],tag:'Faction',base:75},
  {id:'zeta',name:'Adaptive Counter',heroes:['leonardo','tesla','achilles','joan','cleopatra'],tag:'Hybrid',base:87}
];
export const opponents = [
  {id:'opp1',name:'Iron Regent',mode:'Arena',rank:12,power:193420,traits:'Frontline heavy',current:'alpha',win:88,alternative:'zeta',predicted:94,confidence:'High',record:'8 / 9'},
  {id:'opp2',name:'Night Raven',mode:'Arena',rank:18,power:206890,traits:'Burst opening',current:'gamma',win:75,alternative:'alpha',predicted:89,confidence:'Medium',record:'3 / 4'},
  {id:'opp3',name:'Solaris',mode:'Arena',rank:21,power:198600,traits:'Area damage',current:'beta',win:62,alternative:'gamma',predicted:85,confidence:'Medium',record:'5 / 8'},
  {id:'opp4',name:'Stone Warden',mode:'Elite Arena',rank:8,power:228100,traits:'Triple defense',current:'epsilon',win:54,alternative:'zeta',predicted:81,confidence:'Low',record:'2 / 4'},
  {id:'opp5',name:'Mist Sovereign',mode:'Elite Arena',rank:14,power:215600,traits:'Control / heal',current:'delta',win:73,alternative:'beta',predicted:86,confidence:'Medium',record:'7 / 10'},
  {id:'opp6',name:'Golden Fang',mode:'Arena',rank:28,power:184200,traits:'Single-target burst',current:'zeta',win:92,alternative:'zeta',predicted:92,confidence:'High',record:'11 / 12'}
];
export const battles = [
  {id:'b1',name:'Sparta’s Last Stand · 11',mode:'Historic',result:'Defeat',stars:0,seed:'3197340546',team:'beta',last:'11 Nov · 10:42',target:'Victory',plan:'sparta',gain:72},
  {id:'b2',name:'Campaign · 44-3 Normal',mode:'Campaign',result:'Victory',stars:2,seed:'981230474',team:'alpha',last:'11 Nov · 09:28',target:'3 stars',plan:'campaign',gain:17},
  {id:'b3',name:'Tesla Storms · Stage 17 Yellow',mode:'Tesla Storms',result:'Defeat',stars:0,seed:'2081458913',team:'delta',last:'10 Nov · 20:16',target:'Victory',plan:'tesla',gain:66},
  {id:'b4',name:'Siege of Orleans · 8',mode:'Historic',result:'Victory',stars:1,seed:'1415578320',team:'gamma',last:'10 Nov · 18:04',target:'3 stars',plan:'orleans',gain:49},
  {id:'b5',name:'Campaign · 29-1 Hard',mode:'Campaign Hard',result:'Defeat',stars:0,seed:'1149182222',team:'epsilon',last:'10 Nov · 17:41',target:'Victory',plan:'hard',gain:58},
  {id:'b6',name:'Fall of Troy · 7',mode:'Historic',result:'Victory',stars:2,seed:'2442873821',team:'beta',last:'09 Nov · 21:15',target:'3 stars',plan:'troy',gain:22},
  {id:'b7',name:'Campaign · 43-9 Normal',mode:'Campaign',result:'Victory',stars:3,seed:'1673020440',team:'alpha',last:'09 Nov · 19:08',target:'Complete',plan:null,gain:0},
  {id:'b8',name:'Atlantis · Depth 12',mode:'Atlantis',result:'Defeat',stars:0,seed:'2245091821',team:'delta',last:'09 Nov · 16:34',target:'Victory',plan:'atlantis',gain:75},
  {id:'b9',name:'Campaign · 42-5 Normal',mode:'Campaign',result:'Victory',stars:3,seed:'1900421281',team:'zeta',last:'08 Nov · 20:12',target:'Complete',plan:null,gain:0},
  {id:'b10',name:'Campaign · 28-10 Hard',mode:'Campaign Hard',result:'Victory',stars:2,seed:'1120477894',team:'gamma',last:'08 Nov · 15:02',target:'3 stars',plan:'hard',gain:16},
  {id:'b11',name:'Tesla Storms · Stage 16 Blue',mode:'Tesla Storms',result:'Victory',stars:3,seed:'687645518',team:'delta',last:'07 Nov · 22:31',target:'Complete',plan:null,gain:0}
];
// Recipes are illustrative candidate changes; no native WASM simulation is performed.
export const recipes = {
  sparta:{hero:'achilles',level:192,equipment:'lance',relic:'valor',cost:{gold:420000,xp:19000,medals:42,ore:45},description:'Improve single-target damage to finish the final wave.',suggested:'Burst Vanguard'},
  campaign:{hero:'joan',level:187,equipment:'guardian',relic:'aegis',cost:{gold:85000,xp:4800,medals:8},description:'Small frontline durability increase for a safer 3-star clear.',suggested:'Control & Sustain'},
  tesla:{hero:'tesla',level:180,equipment:'spark',relic:'insight',cost:{gold:290000,xp:16500,medals:32,ore:40,scrolls:20},description:'Increase area damage without exceeding rarity cap.',suggested:'Storm Response'},
  orleans:{hero:'joan',level:192,equipment:'aegis',relic:'aegis',cost:{gold:310000,xp:12000,medals:26,ore:30},description:'Defensive frontline, preserving historic class restrictions.',suggested:'Fortress Hold'},
  hard:{hero:'alexander',level:196,equipment:'conqueror',relic:'valor',cost:{gold:540000,xp:23000,medals:46,essence:26},description:'Strengthen core striker to survive the boss phase.',suggested:'Antiquity Five'},
  troy:{hero:'sun',level:172,equipment:'arcane',relic:'insight',cost:{gold:132000,xp:7300,medals:12},description:'A modest control increase for the final encounter.',suggested:'Burst Vanguard'},
  atlantis:{hero:'marie',level:170,equipment:'spark',relic:'ember',cost:{gold:350000,xp:18000,medals:36,shards:20},description:'Improve area clearance in the deep wave.',suggested:'Storm Response'}
};
export const formatNum = value => new Intl.NumberFormat('en-US',{notation:Math.abs(value)>=1000000?'compact':'standard',maximumFractionDigits:Math.abs(value)>=1000000?1:0}).format(value);

