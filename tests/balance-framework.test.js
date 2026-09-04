const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  CALIBRATION_SEEDS,
  SENSITIVITY_SEEDS,
  VALIDATION_SEEDS,
  STRATEGIES,
  applyOverrides,
  applyScenario,
  runSimulation,
  summarizeRuns
} = require('../scripts/balance');
const { buyRanked } = require('../scripts/balance/strategies');
const { createGame } = require('./helpers/load-game');
const { pairedComparison } = require('../scripts/generate-balance-report');

test('calibration, validation, and sensitivity seeds are deterministic and disjoint', () => {
  assert.equal(CALIBRATION_SEEDS.length > 0, true);
  assert.equal(VALIDATION_SEEDS.length > 0, true);
  assert.equal(SENSITIVITY_SEEDS.length > 0, true);
  const allSeeds = [...CALIBRATION_SEEDS, ...VALIDATION_SEEDS, ...SENSITIVITY_SEEDS];
  assert.equal(new Set(allSeeds).size, allSeeds.length);
});

test('pure trading baseline exposes seven explainable card-free strategies', () => {
  assert.deepEqual(Object.keys(STRATEGIES), [
    'wait', 'random', 'allIn', 'diversified', 'disciplined', 'skilled', 'extreme'
  ]);
  for (const strategy of Object.values(STRATEGIES)) {
    assert.equal(typeof strategy.description, 'string');
    assert.equal(strategy.description.length > 10, true);
    assert.equal(typeof strategy.act, 'function');
  }
});

test('same seed and scenario produce identical card-free runs', () => {
  const first = runSimulation({ seed: 2026090201, strategyId: 'skilled' });
  const second = runSimulation({ seed: 2026090201, strategyId: 'skilled' });

  assert.deepEqual(second, first);
  assert.equal(first.daysPlayed <= 90, true);
});

test('run metrics include survival, risk, activity, and return attribution', () => {
  const result = runSimulation({ seed: 2026090202, strategyId: 'allIn' });

  for (const key of [
    'survived', 'finalWorth', 'bankruptcyDay', 'forcedLiquidations',
    'maxDrawdown', 'cashDangerDays', 'fullPositionDays', 'trappedDays',
    'buyActions', 'sellActions', 'actionDensity', 'profitSources'
  ]) assert.equal(Object.hasOwn(result, key), true, key);

  assert.deepEqual(Object.keys(result.profitSources).sort(), [
    'ecology', 'forcedLiquidationPenalty', 'natural', 'operatingFees', 'storageFees', 'sudden', 'trading'
  ]);
});

test('balance simulation can run salt iron monopoly with licensed trading and wind vane', () => {
  const result = runSimulation({
    seed: 2026090301,
    strategyId: 'skilled',
    scenario: { professionId: 'saltIronMonopoly', autoUseProfessionAbility: true }
  });

  assert.equal(result.profession, 'saltIronMonopoly');
  assert.equal(result.professionAbilityUses > 0, true);
  assert.equal(result.unlicensedTradeAttempts, 0);
});

test('baseline simulation includes operating pressure and no-trade failure', () => {
  const result = runSimulation({ seed: 2026090204, strategyId: 'wait' });

  assert.equal(result.survived, false);
  assert.equal(result.bankruptcyDay, 27);
  assert.equal(result.profitSources.operatingFees < 0, true);
});

test('scenario overrides affect live parameters without leaking into later runs', () => {
  const baseline = runSimulation({ seed: 2026090203, strategyId: 'allIn' });
  const expensiveStorage = runSimulation({
    seed: 2026090203,
    strategyId: 'allIn',
    scenario: applyScenario({ storageFeeRate: 0.02 })
  });
  const repeatedBaseline = runSimulation({ seed: 2026090203, strategyId: 'allIn' });

  assert.equal(expensiveStorage.profitSources.storageFees < baseline.profitSources.storageFees, true);
  assert.deepEqual(repeatedBaseline, baseline);
});

test('debt settlement scenario maps the candidate operating and liquidation rules', () => {
  const { api } = createGame();

  applyOverrides(api, applyScenario({
    operatingCostMultiplier: 2,
    liquidationRate: 1,
    allowOffMarketLiquidation: true,
    offMarketLiquidationRate: 0.2
  }));

  assert.equal(api.BALANCE_CONFIG.OPERATING_COST_MULTIPLIER, 2);
  assert.equal(api.BALANCE_CONFIG.LIQUIDATION_RATE, 1);
  assert.equal(api.BALANCE_CONFIG.ALLOW_OFF_MARKET_LIQUIDATION, true);
  assert.equal(api.BALANCE_CONFIG.OFF_MARKET_LIQUIDATION_RATE, 0.2);
});

