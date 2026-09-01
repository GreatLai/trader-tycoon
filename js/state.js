// ==================== 游戏状态 ====================
let state = null;

function newState() {
  const prices = {};
  const factors = {};
  GOODS.forEach(g => {
    const initFactor = 0.85 + Math.random() * 0.3;
    factors[g.id] = initFactor;
    prices[g.id] = +(g.base * initFactor).toFixed(2);
  });
  const availableGoods = pickGoods(CONFIG.MARKET_SIZE, CONFIG.START_CASH, null);
  const lastSeenPrice = {};
  const prevSeenPrice = {};
  GOODS.forEach(g => {
    lastSeenPrice[g.id] = null;
    prevSeenPrice[g.id] = null;
  });
  availableGoods.forEach(id => {
    lastSeenPrice[id] = prices[id];
  });
  const priceHistory = {};
  GOODS.forEach(g => {
    priceHistory[g.id] = [{ day: 1, price: prices[g.id] }];
  });
  return {
    saveVersion: APP_VERSION,
    day: 1,
    cash: CONFIG.START_CASH,
    capacityLevel: 0,
    prices,
    prevPrices: { ...prices },
    factors,
    lastSeenPrice,
    prevSeenPrice,
    inventory: {},
    costBasis: {},
    events: [],
    popupShown: true,
    eco: null,
    ecoPopup: null,
    ecoPopupShown: true,
    dailyHistory: [],
    priceHistory,
    chartGood: GOODS[0].id,
    highestMilestone: -1,
    availableGoods,
    shopStock: [],
    shopRefreshDay: 1,
    cardInventory: {},
    peakNetWorth: CONFIG.START_CASH,
    scheduledEco: null,
    scheduledEcoByCard: false,
    nextDaySeed: Math.floor(Math.random() * 1e9),
    eventNoticeQueue: [],
    logs: [],
    gameOver: null
  };
}

function totalUnits() {
  return Object.values(state.inventory).reduce((a, b) => a + b, 0);
}

function capacity() {
  const idx = (state.highestMilestone == null || state.highestMilestone < 0) ? 0 : Math.min(state.highestMilestone + 1, WAREHOUSE_CAPACITY_BY_MILESTONE.length - 1);
  return WAREHOUSE_CAPACITY_BY_MILESTONE[idx];
}

// 玩家当前“知道”的价格：今天上架用实时价，没上架用上次出现价
function knownPrice(id) {
  if (state.availableGoods.includes(id)) return state.prices[id];
  if (state.lastSeenPrice[id] != null) return state.lastSeenPrice[id];
  return state.prices[id];
}

function netWorth() {
  let invValue = 0;
  for (const id of Object.keys(state.inventory)) {
    invValue += state.inventory[id] * knownPrice(id);
  }
  return state.cash + invValue;
}

function totalInventoryValue() {
  return Object.keys(state.inventory).reduce((sum, id) => sum + state.inventory[id] * knownPrice(id), 0);
}

