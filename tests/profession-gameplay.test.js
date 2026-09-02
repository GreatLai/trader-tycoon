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
  assert.equal(rules.price.ordinaryFloorShift < 0, true);
  assert.equal(rules.price.ordinaryCeilingCap < 1.2, true);
});

test('tooth merchant is available by default and remains unlocked after progress updates', () => {
  const { api } = createGame();

  assert.equal(api.loadProfile().unlockedProfessionIds.includes('toothMerchant'), true);
  api.unlockEligibleProfessions({ peakNetWorth: 10000 });

  assert.equal(api.loadProfile().unlockedProfessionIds.includes('toothMerchant'), true);
});

test('tooth merchant can raise an owned listed good once every three days', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 10;
  const rolls = [0.5, 0];
  api.setRandom(() => rolls.shift() ?? 0);

  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), ['wheat']);
  const first = api.useProfessionAbility('wheat');
  const second = api.useProfessionAbility('wheat');

  assert.equal(first.ok, true);
  assert.equal(state.prices.wheat, +(api.GOODS.find(good => good.id === 'wheat').base * 1.15).toFixed(2));
  assert.equal(state.profession.activeUsedDay, state.day);
  assert.deepEqual(plain(second), { ok: false, reason: 'already-used' });

  state.day = 2;
  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), []);
  assert.deepEqual(plain(api.useProfessionAbility('wheat')), { ok: false, reason: 'cooldown', readyDay: 4 });

  state.day = 3;
  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), []);

  state.day = 4;
  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), ['wheat']);
});

test('tooth merchant cannot raise a good bought on the same day', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.prices.wheat = 5;
  state.cash = 5000;

  api.buy('wheat', 1);

  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), []);
  assert.deepEqual(plain(api.useProfessionAbility('wheat')), { ok: false, reason: 'invalid-target' });
});

test('buying more of an existing holding blocks tooth merchant raise price that day', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;

  api.buy('wheat', 1);

  assert.equal(state.inventory.wheat, 11);
  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), []);
});

test('failed raise price consumes the ability and locks sales through the third day', () => {
  const { api } = createGame({ random: () => 0.10 });
  const state = api.reset();
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.prices.wheat = 5;
  const cashBefore = state.cash;

  const result = api.useProfessionAbility('wheat');

  assert.deepEqual(plain(result), { ok: false, reason: 'raise-failed', goodId: 'wheat', unlockDay: 4 });
  assert.equal(state.prices.wheat, 5);
  assert.equal(state.profession.activeUsedDay, 1);
  assert.equal(api.isGoodSaleLocked('wheat'), true);
  api.sell('wheat', 10);
  assert.equal(state.inventory.wheat, 10);
  assert.equal(state.cash, cashBefore);

  state.day = 2;
  assert.equal(api.isGoodSaleLocked('wheat'), true);
  state.day = 3;
  assert.equal(api.isGoodSaleLocked('wheat'), true);
  state.day = 4;
  assert.equal(api.isGoodSaleLocked('wheat'), false);
  api.sell('wheat', 10);
  assert.equal(state.inventory.wheat, undefined);
});

test('forced liquidation cannot bypass a tooth merchant sale lock', () => {
  const { api } = createGame({ random: () => 0.10 });
  const state = api.reset();
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 100;
  state.costBasis.wheat = 500;
  state.prices.wheat = 5;
  api.useProfessionAbility('wheat');
  state.cash = 0;

  api.applyDailyCosts(1);

  assert.equal(state.inventory.wheat, 100);
  assert.equal(state.gameOver, 'lose');
});

test('legacy saves normalize tooth merchant purchase and sale lock state', () => {
  const { api } = createGame();
  const legacy = api.newState();
  delete legacy.goodsBoughtDay;
  delete legacy.saleLockUntilDay;
  const { api: loadedApi } = createGame({ savedState: legacy });

  const loaded = loadedApi.loadSave();

  assert.deepEqual(plain(loaded.goodsBoughtDay), {});
  assert.deepEqual(plain(loaded.saleLockUntilDay), {});
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
