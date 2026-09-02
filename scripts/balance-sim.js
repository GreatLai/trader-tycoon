const { CALIBRATION_SEEDS, STRATEGIES, runBatch, summarizeRuns } = require('./balance');

const requestedRuns = Math.max(1, Number(process.argv[2]) || CALIBRATION_SEEDS.length);
const seeds = CALIBRATION_SEEDS.slice(0, requestedRuns);
const report = {
  baseline: 'useless-trader-card-free',
  seedSet: 'calibration',
  runsPerStrategy: seeds.length,
  strategies: Object.fromEntries(Object.keys(STRATEGIES).map(strategyId => [
    strategyId,
    summarizeRuns(runBatch({ seeds, strategyId }))
  ]))
};

console.log(JSON.stringify(report, null, 2));
