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

test('ultra goods stay unlocked after peak wealth reaches ten million', () => {
  const { api } = createGame({ random: () => 0.999999 });
  const state = api.reset();
  state.cash = 1000;
  state.peakNetWorth = 10000000;

  const picks = api.pickGoods(api.GOODS.length);

  assert.equal(picks.some(id => ULTRA_IDS.has(id)), true);
});

test('forced liquidation pays the shortfall and keeps only the surplus', () => {
  const { api } = createGame();
  const state = api.reset();
  state.cash = 0;
  state.inventory = { wheat: 1000 };
  state.costBasis = { wheat: 5000 };
  state.prices.wheat = 5;
  state.lastSeenPrice.wheat = 5;
  state.availableGoods = ['wheat'];

  assert.equal(api.calcDailyFee(), 5);
  api.applyDailyCosts();

  assert.equal(state.inventory.wheat, 984);
  assert.equal(state.cash, 1);
  assert.equal(state.gameOver, null);
});

test('forced liquidation cannot sell holdings that are absent from the market', () => {
  const { api } = createGame();
  const state = api.reset();
  state.cash = 0;
  state.inventory = { wheat: 1000 };
  state.costBasis = { wheat: 5000 };
  state.prices.wheat = 5;
  state.lastSeenPrice.wheat = 5;
  state.availableGoods = ['wood'];

  api.applyDailyCosts();

  assert.equal(state.inventory.wheat, 1000);
  assert.equal(state.gameOver, 'lose');
});

test('operating costs follow the configured four-stage ninety-day pressure curve', () => {
  const { api } = createGame();
  const costs = Array.from({ length: api.CONFIG.DAYS_LIMIT }, (_, index) => api.calcOperatingCost(index + 1));

  assert.equal(costs[0], 50);
  assert.equal(Math.abs(costs[14] - 50 * 1.025 ** 14) < 0.001, true);
  assert.equal(costs[15], 80);
  assert.equal(Math.abs(costs[29] - 80 * 1.08 ** 14) < 0.001, true);
  assert.equal(costs[30], 300);
  assert.equal(Math.abs(costs[59] - 300 * 1.10 ** 29) < 0.001, true);
  assert.equal(costs[60], 6000);
  assert.equal(Math.abs(costs.at(-1) - 6000 * 1.08 ** 29) < 0.001, true);
  assert.equal(Math.abs(costs.reduce((sum, value) => sum + value, 0) - 732116.2389343618) < 0.01, true);
  assert.equal(Math.abs(api.BALANCE_CONFIG.OPERATING_COST_TOTAL - 732116.2389343618) < 0.01, true);
  assert.equal(Math.abs(api.calcRemainingOperatingCost(1) - 732116.2389343618) < 0.01, true);
  assert.equal(Math.abs(api.calcRemainingOperatingCost(16) - costs.slice(15).reduce((sum, value) => sum + value, 0)) < 0.01, true);
  assert.equal(Math.abs(api.calcRemainingOperatingCost(31) - costs.slice(30).reduce((sum, value) => sum + value, 0)) < 0.01, true);
  assert.equal(Math.abs(api.calcRemainingOperatingCost(61) - costs.slice(60).reduce((sum, value) => sum + value, 0)) < 0.01, true);
  assert.equal(Math.abs(api.calcRemainingOperatingCost(90) - costs.at(-1)) < 0.01, true);
});

test('a merchant who never trades fails under the staged operating pressure', () => {
  const { api } = createGame();
  const state = api.reset();

  while (!state.gameOver) api.nextDay();

  assert.equal(state.gameOver, 'lose');
  assert.equal(state.day > 30 && state.day < 61, true);
});