test('balance scenarios can replace the operating cost schedule with fixed accounting periods', () => {
  const { api } = createGame();
  const stages = [
    { startDay: 1, endDay: 15, base: 50, growth: 1 },
    { startDay: 16, endDay: 30, base: 200, growth: 1 },
    { startDay: 31, endDay: 45, base: 1000, growth: 1 },
    { startDay: 46, endDay: 60, base: 5000, growth: 1 },
    { startDay: 61, endDay: 75, base: 20000, growth: 1 },
    { startDay: 76, endDay: 90, base: 72000, growth: 1 }
  ];

  applyOverrides(api, applyScenario({ operatingCostStages: stages }));

  assert.equal(api.calcOperatingCost(1), 50);
  assert.equal(api.calcOperatingCost(16), 200);
  assert.equal(api.calcOperatingCost(31), 1000);
  assert.equal(api.calcOperatingCost(46), 5000);
  assert.equal(api.calcOperatingCost(61), 20000);
  assert.equal(api.calcOperatingCost(76), 72000);
});

test('summary reports survivor-only wealth and bankruptcy timing separately', () => {
  const summary = summarizeRuns([
    { survived: true, finalWorth: 100, bankruptcyDay: null },
    { survived: false, finalWorth: 0, bankruptcyDay: 20 },
    { survived: true, finalWorth: 300, bankruptcyDay: null }
  ]);

  assert.equal(summary.survivalRate, 2 / 3);
  assert.equal(summary.survivorFinalWorth.median, 200);
  assert.equal(summary.bankruptcyDay.median, 20);
});

test('ranked multi-position buying never spends more than its explicit budget', () => {
  const state = { cash: 1000, prices: { a: 10, b: 10 } };
  let units = 0;
  const context = {
    state,
    api: { capacity: () => 1000, totalUnits: () => units },
    buy(id, quantity) {
      state.cash -= quantity * state.prices[id];
      units += quantity;
      return true;
    }
  };

  buyRanked(context, ['a', 'b'], 600, 2, 1);

  assert.equal(state.cash >= 400, true);
});

test('generated balance report matches the current card-free pressure baseline', () => {
  const report = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'balance', 'useless-trader-v1.json'),
    'utf8'
  ));
  const framework = fs.readFileSync(path.join(__dirname, '..', 'docs', 'BALANCE_FRAMEWORK.md'), 'utf8');
  const skilled = report.validation.strategies.skilled;

  assert.equal(report.baseline, 'useless-trader-card-free');
  assert.equal(report.gameVersion, '1.17.1');
  assert.deepEqual(report.exclusions, [
    'daily-hand', 'career-skills', 'shop-cards', 'existing-item-card-income', 'common-listing'
  ]);
  assert.equal(skilled.survivalRate >= 0.60 && skilled.survivalRate <= 0.70, true);
  assert.equal(skilled.survivorFinalWorth.median >= 75000000, true);
  assert.equal(skilled.survivorFinalWorth.median <= 125000000, true);
  assert.equal(report.sensitivity.some(item => item.name === '商品基础锚点'), true);
  assert.equal(Object.hasOwn(skilled.profitSources, 'operatingFees'), true);
  assert.match(framework, /存活率 69\.6%/);
});

test('balance simulator source does not call card purchase or use APIs', () => {
  const sources = [
    fs.readFileSync(path.join(__dirname, '..', 'scripts', 'balance-sim.js'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '..', 'scripts', 'balance', 'index.js'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '..', 'scripts', 'balance', 'strategies.js'), 'utf8')
  ].join('\n');

  assert.doesNotMatch(sources, /\.buyCard\(|\.useCard\(/);
});

test('pure market day applies wealth milestones like the real next-day flow', () => {
  const { api } = createGame({ random: () => 0.5 });
  const state = api.reset({ skipShop: true });
  state.cash = 10500;

  api.advanceBaselineDay(12345);

  assert.equal(state.highestMilestone >= 0, true);
  assert.equal(api.capacity() > api.WAREHOUSE_CAPACITY_BY_MILESTONE[0], true);
});

test('paired sensitivity separates survival transitions from common-survivor wealth', () => {
  const comparison = pairedComparison(
    [
      { survived: true, finalWorth: 100 },
      { survived: true, finalWorth: 200 },
      { survived: false, finalWorth: 10 }
    ],
    [
      { survived: true, finalWorth: 150 },
      { survived: false, finalWorth: 20 },
      { survived: true, finalWorth: 30 }
    ]
  );

  assert.deepEqual(comparison.transitions, {
    survivedBoth: 1, baselineOnly: 1, variantOnly: 1, failedBoth: 0
  });
  assert.equal(comparison.commonSurvivorWorthRatio.median, 1.5);
});
