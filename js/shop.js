// ==================== 商店 ====================
function shopAnchor() {
  const peak = Math.max(CONFIG.START_CASH, state.peakNetWorth || 0);
  return peak < 10000 ? CONFIG.START_CASH : 10 ** Math.floor(Math.log10(peak));
}

function shopPriceFor(cardId) {
  const card = SHOP_CONFIG.CARDS[cardId];
  const min = SHOP_CONFIG.PRICE_VARIATION[0];
  const max = SHOP_CONFIG.PRICE_VARIATION[1];
  return Math.max(1, Math.round(card.priceRate * shopAnchor() * (min + Math.random() * (max - min))));
}

function cardUnlocked(cardId) {
  const card = SHOP_CONFIG.CARDS[cardId];
  return !!card && (!card.unlock || netWorth() >= card.unlock);
}

function generateShopStock() {
  const ids = Object.keys(SHOP_CONFIG.CARDS).filter(cardUnlocked);
  const totalWeight = ids.reduce((sum, id) => sum + SHOP_CONFIG.CARDS[id].weight, 0);
  state.shopStock = Array.from({ length: SHOP_CONFIG.STOCK_SIZE }, (_, index) => {
    let roll = Math.random() * totalWeight;
    let cardId = ids[ids.length - 1];
    for (const id of ids) {
      roll -= SHOP_CONFIG.CARDS[id].weight;
      if (roll <= 0) { cardId = id; break; }
    }
    return { id: `shop-${state.day}-${index}-${Math.random().toString(36).slice(2, 6)}`, cardId, price: shopPriceFor(cardId), purchased: false };
  });
  state.shopRefreshDay = state.day;
}

function refreshShopIfNeeded() {
  if (!state.shopStock.length || state.day - state.shopRefreshDay >= SHOP_CONFIG.REFRESH_INTERVAL) generateShopStock();
}

function buyCard(entryId) {
  const entry = state.shopStock.find(item => item.id === entryId);
  if (!entry || entry.purchased || !cardUnlocked(entry.cardId) || state.cash < entry.price) return false;
  state.cash = +(state.cash - entry.price).toFixed(2);
  entry.purchased = true;
  state.cardInventory[entry.cardId] = (state.cardInventory[entry.cardId] || 0) + 1;
  save(); render();
  return true;
}

function shopCountdownText() {
  return `下次 ${Math.max(0, state.shopRefreshDay + SHOP_CONFIG.REFRESH_INTERVAL - state.day)} 天`;
}

function renderShop() {
  $('shopCountdown').textContent = shopCountdownText();
  $('shopStock').innerHTML = state.shopStock.filter(entry => cardUnlocked(entry.cardId)).map(entry => {
    const card = SHOP_CONFIG.CARDS[entry.cardId];
    const disabled = entry.purchased || state.cash < entry.price ? 'disabled' : '';
    const rarity = card.rarity ? `<span class="card-rarity">${card.rarity}</span>` : '';
    return `<div class="shop-entry ${card.rarity ? 'shop-entry-legendary' : ''}"><div class="shop-entry-copy"><div class="shop-name">${card.name}${rarity}</div><div class="shop-desc">${card.desc}</div></div><div class="shop-entry-action"><span class="shop-price">¥${fmt(entry.price, 0)}</span><button class="btn btn-small" data-shop-buy="${entry.id}" ${disabled}>${entry.purchased ? '已购买' : '购买'}</button></div></div>`;
  }).join('');
  const owned = Object.keys(SHOP_CONFIG.CARDS).filter(id => (state.cardInventory[id] || 0) > 0).map(id => `<div class="shop-owned"><span>${SHOP_CONFIG.CARDS[id].name} ×${state.cardInventory[id]}</span><button class="btn btn-small btn-ghost" data-shop-use="${id}" ${cardUnlocked(id) ? '' : 'disabled'}>使用</button></div>`).join('');
  $('cardInventory').innerHTML = owned ? `<div class="shop-inventory-title">持有卡牌</div><div class="shop-inventory-list">${owned}</div>` : '';
}

function queueNotice(title, desc, source = 'card') {
  state.eventNoticeQueue.push({ title, desc, source });
}

function applyCardEvent(id, positive) {
  const good = goodById(id);
  const event = makeEvent(id, positive);
  const oldPrice = state.prices[id];
  state.prices[id] = +(oldPrice * event.targetMult).toFixed(2);
  state.prevPrices[id] = oldPrice;
  state.factors[id] = state.prices[id] / good.base;
  event.desc = `${event.desc} 当前价 ¥${fmt(state.prices[id], 2)}`;
  event.source = 'card';
  state.events.push(event);
  state.logs.unshift(`第${state.day}天：${event.title} ${event.desc}`);
  recordCurrentPrice(id);
  queueNotice(event.title, event.desc);
  return event;
}

function refreshSingleGood(id) {
  return refreshMarketGood(id, {
    eventChance: SHOP_CONFIG.SUDDEN_EVENT_CHANCE,
    source: 'card'
  });
}

function eligibleTargetsFor(cardId) {
  if (cardId === 'addGood') return GOODS.filter(g => !state.availableGoods.includes(g.id) && (g.tier !== 'ultra' || ultraGoodsUnlocked())).map(g => g.id);
  if (cardId === 'refreshPrice' || cardId === 'suddenRise') return state.availableGoods.slice();
  if (cardId === 'futureMarket') return GOODS.filter(g => state.lastSeenPrice[g.id] != null).map(g => g.id);
  return [];
}

function forecastCategory(before, after) {
  const diff = (after - before) / before * 100;
  return diff <= -15 ? '大跌' : diff <= -5 ? '小跌' : diff <= 5 ? '平稳' : diff <= 15 ? '小涨' : '大涨';
}

