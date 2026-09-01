const { createGame } = require('../tests/helpers/load-game');

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function percentile(values, ratio) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function summarize(values) {
  if (!values.length) return { min: 0, p10: 0, median: 0, p90: 0, max: 0, mean: 0 };
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    min: Math.min(...values),
    p10: percentile(values, 0.10),
    median: percentile(values, 0.50),
    p90: percentile(values, 0.90),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    max: Math.max(...values),
    mean: sum / values.length
  };
}

function good(api, id) {
  return api.GOODS.find(item => item.id === id);
}

function ratio(api, state, id) {
  return state.prices[id] / good(api, id).base;
}

function sellAvailableHoldings(api, state, stats, threshold) {
  for (const id of state.availableGoods) {
    const qty = state.inventory[id] || 0;
    if (!qty) continue;
    const average = state.costBasis[id] / qty;
    const event = state.events.find(item => item.goodId === id);
    if (state.prices[id] >= average * threshold || (event && event.type === 'good')) {
      stats.realizedProfit += (state.prices[id] - average) * qty;
      stats.sellActions++;
      api.sell(id, qty);
    }
  }
}

function buyBestValue(api, state, stats, options = {}) {
  const candidates = state.availableGoods
    .map(id => ({ id, value: ratio(api, state, id), event: state.events.find(item => item.goodId === id) }))
    .filter(item => item.value <= (options.maxRatio || 0.94) || (item.event && item.event.type === 'bad'))
    .sort((a, b) => a.value - b.value);
  if (!candidates.length) return;
  const reserve = options.reserve || 0;
  const budget = Math.max(0, state.cash - reserve);
  const target = candidates[0].id;
  const quantity = Math.min(Math.floor(budget / state.prices[target]), api.capacity() - api.totalUnits());
  if (quantity > 0) {
    api.buy(target, quantity);
    stats.buyActions++;
  }
}

function buyUsefulCards(api, state, stats, allowedCards = null) {
  const priority = { suddenFall: 6, futureMarket: 5, addGood: 4, refreshPrice: 3, suddenRise: 2, iAmTheTrend: 1 };
  const entries = state.shopStock.slice().sort((a, b) => priority[b.cardId] - priority[a.cardId]);
  for (const entry of entries) {
    if (allowedCards && !allowedCards.has(entry.cardId)) continue;
    const maxCashShare = entry.cardId === 'iAmTheTrend' && allowedCards ? 0.65 : 0.22;
    if (entry.purchased || entry.price > state.cash * maxCashShare) continue;
    if (api.buyCard(entry.id)) {
      stats.cardSpend += entry.price;
      stats.cardsBought[entry.cardId] = (stats.cardsBought[entry.cardId] || 0) + 1;
    }
  }
}