test('day ninety charges its own costs before a successful time settlement', () => {
  const { api } = createGame();
  const state = api.reset();
  state.day = api.CONFIG.DAYS_LIMIT;
  state.cash = 100000;
  const expected = +(state.cash - api.calcOperatingCost(api.CONFIG.DAYS_LIMIT)).toFixed(2);

  api.nextDay();

  assert.equal(state.day, api.CONFIG.DAYS_LIMIT);
  assert.equal(state.gameOver, 'time');
  assert.equal(state.cash, expected);
});

test('ending day 90 does not create or charge day 91', () => {
  const { api } = createGame();
  const state = api.reset();
  state.day = api.CONFIG.DAYS_LIMIT;
  state.cash = 200000;
  state.inventory = { wheat: 1000 };
  state.costBasis = { wheat: 5000 };
  const historyLength = state.priceHistory.wheat.length;
  const expectedCash = +(state.cash - api.calcOperatingCost(90) - api.calcDailyFee()).toFixed(2);

  api.nextDay();

  assert.equal(state.day, api.CONFIG.DAYS_LIMIT);
  assert.equal(state.gameOver, 'time');
  assert.equal(state.cash, expectedCash);
  assert.equal(state.inventory.wheat, 1000);
  assert.equal(state.priceHistory.wheat.length, historyLength);
});

test('current ecological saves reload at the same stage', () => {
  const baseline = createGame().api.reset();
  baseline.day = 9;
  baseline.saveVersion = '1.7.0';
  baseline.eco = {
    treeId: 'globalDrought',
    startDay: 8,
    A: 0,
    B: null,
    C: null
  };

  const { api } = createGame({ savedState: baseline });
  const loaded = api.loadSave();
  api.setState(loaded);

  assert.equal(loaded.saveVersion, api.APP_VERSION);
  assert.equal(api.ecoRel(), 2);
  assert.doesNotThrow(() => api.nextDay());
  assert.notEqual(loaded.eco.B, null);
});

test('loading a low-wealth save removes prematurely listed ultra goods', () => {
  const baseline = createGame().api.reset();
  baseline.cash = 5000;
  baseline.inventory = {};
  baseline.availableGoods = ['spacecraft', 'antique', 'diamond', 'wheat', 'wood'];

  const { api } = createGame({ savedState: baseline });
  const loaded = api.loadSave();

  assert.equal(loaded.availableGoods.length, api.CONFIG.MARKET_SIZE);
  assert.equal(loaded.availableGoods.some(id => ULTRA_IDS.has(id)), false);
});

test('warehouse and profession are sibling panels', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(
    html,
      /id="inventoryList"><\/div>\s*<\/div>\s*<div class="panel" id="professionPanel">/
  );
});

test('start screen presents five immersive operating principles including professions', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ruleList = html.match(/<ul class="start-rules">([\s\S]*?)<\/ul>/)?.[1] || '';

  assert.equal((ruleList.match(/<li>/g) || []).length, 5);
  assert.match(html, /只剩.*¥5,000.*旧商行/);
  assert.match(ruleList, /逐利/);
  assert.match(ruleList, /观势/);
  assert.match(ruleList, /择业/);
  assert.match(ruleList, /四种职业默认开放/);
  assert.match(ruleList, /守仓/);
  assert.match(ruleList, /经营费会分阶段加速上涨/);
  assert.match(html, /现金不足时只能按七折强平今日上架的库存/);
  assert.match(ruleList, /登阶/);
});

test('new-game controls return to the start screen before another run begins', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

  assert.match(source, /function returnToStartScreen\(\)/);
  assert.match(source, /target\.id === 'newGameBtn'[\s\S]*?returnToStartScreen\(\)/);
  assert.match(source, /target\.id === 'restartBtn'[\s\S]*?returnToStartScreen\(\)/);
});

test('the in-game version button lives in the header instead of covering content', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const header = html.match(/<header>([\s\S]*?)<\/header>/)?.[1] || '';

  assert.match(header, /id="versionFab"/);
  assert.doesNotMatch(html, /id="versionFab"[^>]*position:fixed/);
});

