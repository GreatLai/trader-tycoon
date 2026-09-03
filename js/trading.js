// ==================== 交易 ====================
function parseTradeQuantity(value) {
  const qty = Math.floor(Number(value));
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

function getPercentageTradeQuantity(side, id, percentage) {
  const percent = Number(percentage);
  if (!Number.isFinite(percent) || percent <= 0) return 0;

  let available = 0;
  if (side === 'buy') {
    const price = state.prices[id];
    if (!Number.isFinite(price) || price <= 0) return 0;
    const affordable = Math.floor(state.cash / price);
    const freeCapacity = Math.max(0, capacity() - totalUnits());
    available = Math.max(0, Math.min(affordable, freeCapacity));
  } else if (side === 'sell') {
    available = Math.max(0, Math.floor(state.inventory[id] || 0));
  } else {
    return 0;
  }

  if (available === 0) return 0;
  if (percent >= 100) return available;
  return Math.max(1, Math.floor(available * percent / 100));
}

function setTradeInputMode(mode) {
  if (!state || (mode !== 'quantity' && mode !== 'percentage')) return false;
  state.tradeInputMode = mode;
  save();
  render();
  return true;
}

function buy(id, qty) {
  if (state.gameOver) return;
  if (!state.availableGoods.includes(id)) return;
  if (!Number.isFinite(qty)) return;
  qty = Math.floor(qty);
  if (qty <= 0) return;
  const price = state.prices[id];
  const cost = +(price * qty).toFixed(2);
  if (cost > state.cash) { toast('现金不够'); return; }
  if (totalUnits() + qty > capacity()) { toast('仓库容量不足'); return; }
  state.cash = +(state.cash - cost).toFixed(2);
  state.inventory[id] = (state.inventory[id] || 0) + qty;
  state.costBasis[id] = (state.costBasis[id] || 0) + cost;
  state.goodsBoughtDay[id] = state.day;
  const memory = state.tradeMemories[id] || (state.tradeMemories[id] = {});
  if (state.events.some(event => event.goodId === id && event.type === 'bad')) memory.boughtDuringBadEvent = true;
  render();
  return { goodId: id, quantity: qty, unitPrice: price, cost };
}

function sell(id, qty) {
  if (state.gameOver) return;
  if (!state.availableGoods.includes(id)) return;
  if (isGoodSaleLocked(id)) { toast(`该商品被锁定，第${state.saleLockUntilDay[id]}天恢复出售`); return; }
  if (!Number.isFinite(qty)) return;
  qty = Math.min(Math.floor(qty), state.inventory[id] || 0);
  if (qty <= 0) return;
  const price = state.prices[id];
  const settlement = calculateSaleSettlement(id, qty, price);
  const ownedBefore = state.inventory[id];
  const avg = (state.costBasis[id] || 0) / ownedBefore;
  const allocatedCost = +(avg * qty).toFixed(2);
  const netWorthBefore = netWorth();
  state.cash = +(state.cash + settlement.net).toFixed(2);
  state.inventory[id] -= qty;
  state.costBasis[id] = +(state.costBasis[id] - allocatedCost).toFixed(2);
  if (state.inventory[id] <= 0) {
    delete state.inventory[id];
    delete state.costBasis[id];
  }
  const realizedProfit = +(settlement.net - allocatedCost).toFixed(2);
  const tradeResult = {
    goodId: id,
    quantity: qty,
    salePrice: price,
    revenue: settlement.net,
    allocatedCost,
    fees: settlement.fee,
    realizedProfit,
    returnRate: allocatedCost > 0 ? realizedProfit / allocatedCost : 0,
    averageCost: avg,
    netWorthBefore,
    netWorthAfter: netWorth()
  };
  state.lastTradeFeedback = { ...tradeResult, day: state.day };
  evaluateTradeAchievements(tradeResult);
  if (realizedProfit > 0) state.achievementRecovery.hasProfitableSale = true;
  evaluateRunAchievements();
  if (!state.inventory[id]) delete state.tradeMemories[id];
  render();
  return tradeResult;
}

