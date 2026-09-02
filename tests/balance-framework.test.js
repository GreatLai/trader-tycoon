const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  CALIBRATION_SEEDS,
  SENSITIVITY_SEEDS,
  VALIDATION_SEEDS,
  STRATEGIES,
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
  assert.equal(first.cardsBought, 0);
  assert.equal(first.cardsUsed, 0);
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
    'ecology', 'forcedLiquidationPenalty', 'natural', 'storageFees', 'sudden', 'trading'
  ]);
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

test('versioned validation report meets the useless-trader target without card income', () => {
  const report = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'balance', 'useless-trader-v1.json'),
    'utf8'
  ));
  const skilled = report.validation.strategies.skilled;

  assert.equal(report.baseline, 'useless-trader-card-free');
  assert.deepEqual(report.exclusions, [
    'daily-hand', 'career-skills', 'shop-cards', 'existing-item-card-income'
  ]);
  assert.equal(skilled.survivalRate >= 0.60 && skilled.survivalRate <= 0.70, true);
  assert.equal(skilled.survivorFinalWorth.median >= 75000000, true);
  assert.equal(skilled.survivorFinalWorth.median <= 125000000, true);
  assert.equal(report.sensitivity.some(item => item.name === '商品基础锚点'), true);
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
  state.cash = 10000;

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
