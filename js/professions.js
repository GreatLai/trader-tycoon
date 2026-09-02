const DEFAULT_PROFESSION_ID = 'useless';

const PROFESSIONS = Object.freeze({
  useless: Object.freeze({
    id: 'useless',
    name: '无用之人',
    description: '标准规则。没有职业加成，也没有额外代价。',
    passive: '无。商品、事件、经营费和仓库均按标准规则运行。',
    drawback: '无。',
    unlock: null,
    modifyRules: null,
    activeAbility: null
  }),
  toothMerchant: Object.freeze({
    id: 'toothMerchant',
    name: '牙商',
    description: '低价收货，再用抬价主动创造卖点。收益高，但失败会锁住库存。',
    passive: '普通行情更偏低，更容易遇到低价。',
    drawback: '普通行情的自然高价更少；抬价有 20% 几率失败。失败商品当天起连续 3 天禁售，第 4 天恢复。',
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
      description: '每 3 天可用 1 次。选择今日上架、持有且今天未买入的商品，将价格抬至锚点的 115%～145%。'
    })
  }),
  travelingMerchant: Object.freeze({
    id: 'travelingMerchant',
    name: '行商',
    description: '优先盘活库存，减少有货无市；也能主动让持货重新报价。',
    passive: '熟路：若当天没有任何库存自然上架，有 65% 几率带回压货金额最高的商品。',
    drawback: '赶集商品当天卖出时扣除成交收入的 5% 作为路费；未卖出不收费。',
    unlock: null,
    modifyRules: null,
    activeAbility: Object.freeze({
      id: 'marketTrip',
      name: '赶集',
      cooldownDays: 3,
      description: '每 3 天可用 1 次。选择任意持货重新报价：未上架则追加到货架，已上架则原地刷新；有 15% 几率触发普通突发事件。'
    })
  }),
  speculator: Object.freeze({
    id: 'speculator',
    name: '投机商',
    description: '围绕突发事件连续下注。生存提升有限，冲分能力强。',
    passive: '追风：发生自然突发事件的商品，次日必定占用一个正常货架位置继续上架。',
    drawback: '风声放大：自然突发事件的涨跌幅度都会加深 20%；生态行情不受影响。',
    unlock: null,
    modifyRules: null,
    activeAbility: Object.freeze({
      id: 'stokeMarket',
      name: '煽风点火',
      cooldownDays: 3,
      description: '每 3 天可用 1 次。指定今日发生自然突发事件的商品，安排次日后续行情；走势更可能延续，也可能反转。'
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
