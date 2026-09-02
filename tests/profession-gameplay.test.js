const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { ROOT, createGame } = require('./helpers/load-game');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('the playable roster contains useless, tooth merchant, and traveling merchant', () => {
  const { api } = createGame();

  assert.deepEqual(Object.keys(api.PROFESSIONS), ['useless', 'toothMerchant', 'travelingMerchant']);
  assert.equal(api.PROFESSIONS.useless.activeAbility, null);
  assert.equal(api.PROFESSIONS.toothMerchant.activeAbility.id, 'raisePrice');
  assert.equal(api.PROFESSIONS.travelingMerchant.activeAbility.id, 'marketTrip');
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

test('traveling merchant is available by default', () => {
  const { api } = createGame();
  assert.deepEqual(plain(api.loadProfile().unlockedProfessionIds), ['useless', 'toothMerchant', 'travelingMerchant']);
});

test('familiar route brings back the highest-cost holding when no inventory is naturally listed', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.availableGoods = ['coal', 'tea'];
  state.inventory.wheat = 20;
  state.costBasis.wheat = 100;
  state.inventory.wood = 20;
  state.costBasis.wood = 300;
  state.factors.coal = 1.4;
  state.factors.tea = 0.9;
  const woodPrice = state.prices.wood;
  api.setRandom(() => 0.64);

  const result = api.applyProfessionMarketPassive();

  assert.deepEqual(plain(result), { applied: true, broughtGoodId: 'wood', replacedGoodId: 'coal' });
  assert.deepEqual(plain(state.availableGoods), ['wood', 'tea']);
  assert.equal(state.prices.wood, woodPrice);
});

test('familiar route does nothing when inventory is already listed or its roll fails', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.availableGoods = ['wheat', 'wood'];
  api.setRandom(() => 0.1);
  assert.deepEqual(plain(api.applyProfessionMarketPassive()), { applied: false, reason: 'inventory-listed' });

  state.availableGoods = ['wood', 'coal'];
  api.setRandom(() => 0.65);
  assert.deepEqual(plain(api.applyProfessionMarketPassive()), { applied: false, reason: 'roll-failed' });
});

test('market trip refreshes and adds an unlisted holding with a fifteen-percent event chance', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.day = 8;
  state.availableGoods = ['wood'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.lastSeenPrice.wheat = 5;
  const rolls = [0.20, 0.5, 0.5, 0.5, 0.5];
  api.setRandom(() => rolls.shift() ?? 0.5);

  const result = api.useProfessionAbility('wheat');

  assert.equal(result.ok, true);
  assert.equal(state.availableGoods.includes('wheat'), true);
  assert.equal(state.profession.activeUsedDay, 8);
  assert.equal(state.profession.data.marketTripGoodId, 'wheat');
  assert.equal(state.profession.data.marketTripDay, 8);
  assert.equal(state.events.length, 0);
  state.day = 9;
  assert.deepEqual(plain(api.useProfessionAbility('wheat')), { ok: false, reason: 'cooldown', readyDay: 11 });
});

test('market trip can trigger a sudden event but bypasses active ecology pricing', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.day = 8;
  state.availableGoods = ['wood'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.lastSeenPrice.wheat = 5;
  const ecology = Object.entries(api.ECO_EVENTS).find(([, event]) => event.goods.includes('wheat'));
  state.eco = { treeId: ecology[0], startDay: 7, A: 0, B: null, C: null, byCard: false };
  api.setRandom(() => 0.1);

  const result = api.useProfessionAbility('wheat');

  assert.equal(result.ok, true);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].goodId, 'wheat');
});

test('market trip fifteen-percent roll guarantees an event without a second movement gate', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.availableGoods = ['wood'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.lastSeenPrice.wheat = 5;
  const rolls = [0.14];
  api.setRandom(() => rolls.shift() ?? 0.99);

  const result = api.useProfessionAbility('wheat');

  assert.equal(result.ok, true);
  assert.equal(state.events.length, 1);
});

test('selling a same-day market trip good deducts five percent travel costs', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.prices.wheat = 10;
  state.profession.data.marketTripGoodId = 'wheat';
  state.profession.data.marketTripDay = state.day;
  const cashBefore = state.cash;

  assert.deepEqual(plain(api.calculateSaleSettlement('wheat', 10, 10)), { gross: 100, fee: 5, net: 95, feeRate: 0.05 });
  api.sell('wheat', 10);
  assert.equal(state.cash, cashBefore + 95);
});

test('forced liquidation also deducts market trip travel costs', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 100;
  state.costBasis.wheat = 500;
  state.prices.wheat = 10;
  state.profession.data.marketTripGoodId = 'wheat';
  state.profession.data.marketTripDay = state.day;
  state.cash = 0;

  api.applyDailyCosts(1);

  assert.equal(state.inventory.wheat, 92);
  assert.equal(state.cash, 2.7);
});

test('legacy traveling merchant saves normalize market trip state', () => {
  const { api } = createGame();
  const legacy = api.newState();
  legacy.profession = { id: 'travelingMerchant', activeUsedDay: null, data: null };
  const { api: loadedApi } = createGame({ savedState: legacy });

  const loaded = loadedApi.loadSave();

  assert.equal(loaded.profession.id, 'travelingMerchant');
  assert.deepEqual(plain(loaded.profession.data), {});
});

test('traveling merchant UI exposes description, targets, cooldown, and travel fee text', () => {
  const professions = fs.readFileSync(path.join(ROOT, 'js/professions.js'), 'utf8');
  const marketActions = fs.readFileSync(path.join(ROOT, 'js/market_actions.js'), 'utf8');
  const ui = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');

  assert.match(professions, /熟路/);
  assert.match(professions, /赶集/);
  assert.match(professions, /5%/);
  assert.match(marketActions, /marketTrip/);
  assert.match(ui, /路费 5%/);
  assert.match(ui, /professionAbilityReadyDay/);
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
