const DEFAULT_PROFESSION_ID = 'useless';

const PROFESSIONS = Object.freeze({
  useless: Object.freeze({
    id: 'useless',
    name: '无用之人',
    description: '没有缺陷，也没有特长。完全依靠市场判断活过九十天。',
    passive: '标准行情、标准仓储、标准事件。',
    drawback: '无',
    unlock: null,
    modifyRules: null,
    activeAbility: null
  }),
  toothMerchant: Object.freeze({
    id: 'toothMerchant',
    name: '牙商',
    description: '擅长在低迷市场压价收货，再亲自为手中的货抬价出手。',
    passive: '普通行情整体偏低，低价机会更多。',
    drawback: '普通行情的自然高价更少，买得容易，卖得更难。',
    unlock: { peakNetWorth: 10000, text: '任意一局总资产达到 ¥10,000' },
    modifyRules(rules) {
      rules.price.ordinaryLogBias = -0.035;
      rules.price.ordinaryFloorShift = -0.08;
      rules.price.ordinaryCeilingCap = 1.10;
    },
    activeAbility: Object.freeze({
      id: 'raisePrice',
      name: '抬价',
      cooldownDays: 3,
      description: '选择一个今日上架、自己持有且当天未买入的商品，将价格抬到锚点的 1.15 至 1.45 倍。使用后第 4 天可再次发动；有 20% 几率失败并禁售三天。'
    })
  }),
  travelingMerchant: Object.freeze({
    id: 'travelingMerchant',
    name: '行商',
    description: '走熟路、赶大集，让压在仓里的货重新遇见买主。',
    passive: '熟路：每日自然货架没有任何持货时，65%概率带回成本总额最高的库存商品，并替换当日价格相对锚点最高的非库存商品。',
    drawback: '赶集带回的商品若在当天卖出，成交收入扣除 5% 路费。',
    unlock: null,
    modifyRules: null,
    activeAbility: Object.freeze({
      id: 'marketTrip',
      name: '赶集',
      cooldownDays: 3,
      description: '选择一个持有商品重新报价；未上架则追加到今日货架，已上架则原地刷新。有 15% 几率触发突发事件，不受生态行情定价影响。使用后第 4 天可再次发动。'
    })
  }),
  speculator: Object.freeze({
    id: 'speculator',
    name: '投机商',
    description: '追着突发风声下注，把一次行情变成连续两天的机会或风险。',
    passive: '追风：所有自然突发事件商品次日必定继续上架，占用正常货架位置。',
    drawback: '风声放大：自然突发事件的涨跌幅度都会加深 20%，生态行情不受影响。',
    unlock: null,
    modifyRules: null,
    activeAbility: Object.freeze({
      id: 'stokeMarket',
      name: '煽风点火',
      cooldownDays: 3,
      description: '指定一个今日发生自然突发事件的商品，安排次日后续报道。走势更可能延续，也可能反转；使用后第 4 天可再次发动。'
    })
  })
});

function normalizeProfessionId(id) {
  return Object.prototype.hasOwnProperty.call(PROFESSIONS, id) ? id : DEFAULT_PROFESSION_ID;
}

function newProfessionState(id = DEFAULT_PROFESSION_ID) {
  return {
    id: normalizeProfessionId(id),
    activeUsedDay: null,
    data: {}
  };
}
