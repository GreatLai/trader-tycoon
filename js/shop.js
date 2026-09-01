// ==================== 商店 ====================
function shopAnchor() {
  const peak = state.peakNetWorth || state.cash;
  if (peak < 10000) return 5000;
  return 10 ** Math.floor(Math.log10(peak));
}

function shopPriceFor(cardId) {
  const card = SHOP_CONFIG.CARDS[cardId];
  const base = card.priceRate * shopAnchor();
  const variance = SHOP_CONFIG.PRICE_VARIATION[0] + Math.random() * (SHOP_CONFIG.PRICE_VARIATION[1] - SHOP_CONFIG.PRICE_VARIATION[0]);
  return Math.max(1, Math.round(base * variance));
}

function generateShopStock() {
  const entries = [];
  const ids = Object.keys(SHOP_CONFIG.CARDS);
  const totalWeight = ids.reduce((s, id) => s + SHOP_CONFIG.CARDS[id].weight, 0);
  for (let i = 0; i < SHOP_CONFIG.STOCK_SIZE; i++) {
    let roll = Math.random() * totalWeight;
    let chosen = ids[ids.length - 1];
    for (const id of ids) {
      roll -= SHOP_CONFIG.CARDS[id].weight;
      if (roll <= 0) { chosen = id; break; }
    }
    entries.push({ id: 'shop-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 6), cardId: chosen, price: shopPriceFor(chosen), purchased: false });
  }
  state.shopStock = entries;
  state.shopRefreshDay = state.day;
}

function refreshShopIfNeeded() {
  if (!state.shopStock.length || state.day - state.shopRefreshDay >= SHOP_CONFIG.REFRESH_INTERVAL) {
    generateShopStock();
  }
}

function buyCard(entryId) {
  const entry = state.shopStock.find(e => e.id === entryId);
  if (!entry || entry.purchased) return false;
  if (state.cash < entry.price) return false;
  state.cash = +(state.cash - entry.price).toFixed(2);
  entry.purchased = true;
  state.cardInventory[entry.cardId] = (state.cardInventory[entry.cardId] || 0) + 1;
  if ((state.peakNetWorth || 0) < netWorth()) state.peakNetWorth = netWorth();
  save();
  render();
  return true;
}

function shopCountdownText() {
  const next = state.shopRefreshDay + SHOP_CONFIG.REFRESH_INTERVAL;
  return `下次 ${Math.max(0, next - state.day)} 天`;
}

function renderShop() {
  const stockHtml = state.shopStock.map(entry => {
    const card = SHOP_CONFIG.CARDS[entry.cardId];
    const disabled = entry.purchased || state.cash < entry.price ? 'disabled' : '';
    return `<div class="shop-entry">
      <div class="shop-name">${card.name}</div>
      <div class="shop-desc">${card.desc}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
        <span class="shop-price">¥${fmt(entry.price, 0)}</span>
        <button class="btn btn-small" data-shop-buy="${entry.id}" ${disabled}>${entry.purchased ? '已购买' : '购买'}</button>
      </div>
    </div>`;
  }).join('');
  $('shopCountdown').textContent = shopCountdownText();
  $('shopStock').innerHTML = stockHtml;
  const owned = Object.keys(state.cardInventory).filter(k => state.cardInventory[k] > 0).map(k => `<span class="shop-owned">${SHOP_CONFIG.CARDS[k].name} ×${state.cardInventory[k]} <button class="btn btn-small btn-ghost" data-shop-use="${k}">使用</button></span>`).join(' ');
  $('cardInventory').innerHTML = owned ? `<div style="margin-top:10px;font-size:12px;color:var(--muted);">持有卡牌：${owned}</div>` : '';
}

let cardUseId = null;
let cardTarget = null;

function queueNotice(title, desc, source) {
  if (!state.eventNoticeQueue) state.eventNoticeQueue = [];
  state.eventNoticeQueue.push({ title, desc, source });
}

function refreshSingleGood(id) {
  const g = goodById(id);
  const old = state.prices[id];
  let logF = state.factors[id] ? Math.log(state.factors[id]) : 0;
  logF += -logF * 0.18;
  logF += randn() * g.vol;
  logF = Math.max(Math.log(0.8), Math.min(Math.log(1.2), logF));
  const newPrice = +(g.base * Math.exp(logF)).toFixed(2);
  state.prices[id] = newPrice;
  state.prevPrices[id] = old;
  state.factors[id] = newPrice / g.base;
  const hist = state.priceHistory[id];
  if (hist.length && hist[hist.length - 1].day === state.day) hist[hist.length - 1].price = newPrice;
  else hist.push({ day: state.day, price: newPrice });
}

function cardEventMultiplier(g, positive, rare) {
  if (rare) {
    return positive ? (g.tier === 'ultra' ? 15 + Math.random() * 10 : 8 + Math.random() * 8) : (g.tier === 'ultra' ? 0.03 + Math.random() * 0.07 : 0.05 + Math.random() * 0.15);
  }
  if (positive) {
    if (g.tier === 'low') return 2.5 + Math.random() * 1.5;
    if (g.tier === 'mid') return 2 + Math.random();
    if (g.tier === 'high') return 1.5 + Math.random() * 0.5;
    return 3 + Math.random() * 3;
  }
  if (g.tier === 'low') return 0.20 + Math.random() * 0.20;
  if (g.tier === 'mid') return 0.30 + Math.random() * 0.20;
  if (g.tier === 'high') return 0.40 + Math.random() * 0.20;
  return 0.30 + Math.random() * 0.30;
}

function applyCardEvent(id, positive) {
  const g = goodById(id);
  const startPrice = state.prices[id];
  const rare = Math.random() < SHOP_CONFIG.RARE_EVENT_CHANCE;
  const mult = cardEventMultiplier(g, positive, rare);
  const newPrice = +(startPrice * mult).toFixed(2);
  state.prices[id] = newPrice;
  state.prevPrices[id] = startPrice;
  state.factors[id] = newPrice / g.base;
  const hist = state.priceHistory[id];
  if (hist.length && hist[hist.length - 1].day === state.day) hist[hist.length - 1].price = newPrice;
  else hist.push({ day: state.day, price: newPrice });
  state.events.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,5), goodId: id, title: (positive ? '📈 ' : '📉 ') + (rare ? (positive ? '超级风口' : '黑天鹅') : (positive ? '突发利好' : '突发利空')), desc: `${g.name} 当前价 ¥${fmt(newPrice, 2)}`, type: positive ? 'good' : 'bad', isRare: rare, source: 'card' });
  state.popupShown = false;
  save();
  render();
}

