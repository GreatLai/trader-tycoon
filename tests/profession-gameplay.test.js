const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { ROOT, createGame } = require('./helpers/load-game');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('the playable roster contains all five professions', () => {
  const { api } = createGame();

  assert.deepEqual(Object.keys(api.PROFESSIONS), ['useless', 'toothMerchant', 'travelingMerchant', 'speculator', 'saltIronMonopoly']);
  assert.equal(api.PROFESSIONS.useless.activeAbility, null);
  assert.equal(api.PROFESSIONS.toothMerchant.activeAbility.id, 'raisePrice');
  assert.equal(api.PROFESSIONS.travelingMerchant.activeAbility.id, 'marketTrip');
  assert.equal(api.PROFESSIONS.speculator.activeAbility.id, 'stokeMarket');
  assert.equal(api.PROFESSIONS.saltIronMonopoly.activeAbility.id, 'windVane');
  assert.match(api.PROFESSIONS.toothMerchant.passive, /110%/);
});

test('salt iron monopoly exposes four licensed goods and wider ordinary price rules', () => {
  const { api } = createGame();
  const rules = api.getEffectiveRules({ id: 'saltIronMonopoly', activeUsedDay: null, data: {} });

  assert.deepEqual(plain(rules.trade.allowedGoodIds), ['salt', 'steel', 'machine-tool', 'lunar-soil']);
  for (const id of rules.trade.allowedGoodIds) {
    assert.deepEqual(plain(rules.price.byGood[id]), { deviationScale: 3 });
  }
});

test('salt iron monopoly triples the original ordinary price deviation from anchor', () => {
  function refreshFactor(professionId) {
    const { api } = createGame();
    const state = api.reset();
    const salt = api.GOODS.find(good => good.id === 'salt');
    state.profession = api.newProfessionState(professionId);
    state.prices.salt = salt.base;
    state.prevPrices.salt = salt.base;
    state.factors.salt = 1;
    api.setRandom(() => 0.60);
    api.updateGoodPrice(salt);
    return state.factors.salt;
  }

  const ordinaryFactor = refreshFactor('useless');
  const monopolyFactor = refreshFactor('saltIronMonopoly');

  assert.equal(Math.abs(Math.log(monopolyFactor) - Math.log(ordinaryFactor) * 3) < 1e-10, true);
});

test('salt iron monopoly keeps the original recovery trajectory amplified', () => {
  function refreshFactor(professionId, factor) {
    const { api } = createGame();
    const state = api.reset();
    const salt = api.GOODS.find(good => good.id === 'salt');
    state.profession = api.newProfessionState(professionId);
    state.prices.salt = salt.base * factor;
    state.prevPrices.salt = salt.base * factor;
    state.factors.salt = factor;
    api.setRandom(() => 0.60);
    api.updateGoodPrice(salt);
    return state.factors.salt;
  }

  for (const underlyingFactor of [0.50, 1.60]) {
    const ordinaryFactor = refreshFactor('useless', underlyingFactor);
    const monopolyFactor = refreshFactor('saltIronMonopoly', underlyingFactor ** 3);
    assert.equal(Math.abs(Math.log(monopolyFactor) - Math.log(ordinaryFactor) * 3) < 1e-10, true);
  }
});

test('salt iron monopoly triples sudden event impact after selecting the directional baseline', () => {
  const baselineGame = createGame();
  const baselineState = baselineGame.api.reset();
  const baselineSalt = baselineGame.api.GOODS.find(good => good.id === 'salt');
  baselineState.profession = baselineGame.api.newProfessionState('saltIronMonopoly');
  baselineState.prices.salt = baselineSalt.base;
  baselineState.prevPrices.salt = baselineSalt.base;
  baselineState.factors.salt = 1;
  baselineGame.api.setRandom(() => 0.5);
  baselineGame.api.updateGoodPrice(baselineSalt);

  const { api } = createGame();
  const state = api.reset();
  const salt = api.GOODS.find(good => good.id === 'salt');
  state.profession = api.newProfessionState('saltIronMonopoly');
  state.prices.salt = salt.base;
  state.prevPrices.salt = salt.base;
  state.factors.salt = 1;
  api.setRandom(() => 0.5);

  api.updateGoodPrice(salt, { goodId: 'salt', impactMult: 2, type: 'good' });

  assert.equal(Math.abs(state.factors.salt - Math.max(1, baselineState.factors.salt) * (2 ** 3)) < 1e-10, true);
});