function forecastCategories(goodId) {
  const before = state.prices[goodId];
  const realState = state;
  const clone = JSON.parse(JSON.stringify(state));
  const oldRandom = Math.random;
  try {
    state = clone;
    Math.random = mulberry32(clone.nextDaySeed);
    resolveNextDayState();
  } finally {
    Math.random = oldRandom;
    state = realState;
  }
  return forecastCategory(before, clone.prices[goodId]);
}

function consumeCard(cardId) { state.cardInventory[cardId]--; }

function useFateToken() {
  if (!cardUnlocked('fateToken')) return { ok: false, message: '总资产达到 ¥10,000 后才能使用' };
  const before = netWorth();
  const win = Math.random() < 0.40;
  if (win) {
    state.cash = +(state.cash + before * 9).toFixed(2);
    state.peakNetWorth = Math.max(state.peakNetWorth || 0, netWorth());
  } else {
    state.cash = +(state.cash / 10).toFixed(2);
    Object.keys(state.inventory).forEach(id => {
      const oldQuantity = state.inventory[id] || 0;
      const newQuantity = Math.floor(oldQuantity / 10);
      if (newQuantity <= 0) {
        delete state.inventory[id];
        delete state.costBasis[id];
        return;
      }
      const averageCost = (state.costBasis[id] || 0) / oldQuantity;
      state.inventory[id] = newQuantity;
      state.costBasis[id] = +(averageCost * newQuantity).toFixed(2);
    });
  }
  consumeCard('fateToken');
  const title = win ? '金筹大吉：身家进一位' : '金筹大凶：身家退一位';
  const message = win ? `命数翻转，总资产从 ¥${fmt(before, 2)} 跃升至 ¥${fmt(netWorth(), 2)}。` : `命数反噬，现金与所有持仓均缩减至十分之一。`;
  state.logs.unshift(`${title}。${message}`);
  queueNotice(title, message, 'fateToken');
  return { ok: true, outcome: win ? 'win' : 'loss', message: title };
}

function useCard(cardId, targetId = null) {
  if (!SHOP_CONFIG.CARDS[cardId] || (state.cardInventory[cardId] || 0) <= 0) return { ok: false, message: '没有这张卡牌' };
  if (cardId === 'fateToken') return useFateToken();
  if (cardId === 'iAmTheTrend') {
    if (state.eco || state.scheduledEco) return { ok: false, message: '当前已有生态事件' };
    if (state.day > 82) return { ok: false, message: '剩余时间不足以触发生态事件' };
    const keys = Object.keys(ECO_EVENTS).filter(id => !ECO_EVENTS[id].unlock || netWorth() >= ECO_EVENTS[id].unlock);
    if (!keys.length) return { ok: false, message: '当前没有可用生态事件' };
    state.scheduledEco = keys[Math.floor(Math.random() * keys.length)];
    state.scheduledEcoByCard = true;
    consumeCard(cardId);
    return { ok: true, message: `已安排：${ECO_EVENTS[state.scheduledEco].name}` };
  }
  if (cardId === 'suddenFall') {
    if (!state.availableGoods.length) return { ok: false, message: '当前没有已上架商品' };
    const goodId = state.availableGoods[Math.floor(Math.random() * state.availableGoods.length)];
    const event = applyCardEvent(goodId, false);
    consumeCard(cardId);
    return { ok: true, goodId, message: event.title };
  }
  const targets = eligibleTargetsFor(cardId);
  if (!targetId || !targets.includes(targetId)) return { ok: false, message: '请选择有效商品' };
  if (cardId === 'addGood') { state.availableGoods.push(targetId); refreshSingleGood(targetId); }
  else if (cardId === 'refreshPrice') refreshSingleGood(targetId);
  else if (cardId === 'suddenRise') {
    const event = applyCardEvent(targetId, true);
    consumeCard(cardId);
    return { ok: true, goodId: targetId, message: event.title };
  }
  else if (cardId === 'futureMarket') {
    const category = forecastCategories(targetId);
    consumeCard(cardId);
    return { ok: true, goodId: targetId, category, message: `${goodById(targetId).name} 明日预计：${category}` };
  }
  consumeCard(cardId);
  return { ok: true, goodId: targetId };
}

let cardUseId = null;
let cardTarget = null;

function openCardUse(cardId) {
  if ((state.cardInventory[cardId] || 0) <= 0) return;
  cardUseId = cardId; cardTarget = null; renderCardUse();
  $('cardOverlay').classList.remove('hidden');
}

function renderCardUse() {
  const card = SHOP_CONFIG.CARDS[cardUseId];
  $('cardModalTitle').textContent = `使用卡牌：${card.name}`;
  $('cardModalInfo').textContent = card.desc;
  const needsTarget = !['suddenFall', 'iAmTheTrend', 'fateToken'].includes(cardUseId);
  const targets = needsTarget ? eligibleTargetsFor(cardUseId) : [];
  $('cardTargets').innerHTML = needsTarget ? (targets.length ? targets.map(id => `<button class="btn btn-small btn-ghost ${cardTarget === id ? 'btn-secondary' : ''}" data-card-target="${id}">${goodById(id).name}</button>`).join('') : '<div class="card-empty">当前没有可用目标。</div>') : '<div class="card-random-note">无需选择目标，确认后立即生效。</div>';
  $('cardUseConfirmBtn').style.display = (!needsTarget || cardTarget) ? 'block' : 'none';
}

function useCardConfirm() {
  const result = useCard(cardUseId, cardTarget);
  if (!result.ok) { toast(result.message); return; }
  toast(result.message || '卡牌已使用');
  save(); render(); closeCardUse();
}

function closeCardUse() {
  $('cardOverlay').classList.add('hidden');
  cardUseId = null; cardTarget = null;
}