test('the release version is consistent across delivery files', () => {
  const { api } = createGame();
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  const versionInfo = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

  assert.equal(api.APP_VERSION, '1.12.1');
  assert.equal(versionInfo.version, api.APP_VERSION);
  assert.equal((html.match(/\?v=1\.12\.1/g) || []).length, 15);
  assert.match(readme, /当前版本：\*\* v1\.12\.1/);
  assert.match(changelog, /## \[1\.12\.1\] - 2026-09-02/);
});

test('standard and ecology markets list six and seven goods respectively', () => {
  const { api } = createGame();
  assert.equal(api.CONFIG.MARKET_SIZE, 6);
  assert.equal(api.CONFIG.ECO_MARKET_SIZE, 7);
});

test('manual version refresh preserves the existing save', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');
  const updateBody = source.match(/function doVersionUpdate\(\) \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.doesNotMatch(updateBody, /removeItem|clearSave/);
  assert.doesNotMatch(source, /更新将清除存档/);
});

test('market rows expose immediate presets and custom buy and sell controls', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'ui.js'), 'utf8');

  assert.match(source, /class="trade-row trade-buy"/);
  assert.match(source, /class="trade-row trade-sell"/);
  for (const qty of ['1', '10', '100']) {
    assert.match(source, new RegExp(`data-action="buy"[^>]*data-qty="${qty}"`));
    assert.match(source, new RegExp(`data-action="sell"[^>]*data-qty="${qty}"`));
  }
  assert.match(source, /data-action="buy"[^>]*data-qty="max"[^>]*>买满/);
  assert.match(source, /data-action="sell"[^>]*data-qty="all"[^>]*>全卖/);
  assert.match(source, /data-trade-input="buy"/);
  assert.match(source, /data-trade-input="sell"/);
  assert.match(source, /data-custom-trade="buy"/);
  assert.match(source, /data-custom-trade="sell"/);
  assert.match(source, /owned === 0 \|\| saleLocked \? 'disabled' : ''/);
});

test('new games default to quantity trading mode', () => {
  const { api } = createGame();

  assert.equal(api.newState().tradeInputMode, 'quantity');
});

test('legacy saves normalize missing or invalid trading modes to quantity', () => {
  const { api } = createGame();
  const legacy = api.newState();
  delete legacy.tradeInputMode;

  const missingModeGame = createGame({ savedState: legacy });
  assert.equal(missingModeGame.api.loadSave().tradeInputMode, 'quantity');

  legacy.tradeInputMode = 'unexpected';
  const invalidModeGame = createGame({ savedState: legacy });
  assert.equal(invalidModeGame.api.loadSave().tradeInputMode, 'quantity');
});

test('buy percentages use the current affordable and available capacity maximum', () => {
  const { api } = createGame();
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.prices.wheat = 3;
  state.cash = 100;

  assert.equal(typeof api.getPercentageTradeQuantity, 'function');
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 25), 8);
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 50), 16);
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 75), 24);
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 100), 33);

  state.inventory.tea = api.capacity() - 10;
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 25), 2);
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 100), 10);
});

test('trade percentages round down but buy or sell at least one available unit', () => {
  const { api } = createGame();
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.prices.wheat = state.cash;
  state.inventory.wheat = 3;
  state.costBasis.wheat = 3;

  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 25), 1);
  assert.equal(api.getPercentageTradeQuantity('sell', 'wheat', 25), 1);
  assert.equal(api.getPercentageTradeQuantity('sell', 'wheat', 50), 1);
  assert.equal(api.getPercentageTradeQuantity('sell', 'wheat', 75), 2);
  assert.equal(api.getPercentageTradeQuantity('sell', 'wheat', 100), 3);

  state.cash = 0;
  state.inventory.wheat = 0;
  assert.equal(api.getPercentageTradeQuantity('buy', 'wheat', 25), 0);
  assert.equal(api.getPercentageTradeQuantity('sell', 'wheat', 25), 0);
});