test('salt iron monopoly consecutive falling news cannot rise after amplification', () => {
  const { api } = createGame();
  const state = api.reset();
  const salt = api.GOODS.find(good => good.id === 'salt');
  state.profession = api.newProfessionState('saltIronMonopoly');
  state.prices.salt = salt.base * 0.125;
  state.factors.salt = 0.125;

  api.updateGoodPrice(salt, { goodId: 'salt', impactMult: 0.70, type: 'bad' });

  assert.equal(Math.abs(state.factors.salt - 0.125 * (0.70 ** 3)) < 1e-10, true);
});

test('salt iron monopoly triples ecology target deviation from anchor', () => {
  const { api } = createGame();
  const state = api.reset();
  const salt = api.GOODS.find(good => good.id === 'salt');
  state.profession = api.newProfessionState('saltIronMonopoly');
  state.day = 2;
  state.eco = { treeId: 'civilSupplyControl', startDay: 1, A: 0, B: null, C: null, byCard: false };
  state.prices.salt = salt.base;
  state.factors.salt = 1;
  const target = Math.pow(
    api.ECO_EVENTS.civilSupplyControl.A[0].mults.salt,
    api.BALANCE_CONFIG.ECO_EVENT_SCALE
  );

  api.updateGoodPrice(salt);

  assert.equal(Math.abs(Math.log(state.factors.salt) - Math.log(target) * 0.6 * 3) < 1e-10, true);
});

test('salt iron monopoly cannot buy or sell goods outside its license', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('saltIronMonopoly');
  state.availableGoods = ['salt', 'wheat'];
  state.prices.salt = 6;
  state.prices.wheat = 5;

  const cashBefore = state.cash;
  assert.equal(api.buy('wheat', 1), undefined);
  assert.equal(state.cash, cashBefore);
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 100), 0);
  assert.equal(api.buy('salt', 1).goodId, 'salt');

  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  assert.equal(api.sell('wheat', 10), undefined);
  assert.equal(state.inventory.wheat, 10);
});

test('salt iron monopoly does not bypass the ultra goods wealth lock', () => {
  const { api } = createGame({ random: () => 0.999999 });
  const state = api.reset();
  state.profession = api.newProfessionState('saltIronMonopoly');
  state.peakNetWorth = api.CONFIG.START_CASH;

  const market = api.pickGoods(api.GOODS.length);

  assert.equal(market.includes('lunar-soil'), false);
});

test('wind vane summons an eligible existing ecology event and has a seven-day cooldown', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('saltIronMonopoly');
  state.day = 10;
  api.setRandom(() => 0);

  const result = api.useProfessionAbility(null);

  assert.equal(result.ok, true);
  assert.equal(result.treeId, 'civilSupplyControl');
  assert.equal(state.eco.treeId, result.treeId);
  assert.equal(state.eco.startDay, 10);
  assert.equal(state.eco.byProfession, true);
  assert.equal(state.eventNoticeQueue.length, 1);
  assert.equal(state.availableGoods.length, api.CONFIG.MARKET_SIZE);

  api.advanceBaselineDay(2026090302);
  assert.equal(state.availableGoods.length, api.CONFIG.ECO_MARKET_SIZE);
  assert.equal(Number.isInteger(state.eco.A), true);

  state.eco = null;
  state.day = 16;
  assert.deepEqual(plain(api.useProfessionAbility(null)), { ok: false, reason: 'cooldown', readyDay: 17 });
  state.day = 17;
  assert.equal(api.useProfessionAbility(null).ok, true);
});

test('wind vane cannot replace an active ecology event or select locked ecology trees', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('saltIronMonopoly');
  state.day = 10;
  state.eco = { treeId: 'globalDrought', startDay: 9, A: null, B: null, C: null, byCard: false };

  assert.deepEqual(plain(api.useProfessionAbility(null)), { ok: false, reason: 'active-ecology' });
  assert.equal(state.profession.activeUsedDay, null);

  state.eco = null;
  assert.equal(api.eligibleProfessionEcoEvents().includes('lunarResourceDevelopment'), false);
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
  const oldPrice = state.prices.wheat;
  const rolls = [0.5, 0];
  api.setRandom(() => rolls.shift() ?? 0);

  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), ['wheat']);
  const first = api.useProfessionAbility('wheat');
  const second = api.useProfessionAbility('wheat');

  assert.equal(first.ok, true);
  assert.equal(state.prices.wheat > oldPrice, true);
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

