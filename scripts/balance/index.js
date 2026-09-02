const { createGame } = require('../../tests/helpers/load-game');
const { STRATEGIES } = require('./strategies');

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function buildSeeds(start, count) {
  const random = seededRandom(start);
  const seeds = new Set();
  while (seeds.size < count) seeds.add(Math.floor(random() * 0x100000000) >>> 0);
  return [...seeds];
}

const CALIBRATION_SEEDS = buildSeeds(0x4c414231, 400);
const VALIDATION_SEEDS = buildSeeds(0x56414c31, 1000);
const SENSITIVITY_SEEDS = buildSeeds(0x53454e31, 300);
const DEFAULT_STRATEGY_PARAMETERS = {
  skilledReserveRate: 0.0095,
  skilledFeeBufferDays: 0.5
};

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function summarize(values) {
  if (!values.length) return { min: 0, p10: 0, median: 0, p90: 0, max: 0, mean: 0 };
  return {
    min: Math.min(...values),
    p10: percentile(values, 0.10),
    median: percentile(values, 0.50),
    p90: percentile(values, 0.90),
    max: Math.max(...values),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length
  };
}

function applyScenario(overrides = {}) {
  return { ...overrides };
}

function applyOverrides(api, scenario) {
  const mapping = {
    storageFeeRate: 'STORAGE_FEE_RATE',
    liquidationRate: 'LIQUIDATION_RATE',
    allowOffMarketLiquidation: 'ALLOW_OFF_MARKET_LIQUIDATION',
    ecoEventChance: 'ECO_EVENT_CHANCE',
    naturalVolatilityScale: 'NATURAL_VOLATILITY_SCALE',
    suddenEventScale: 'SUDDEN_EVENT_SCALE',
    ecoEventScale: 'ECO_EVENT_SCALE'
  };
  for (const [key, configKey] of Object.entries(mapping)) {
    if (scenario[key] != null) api.BALANCE_CONFIG[configKey] = scenario[key];
  }
  if (scenario.basePriceScale != null) {
    for (const good of api.GOODS) good.base *= scenario.basePriceScale;
  }
}

function knownPrice(state, id) {
  return state.availableGoods.includes(id) ? state.prices[id] : (state.lastSeenPrice[id] ?? state.prices[id]);
}