function useCards(api, state, stats, prepareRise = false) {
  const use = (cardId, target = null) => {
    const before = api.netWorth();
    const result = api.useCard(cardId, target);
    if (!result.ok) return result;
    stats.cardsUsed[cardId] = (stats.cardsUsed[cardId] || 0) + 1;
    stats.cardImmediateWealthDelta += api.netWorth() - before;
    return result;
  };

  while ((state.cardInventory.suddenFall || 0) > 0 && state.cash > 0) {
    const result = use('suddenFall');
    if (!result.ok) break;
    const id = result.goodId;
    const quantity = Math.min(Math.floor(state.cash / state.prices[id]), api.capacity() - api.totalUnits());
    if (quantity > 0) { api.buy(id, quantity); stats.buyActions++; }
  }
  while ((state.cardInventory.suddenRise || 0) > 0) {
    const held = state.availableGoods.filter(id => (state.inventory[id] || 0) > 0);
    if (!held.length) break;
    const target = held.sort((a, b) => state.inventory[b] * state.prices[b] - state.inventory[a] * state.prices[a])[0];
    const result = use('suddenRise', target);
    if (!result.ok) break;
    if (prepareRise) {
      const id = result.goodId;
      const qty = state.inventory[id] || 0;
      if (qty > 0) {
        const average = state.costBasis[id] / qty;
        stats.realizedProfit += (state.prices[id] - average) * qty;
        api.sell(id, qty);
        stats.sellActions++;
      }
    }
  }
  while ((state.cardInventory.refreshPrice || 0) > 0) {
    const held = state.availableGoods.filter(id => (state.inventory[id] || 0) > 0).sort((a, b) => ratio(api, state, a) - ratio(api, state, b));
    if (!held.length || !use('refreshPrice', held[0]).ok) break;
  }
  while ((state.cardInventory.addGood || 0) > 0) {
    const target = api.GOODS.filter(item => !state.availableGoods.includes(item.id) && (item.tier !== 'ultra' || api.netWorth() >= 10000000)).sort((a, b) => a.base - b.base)[0];
    if (!target || !use('addGood', target.id).ok) break;
  }
  while ((state.cardInventory.futureMarket || 0) > 0) {
    const target = state.availableGoods.find(id => (state.inventory[id] || 0) > 0) || state.availableGoods[0];
    const result = use('futureMarket', target);
    if (!result.ok) break;
    stats.forecasts[result.category] = (stats.forecasts[result.category] || 0) + 1;
  }
  if ((state.cardInventory.iAmTheTrend || 0) > 0) use('iAmTheTrend');
}

function run(seed, strategy) {
  const { api } = createGame({ random: seededRandom(seed) });
  const state = api.reset();
  const stats = {
    seed, strategy, buyActions: 0, sellActions: 0, realizedProfit: 0,
    cardSpend: 0, cardImmediateWealthDelta: 0, cardsBought: {}, cardsUsed: {}, forecasts: {},
    eventDays: 0, rareEventDays: 0, ecoDays: 0, fullPositionDays: 0, trappedDays: 0,
    meaningfulDays: 0, peak: api.netWorth(), firstMillionDay: null, firstTenMillionDay: null,
    daysAfterTenMillion: 0, meaningfulDaysAfterTenMillion: 0, fullPositionDaysAfterTenMillion: 0, trappedDaysAfterTenMillion: 0,
    daily: []
  };

  while (state.day < api.CONFIG.DAYS_LIMIT && !state.gameOver) {
    const worthBeforeActions = api.netWorth();
    const actionsBefore = stats.buyActions + stats.sellActions + Object.values(stats.cardsUsed).reduce((a, b) => a + b, 0);
    if (strategy !== 'none') {
      sellAvailableHoldings(api, state, stats, strategy === 'allIn' ? 1.03 : 1.12);
      if (strategy === 'shop' || strategy === 'shopSelective' || strategy === 'shopTail') {
        const allowed = strategy === 'shopSelective'
          ? new Set(['suddenFall', 'refreshPrice', 'addGood', 'iAmTheTrend'])
          : strategy === 'shopTail'
            ? new Set(['suddenFall', 'suddenRise', 'refreshPrice', 'addGood', 'iAmTheTrend'])
            : null;
        buyUsefulCards(api, state, stats, allowed);
        useCards(api, state, stats, strategy === 'shopTail');
      }
      buyBestValue(api, state, stats, { maxRatio: strategy === 'allIn' ? 1.20 : 0.94, reserve: strategy.startsWith('shop') ? state.cash * 0.12 : 0 });
    }
    const held = Object.keys(state.inventory).filter(id => state.inventory[id] > 0);
    const isFull = api.totalUnits() >= api.capacity() * 0.95;
    const isTrapped = held.length && !held.some(id => state.availableGoods.includes(id));
    const acted = stats.buyActions + stats.sellActions + Object.values(stats.cardsUsed).reduce((a, b) => a + b, 0) > actionsBefore;
    if (isFull) stats.fullPositionDays++;
    if (isTrapped) stats.trappedDays++;
    if (acted) stats.meaningfulDays++;
    if (api.netWorth() >= 10000000) {
      stats.daysAfterTenMillion++;
      if (acted) stats.meaningfulDaysAfterTenMillion++;
      if (isFull) stats.fullPositionDaysAfterTenMillion++;
      if (isTrapped) stats.trappedDaysAfterTenMillion++;
    }

    api.nextDay();
    if (state.events.length) stats.eventDays++;
    if (state.events.some(event => event.isRare)) stats.rareEventDays++;
    if (state.eco) stats.ecoDays++;
    const worth = api.netWorth();
    stats.peak = Math.max(stats.peak, worth);
    if (!stats.firstMillionDay && worth >= 1000000) stats.firstMillionDay = state.day;
    if (!stats.firstTenMillionDay && worth >= 10000000) stats.firstTenMillionDay = state.day;
    stats.daily.push({ day: state.day, worth, delta: worth - worthBeforeActions, cash: state.cash, units: api.totalUnits(), events: state.events.length, eco: !!state.eco });
  }
  stats.finalWorth = api.netWorth();
  const positiveDeltas = stats.daily.map(day => day.delta).filter(delta => delta > 0).sort((a, b) => b - a);
  stats.largestGain = positiveDeltas[0] || 0;
  stats.topFiveGainShare = positiveDeltas.length ? positiveDeltas.slice(0, 5).reduce((a, b) => a + b, 0) / positiveDeltas.reduce((a, b) => a + b, 0) : 0;
  stats.inventoryValue = Object.keys(state.inventory).reduce((sum, id) => sum + state.inventory[id] * (state.availableGoods.includes(id) ? state.prices[id] : state.lastSeenPrice[id]), 0);
  return stats;
}