test('tooth merchant raise price never lowers an already elevated market price', () => {
  const { api } = createGame();
  const state = api.reset();
  const wheat = api.GOODS.find(good => good.id === 'wheat');
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = wheat.base * 10;
  state.prices.wheat = +(wheat.base * 1.30).toFixed(2);
  state.factors.wheat = 1.30;
  const rolls = [0.5, 0];
  api.setRandom(() => rolls.shift() ?? 0);

  const result = api.useProfessionAbility('wheat');

  assert.equal(result.ok, true);
  assert.equal(state.prices.wheat > +(wheat.base * 1.30).toFixed(2), true);
});

test('tooth merchant cannot target goods already at the ability ceiling', () => {
  const { api } = createGame();
  const state = api.reset();
  const wheat = api.GOODS.find(good => good.id === 'wheat');
  state.profession = api.newProfessionState('toothMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = wheat.base * 10;
  state.prices.wheat = +(wheat.base * 1.45).toFixed(2);
  state.factors.wheat = 1.45;

  assert.deepEqual(plain(api.eligibleProfessionAbilityTargets()), []);
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

  assert.equal(Math.abs(Math.log(specUp.impactMult) - Math.log(baseUp.impactMult) * 1.2) < 0.003, true);
  assert.equal(Math.abs(Math.log(specDown.impactMult) - Math.log(baseDown.impactMult) * 1.2) < 0.003, true);
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

test('speculator positive follow-up must rise from the previous event price', () => {
  const { api } = createGame();
  const state = api.reset();
  const wheat = api.GOODS.find(good => good.id === 'wheat');
  state.profession = api.newProfessionState('speculator');
  state.day = 13;
  state.prices.wheat = +(wheat.base * 3.5).toFixed(2);
  state.factors.wheat = 3.5;
  state.profession.data.pendingFollowUp = { goodId: 'wheat', originalPositive: true, dueDay: 13 };
  const rolls = [0, 0.5, 0.5, 0.5];
  api.setRandom(() => rolls.shift() ?? 0.5);

  const event = api.resolveProfessionScheduledEvents();
  api.updateGoodPrice(wheat, event);

  assert.equal(event.type, 'good');
  assert.equal(state.prices.wheat > wheat.base * 3.5, true);
});

test('speculator negative follow-up must fall from the previous event price', () => {
  const { api } = createGame();
  const state = api.reset();
  const wheat = api.GOODS.find(good => good.id === 'wheat');
  state.profession = api.newProfessionState('speculator');
  state.day = 13;
  state.prices.wheat = +(wheat.base * 0.25).toFixed(2);
  state.factors.wheat = 0.25;
  state.profession.data.pendingFollowUp = { goodId: 'wheat', originalPositive: false, dueDay: 13 };
  const rolls = [0, 0.5, 0.5, 0.5];
  api.setRandom(() => rolls.shift() ?? 0.5);

  const event = api.resolveProfessionScheduledEvents();
  api.updateGoodPrice(wheat, event);

  assert.equal(event.type, 'bad');
  assert.equal(state.prices.wheat < wheat.base * 0.25, true);
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
  assert.equal(event.impactMult < 1, true);
  assert.equal(event.impactMult >= 0.02, true);
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

test('speculator UI publishes the exact follow-up odds', () => {
  const professions = fs.readFileSync(path.join(ROOT, 'js/professions.js'), 'utf8');
  const ui = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');

  assert.match(professions, /追风/);
  assert.match(professions, /风声放大/);
  assert.match(professions, /煽风点火/);
  assert.match(professions, /70%/);
  assert.match(professions, /30%/);
  assert.match(ui, /professionAbilityReadyDay/);
});

test('traveling merchant is available by default', () => {
  const { api } = createGame();
  assert.deepEqual(plain(api.loadProfile().unlockedProfessionIds), ['useless', 'toothMerchant', 'travelingMerchant', 'speculator', 'saltIronMonopoly']);
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

test('market refresh does not reapply an event that already changed the current day price', () => {
  const baselineGame = createGame();
  const baselineState = baselineGame.api.reset();
  const wheat = baselineGame.api.GOODS.find(good => good.id === 'wheat');
  baselineState.prices.wheat = wheat.base * 0.5;
  baselineState.prevPrices.wheat = wheat.base;
  baselineState.factors.wheat = 0.5;
  baselineGame.api.setRandom(() => 0.5);
  baselineGame.api.refreshMarketGood('wheat', { eventChance: 0, skipEcology: true });
  const expectedPrice = baselineState.prices.wheat;

  const eventGame = createGame();
  const eventState = eventGame.api.reset();
  eventState.prices.wheat = wheat.base * 0.5;
  eventState.prevPrices.wheat = wheat.base;
  eventState.factors.wheat = 0.5;
  eventState.events = [{ goodId: 'wheat', impactMult: 0.5, type: 'bad', source: 'natural' }];
  eventGame.api.setRandom(() => 0.5);
  eventGame.api.refreshMarketGood('wheat', { eventChance: 0, skipEcology: true });

  assert.equal(eventState.prices.wheat, expectedPrice);
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

test('market trip falling news always reprices below the pre-trip purchase price', () => {
  const { api } = createGame();
  const state = api.reset();
  const wheat = api.GOODS.find(good => good.id === 'wheat');
  state.profession = api.newProfessionState('travelingMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = wheat.base * 0.25 * 10;
  state.lastSeenPrice.wheat = wheat.base * 0.25;
  state.prices.wheat = wheat.base * 0.25;
  state.factors.wheat = 0.25;
  const priceBefore = state.prices.wheat;
  const rolls = [0.10, 0.50, 0.99, 0.50, 0.50];
  api.setRandom(() => rolls.shift() ?? 0.50);

  const result = api.useProfessionAbility('wheat');

  assert.equal(result.event.type, 'bad');
  assert.equal(state.prices.wheat < priceBefore, true);
});

test('market trip rising news always reprices above the pre-trip price', () => {
  const { api } = createGame();
  const state = api.reset();
  const wheat = api.GOODS.find(good => good.id === 'wheat');
  state.profession = api.newProfessionState('travelingMerchant');
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 10;
  state.costBasis.wheat = wheat.base * 3 * 10;
  state.lastSeenPrice.wheat = wheat.base * 3;
  state.prices.wheat = wheat.base * 3;
  state.factors.wheat = 3;
  const priceBefore = state.prices.wheat;
  const rolls = [0.10, 0.50, 0.01, 0.50, 0.50];
  api.setRandom(() => rolls.shift() ?? 0.50);

  const result = api.useProfessionAbility('wheat');

  assert.equal(result.event.type, 'good');
  assert.equal(state.prices.wheat > priceBefore, true);
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

  assert.equal(state.inventory.wheat, 91);
  assert.equal(state.cash, 1);
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

test('profession selection stays concise while the in-run panel exposes detailed rules', () => {
  const main = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8');
  const professions = fs.readFileSync(path.join(ROOT, 'js/professions.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(main, /profession-choice-tagline/);
  assert.match(main, /profession-choice-tags/);
  assert.match(main, /profession-choice-active/);
  assert.doesNotMatch(main, /profession\.passive/);
  assert.match(html, /<strong>本事<\/strong>/);
  assert.match(html, /<strong>手段<\/strong>/);
  assert.match(html, /<strong>代价<\/strong>/);
  assert.match(professions, /失败当天及随后两天禁止出售/);
  assert.match(professions, /未卖出不收费/);
  assert.match(professions, /真正的赌注在下一阵风/);
  assert.match(html, /id="professionOverlay"[\s\S]*?max-height:calc\(100vh - 32px\);overflow:auto/);
});

test('common listing UI is separate from profession abilities and keeps its copy concise', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const main = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8');
  const ui = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');

  assert.match(html, /id="commonListingBtn"/);
  assert.match(html, /id="commonListingOverlay"/);
  assert.match(html, /另开货路/);
  assert.match(html, /行情吉凶不由你定/);
  assert.match(main, /data-common-listing-target/);
  assert.match(ui, /通商令 \$\{commonListingRemaining\} \/ \$\{COMMON_ACTIONS\.listing\.maxUses\}/);
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

test('profession presentation uses three-character role names and distinctive selection copy', () => {
  const { api } = createGame();
  assert.deepEqual(Object.values(api.PROFESSIONS).map(profession => profession.name), [
    '生意人', '牙行商', '行脚商', '投机客', '盐铁商'
  ]);
  for (const profession of Object.values(api.PROFESSIONS)) {
    assert.equal(profession.name.length, 3);
    assert.equal(profession.tagline.length, 4);
    assert.equal(profession.selectionTags.length, 3);
    assert.equal(typeof profession.selectionQuote, 'string');
    assert.equal(typeof profession.inRun.judgment, 'string');
    assert.equal(typeof profession.inRun.passive, 'string');
    assert.equal(typeof profession.inRun.active, 'string');
    assert.equal(typeof profession.inRun.drawback, 'string');
  }
});

test('every profession receives three independent common listing uses', () => {
  for (const professionId of ['useless', 'toothMerchant', 'travelingMerchant', 'speculator', 'saltIronMonopoly']) {
    const { api } = createGame();
    const state = api.reset();
    state.profession = api.newProfessionState(professionId);
    assert.deepEqual(plain(state.commonActions), { listingUses: 0 });
    assert.equal(api.commonListingUsesRemaining(), 3);
  }
});

test('common listing reprices owned unlisted goods and allows normal trading', () => {
  const { api } = createGame();
  const state = api.reset();
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.availableGoods = state.availableGoods.filter(id => id !== 'wheat');
  state.lastSeenPrice.wheat = 5;
  const oldPrice = state.prices.wheat;
  api.setRandom(() => 0.5);

  const result = api.useCommonListing('wheat');

  assert.equal(result.ok, true);
  assert.equal(state.availableGoods.includes('wheat'), true);
  assert.equal(state.prices.wheat !== oldPrice, true);
  assert.equal(api.commonListingUsesRemaining(), 2);
  assert.equal(api.sell('wheat', 1).quantity, 1);
  assert.equal(api.buy('wheat', 1).quantity, 1);
});

test('common listing rejects invalid targets without consuming a use', () => {
  const { api } = createGame();
  const state = api.reset();
  const listedId = state.availableGoods[0];
  state.inventory[listedId] = 1;

  assert.deepEqual(plain(api.useCommonListing(listedId)), { ok: false, reason: 'invalid-target' });
  assert.deepEqual(plain(api.useCommonListing('wheat')), { ok: false, reason: 'invalid-target' });
  assert.equal(api.commonListingUsesRemaining(), 3);
});

test('common listing can spend all three uses in one day but no more', () => {
  const { api } = createGame();
  const state = api.reset();
  const targets = api.GOODS.map(good => good.id).filter(id => !state.availableGoods.includes(id)).slice(0, 4);
  targets.forEach(id => {
    state.inventory[id] = 1;
    state.costBasis[id] = api.GOODS.find(good => good.id === id).base;
    state.lastSeenPrice[id] = state.prices[id];
  });
  api.setRandom(() => 0.5);

  assert.equal(api.useCommonListing(targets[0]).ok, true);
  assert.equal(api.useCommonListing(targets[1]).ok, true);
  assert.equal(api.useCommonListing(targets[2]).ok, true);
  assert.equal(api.useCommonListing(targets[3]).reason, 'no-uses');
  assert.equal(api.commonListingUsesRemaining(), 0);
});

test('common listing can trigger a normal sudden event without choosing its direction', () => {
  const { api } = createGame();
  const state = api.reset();
  state.inventory.wheat = 1;
  state.costBasis.wheat = 5;
  state.availableGoods = state.availableGoods.filter(id => id !== 'wheat');
  state.lastSeenPrice.wheat = 5;
  api.setRandom(() => 0.01);

  const result = api.useCommonListing('wheat');

  assert.equal(result.ok, true);
  assert.equal(result.event.goodId, 'wheat');
  assert.equal(result.event.source, 'common-listing');
  assert.equal(state.events.includes(result.event), true);
});

test('common listing does not consume or reset profession ability cooldown', () => {
  const { api } = createGame();
  const state = api.reset();
  state.profession = api.newProfessionState('toothMerchant');
  state.profession.activeUsedDay = 4;
  state.day = 5;
  state.inventory.wheat = 1;
  state.costBasis.wheat = 5;
  state.availableGoods = state.availableGoods.filter(id => id !== 'wheat');
  state.lastSeenPrice.wheat = 5;
  api.setRandom(() => 0.5);

  api.useCommonListing('wheat');

  assert.equal(state.profession.activeUsedDay, 4);
  assert.equal(api.professionAbilityReadyDay(api.PROFESSIONS.toothMerchant), 7);
});
