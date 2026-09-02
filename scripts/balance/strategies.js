function averageCost(state, id) {
  const quantity = state.inventory[id] || 0;
  return quantity ? (state.costBasis[id] || 0) / quantity : 0;
}

function priceRatio(api, state, id) {
  return state.prices[id] / api.GOODS.find(good => good.id === id).base;
}

function heldTradable(state) {
  return state.availableGoods.filter(id => (state.inventory[id] || 0) > 0);
}

function sellWhen(context, predicate) {
  for (const id of heldTradable(context.state)) {
    if (predicate(id)) context.sell(id, context.state.inventory[id]);
  }
}

function buyRanked(context, candidates, budget, maxPositions = 1, capacityShare = 1) {
  const { api, state } = context;
  const remainingCapacity = Math.max(0, Math.floor(api.capacity() * capacityShare) - api.totalUnits());
  if (!candidates.length || budget <= 0 || remainingCapacity <= 0) return;
  const selected = candidates.slice(0, maxPositions);
  let budgetLeft = Math.min(state.cash, budget);
  let capacityLeft = remainingCapacity;
  selected.forEach((id, index) => {
    const slotsLeft = selected.length - index;
    const quantity = Math.min(
      Math.floor(budgetLeft / slotsLeft / state.prices[id]),
      Math.floor(capacityLeft / slotsLeft)
    );
    const cashBefore = state.cash;
    if (quantity > 0 && context.buy(id, quantity)) {
      budgetLeft = Math.max(0, budgetLeft - (cashBefore - state.cash));
      capacityLeft = Math.max(0, Math.floor(api.capacity() * capacityShare) - api.totalUnits());
    }
  });
}

const STRATEGIES = {
  wait: {
    description: '全程空等，不进行任何交易，用于确认现金和纯市场时间基线。',
    act() {}
  },
  random: {
    description: '随机选择上架商品和买卖方向，每次最多动用七成现金，不读取价格信号。',
    act(context) {
      const { random, state } = context;
      const held = heldTradable(state);
      if (held.length && random() < 0.35) {
        const id = held[Math.floor(random() * held.length)];
        context.sell(id, Math.max(1, Math.floor(state.inventory[id] * (0.25 + random() * 0.75))));
      }
      if (state.availableGoods.length && random() < 0.60) {
        const id = state.availableGoods[Math.floor(random() * state.availableGoods.length)];
        const quantity = Math.min(
          Math.floor(state.cash * 0.70 / state.prices[id]),
          context.api.capacity() - context.api.totalUnits()
        );
        context.buy(id, quantity);
      }
    }
  },
  allIn: {
    description: '每天卖出能卖的旧仓并把现金买满当日绝对单价最低商品，不判断估值。',
    act(context) {
      for (const id of heldTradable(context.state)) context.sell(id, context.state.inventory[id]);
      const candidates = context.state.availableGoods.slice().sort((a, b) => context.state.prices[a] - context.state.prices[b]);
      buyRanked(context, candidates, context.state.cash, 1, 1);
    }
  },
  diversified: {
    description: '持有最多三种相对基础价较低的商品，保留一成五现金并分散仓位。',
    act(context) {
      const { api, state } = context;
      sellWhen(context, id => state.prices[id] >= averageCost(state, id) * 1.15 || priceRatio(api, state, id) >= 1.15);
      const candidates = state.availableGoods
        .filter(id => priceRatio(api, state, id) <= 1)
        .sort((a, b) => priceRatio(api, state, a) - priceRatio(api, state, b));
      buyRanked(context, candidates, state.cash - api.netWorth() * 0.15, 3, 0.85);
    }
  },
  disciplined: {
    description: '只买九二折以下商品，盈利一成二或显著高估即卖，保留两成现金且仓位不超七成。',
    act(context) {
      const { api, state } = context;
      sellWhen(context, id => state.prices[id] >= averageCost(state, id) * 1.12 || priceRatio(api, state, id) >= 1.16);
      const candidates = state.availableGoods
        .filter(id => priceRatio(api, state, id) <= 0.92)
        .sort((a, b) => priceRatio(api, state, a) - priceRatio(api, state, b));
      buyRanked(context, candidates, state.cash - api.netWorth() * 0.20, 2, 0.70);
    }
  },
  skilled: {
    description: '结合成本、基础价、突发新闻和生态行情低吸高卖，分散两仓并保留现金缓冲。',
    act(context) {
      const { api, state } = context;
      const events = new Map(state.events.map(event => [event.goodId, event]));
      sellWhen(context, id => {
        const event = events.get(id);
        return (event && event.type === 'good') || state.prices[id] >= averageCost(state, id) * 1.10 || priceRatio(api, state, id) >= 1.18;
      });
      const candidates = state.availableGoods
        .filter(id => {
          const event = events.get(id);
          return priceRatio(api, state, id) <= 0.95 || (event && event.type === 'bad');
        })
        .sort((a, b) => {
          const eventA = events.get(a);
          const eventB = events.get(b);
          const scoreA = priceRatio(api, state, a) * (eventA?.type === 'bad' ? 0.72 : 1);
          const scoreB = priceRatio(api, state, b) * (eventB?.type === 'bad' ? 0.72 : 1);
          return scoreA - scoreB;
        });
      const reserve = Math.max(
        api.netWorth() * context.parameters.skilledReserveRate,
        context.estimatedDailyFee * context.parameters.skilledFeeBufferDays
      );
      buyRanked(context, candidates, state.cash - reserve, 2, 0.82);
    }
  },
  extreme: {
    description: '只追逐最深跌幅和利空商品，始终满仓，直到翻倍或利好出现才退出。',
    act(context) {
      const { api, state } = context;
      const events = new Map(state.events.map(event => [event.goodId, event]));
      sellWhen(context, id => {
        const event = events.get(id);
        return event?.type === 'good' || state.prices[id] >= averageCost(state, id) * 2;
      });
      const candidates = state.availableGoods.slice().sort((a, b) => {
        const eventA = events.get(a);
        const eventB = events.get(b);
        const scoreA = priceRatio(api, state, a) * (eventA?.type === 'bad' ? 0.45 : 1);
        const scoreB = priceRatio(api, state, b) * (eventB?.type === 'bad' ? 0.45 : 1);
        return scoreA - scoreB;
      });
      if (candidates.length && (priceRatio(api, state, candidates[0]) <= 0.88 || events.get(candidates[0])?.type === 'bad')) {
        buyRanked(context, candidates, state.cash, 1, 1);
      }
    }
  }
};

module.exports = { STRATEGIES, averageCost, buyRanked, priceRatio };