function eligibleTargetsFor(cardId) {
  if (cardId === 'addGood') {
    return GOODS.filter(g => !state.availableGoods.includes(g.id) && (g.tier !== 'ultra' || netWorth() >= ULTRA_UNLOCK)).map(g => g.id);
  }
  if (cardId === 'refreshPrice' || cardId === 'suddenRise' || cardId === 'suddenFall') {
    return state.availableGoods.slice();
  }
  if (cardId === 'futureMarket') {
    return GOODS.filter(g => state.lastSeenPrice[g.id] != null).map(g => g.id);
  }
  if (cardId === 'iAmTheTrend') {
    return []; // no target needed
  }
  return [];
}

function openCardUse(cardId) {
  if ((state.cardInventory[cardId] || 0) <= 0) return;
  cardUseId = cardId;
  cardTarget = null;
  renderCardUse();
  $('cardOverlay').classList.remove('hidden');
}

function renderCardUse() {
  const card = SHOP_CONFIG.CARDS[cardUseId];
  $('cardModalTitle').textContent = '使用卡牌：' + card.name;
  $('cardModalInfo').textContent = card.desc;
  $('cardUseConfirmBtn').style.display = 'none';
  const targets = eligibleTargetsFor(cardUseId);
  if (cardUseId === 'iAmTheTrend') {
    $('cardTargets').innerHTML = '<div style="color:var(--muted);">无需选择目标，直接安排生态事件。</div>';
    $('cardUseConfirmBtn').style.display = 'block';
    return;
  }
  if (!targets.length) {
    $('cardTargets').innerHTML = '<div style="color:var(--red);">当前没有可用目标。</div>';
    return;
  }
  $('cardTargets').innerHTML = targets.map(id => `<button class="btn btn-small btn-ghost ${cardTarget === id ? 'btn-secondary' : ''}" data-card-target="${id}">${goodById(id).name}</button>`).join('');
}

function hashString2(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededCategory(id) {
  if (!state.nextDaySeed) state.nextDaySeed = Math.floor(Math.random() * 1e9);
  const v = (state.nextDaySeed ^ hashString2(id)) % 5;
  return ['大跌', '小跌', '平稳', '小涨', '大涨'][v];
}

function useCardConfirm() {
  if (!cardUseId) return;
  if ((state.cardInventory[cardUseId] || 0) <= 0) return;
  if (cardUseId === 'iAmTheTrend') {
    if (state.eco || state.scheduledEco) { toast('当前已有生态事件'); return; }
    const keys = Object.keys(ECO_EVENTS).filter(k => !ECO_EVENTS[k].unlock || netWorth() >= ECO_EVENTS[k].unlock);
    if (!keys.length) { toast('没有可安排的生态事件'); return; }
    state.scheduledEco = keys[Math.floor(Math.random() * keys.length)];
    state.cardInventory[cardUseId]--;
    toast('已安排：' + ECO_EVENTS[state.scheduledEco].name);
    save(); render(); closeCardUse();
    return;
  }
  if (!cardTarget) return;
  const id = cardTarget;
  if (cardUseId === 'addGood') {
    if (state.availableGoods.includes(id)) return;
    state.availableGoods.push(id);
    refreshSingleGood(id);
  } else if (cardUseId === 'refreshPrice') {
    refreshSingleGood(id);
  } else if (cardUseId === 'suddenRise') {
    applyCardEvent(id, true);
  } else if (cardUseId === 'suddenFall') {
    applyCardEvent(id, false);
  } else if (cardUseId === 'futureMarket') {
    toast(goodById(id).name + ' 明日预计：' + seededCategory(id));
    state.cardInventory[cardUseId]--;
    save(); render(); closeCardUse();
    return;
  }
  state.cardInventory[cardUseId]--;
  save();
  render();
  closeCardUse();
}

function closeCardUse() {
  $('cardOverlay').classList.add('hidden');
  cardUseId = null;
  cardTarget = null;
}
