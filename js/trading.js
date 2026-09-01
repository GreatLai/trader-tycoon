// ==================== 交易 ====================
function parseTradeQuantity(value) {
  const qty = Math.floor(Number(value));
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
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

function borrow(amount) {
  amount = Math.floor(amount);
  if (amount <= 0) return;
  const max = creditLimit() - state.loan;
  amount = Math.min(amount, max);
  if (amount <= 0) { toast('已达到借款上限'); return; }
  state.cash = +(state.cash + amount).toFixed(2);
  state.loan = +(state.loan + amount).toFixed(2);
  render();
}

function repay(amount) {
  amount = Math.floor(amount);
  if (amount <= 0) return;
  amount = Math.min(amount, state.loan, state.cash);
  if (amount <= 0) { toast('现金不足或没有贷款'); return; }
  state.cash = +(state.cash - amount).toFixed(2);
  state.loan = +(state.loan - amount).toFixed(2);
  render();
}

