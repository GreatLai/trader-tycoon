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
      description: '选择一个今日上架、自己持有且当天未买入的商品，将价格抬到锚点的 1.15 至 1.45 倍。每天一次；有 20% 几率失败并禁售三天。'
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
