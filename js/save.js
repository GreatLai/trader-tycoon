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
  return saved.cash + inventoryValue;
}

function normalizeSave(saved) {
  if (!saved || typeof saved !== 'object') return null;

  saved.events = Array.isArray(saved.events) ? saved.events : [];
  saved.dailyHistory = Array.isArray(saved.dailyHistory) ? saved.dailyHistory : [];
  saved.logs = Array.isArray(saved.logs) ? saved.logs : [];
  saved.inventory = saved.inventory || {};
  saved.costBasis = saved.costBasis || {};
  saved.goodsBoughtDay = saved.goodsBoughtDay && typeof saved.goodsBoughtDay === 'object' ? saved.goodsBoughtDay : {};
  saved.saleLockUntilDay = saved.saleLockUntilDay && typeof saved.saleLockUntilDay === 'object' ? saved.saleLockUntilDay : {};
  saved.priceHistory = saved.priceHistory || {};
  saved.tradeInputMode = saved.tradeInputMode === 'percentage' ? 'percentage' : 'quantity';
  const professionId = normalizeProfessionId(saved.profession && saved.profession.id);
  saved.profession = {
    id: professionId,
    activeUsedDay: Number.isFinite(saved.profession && saved.profession.activeUsedDay) ? saved.profession.activeUsedDay : null,
    data: saved.profession && saved.profession.data && typeof saved.profession.data === 'object' ? saved.profession.data : {}
  };
  saved.runStats = saved.runStats && typeof saved.runStats === 'object' ? saved.runStats : {};
  saved.runStats.maxDayReached = Math.max(saved.day || 1, Number(saved.runStats.maxDayReached) || 1);
  saved.runStats.peakNetWorth = Math.max(saved.peakNetWorth || CONFIG.START_CASH, Number(saved.runStats.peakNetWorth) || CONFIG.START_CASH);
  saved.runStats.forcedLiquidations = Math.max(0, Math.floor(Number(saved.runStats.forcedLiquidations) || 0));
  saved.runStats.totalFeesPaid = Math.max(0, Number(saved.runStats.totalFeesPaid) || 0);
  saved.resultRecorded = saved.resultRecorded === true;

  GOODS.forEach(g => {
    if (!Array.isArray(saved.priceHistory[g.id])) {
      saved.priceHistory[g.id] = [{ day: saved.day || 1, price: saved.prices[g.id] }];
    }
  });

  const wealth = savedNetWorth(saved);
  const unlockWealth = Math.max(wealth, saved.peakNetWorth || 0);
  const hasLockedMarketGood = saved.availableGoods.some(id => {
    const good = goodById(id);
    return good && good.tier === 'ultra' && unlockWealth < ULTRA_UNLOCK;
  });
  if (hasLockedMarketGood) {
    saved.availableGoods = pickGoods(CONFIG.MARKET_SIZE, unlockWealth, saved.eco);
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

