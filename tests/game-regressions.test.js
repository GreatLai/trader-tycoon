const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { ROOT, createGame } = require('./helpers/load-game');

const ULTRA_IDS = new Set(['diamond', 'antique', 'spacecraft']);

function initialMarketRandom() {
  let calls = 0;
  return () => {
    calls += 1;
    if (calls <= 13) return 0.5;
    if (calls === 14) return 0;
    return 0.999;
  };
}

test('a fresh game never lists ultra goods before the unlock threshold', () => {
  const { api } = createGame({ random: initialMarketRandom() });
  const state = api.reset();

  assert.equal(state.cash, api.CONFIG.START_CASH);
  assert.equal(state.availableGoods.some(id => ULTRA_IDS.has(id)), false);
});

test('forced liquidation pays the shortfall and keeps only the surplus', () => {
  const { api } = createGame();
  const state = api.reset();
  state.cash = 0;
  state.loan = 0;
  state.inventory = { wheat: 1000 };
  state.costBasis = { wheat: 5000 };
  state.prices.wheat = 5;
  state.lastSeenPrice.wheat = 5;
  state.availableGoods = ['wheat'];

  assert.equal(api.calcDailyFee(), 5);
  api.applyDailyCosts();

  assert.equal(state.inventory.wheat, 998);
  assert.equal(state.cash, 2);
  assert.equal(state.gameOver, null);
});

test('ending day 90 does not create or charge day 91', () => {
  const { api } = createGame();
  const state = api.reset();
  state.day = api.CONFIG.DAYS_LIMIT;
  state.cash = 100;
  state.inventory = { wheat: 1000 };
  state.costBasis = { wheat: 5000 };
  const historyLength = state.priceHistory.wheat.length;

  api.nextDay();

  assert.equal(state.day, api.CONFIG.DAYS_LIMIT);
  assert.equal(state.gameOver, 'time');
  assert.equal(state.cash, 100);
  assert.equal(state.inventory.wheat, 1000);
  assert.equal(state.priceHistory.wheat.length, historyLength);
});

test('v1.3 ecological saves migrate to a valid v1.4 stage', () => {
  const baseline = createGame().api.reset();
  baseline.day = 10;
  baseline.saveVersion = '1.3.0';
  baseline.eco = {
    treeId: 'globalDrought',
    startDay: 8,
    startPrices: { wheat: 5 },
    A: 0,
    B: null,
    C: null
  };

  const { api } = createGame({ savedState: baseline });
  const loaded = api.loadSave();
  api.setState(loaded);

  assert.equal(loaded.saveVersion, api.APP_VERSION);
  assert.equal(Object.hasOwn(loaded.eco, 'startPrices'), false);
  assert.equal(api.ecoRel(), 2);
  assert.doesNotThrow(() => api.nextDay());
  assert.notEqual(loaded.eco.B, null);
});

test('loading a low-wealth save removes prematurely listed ultra goods', () => {
  const baseline = createGame().api.reset();
  baseline.cash = 5000;
  baseline.loan = 0;
  baseline.inventory = {};
  baseline.availableGoods = ['spacecraft', 'antique', 'diamond', 'wheat', 'wood'];

  const { api } = createGame({ savedState: baseline });
  const loaded = api.loadSave();

  assert.equal(loaded.availableGoods.length, api.CONFIG.MARKET_SIZE);
  assert.equal(loaded.availableGoods.some(id => ULTRA_IDS.has(id)), false);
});

test('warehouse and bank are sibling panels', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(
    html,
    /id="inventoryList"><\/div>\s*<\/div>\s*<div class="panel">\s*<div class="panel-title">🏦 银行/
  );
});

test('start-screen rules match the v1.4 warehouse and liquidation behavior', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.doesNotMatch(html, /可花钱扩容/);
  assert.doesNotMatch(html, /现金不足会自动转贷款/);
  assert.match(html, /财富评级提升后自动扩容/);
  assert.match(html, /现金不足会按七折强制平仓/);
});

test('the in-game version button lives in the header instead of covering content', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const header = html.match(/<header>([\s\S]*?)<\/header>/)?.[1] || '';

  assert.match(header, /id="versionFab"/);
  assert.doesNotMatch(html, /id="versionFab"[^>]*position:fixed/);
});

test('the stability release version is consistent across delivery files', () => {
  const { api } = createGame();
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const versionInfo = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

  assert.equal(api.APP_VERSION, '1.4.1');
  assert.equal(versionInfo.version, api.APP_VERSION);
  assert.equal((html.match(/\?v=1\.4\.1/g) || []).length, 11);
});

test('manual version refresh preserves the existing save', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');
  const updateBody = source.match(/function doVersionUpdate\(\) \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.doesNotMatch(updateBody, /removeItem|clearSave/);
  assert.doesNotMatch(source, /更新将清除存档/);
});

test('every ecological event has complete A/B/C multipliers', () => {
  const { api } = createGame();
  const goodIds = new Set(api.GOODS.map(good => good.id));

  for (const [eventId, event] of Object.entries(api.ECO_EVENTS)) {
    assert.equal(event.goods.length, 4, `${eventId} should affect four goods`);
    assert.equal(event.A.length, 3, `${eventId} should have three A branches`);
    for (const goodId of event.goods) assert.equal(goodIds.has(goodId), true);

    for (const A of event.A) {
      assert.equal(A.B.length, 3);
      for (const B of A.B) {
        assert.equal(B.C.length, 3);
        for (const stage of [A, B, ...B.C]) {
          for (const goodId of event.goods) {
            assert.equal(Number.isFinite(stage.mults[goodId]), true);
            assert.equal(stage.mults[goodId] > 0, true);
          }
        }
      }
    }
  }
});

test('a deterministic no-trade run finishes without invalid state', () => {
  let seed = 123456789;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const { api } = createGame({ random });
  const state = api.reset();

  while (!state.gameOver) {
    api.nextDay();
    const numericValues = [
      state.cash,
      state.loan,
      api.netWorth(),
      ...Object.values(state.prices),
      ...Object.values(state.inventory),
      ...Object.values(state.costBasis)
    ];
    assert.equal(numericValues.every(Number.isFinite), true);
    assert.equal(Object.values(state.inventory).every(value => value >= 0), true);
    assert.equal(api.totalUnits() <= api.capacity(), true);
  }

  assert.equal(state.day, api.CONFIG.DAYS_LIMIT);
  assert.equal(state.gameOver, 'time');
});