test('trading mode changes persist with the save and reject unknown modes', () => {
  const { api, storage } = createGame();
  const state = api.reset();

  assert.equal(typeof api.setTradeInputMode, 'function');
  assert.equal(api.setTradeInputMode('percentage'), true);
  assert.equal(state.tradeInputMode, 'percentage');
  assert.equal(JSON.parse(storage.get(api.CONFIG.SAVE_KEY)).tradeInputMode, 'percentage');
  assert.equal(api.setTradeInputMode('invalid'), false);
  assert.equal(state.tradeInputMode, 'percentage');
});

test('market title exposes one global compact quantity and percentage switch', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const uiSource = fs.readFileSync(path.join(ROOT, 'js', 'ui.js'), 'utf8');
  const mainSource = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

  assert.equal((html.match(/class="trade-mode-toggle"/g) || []).length, 1);
  assert.match(html, /data-trade-mode="quantity"[^>]*>数量</);
  assert.match(html, /data-trade-mode="percentage"[^>]*>比例</);
  assert.match(uiSource, /\[25, 50, 75, 100\]/);
  assert.match(uiSource, /state\.tradeInputMode === 'percentage'/);
  assert.match(mainSource, /target\.dataset\.tradeMode/);
  assert.match(mainSource, /setTradeInputMode\(target\.dataset\.tradeMode\)/);
});

test('legacy trade modal is removed', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const mainSource = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

  assert.doesNotMatch(html, /id="tradeOverlay"|id="tradeQty"|id="tradeBuyBtn"|id="tradeSellBtn"/);
  assert.doesNotMatch(mainSource, /tradeGoodId|openTrade|renderTrade|data\.tradeQuick/);
});

test('custom inline trades support click and Enter and clear only after success', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

  assert.match(source, /function executeCustomTrade\(target\)/);
  assert.match(source, /target\.dataset\.customTrade/);
  assert.match(source, /input\.value = ''/);
  assert.match(source, /document\.addEventListener\('keydown'/);
  assert.match(source, /e\.key !== 'Enter'/);
  assert.match(source, /executeCustomTrade\(input\)/);
  assert.match(source, /parseTradeQuantity\(input\.value\)/);
});

test('custom trade quantity parsing rejects empty and invalid values', () => {
  const { api } = createGame();

  assert.equal(api.parseTradeQuantity(''), 0);
  assert.equal(api.parseTradeQuantity('not-a-number'), 0);
  assert.equal(api.parseTradeQuantity('Infinity'), 0);
  assert.equal(api.parseTradeQuantity('3'), 3);
  assert.equal(api.parseTradeQuantity('3.9'), 3);
});

test('non-finite trade quantities cannot corrupt cash or inventory', () => {
  const { api } = createGame();
  const state = api.reset();
  state.availableGoods = ['wheat'];
  state.prices.wheat = 5;
  state.inventory.wheat = 1000;
  state.costBasis.wheat = 5000;

  for (const qty of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    api.sell('wheat', qty);
    api.buy('wheat', qty);
  }

  assert.equal(state.cash, api.CONFIG.START_CASH);
  assert.equal(state.inventory.wheat, 1000);
  assert.equal(state.costBasis.wheat, 5000);
  assert.equal(Number.isFinite(api.netWorth()), true);
});

