const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { ROOT, createGame } = require('./helpers/load-game');

test('shop stock can be purchased and the card enters inventory', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  const entry = state.shopStock[0];
  state.cash = entry.price;

  assert.equal(api.buyCard(entry.id), true);
  assert.equal(entry.purchased, true);
  assert.equal(state.cardInventory[entry.cardId], 1);
  assert.equal(state.cash, 0);
});

test('add-good card expands the live market and consumes one card', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  const target = api.GOODS.find(g => !state.availableGoods.includes(g.id) && g.tier !== 'ultra').id;
  state.cardInventory.addGood = 1;

  const result = api.useCard('addGood', target);

  assert.equal(result.ok, true);
  assert.equal(state.availableGoods.includes(target), true);
  assert.equal(state.availableGoods.length, api.CONFIG.MARKET_SIZE + 1);
  assert.equal(state.cardInventory.addGood, 0);
});

test('sudden-rise card applies to the selected listed good', () => {
  const { api } = createGame({ random: () => 0 });
  const state = api.reset();
  state.availableGoods = ['wheat', 'wood'];
  state.prices.wheat = 5;
  state.factors.wheat = 1;
  state.prices.wood = 8;
  state.factors.wood = 1;
  state.cardInventory.suddenRise = 1;

  const result = api.useCard('suddenRise', 'wood');

  assert.equal(result.ok, true);
  assert.equal(result.goodId, 'wood');
  assert.equal(state.prices.wheat, 5);
  assert.equal(state.prices.wood > 8, true);
});

test('sudden-rise card rejects an unavailable target without consuming the card', () => {
  const { api } = createGame({ random: () => 0 });
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.cardInventory.suddenRise = 1;

  const result = api.useCard('suddenRise', 'wood');

  assert.equal(result.ok, false);
  assert.equal(state.cardInventory.suddenRise, 1);
});

test('future-market forecast matches the actual next-day category', () => {
  const { api } = createGame({ random: () => 0.42 });
  const state = api.reset();
  const target = state.availableGoods[0];
  state.cardInventory.futureMarket = 1;
  const before = state.prices[target];

  const result = api.useCard('futureMarket', target);
  assert.equal(result.ok, true);

  api.nextDay();
  const after = state.prices[target];
  const diff = (after - before) / before * 100;
  const actual = diff <= -15 ? '大跌' : diff <= -5 ? '小跌' : diff <= 5 ? '平稳' : diff <= 15 ? '小涨' : '大涨';
  assert.equal(result.category, actual);
});

test('trend card is not consumed when an ecological event cannot complete', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  state.day = 83;
  state.cardInventory.iAmTheTrend = 1;

  const result = api.useCard('iAmTheTrend');

  assert.equal(result.ok, false);
  assert.equal(state.cardInventory.iAmTheTrend, 1);
  assert.equal(state.scheduledEco, null);
});

test('bank implementation and old save key are removed', () => {
  const files = ['js/config.js', 'js/state.js', 'js/trading.js', 'js/events.js', 'js/ui.js', 'js/main.js', 'js/save.js'];
  const source = files.map(file => fs.readFileSync(path.join(ROOT, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /\bfunction\s+(borrow|repay|creditLimit)\b/);
  assert.doesNotMatch(source, /state\.loan|LOAN_INTEREST_RATE|save-v11/);
});

test('sudden cards anchor their multiplier to the current price during ecology', () => {
  const { api } = createGame({ random: () => 0 });
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.prices.wheat = 100;
  state.factors.wheat = 20;
  state.eco = { treeId: 'globalDrought', startDay: state.day - 1, A: 0, B: null, C: null };
  state.cardInventory.suddenRise = 1;

  const result = api.useCard('suddenRise', 'wheat');

  assert.equal(result.ok, true);
  assert.equal(state.prices.wheat, 25000);
});

test('cards can be used repeatedly on the same day without a daily limit', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  const target = state.availableGoods[0];
  state.cardInventory.refreshPrice = 2;

  assert.equal(api.useCard('refreshPrice', target).ok, true);
  assert.equal(api.useCard('refreshPrice', target).ok, true);
  assert.equal(state.cardInventory.refreshPrice, 0);
});

test('shop refreshes every seven days and prices from historical peak wealth', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  const firstStock = state.shopStock;
  state.peakNetWorth = 1000000;
  state.day = 8;
  api.refreshShopIfNeeded();

  assert.notEqual(state.shopStock, firstStock);
  assert.equal(state.shopRefreshDay, 8);
  assert.equal(state.shopStock.every(entry => entry.price >= 20000), true);
});

test('trend card marks its scheduled ecology as player-created', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  state.day = 20;
  state.cardInventory.iAmTheTrend = 1;

  const result = api.useCard('iAmTheTrend');

  assert.equal(result.ok, true);
  assert.equal(state.scheduledEcoByCard, true);
});

test('fate token does not appear in the shop below ten thousand net worth', () => {
  const { api } = createGame({ random: () => 0.999999 });
  const state = api.reset();

  assert.equal(api.netWorth(), 5000);
  assert.equal(state.shopStock.some(entry => entry.cardId === 'fateToken'), false);
});

test('fate token cannot be used below ten thousand net worth', () => {
  const { api } = createGame({ random: () => 0 });
  const state = api.reset();
  state.cardInventory.fateToken = 1;

  const result = api.useCard('fateToken');

  assert.equal(result.ok, false);
  assert.equal(state.cardInventory.fateToken, 1);
});

test('winning fate token adds nine times current net worth as cash', () => {
  const { api } = createGame({ random: () => 0.39 });
  const state = api.reset();
  state.cash = 10000;
  state.inventory.wheat = 100;
  state.costBasis.wheat = 400;
  state.prices.wheat = 5;
  state.cardInventory.fateToken = 1;
  const before = api.netWorth();

  const result = api.useCard('fateToken');

  assert.equal(result.ok, true);
  assert.equal(result.outcome, 'win');
  assert.equal(api.netWorth(), before * 10);
  assert.equal(state.inventory.wheat, 100);
  assert.equal(state.cardInventory.fateToken, 0);
});

test('losing fate token reduces cash and every holding to one tenth', () => {
  const { api } = createGame({ random: () => 0.4 });
  const state = api.reset();
  state.cash = 10000;
  state.inventory.wheat = 109;
  state.costBasis.wheat = 436;
  state.inventory.wood = 9;
  state.costBasis.wood = 72;
  state.cardInventory.fateToken = 1;

  const result = api.useCard('fateToken');

  assert.equal(result.ok, true);
  assert.equal(result.outcome, 'loss');
  assert.equal(state.cash, 1000);
  assert.equal(state.inventory.wheat, 10);
  assert.equal(state.costBasis.wheat, 40);
  assert.equal(state.inventory.wood || 0, 0);
  assert.equal(state.costBasis.wood || 0, 0);
  assert.equal(state.cardInventory.fateToken, 0);
});
