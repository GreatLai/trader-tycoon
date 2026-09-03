const DEFAULT_PROFESSION_ID = 'useless';

const COMMON_ACTIONS = Object.freeze({
  listing: Object.freeze({ id: 'commonListing', name: '通商令', maxUses: 3, eventChance: 0.15,
    description: '让一件压仓货重新报价并加入今日市场，行情吉凶不由你定。' })
});

const PROFESSION_MECHANICS = Object.freeze({
  toothMerchant: Object.freeze({ ordinaryLogBias: -0.035, ordinaryFloorShift: -0.08, ordinaryCeilingCap: 1.10, raiseFailureChance: 0.20, raiseMinFactor: 1.15, raiseMinStep: 0.05, raiseMaxFactor: 1.45, saleLockDays: 3, cooldownDays: 3 }),
  travelingMerchant: Object.freeze({ familiarRouteChance: 0.65, marketTripEventChance: 0.15, travelFeeRate: 0.05, cooldownDays: 3 }),
  speculator: Object.freeze({ eventIntensity: 1.20, followContinueChance: 0.70, cooldownDays: 3 }),
  saltIronMonopoly: Object.freeze({ allowedGoodIds: Object.freeze(['salt', 'steel', 'machine-tool', 'lunar-soil']), deviationScale: 3, cooldownDays: 7 })
});

