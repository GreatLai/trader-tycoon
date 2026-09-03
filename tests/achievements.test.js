const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { ROOT, createGame } = require('./helpers/load-game');

test('profitable sale records realized profit and lightweight trade feedback', () => {
  const { api } = createGame();
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.cash = 1000;
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  state.prices.wheat = 10;

  const result = api.sell('wheat', 10);

  assert.equal(result.realizedProfit, 50);
  assert.equal(result.returnRate, 1);
  assert.equal(state.lastTradeFeedback.goodId, 'wheat');
  assert.equal(state.lastTradeFeedback.realizedProfit, 50);
});

test('one sale queues only the highest priority matching achievement', () => {
  const { api } = createGame();
  const state = api.reset();
  const wheat = api.GOODS.find(good => good.id === 'wheat');
  state.availableGoods = ['wheat'];
  state.cash = 100;
  state.inventory.wheat = 10;
  state.costBasis.wheat = wheat.base * 2;
  state.prices.wheat = wheat.base * 3;

  api.sell('wheat', 10);

  assert.equal(state.achievementQueue.length, 1);
  assert.equal(state.achievementQueue[0].id, 'windfall');
});

test('completed achievements cannot be queued twice in one run', () => {
  const { api } = createGame();
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.inventory.wheat = 20;
  state.costBasis.wheat = 100;
  state.prices.wheat = 8;

  api.sell('wheat', 10);
  state.inventory.wheat = 10;
  state.costBasis.wheat = 50;
  api.sell('wheat', 10);

  assert.equal(state.achievementQueue.filter(item => item.id === 'firstProfit').length, 1);
});

test('breaking even after a deep drawdown still earns the escape achievement', () => {
  const { api } = createGame();
  const state = api.reset();
  state.tradeMemories.wheat = { wasDeepUnderwater: true };

  const achievement = api.evaluateTradeAchievements({
    goodId: 'wheat',
    realizedProfit: 0,
    returnRate: 0,
    averageCost: 5,
    salePrice: 5,
    netWorthBefore: 5000,
    netWorthAfter: 5000
  });

  assert.equal(achievement.id, 'escapeTrap');
});

test('achievement feedback is wired into the market and a dedicated modal', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ui = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');

  assert.match(html, /id="achievementOverlay"/);
  assert.match(html, /js\/achievements\.js/);
  assert.match(ui, /trade-feedback/);
  assert.match(ui, /achievementQueue/);
});
