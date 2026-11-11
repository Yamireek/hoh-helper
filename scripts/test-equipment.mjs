import assert from 'node:assert/strict';
import {heroes,equipment,equipmentSlots,equipmentSets} from '../src/mock-data.js';
assert.equal(equipmentSlots.length,5,'Five equipment slots are required');
assert(heroes.length>0&&equipment.length>0);
assert(new Set(equipment.map(x=>x.id)).size===equipment.length,'Equipment items must have unique IDs');
assert(equipmentSets.length>0,'Equipment set definitions missing');
console.log('Equipment fixture invariants: OK');
