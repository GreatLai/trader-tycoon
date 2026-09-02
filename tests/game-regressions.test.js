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

test('warehouse and shop are sibling panels', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(
    html,
      /id="inventoryList"><\/div>\s*<\/div>\s*<div class="panel">\s*<div class="panel-title">🏪 奇货铺/
  );
});

test('start screen presents five immersive operating principles including the shop', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ruleList = html.match(/<ul class="start-rules">([\s\S]*?)<\/ul>/)?.[1] || '';

  assert.equal((ruleList.match(/<li>/g) || []).length, 5);
  assert.match(html, /只剩.*¥5,000.*旧商行/);
  assert.match(ruleList, /逐利/);
  assert.match(ruleList, /观势/);
  assert.match(ruleList, /借势/);
  assert.match(ruleList, /奇货铺每 7 天/);
  assert.match(ruleList, /守仓/);
  assert.match(html, /现金不足会按七折强制平仓/);
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
  const versionInfo = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

  assert.equal(api.APP_VERSION, '1.8.0');
  assert.equal(versionInfo.version, api.APP_VERSION);
  assert.equal((html.match(/\?v=1\.8\.0/g) || []).length, 12);
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
  assert.match(source, /owned === 0 \? 'disabled' : ''/);
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

test('a deterministic no-trade run finishes without invalid state', () => {
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

  assert.equal(state.day, api.CONFIG.DAYS_LIMIT);
  assert.equal(state.gameOver, 'time');
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
  state.scheduledEco = 'globalDrought';

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

test('ecological events retain their configured multiplier', () => {
  const { api } = createGame();
  const state = api.reset();
  state.day = 9;
  state.eco = { treeId: 'globalDrought', startDay: 8, A: 0, B: null, C: null };

  assert.equal(api.ecoCurrentMult('wheat'), api.ECO_EVENTS.globalDrought.A[0].mults.wheat);
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

test('paid sudden-event cards have a higher rare-outcome chance', () => {
  const { api } = createGame();

  assert.equal(api.eventRareChance(false), 0.06);
  assert.equal(api.eventRareChance(true), 0.20);
});
