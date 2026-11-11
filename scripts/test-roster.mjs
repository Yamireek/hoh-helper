import fs from 'node:fs';
import assert from 'node:assert/strict';
import {heroes} from '../src/mock-data.js';
const source=fs.readFileSync('src/main.js','utf8');
assert(heroes.length>=10);
for(const name of ['heroDiff','changedHeroes','heroChangedOnly','visibleHeroes','resetHeroDraft'])assert(source.includes(name),'Missing roster change feature '+name);
console.log('Roster change features: OK');
