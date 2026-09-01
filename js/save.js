// ==================== 存档 ====================
function save() {
  try {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function savedNetWorth(saved) {
  const inventoryValue = Object.keys(saved.inventory).reduce((sum, id) => {
    const price = saved.availableGoods.includes(id)
      ? saved.prices[id]
      : (saved.lastSeenPrice[id] == null ? saved.prices[id] : saved.lastSeenPrice[id]);
    return sum + saved.inventory[id] * price;
  }, 0);
  return saved.cash - saved.loan + inventoryValue;
}

function normalizeSave(saved) {
  if (!saved || typeof saved !== 'object') return null;

  saved.events = Array.isArray(saved.events) ? saved.events : [];
  saved.dailyHistory = Array.isArray(saved.dailyHistory) ? saved.dailyHistory : [];
  saved.logs = Array.isArray(saved.logs) ? saved.logs : [];
  saved.inventory = saved.inventory || {};
  saved.costBasis = saved.costBasis || {};
  saved.priceHistory = saved.priceHistory || {};

  GOODS.forEach(g => {
    if (!Array.isArray(saved.priceHistory[g.id])) {
      saved.priceHistory[g.id] = [{ day: saved.day || 1, price: saved.prices[g.id] }];
    }
  });

  // v1.3 used a longer ecological-event timeline and stored startPrices.
  // Map the completed branch depth onto v1.4's four-day timeline.
  if (saved.eco && Object.prototype.hasOwnProperty.call(saved.eco, 'startPrices')) {
    delete saved.eco.startPrices;
    if (saved.eco.C != null) saved.eco.startDay = saved.day - 3;
    else if (saved.eco.B != null) saved.eco.startDay = saved.day - 2;
    else if (saved.eco.A != null) saved.eco.startDay = saved.day - 1;
    else saved.eco.startDay = saved.day;
  }

  const wealth = savedNetWorth(saved);
  const hasLockedMarketGood = saved.availableGoods.some(id => {
    const good = goodById(id);
    return good && good.tier === 'ultra' && wealth < ULTRA_UNLOCK;
  });
  if (hasLockedMarketGood) {
    saved.availableGoods = pickGoods(CONFIG.MARKET_SIZE, wealth, saved.eco);
  }

  if (saved.day > CONFIG.DAYS_LIMIT) {
    saved.day = CONFIG.DAYS_LIMIT;
    saved.gameOver = 'time';
  }
  saved.saveVersion = APP_VERSION;
  return saved;
}

function load() {
  try {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    return raw ? normalizeSave(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
}

function clearSave() {
  try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch (e) {}
}

