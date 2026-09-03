const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createGame } = require('../tests/helpers/load-game');
const {
  CALIBRATION_SEEDS,
  SENSITIVITY_SEEDS,
  VALIDATION_SEEDS,
  STRATEGIES,
  runBatch,
  summarize,
  summarizeRuns
} = require('./balance');

const ROOT = path.resolve(__dirname, '..');
const REPORT_VERSION = 'useless-trader-v1';

function compact(summary) {
  const {
    runs, survivalRate, survivorFinalWorth, bankruptcyDay, forcedLiquidations, forcedLiquidatedUnits,
    maxDrawdown, cashDangerDays, fullPositionDays, trappedDays, actionDensity,
    tradedValue, profitSources
  } = summary;
  return {
    runs, survivalRate, survivorFinalWorth, bankruptcyDay, forcedLiquidations, forcedLiquidatedUnits,
    maxDrawdown, cashDangerDays, fullPositionDays, trappedDays, actionDensity,
    tradedValue, profitSources
  };
}

function evaluate(seeds, strategyId, scenario = {}) {
  return compact(summarizeRuns(runBatch({ seeds, strategyId, scenario })));
}

function pairedComparison(baselineRuns, variantRuns) {
  const transitions = { survivedBoth: 0, baselineOnly: 0, variantOnly: 0, failedBoth: 0 };
  const commonSurvivorWorthRatios = [];
  const finalWorthDeltas = [];
  baselineRuns.forEach((baseline, index) => {
    const variant = variantRuns[index];
    if (baseline.survived && variant.survived) {
      transitions.survivedBoth++;
      commonSurvivorWorthRatios.push(variant.finalWorth / baseline.finalWorth);
    } else if (baseline.survived) transitions.baselineOnly++;
    else if (variant.survived) transitions.variantOnly++;
    else transitions.failedBoth++;
    finalWorthDeltas.push(variant.finalWorth - baseline.finalWorth);
  });
  return {
    transitions,
    commonSurvivorWorthRatio: summarize(commonSurvivorWorthRatios),
    pairedFinalWorthDelta: summarize(finalWorthDeltas)
  };
}