const PROFESSIONS = Object.freeze({
  useless: Object.freeze({
    id: 'useless', name: '生意人', tagline: '大道至简',
    selectionQuote: '不借势，不设局。低处敢买，高处舍得卖，就是全部本事。',
    selectionTags: Object.freeze(['标准交易', '没有特权', '没有代价']),
    description: '没有门路，也没有靠山。只凭眼力，在九十天里把小生意做大。',
    passive: '本分生意：商品、货架、价格、事件和经营压力全部采用标准规则。',
    drawback: '没有职业优势，也没有职业限制。',
    inRun: Object.freeze({
      judgment: '没有门路，也没有靠山。只凭眼力，在九十天里把小生意做大。',
      passive: '本分生意：商品、货架、价格、事件和经营压力全部采用标准规则。',
      active: '没有专属手段。你仍可使用每局 3 次的通商令。',
      drawback: '没有职业优势，也没有职业限制。'
    }),
    unlock: null, modifyRules: null, activeAbility: null
  }),
  toothMerchant: Object.freeze({
    id: 'toothMerchant', name: '牙行商', tagline: '奇货可居',
    selectionQuote: '行情不肯来，就把行情做出来。只是货能抬价，也能砸在自己手里。',
    selectionTags: Object.freeze(['低价收货', '主动抬价', '失败封货']),
    description: '不等待高价，先找到便宜货，再决定是否亲手造势。',
    passive: '低价收货：普通行情每日额外向低价偏移约 3.4%，价格下限降低 8 个百分点，自然高价不超过锚点的 110%。',
    drawback: '封货：抬价有 20% 概率失败。失败商品连续 3 天禁止出售，第 4 天恢复；强制清算也不能绕过。',
    inRun: Object.freeze({
      judgment: '不等待高价，先找到便宜货，再决定是否亲手造势。',
      passive: '低价收货：普通行情每日额外向低价偏移约 3.4%，价格下限降低 8 个百分点，自然高价不超过锚点的 110%。',
      active: '抬价：每 3 天可用一次，成功率 80%。成功后至少达到锚点的 115%，至少比当前倍率提高 5 个百分点，最高达到锚点的 145%。',
      drawback: '封货：失败率 20%。失败当天及随后两天禁止出售，第 4 天恢复；强制清算不能绕过。'
    }),
    unlock: { peakNetWorth: 10000, text: '任意一局总资产达到 ¥10,000' },
    modifyRules(rules) {
      const m = PROFESSION_MECHANICS.toothMerchant;
      rules.price.ordinaryLogBias = m.ordinaryLogBias;
      rules.price.ordinaryFloorShift = m.ordinaryFloorShift;
      rules.price.ordinaryCeilingCap = m.ordinaryCeilingCap;
    },
    activeAbility: Object.freeze({ id: 'raisePrice', name: '抬价', cooldownDays: PROFESSION_MECHANICS.toothMerchant.cooldownDays,
      description: '选择今日上架、持有且今天未买入的商品。80% 成功；成功后升至锚点的 115%–145%，20% 失败并连续 3 天禁售。' })
  }),
  travelingMerchant: Object.freeze({
    id: 'travelingMerchant', name: '行脚商', tagline: '货走四方',
    selectionQuote: '货压在仓里不值钱，走到有买主的地方，才真正算一门生意。',
    selectionTags: Object.freeze(['库存回市', '重新报价', '成交路费']),
    description: '市场不来找你，就带着货去找市场。',
    passive: '熟门熟路：若当天没有任何持仓商品自然上架，有 65% 概率带回压货金额最高的商品。',
    drawback: '路费：赶集商品当天卖出扣除成交收入的 5%，未卖出不收费。',
    inRun: Object.freeze({
      judgment: '市场不来找你，就带着货去找市场。',
      passive: '熟门熟路：若当天没有任何持仓商品自然上架，有 65% 概率带回压货金额最高的商品，并替换一个没有库存的货架位置。',
      active: '赶集：每 3 天可用一次。任意持仓均可重新报价；未上架则追加，已上架则刷新；有 15% 概率触发普通突发事件，本次报价不套用当日生态目标价。',
      drawback: '路费：赶集商品当天卖出扣除成交收入的 5%，未卖出不收费。'
    }),
    unlock: null, modifyRules: null,
    activeAbility: Object.freeze({ id: 'marketTrip', name: '赶集', cooldownDays: PROFESSION_MECHANICS.travelingMerchant.cooldownDays,
      description: '选择任意持仓重新报价。未上架则追加到货架，已上架则刷新；15% 概率触发普通突发事件，当天卖出收取 5% 路费。' })
  }),
  speculator: Object.freeze({
    id: 'speculator', name: '投机客', tagline: '闻风下注',
    selectionQuote: '一条消息，他敢吃两遍。风向若是不改，赚的是胆量；风向若变，赔的也是胆量。',
    selectionTags: Object.freeze(['消息续场', '追涨追跌', '风险放大']),
    description: '消息落地只是开始，真正的赌注在下一阵风。',
    passive: '追风：自然突发事件商品第二天必定占用一个正常货架位置。',
    drawback: '风声放大：自然突发事件的价格偏离强度额外放大 20%；生态行情不受影响。',
    inRun: Object.freeze({
      judgment: '消息落地只是开始，真正的赌注在下一阵风。',
      passive: '追风：当天发生自然突发事件的商品，第二天必定占用一个正常货架位置。',
      active: '煽风点火：每 3 天可用一次。指定当天自然突发商品，第二天有 70% 概率延续原方向、30% 概率反转；必定产生实际涨跌，不会升级为稀有事件。',
      drawback: '风声放大：所有自然突发事件的价格偏离强度额外放大 20%，利好与利空同时增强；生态行情不受影响。'
    }),
    unlock: null, modifyRules: null,
    activeAbility: Object.freeze({ id: 'stokeMarket', name: '煽风点火', cooldownDays: PROFESSION_MECHANICS.speculator.cooldownDays,
      description: '指定今日发生自然突发事件的商品。次日 70% 延续原方向、30% 反转，必定涨跌且不会出现稀有事件。' })
  }),
  saltIronMonopoly: Object.freeze({
    id: 'saltIronMonopoly', name: '盐铁商', tagline: '利出一孔',
    selectionQuote: '天下货路尽数舍去，只守四门生意。路越窄，价差越狠。',
    selectionTags: Object.freeze(['四货专营', '行情放大', '机会稀少']),
    description: '天下货物虽多，只守四门生意，把每一次行情做到极致。',
    passive: '专营行情：只能交易食盐、钢材、精密机床和月壤；四种商品的普通、突发、生态和回归偏离统一使用 3 倍对数幅度。',
    drawback: '专营限制：其他商品即使上架也不能交易；月壤仍需本局历史最高资产达到 1,000 万后解锁。',
    inRun: Object.freeze({
      judgment: '天下货物虽多，只守四门生意，把每一次行情做到极致。',
      passive: '专营行情：只能交易食盐、钢材、精密机床和月壤；四种商品的普通、突发、生态和回归偏离统一使用 3 倍对数幅度，即标准倍率 f 显示为 f³。',
      active: '风向标：每 7 天可用一次。没有生态行情时，随机召来一项已解锁且包含专营商品的生态事件；当天预告，下一天进入第一阶段，不能指定商品、分支或方向。',
      drawback: '专营限制：其他商品即使上架也不能交易；月壤仍需本局历史最高资产达到 1,000 万后解锁。'
    }),
    unlock: null,
    modifyRules(rules) {
      const m = PROFESSION_MECHANICS.saltIronMonopoly;
      rules.trade.allowedGoodIds = [...m.allowedGoodIds];
      rules.price.byGood = Object.fromEntries(m.allowedGoodIds.map(id => [id, { deviationScale: m.deviationScale }]));
    },
    activeAbility: Object.freeze({ id: 'windVane', name: '风向标', cooldownDays: PROFESSION_MECHANICS.saltIronMonopoly.cooldownDays,
      description: '当前没有生态行情时，随机召来一项包含专营商品的已解锁生态事件。无法指定商品、分支或涨跌方向。' })
  })
});

function normalizeProfessionId(id) {
  return Object.prototype.hasOwnProperty.call(PROFESSIONS, id) ? id : DEFAULT_PROFESSION_ID;
}

function newProfessionState(id = DEFAULT_PROFESSION_ID) {
  return { id: normalizeProfessionId(id), activeUsedDay: null, data: {} };
}