function runSimulation({ seed, strategyId, scenario = {} }) {
  const strategy = STRATEGIES[strategyId];
  if (!strategy) throw new Error(`Unknown strategy: ${strategyId}`);
  const setupRandom = seededRandom(seed ^ 0xa5a5a5a5);
  const marketRandom = seededRandom(seed ^ 0x5a5a5a5a);
  const actionRandom = seededRandom(seed ^ 0x3c6ef372);
  const { api } = createGame({ random: setupRandom });
  applyOverrides(api, scenario);
  const state = api.reset({ skipShop: true });
  state.shopStock = [];
  state.cardInventory = {};

  const metrics = {
    seed,
    strategy: strategyId,
    cardsBought: 0,
    cardsUsed: 0,
    buyActions: 0,
    sellActions: 0,
    tradedValue: 0,
    forcedLiquidations: 0,
    forcedLiquidatedUnits: 0,
    cashDangerDays: 0,
    fullPositionDays: 0,
    trappedDays: 0,
    peakWorth: api.netWorth(),
    maxDrawdown: 0,
    profitSources: {
      trading: 0,
      natural: 0,
      sudden: 0,
      ecology: 0,
      storageFees: 0,
      forcedLiquidationPenalty: 0
    }
  };

  const context = {
    api,
    state,
    random: actionRandom,
    parameters: { ...DEFAULT_STRATEGY_PARAMETERS, ...scenario },
    estimatedDailyFee: 0,
    buy(id, quantity) {
      quantity = Math.max(0, Math.floor(quantity));
      if (!quantity) return false;
      const before = state.inventory[id] || 0;
      const price = state.prices[id];
      api.buy(id, quantity);
      const bought = (state.inventory[id] || 0) - before;
      if (bought <= 0) return false;
      metrics.buyActions++;
      metrics.tradedValue += bought * price;
      return true;
    },
    sell(id, quantity) {
      quantity = Math.max(0, Math.floor(quantity));
      const before = state.inventory[id] || 0;
      if (!quantity || !before) return false;
      const average = (state.costBasis[id] || 0) / before;
      const price = state.prices[id];
      api.sell(id, quantity);
      const sold = before - (state.inventory[id] || 0);
      if (sold <= 0) return false;
      metrics.sellActions++;
      metrics.tradedValue += sold * price;
      metrics.profitSources.trading += sold * (price - average);
      return true;
    }
  };

  while (!state.gameOver) {
    context.estimatedDailyFee = api.calcDailyFee();
    strategy.act(context);

    const worth = api.netWorth();
    const fee = api.calcDailyFee();
    const beforeInventory = { ...state.inventory };
    const beforePrices = {};
    for (const id of Object.keys(beforeInventory)) beforePrices[id] = knownPrice(state, id);

    if (state.cash < Math.max(fee * 7, worth * 0.03)) metrics.cashDangerDays++;
    if (api.totalUnits() >= api.capacity() * 0.90) metrics.fullPositionDays++;
    const heldIds = Object.keys(state.inventory).filter(id => state.inventory[id] > 0);
    if (heldIds.length && !heldIds.some(id => state.availableGoods.includes(id))) metrics.trappedDays++;

    metrics.profitSources.storageFees -= fee;
    api.advanceBaselineDay(Math.floor(marketRandom() * 0x100000000));

    let forcedThisDay = false;
    for (const [id, beforeQuantity] of Object.entries(beforeInventory)) {
      const afterQuantity = state.inventory[id] || 0;
      const liquidated = Math.max(0, beforeQuantity - afterQuantity);
      if (liquidated > 0) {
        forcedThisDay = true;
        metrics.forcedLiquidatedUnits += liquidated;
        metrics.profitSources.forcedLiquidationPenalty -= liquidated * beforePrices[id] * (1 - api.BALANCE_CONFIG.LIQUIDATION_RATE);
      }
      const heldQuantity = Math.min(beforeQuantity, afterQuantity);
      if (!heldQuantity) continue;
      const priceDelta = knownPrice(state, id) - beforePrices[id];
      const event = state.events.find(item => item.goodId === id);
      const ecology = state.eco && api.ECO_EVENTS[state.eco.treeId].goods.includes(id) && api.ecoRel() >= 2;
      const source = ecology ? 'ecology' : event ? 'sudden' : 'natural';
      metrics.profitSources[source] += heldQuantity * priceDelta;
    }
    if (forcedThisDay) metrics.forcedLiquidations++;

    const newWorth = api.netWorth();
    metrics.peakWorth = Math.max(metrics.peakWorth, newWorth);
    metrics.maxDrawdown = Math.max(metrics.maxDrawdown, metrics.peakWorth > 0 ? (metrics.peakWorth - newWorth) / metrics.peakWorth : 0);
  }

  const survived = state.gameOver === 'time';
  const actions = metrics.buyActions + metrics.sellActions;
  return {
    ...metrics,
    survived,
    daysPlayed: state.day,
    finalWorth: api.netWorth(),
    bankruptcyDay: survived ? null : state.day,
    actionDensity: actions / Math.max(1, state.day),
    endingCash: state.cash,
    endingInventoryValue: api.netWorth() - state.cash
  };
}

function summarizeRuns(results) {
  const survivors = results.filter(result => result.survived);
  const failures = results.filter(result => !result.survived);
  const numeric = key => summarize(results.map(result => result[key]));
  const profitSources = {};
  const sourceNames = results[0]?.profitSources ? Object.keys(results[0].profitSources) : [];
  for (const source of sourceNames) profitSources[source] = summarize(results.map(result => result.profitSources[source]));
  return {
    runs: results.length,
    survivalRate: results.length ? survivors.length / results.length : 0,
    survivorFinalWorth: summarize(survivors.map(result => result.finalWorth)),
    allFinalWorth: numeric('finalWorth'),
    bankruptcyDay: summarize(failures.map(result => result.bankruptcyDay)),
    forcedLiquidations: numeric('forcedLiquidations'),
    forcedLiquidatedUnits: numeric('forcedLiquidatedUnits'),
    maxDrawdown: numeric('maxDrawdown'),
    cashDangerDays: numeric('cashDangerDays'),
    fullPositionDays: numeric('fullPositionDays'),
    trappedDays: numeric('trappedDays'),
    actionDensity: numeric('actionDensity'),
    tradedValue: numeric('tradedValue'),
    profitSources
  };
}

function runBatch({ seeds, strategyId, scenario = {} }) {
  return seeds.map(seed => runSimulation({ seed, strategyId, scenario }));
}

module.exports = {
  CALIBRATION_SEEDS,
  DEFAULT_STRATEGY_PARAMETERS,
  SENSITIVITY_SEEDS,
  VALIDATION_SEEDS,
  STRATEGIES,
  applyScenario,
  runBatch,
  runSimulation,
  seededRandom,
  summarize,
  summarizeRuns
};