function sensitivityEntry(seeds, name, low, high, baselineRuns, baseline) {
  const lowRuns = runBatch({ seeds, strategyId: 'skilled', scenario: low });
  const highRuns = runBatch({ seeds, strategyId: 'skilled', scenario: high });
  const lowResult = compact(summarizeRuns(lowRuns));
  const highResult = compact(summarizeRuns(highRuns));
  const effect = (result, runs) => ({
    survivalRateDelta: result.survivalRate - baseline.survivalRate,
    survivorMedianRatio: result.survivorFinalWorth.median / baseline.survivorFinalWorth.median,
    paired: pairedComparison(baselineRuns, runs)
  });
  return {
    name,
    low: { scenario: low, result: lowResult, effect: effect(lowResult, lowRuns) },
    high: { scenario: high, result: highResult, effect: effect(highResult, highRuns) }
  };
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fingerprints() {
  const sourceFiles = [
    'js/config.js', 'js/eco.js', 'js/events.js', 'js/game.js', 'js/state.js', 'js/trading.js',
    'scripts/balance/index.js', 'scripts/balance/strategies.js', 'scripts/generate-balance-report.js',
    'tests/helpers/load-game.js'
  ];
  const source = sourceFiles.map(file => `${file}\n${fs.readFileSync(path.join(ROOT, file), 'utf8')}`).join('\n');
  const { api } = createGame();
  return {
    sourceHash: digest(source),
    configHash: digest(JSON.stringify({ balance: api.BALANCE_CONFIG, goods: api.GOODS })),
    calibrationSeedHash: digest(JSON.stringify(CALIBRATION_SEEDS)),
    validationSeedHash: digest(JSON.stringify(VALIDATION_SEEDS)),
    sensitivitySeedHash: digest(JSON.stringify(SENSITIVITY_SEEDS))
  };
}

function money(value) {
  return `¥${Math.round(value).toLocaleString('en-US')}`;
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function markdown(report) {
  const rows = Object.entries(report.validation.strategies).map(([id, result]) =>
    `| ${id} | ${percent(result.survivalRate)} | ${money(result.survivorFinalWorth.median)} | ${money(result.survivorFinalWorth.p10)} | ${money(result.survivorFinalWorth.p90)} | ${result.bankruptcyDay.median.toFixed(1)} | ${result.forcedLiquidations.mean.toFixed(2)} | ${percent(result.maxDrawdown.median)} |`
  ).join('\n');
  const sensitivities = report.sensitivity.map(item =>
    `| ${item.name} | ${percent(item.low.effect.survivalRateDelta)} / ${item.low.effect.paired.commonSurvivorWorthRatio.median.toFixed(2)}x | ${percent(item.high.effect.survivalRateDelta)} / ${item.high.effect.paired.commonSurvivorWorthRatio.median.toFixed(2)}x |`
  ).join('\n');
  const skilled = report.validation.strategies.skilled;

  return `# 生意人纯交易基准报告\n\n` +
    `- 报告版本：\`${report.reportVersion}\`\n` +
    `- 游戏版本：\`${report.gameVersion}\`\n` +
    `- 校准种子：${report.calibration.runsPerStrategy} 个；验证种子：${report.validation.runsPerStrategy} 个，二者不重叠。\n` +
    `- 排除项：每日手牌、职业技能、奇货铺购买与所有道具卡收益。\n\n` +
    `## 核心结论\n\n` +
    `验证集熟练玩家存活率为 **${percent(skilled.survivalRate)}**，存活局第 90 天最终资产中位数为 **${money(skilled.survivorFinalWorth.median)}**。` +
    `目标锚点为约 65% 和约 1 亿元，验收容差为存活率 ±5 个百分点、资产中位数 0.75 亿至 1.25 亿元。\n\n` +
    `商品基础锚点统一上下调整 20% 后，名义资产大致随锚点同比变化，存活率只移动数个百分点。` +
    `因此不建议用改基础价来修复风险结构，也不需要调整当前商品锚点。影响最大的结构参数是非上架库存能否强平；事件强度决定财富上限，现金缓冲决定熟练模型的存活率。\n\n` +
    `## 验证集策略对比\n\n` +
    `| 策略 | 存活率 | 存活局中位资产 | P10 | P90 | 破产日中位数 | 强平次数均值 | 最大回撤中位数 |\n` +
    `| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows}\n\n` +
    `## 参数敏感性\n\n` +
    `使用独立敏感性种子池，逐项只改一个参数。单元格为“存活率变化 / 两种场景共同幸存局的逐种子资产比中位数”。\n\n` +
    `| 参数 | 低值 | 高值 |\n| --- | ---: | ---: |\n${sensitivities}\n\n` +
    `完整分布、风险指标、收益来源和实验场景见同目录 JSON 文件。\n`;
}

function main() {
  const validationCount = Math.max(1, Number(process.argv[2]) || VALIDATION_SEEDS.length);
  const validationSeeds = VALIDATION_SEEDS.slice(0, validationCount);
  const sensitivitySeeds = SENSITIVITY_SEEDS;
  const calibration = evaluate(CALIBRATION_SEEDS, 'skilled');
  const strategies = Object.fromEntries(Object.keys(STRATEGIES).map(id => [id, evaluate(validationSeeds, id)]));
  const sensitivityBaselineRuns = runBatch({ seeds: sensitivitySeeds, strategyId: 'skilled' });
  const sensitivityBaseline = compact(summarizeRuns(sensitivityBaselineRuns));
  const cases = [
    ['商品基础锚点', { basePriceScale: 0.8 }, { basePriceScale: 1.2 }],
    ['仓储费率', { storageFeeRate: 0.0005 }, { storageFeeRate: 0.0015 }],
    ['强平回收率', { liquidationRate: 0.60 }, { liquidationRate: 0.80 }],
    ['允许场外强平', { allowOffMarketLiquidation: false }, { allowOffMarketLiquidation: true }],
    ['自然波动', { naturalVolatilityScale: 0.75 }, { naturalVolatilityScale: 1.25 }],
    ['突发事件强度', { suddenEventScale: 0.60 }, { suddenEventScale: 0.80 }],
    ['生态事件强度', { ecoEventScale: 0.80 }, { ecoEventScale: 1.00 }],
    ['生态事件概率', { ecoEventChance: 0.10 }, { ecoEventChance: 0.30 }],
    ['熟练现金缓冲', { skilledReserveRate: 0.008 }, { skilledReserveRate: 0.016 }]
  ];
  const report = {
    reportVersion: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    gameVersion: createGame().api.APP_VERSION,
    fingerprints: fingerprints(),
    baseline: 'useless-trader-card-free',
    exclusions: ['daily-hand', 'career-skills', 'shop-cards', 'existing-item-card-income', 'common-listing'],
    calibration: { seedSet: 'calibration', runsPerStrategy: CALIBRATION_SEEDS.length, skilled: calibration },
    validation: { seedSet: 'validation', runsPerStrategy: validationSeeds.length, strategies },
    sensitivitySeeds: sensitivitySeeds.length,
    sensitivity: cases.map(([name, low, high]) => sensitivityEntry(
      sensitivitySeeds, name, low, high, sensitivityBaselineRuns, sensitivityBaseline
    ))
  };

  const directory = path.join(ROOT, 'docs', 'balance');
  fs.mkdirSync(directory, { recursive: true });
  const jsonPath = path.join(directory, `${REPORT_VERSION}.json`);
  const markdownPath = path.join(directory, `${REPORT_VERSION}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(markdownPath, markdown(report));
  console.log(JSON.stringify({ jsonPath, markdownPath, skilled: strategies.skilled }, null, 2));
}

if (require.main === module) main();

module.exports = { fingerprints, pairedComparison };
