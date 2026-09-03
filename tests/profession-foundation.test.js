const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { createGame } = require('./helpers/load-game');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('useless profession remains the neutral default', () => {
  const { api } = createGame();

  assert.equal(api.DEFAULT_PROFESSION_ID, 'useless');
  assert.deepEqual(Object.keys(api.PROFESSIONS), ['useless', 'toothMerchant', 'travelingMerchant', 'speculator', 'saltIronMonopoly']);
  assert.equal(api.normalizeProfessionId('useless'), 'useless');
  assert.equal(api.normalizeProfessionId('unknown'), 'useless');
  assert.deepEqual(plain(api.newProfessionState()), {
    id: 'useless',
    activeUsedDay: null,
    data: {}
  });
});

test('base effective rules reproduce the current game constants', () => {
  const { api } = createGame();
  const rules = api.getEffectiveRules({ id: 'useless', activeUsedDay: null, data: {} });

  assert.equal(rules.marketSize, api.CONFIG.MARKET_SIZE);
  assert.equal(rules.ecoMarketSize, api.CONFIG.ECO_MARKET_SIZE);
  assert.equal(rules.dailyFeeMultiplier, 1);
  assert.equal(rules.warehouseCapacityMultiplier, 1);
  assert.deepEqual(plain(rules.listingWeights), {});
  assert.deepEqual(plain(rules.trade), { allowedGoodIds: null });
  assert.deepEqual(plain(rules.price), { byGood: {} });
  assert.deepEqual(plain(rules.events), {});
});

test('profession rule modifiers receive an isolated base-rule copy', () => {
  const { api } = createGame();
  const base = api.createBaseRules();
  const modified = api.applyProfessionRules(base, {
    modifyRules(rules) {
      rules.marketSize += 1;
      rules.dailyFeeMultiplier = 1.5;
    }
  }, {});

  assert.equal(base.marketSize, api.CONFIG.MARKET_SIZE);
  assert.equal(base.dailyFeeMultiplier, 1);
  assert.equal(modified.marketSize, api.CONFIG.MARKET_SIZE + 1);
  assert.equal(modified.dailyFeeMultiplier, 1.5);
});

test('new runs contain neutral profession state and measurable run statistics', () => {
  const { api } = createGame();
  const state = api.newState();

  assert.equal(state.profession.id, 'useless');
  assert.deepEqual(plain(state.runStats), {
    maxDayReached: 1,
    peakNetWorth: api.CONFIG.START_CASH,
    forcedLiquidations: 0,
    totalFeesPaid: 0
  });
});

test('legacy saves normalize profession and run statistics', () => {
  const baseline = createGame().api.newState();
  delete baseline.profession;
  delete baseline.runStats;

  const { api } = createGame({ savedState: baseline });
  const loaded = api.loadSave();

  assert.equal(loaded.profession.id, 'useless');
  assert.equal(loaded.runStats.maxDayReached, loaded.day);
  assert.equal(loaded.runStats.peakNetWorth, loaded.peakNetWorth);
});

test('daily advancement records day, peak wealth, fees, and forced liquidation', () => {
  const { api } = createGame();
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.prices.wheat = 5;
  state.lastSeenPrice.wheat = 5;
  state.inventory.wheat = 1000;
  state.costBasis.wheat = 5000;
  state.cash = 0;

  const fee = api.calcDailyFee();
  api.nextDay();

  assert.equal(state.runStats.maxDayReached, 2);
  assert.equal(state.runStats.totalFeesPaid, fee);
  assert.equal(state.runStats.forcedLiquidations, 1);
  assert.equal(state.runStats.peakNetWorth >= api.CONFIG.START_CASH, true);
});

test('career profile starts with every current profession unlocked', () => {
  const { api } = createGame();
  const profile = api.newProfile();

  assert.equal(profile.version, 1);
  assert.deepEqual(plain(profile.unlockedProfessionIds), ['useless', 'toothMerchant', 'travelingMerchant', 'speculator', 'saltIronMonopoly']);
  assert.deepEqual(plain(profile.records), {});
});

test('career profile persists separately from the current run', () => {
  const { api, storage } = createGame();
  const profile = api.newProfile();
  profile.records.useless = { runs: 1, wins: 1, bestNetWorth: 125000 };
  api.saveProfile(profile);
  api.reset();
  api.clearSave();

  assert.equal(storage.has(api.CONFIG.SAVE_KEY), false);
  assert.equal(storage.has(api.CONFIG.PROFILE_SAVE_KEY), true);
  assert.equal(api.loadProfile().records.useless.bestNetWorth, 125000);
});

test('recording run results updates profession-specific records', () => {
  const { api } = createGame();

  api.recordRunResult({ professionId: 'useless', survived: false, finalNetWorth: 9000 });
  api.recordRunResult({ professionId: 'useless', survived: true, finalNetWorth: 120000 });
  const record = api.loadProfile().records.useless;

  assert.equal(record.runs, 2);
  assert.equal(record.wins, 1);
  assert.equal(record.bestNetWorth, 120000);
});

test('finishing a run records its profession result exactly once', () => {
  const { api } = createGame();
  const state = api.reset();
  state.day = api.CONFIG.DAYS_LIMIT;
  state.cash = 100000;
  const expectedFinalWorth = +(state.cash - api.calcOperatingCost(api.CONFIG.DAYS_LIMIT)).toFixed(2);

  api.nextDay();
  api.nextDay();
  const record = api.loadProfile().records.useless;

  assert.equal(state.resultRecorded, true);
  assert.equal(record.runs, 1);
  assert.equal(record.wins, 1);
  assert.equal(record.bestNetWorth, expectedFinalWorth);
});

test('shared market refresh validates targets and updates a good through the normal price engine', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  const listedId = state.availableGoods[0];
  const unavailableId = api.GOODS.find(good => !state.availableGoods.includes(good.id)).id;
  const oldPrice = state.prices[listedId];

  assert.deepEqual(plain(api.refreshMarketGood('missing-good')), { ok: false, reason: 'unknown-good' });
  assert.deepEqual(plain(api.refreshMarketGood(unavailableId, { requireListed: true })), { ok: false, reason: 'not-listed' });

  const result = api.refreshMarketGood(listedId, { eventChance: 0, source: 'test' });
  assert.equal(result.ok, true);
  assert.equal(state.prevPrices[listedId], oldPrice);
  assert.equal(state.lastSeenPrice[listedId], state.prices[listedId]);
});

test('useless profession has a stable deterministic market sequence after shop removal', () => {
  let seed = 246813579;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const { api } = createGame({ random });
  const state = api.reset();
  const days = [];

  while (!state.gameOver) {
    days.push({
      day: state.day,
      cash: state.cash,
      goods: state.availableGoods,
      prices: state.prices,
      events: state.events.map(event => [event.goodId, event.targetMult, event.type, event.isRare]),
      eco: state.eco && [state.eco.treeId, state.eco.startDay, state.eco.A, state.eco.B, state.eco.C, state.eco.byCard]
    });
    api.nextDay();
  }

  const digest = crypto.createHash('sha256').update(JSON.stringify(days)).digest('hex');
  assert.equal(digest, 'f7114d3027427cd2a284c3878b125fa0554ee0b8f516217bf21d7c7229c3bb35');
});