test('market CSS uses stable desktop tracks and a three-row mobile layout', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

  assert.match(css, /@media \(max-width:\s*1120px\)\s*\{\s*main \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /grid-template-areas:\s*"info buy"\s*"info sell"/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /\.trade-row[^}]*white-space:\s*nowrap/s);
  assert.match(css, /\.trade-custom-input[^}]*width:/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*grid-template-areas:\s*"info"\s*"buy"\s*"sell"/);
  assert.match(css, /@media \(max-width:\s*360px\)[\s\S]*\.trade-row\s*\{[^}]*grid-template-columns:\s*24px/s);
  assert.match(css, /\.trade-mode-toggle[^}]*display:\s*grid/s);
  assert.match(css, /\.trade-mode-toggle[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(css, /\.trade-mode-toggle[^}]*flex:\s*0 0 auto/s);
  assert.match(css, /@media \(max-width:\s*360px\)[\s\S]*\.market-panel-title[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /#chartSvgWrap\s+svg\s*\{[^}]*width:\s*100%[^}]*height:\s*auto/s);
  assert.doesNotMatch(css, /<\/style>/);
});

test('generated art is wired into goods, branding, and responsive scenery', () => {
  const { api } = createGame();
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const uiSource = fs.readFileSync(path.join(ROOT, 'js', 'ui.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

  for (const good of api.GOODS) {
    assert.equal(good.art, `assets/art/runtime/goods/good-${good.id}-128.webp`);
  }
  assert.match(html, /class="brand-logo brand-logo-horizontal"[^>]*logo-horizontal\.webp/);
  assert.match(html, /class="brand-logo brand-logo-seal"[^>]*logo-seal\.webp/);
  assert.match(uiSource, /good-art-image/);
  assert.match(uiSource, /onerror=/);
  assert.match(css, /paper-tile\.webp/);
  assert.match(css, /harbor-desktop\.webp/);
  assert.match(css, /harbor-mobile\.webp/);
  assert.match(html, /coin-tassel\.webp/);
  assert.match(css, /@media \(max-width:\s*640px\)[\s\S]*brand-logo-horizontal[^}]*display:\s*none/);
  assert.match(css, /@media \(max-width:\s*640px\)[\s\S]*brand-logo-seal[^}]*display:/);
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

test('a deterministic no-trade run fails from operating pressure without invalid state', () => {
  let seed = 123456789;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const { api } = createGame({ random });
  const state = api.reset();

  while (!state.gameOver) {
    api.nextDay();
    const numericValues = [
      state.cash,
      api.netWorth(),
      ...Object.values(state.prices),
      ...Object.values(state.inventory),
      ...Object.values(state.costBasis)
    ];
    assert.equal(numericValues.every(Number.isFinite), true);
    assert.equal(Object.values(state.inventory).every(value => value >= 0), true);
    assert.equal(api.totalUnits() <= api.capacity(), true);
  }

  assert.equal(state.day, 36);
  assert.equal(state.gameOver, 'lose');
});

test('expense panel shows operating cost, storage cost, and remaining pressure', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'ui.js'), 'utf8');

  assert.match(source, /calcOperatingCost\(\)/);
  assert.match(source, /calcRemainingOperatingCost\(\)/);
  assert.match(source, /基础经营费/);
  assert.match(source, /剩余经营压力/);
});

test('natural sudden event count keeps the original daily distribution', () => {
  const { api } = createGame();
  const state = api.reset();
  state.availableGoods = ['wheat', 'wood', 'coal'];
  state.availableGoods.forEach(id => { state.lastSeenPrice[id] = state.prices[id]; });

  let calls = 0;
  api.setRandom(() => calls++ === 0 ? 0.19 : 0.1);
  api.spawnEvents();
  assert.equal(state.events.length, 0);

  state.events = [];
  calls = 0;
  api.setRandom(() => calls++ === 0 ? 0.20 : 0.1);
  api.spawnEvents();
  assert.equal(state.events.length, 1);

  state.events = [];
  calls = 0;
  api.setRandom(() => calls++ === 0 ? 0.60 : 0.1);
  api.spawnEvents();
  assert.equal(state.events.length, 2);

  state.events = [];
  calls = 0;
  api.setRandom(() => calls++ === 0 ? 0.90 : 0.1);
  api.spawnEvents();
  assert.equal(state.events.length, 3);
});

test('ecological news expands the market to seven goods until the event ends', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset();
  state.day = 7;
  state.eco = { treeId: 'globalDrought', startDay: 7, A: null, B: null, C: null, byCard: false };

  api.nextDay();
  assert.notEqual(state.eco, null);
  assert.equal(state.availableGoods.length, 7);

  while (state.eco) api.nextDay();
  assert.equal(state.availableGoods.length, api.CONFIG.MARKET_SIZE);
});

