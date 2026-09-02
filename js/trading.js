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
  render();
}

function sell(id, qty) {
  if (state.gameOver) return;
  if (!state.availableGoods.includes(id)) return;
  if (!Number.isFinite(qty)) return;
  qty = Math.min(Math.floor(qty), state.inventory[id] || 0);
  if (qty <= 0) return;
  const price = state.prices[id];
  const proceeds = +(price * qty).toFixed(2);
  const avg = (state.costBasis[id] || 0) / state.inventory[id];
  state.cash = +(state.cash + proceeds).toFixed(2);
  state.inventory[id] -= qty;
  state.costBasis[id] = +(state.costBasis[id] - avg * qty).toFixed(2);
  if (state.inventory[id] <= 0) {
    delete state.inventory[id];
    delete state.costBasis[id];
  }
  render();
}

