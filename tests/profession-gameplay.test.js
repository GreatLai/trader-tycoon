const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { ROOT, createGame } = require('./helpers/load-game');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('the playable roster contains all four professions', () => {
  const { api } = createGame();

  assert.deepEqual(Object.keys(api.PROFESSIONS), ['useless', 'toothMerchant', 'travelingMerchant', 'speculator']);
  assert.equal(api.PROFESSIONS.useless.activeAbility, null);
  assert.equal(api.PROFESSIONS.toothMerchant.activeAbility.id, 'raisePrice');
  assert.equal(api.PROFESSIONS.travelingMerchant.activeAbility.id, 'marketTrip');
  assert.equal(api.PROFESSIONS.speculator.activeAbility.id, 'stokeMarket');
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

test('speculator is available by default', () => {
  const { api } = createGame();
  assert.equal(api.loadProfile().unlockedProfessionIds.includes('speculator'), true);
});

test('chasing momentum keeps prior natural-event goods on the next normal-sized shelf', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('speculator');
  state.availableGoods = ['wood', 'coal', 'tea', 'coffee', 'copper', 'oil'];
  state.factors.wood = 1.5;
  state.factors.coal = 1.4;

  const result = api.applyProfessionNextDayMarket([
    { goodId: 'wheat', source: 'natural', type: 'good' },
    { goodId: 'phone', source: 'profession', type: 'good' }
  ]);

  assert.equal(result.applied, true);
  assert.equal(state.availableGoods.length, api.CONFIG.MARKET_SIZE);
  assert.equal(state.availableGoods.includes('wheat'), true);
  assert.equal(state.availableGoods.includes('phone'), false);
});

test('chasing momentum ignores ecology and other non-natural event sources', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('speculator');
  const before = state.availableGoods.slice();

  const result = api.applyProfessionNextDayMarket([
    { goodId: 'wheat', source: 'ecology', type: 'good' },
    { goodId: 'wood', source: 'profession-follow-up', type: 'bad' }
  ]);

  assert.equal(result.applied, false);
  assert.deepEqual(plain(state.availableGoods), plain(before));
});

test('speculator natural sudden events amplify log magnitude by twenty percent in both directions', () => {
  const baseGame = createGame();
  const baseState = baseGame.api.reset();
  baseState.profession = baseGame.api.newProfessionState('useless');
  baseGame.api.setRandom(() => 0.5);
  const baseUp = baseGame.api.makeEvent('wheat', true, { forcedByCard: false, allowRare: false });
  baseGame.api.setRandom(() => 0.5);
  const baseDown = baseGame.api.makeEvent('wheat', false, { forcedByCard: false, allowRare: false });

  const specGame = createGame();
  const specState = specGame.api.reset();
  specState.profession = specGame.api.newProfessionState('speculator');
  specGame.api.setRandom(() => 0.5);
  const specUp = specGame.api.makeEvent('wheat', true, { forcedByCard: false, allowRare: false });
  specGame.api.setRandom(() => 0.5);
  const specDown = specGame.api.makeEvent('wheat', false, { forcedByCard: false, allowRare: false });

  assert.equal(Math.abs(Math.log(specUp.targetMult) - Math.log(baseUp.targetMult) * 1.2) < 0.001, true);
  assert.equal(Math.abs(Math.log(specDown.targetMult) - Math.log(baseDown.targetMult) * 1.2) < 0.001, true);
});

test('stoke market only targets today natural-event goods and does not add an event immediately', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('speculator');
  state.day = 12;
  state.events = [
    { goodId: 'wheat', source: 'natural', type: 'good' },
    { goodId: 'wood', source: 'profession', type: 'bad' }
  ];

  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), ['wheat']);
  const result = api.useProfessionAbility('wheat');

  assert.equal(result.ok, true);
  assert.equal(state.events.length, 2);
  assert.deepEqual(plain(state.profession.data.pendingFollowUp), { goodId: 'wheat', originalPositive: true, dueDay: 13 });
  state.day = 13;
  assert.deepEqual(plain(api.useProfessionAbility('wheat')), { ok: false, reason: 'cooldown', readyDay: 15 });
});

test('stoke market follow-up continues below the seventy-percent boundary', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('speculator');
  state.day = 13;
  state.profession.data.pendingFollowUp = { goodId: 'wheat', originalPositive: true, dueDay: 13 };
  api.setRandom(() => 0.6999);

  const event = api.resolveProfessionScheduledEvents();

  assert.equal(event.type, 'good');
  assert.equal(event.source, 'profession-follow-up');
  assert.equal(event.isRare, false);
});

test('stoke market follow-up reverses at the seventy-percent boundary', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('speculator');
  state.day = 13;
  state.profession.data.pendingFollowUp = { goodId: 'wheat', originalPositive: true, dueDay: 13 };
  api.setRandom(() => 0.70);

  const event = api.resolveProfessionScheduledEvents();

  assert.equal(event.type, 'bad');
  assert.equal(event.targetMult < 1, true);
  assert.equal(event.targetMult < 0.2, false);
});

test('speculator follow-up target occupies a normal shelf position and pending state migrates safely', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('speculator');
  state.day = 13;
  state.availableGoods = ['wood', 'coal', 'tea', 'coffee', 'copper', 'oil'];
  state.profession.data.pendingFollowUp = { goodId: 'wheat', originalPositive: false, dueDay: 13 };

  const result = api.applyProfessionNextDayMarket([]);

  assert.equal(result.applied, true);
  assert.equal(state.availableGoods.length, api.CONFIG.MARKET_SIZE);
  assert.equal(state.availableGoods.includes('wheat'), true);

  state.profession.data.pendingFollowUp = { goodId: 'missing', originalPositive: 'yes', dueDay: 'tomorrow' };
  const { api: loadedApi } = createGame({ savedState: state });
  const loaded = loadedApi.loadSave();
  assert.equal(loaded.profession.id, 'speculator');
  assert.equal(loaded.profession.data.pendingFollowUp, undefined);
});

test('speculator UI describes uncertainty without publishing exact follow-up odds', () => {
  const professions = fs.readFileSync(path.join(ROOT, 'js/professions.js'), 'utf8');
  const ui = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');

  assert.match(professions, /追风/);
  assert.match(professions, /风声放大/);
  assert.match(professions, /煽风点火/);
  assert.match(professions, /更可能延续，也可能反转/);
  assert.doesNotMatch(professions, /70%|30%/);
  assert.match(ui, /professionAbilityReadyDay/);
});

test('traveling merchant is available by default', () => {
  const { api } = createGame();
  assert.deepEqual(plain(api.loadProfile().unlockedProfessionIds), ['useless', 'toothMerchant', 'travelingMerchant', 'speculator']);
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

test('market trip can reprice an already listed holding instead of having no target after familiar route', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('travelingMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.lastSeenPrice.wheat = 5;
  state.prices.wheat = 5;
  state.factors.wheat = 1;
  api.setRandom(() => 0.5);

  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), ['wheat']);
  const result = api.useProfessionAbility('wheat');

  assert.equal(result.ok, true);
  assert.deepEqual(plain(state.availableGoods), ['wheat']);
  assert.notEqual(state.prices.wheat, 5);
  assert.equal(state.profession.data.marketTripGoodId, 'wheat');
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
