const ACHIEVEMENTS = Object.freeze({
  crisisGold: { title: '危机淘金', priority: 100 },
  escapeTrap: { title: '成功解套', priority: 95 },
  toothProfit: { title: '一抬成金', priority: 90 },
  travelProfit: { title: '赶集得利', priority: 90 },
  speculatorProfit: { title: '借势而起', priority: 90 },
  riseAgain: { title: '东山再起', priority: 85 },
  windfall: { title: '一本万利', priority: 80 },
  comeback: { title: '一笔翻身', priority: 75 },
  buyLowSellHigh: { title: '低吸高抛', priority: 70 },
  firstProfit: { title: '第一桶金', priority: 10 }
});

function achievementCompleted(id) {
  return state.runAchievements.includes(id) || state.achievementQueue.some(item => item.id === id);
}

function queueAchievement(id, trade, description) {
  if (!ACHIEVEMENTS[id] || achievementCompleted(id)) return null;
  const item = {
    id,
    title: ACHIEVEMENTS[id].title,
    description,
    day: state.day,
    goodId: trade && trade.goodId || null,
    realizedProfit: trade && trade.realizedProfit || 0,
    returnRate: trade && trade.returnRate || 0,
    netWorthBefore: trade && trade.netWorthBefore || 0,
    netWorthAfter: trade && trade.netWorthAfter || 0
  };
  state.achievementQueue.push(item);
  return item;
}

function evaluateTradeAchievements(trade) {
  if (!trade || trade.realizedProfit < 0) return null;
  const memory = state.tradeMemories[trade.goodId] || {};
  const good = goodById(trade.goodId);
  const candidates = [];
  const add = (id, condition, description) => {
    if (condition && !achievementCompleted(id)) candidates.push({ id, description, priority: ACHIEVEMENTS[id].priority });
  };

  const profitable = trade.realizedProfit > 0;
  add('crisisGold', profitable && memory.boughtDuringBadEvent && trade.returnRate >= 0.5, `你在突发利空时买入${good.name}，并在行情恢复后成功卖出。`);
  add('escapeTrap', memory.wasDeepUnderwater, `${good.name}一度深度套牢，最终被你保本解套。`);
  add('toothProfit', profitable && memory.toothRaised, `你成功抬高${good.name}行情，并把机会兑现成利润。`);
  add('travelProfit', profitable && memory.marketTrip, `你为${good.name}重新找到市场，并在赶集中赚到利润。`);
  add('speculatorProfit', profitable && memory.speculatorFollowUp, `你借${good.name}的后续风声完成了一笔盈利交易。`);
  add('windfall', profitable && trade.returnRate >= 1, `${good.name}单笔收益率突破 100%。`);
  add('comeback', profitable && trade.realizedProfit >= trade.netWorthBefore * 0.2, `这一笔${good.name}交易让总资产明显跃升。`);
  add('buyLowSellHigh', profitable && trade.averageCost <= good.base * 0.8 && trade.salePrice >= good.base * 1.2, `你在锚定价下方收下${good.name}，又在高位兑现。`);
  add('firstProfit', profitable && !state.achievementRecovery.hasProfitableSale, `你完成了本局第一笔盈利卖出：${good.name}。`);

  candidates.sort((a, b) => b.priority - a.priority);
  const winner = candidates[0];
  return winner ? queueAchievement(winner.id, trade, winner.description) : null;
}

function updateTradeMemories() {
  Object.keys(state.inventory).forEach(id => {
    const quantity = state.inventory[id] || 0;
    if (!quantity) return;
    const averageCost = (state.costBasis[id] || 0) / quantity;
    const memory = state.tradeMemories[id] || (state.tradeMemories[id] = {});
    if (averageCost > 0 && state.prices[id] <= averageCost * 0.6) memory.wasDeepUnderwater = true;
  });
}

function evaluateRunAchievements() {
  const wealth = netWorth();
  const tracker = state.achievementRecovery;
  if (!tracker.drawdownPeak) tracker.drawdownPeak = Math.max(state.peakNetWorth || wealth, wealth);
  if (wealth <= tracker.drawdownPeak * 0.5) tracker.armed = true;
  if (tracker.armed && wealth > tracker.drawdownPeak && !achievementCompleted('riseAgain')) {
    tracker.armed = false;
    return queueAchievement('riseAgain', { netWorthBefore: tracker.drawdownPeak, netWorthAfter: wealth }, '总资产曾从高点腰斩，而你重新超过了旧高点。');
  }
  if (!tracker.armed) tracker.drawdownPeak = Math.max(tracker.drawdownPeak, wealth);
  return null;
}

function completeCurrentAchievement() {
  const item = state.achievementQueue.shift();
  if (item && !state.runAchievements.includes(item.id)) state.runAchievements.push(item.id);
  return item;
}