function aggregate(strategy, runs) {
  const results = Array.from({ length: runs }, (_, index) => run(1000 + index * 7919, strategy));
  return {
    strategy,
    runs,
    finalWorth: summarize(results.map(result => result.finalWorth)),
    peak: summarize(results.map(result => result.peak)),
    meaningfulDays: summarize(results.map(result => result.meaningfulDays)),
    fullPositionDays: summarize(results.map(result => result.fullPositionDays)),
    trappedDays: summarize(results.map(result => result.trappedDays)),
    postTenMillionActionRate: summarize(results.filter(result => result.daysAfterTenMillion).map(result => result.meaningfulDaysAfterTenMillion / result.daysAfterTenMillion)),
    postTenMillionFullRate: summarize(results.filter(result => result.daysAfterTenMillion).map(result => result.fullPositionDaysAfterTenMillion / result.daysAfterTenMillion)),
    postTenMillionTrappedRate: summarize(results.filter(result => result.daysAfterTenMillion).map(result => result.trappedDaysAfterTenMillion / result.daysAfterTenMillion)),
    topFiveGainShare: summarize(results.map(result => result.topFiveGainShare)),
    millionRate: results.filter(result => result.firstMillionDay).length / runs,
    tenMillionRate: results.filter(result => result.firstTenMillionDay).length / runs,
    billionRate: results.filter(result => result.finalWorth >= 1000000000).length / runs,
    tenBillionRate: results.filter(result => result.finalWorth >= 10000000000).length / runs,
    hundredBillionRate: results.filter(result => result.finalWorth >= 100000000000).length / runs,
    medianMillionDay: summarize(results.filter(result => result.firstMillionDay).map(result => result.firstMillionDay)).median,
    medianTenMillionDay: summarize(results.filter(result => result.firstTenMillionDay).map(result => result.firstTenMillionDay)).median,
    medianCardSpend: summarize(results.map(result => result.cardSpend)).median,
    medianCardDelta: summarize(results.map(result => result.cardImmediateWealthDelta)).median
  };
}

const runs = Math.max(1, Number(process.argv[2]) || 200);
const sample = run(20260901, 'shop');
const report = {
  sample,
  comparisons: ['none', 'allIn', 'disciplined', 'shop', 'shopSelective', 'shopTail'].map(strategy => aggregate(strategy, runs))
};
console.log(JSON.stringify(report, null, 2));