test('an extreme event price recovers over multiple days instead of snapping to normal', () => {
  const { api } = createGame();
  const state = api.reset();
  const target = api.GOODS.find(good => good.id === 'wheat');
  state.factors.wheat = 0.1;
  state.prices.wheat = target.base * 0.1;
  state.events = [];
  api.setRandom(() => 0.25);

  api.updateGoodPrice(target);

  assert.equal(state.factors.wheat > 0.1, true);
  assert.equal(state.factors.wheat < 0.8, true);
});

test('warehouse growth stays below fourfold per late wealth tier', () => {
  const { api } = createGame();
  const levels = api.WAREHOUSE_CAPACITY_BY_MILESTONE;

  for (let index = 2; index < levels.length; index++) {
    assert.equal(levels[index] / levels[index - 1] <= 4, true);
  }
  assert.equal(levels.at(-1), 16000000);
});

test('ecological event scale transforms the configured multiplier', () => {
  const { api } = createGame();
  const state = api.reset();
  state.day = 9;
  state.eco = { treeId: 'globalDrought', startDay: 8, A: 0, B: null, C: null };

  assert.equal(
    api.ecoCurrentMult('wheat'),
    Math.pow(api.ECO_EVENTS.globalDrought.A[0].mults.wheat, api.BALANCE_CONFIG.ECO_EVENT_SCALE)
  );
});

test('extreme ecological branches receive less selection weight', () => {
  const { api } = createGame();
  const mild = { mults: { wheat: 1.2, wood: 0.9 } };
  const extreme = { mults: { wheat: 20, wood: 0.04 } };

  assert.equal(api.ecoBranchWeight(extreme) < api.ecoBranchWeight(mild), true);
  assert.equal(api.ecoVolatileBranchWeight(extreme) > api.ecoVolatileBranchWeight(mild), true);
});

test('natural events favor falling outcomes over rising outcomes', () => {
  const { api } = createGame();

  assert.equal(api.eventPositiveChance('low', false), 0.38);
  assert.equal(api.eventPositiveChance('ultra', false), 0.22);
  assert.equal(api.eventPositiveChance('low', true), 0.30);
});

test('most natural event targets resolve as an ordinary flat market', () => {
  const { api } = createGame();

  assert.equal(api.eventMovementChance('low'), 0.85);
  assert.equal(api.eventMovementChance('high'), 0.70);
  assert.equal(api.eventMovementChance('ultra'), 0.55);
});

test('forced sudden events can use a higher rare-outcome chance', () => {
  const { api } = createGame();

  assert.equal(api.eventRareChance(false), 0.06);
  assert.equal(api.eventRareChance(true), 0.20);
});

test('opening story introduces the staged operating pressure', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

  assert.match(source, /第 16、31、61 天/);
  assert.match(source, /更高压力阶段/);
});

test('the market defines twenty complete and distinct commodity profiles', () => {
  const { api } = createGame();
  const required = [
    'volatility', 'meanReversion', 'momentum', 'positiveBias',
    'eventWeight', 'eventImpact', 'listingWeight',
    'ordinaryFloor', 'ordinaryCeiling'
  ];

  assert.equal(api.GOODS.length, 20);
  assert.equal(new Set(api.GOODS.map(good => good.id)).size, 20);
  for (const good of api.GOODS) {
    assert.equal(Array.isArray(good.tags), true, good.id);
    assert.equal(good.tags.length > 0 && good.tags.length <= 3, true, good.id);
    for (const field of required) assert.equal(Number.isFinite(good.market[field]), true, `${good.id}.${field}`);
    assert.equal(good.market.ordinaryFloor < 1, true, good.id);
    assert.equal(good.market.ordinaryCeiling > 1, true, good.id);
  }
});
