const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { ROOT, createGame } = require('./helpers/load-game');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('the first playable roster contains useless and tooth merchant', () => {
  const { api } = createGame();

  assert.deepEqual(Object.keys(api.PROFESSIONS), ['useless', 'toothMerchant']);
  assert.equal(api.PROFESSIONS.useless.activeAbility, null);
  assert.equal(api.PROFESSIONS.toothMerchant.activeAbility.id, 'raisePrice');
  assert.match(api.PROFESSIONS.toothMerchant.drawback, /高价/);
});

test('tooth merchant shifts ordinary prices lower and limits natural high prices', () => {
  const { api } = createGame();
  const rules = api.getEffectiveRules({ id: 'toothMerchant', activeUsedDay: null, data: {} });

  assert.equal(rules.price.ordinaryLogBias < 0, true);
  assert.equal(rules.price.ordinaryMinFactor < 0.8, true);
  assert.equal(rules.price.ordinaryMaxFactor < 1.2, true);
});

test('tooth merchant unlocks permanently after reaching ten thousand net worth', () => {
  const { api } = createGame();

  assert.equal(api.loadProfile().unlockedProfessionIds.includes('toothMerchant'), false);
  api.unlockEligibleProfessions({ peakNetWorth: 10000 });

  assert.equal(api.loadProfile().unlockedProfessionIds.includes('toothMerchant'), true);
});

test('tooth merchant can raise one owned listed good once per day', () => {
  const { api } = createGame({ random: () => 0 });
  const state = api.reset();
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 10;

  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), ['wheat']);
  const first = api.useProfessionAbility('wheat');
  const second = api.useProfessionAbility('wheat');

  assert.equal(first.ok, true);
  assert.equal(state.prices.wheat, +(api.GOODS.find(good => good.id === 'wheat').base * 1.15).toFixed(2));
  assert.equal(state.profession.activeUsedDay, state.day);
  assert.deepEqual(plain(second), { ok: false, reason: 'already-used' });
});

test('profession ability rejects standard profession and invalid goods', () => {
  const { api } = createGame();
  const state = api.reset();

  assert.deepEqual(plain(api.useProfessionAbility(state.availableGoods[0])), { ok: false, reason: 'no-active-ability' });
  state.profession = api.newProfessionState('toothMerchant');
  assert.deepEqual(plain(api.useProfessionAbility('wheat')), { ok: false, reason: 'invalid-target' });
});

test('the shop and card UI are replaced by profession selection and the in-run profession panel', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.doesNotMatch(html, /奇货铺|shopStock|cardInventory|cardOverlay|js\/shop\.js/);
  assert.match(html, /id="professionOverlay"/);
  assert.match(html, /id="professionPanel"/);
  assert.match(html, /id="professionAbilityBtn"/);
});

