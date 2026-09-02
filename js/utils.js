// ==================== 工具函数 ====================
const $ = id => document.getElementById(id);

function fmt(n, digits = 0) {
  return Number(n).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function mulberry32(a) {
  return function() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randn(rng) {
  const r = rng || Math.random;
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function shuffle(arr, rng) {
  const a = arr.slice();
  const r = rng || Math.random;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedSample(items, count, weightFor, rng = Math.random) {
  const pool = items.slice();
  const picked = [];
  while (pool.length && picked.length < count) {
    const weights = pool.map(item => Math.max(0, Number(weightFor(item)) || 0));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let index = 0;
    if (total > 0) {
      let roll = rng() * total;
      for (; index < pool.length - 1; index++) {
        roll -= weights[index];
        if (roll <= 0) break;
      }
    } else index = Math.floor(rng() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function pickGoods(count, currentNetWorth = null, activeEco = undefined) {
  const wealth = currentNetWorth == null
    ? (state ? Math.max(netWorth(), state.peakNetWorth || 0) : CONFIG.START_CASH)
    : currentNetWorth;
  const eco = activeEco === undefined ? (state ? state.eco : null) : activeEco;
  const unlocked = GOODS.filter(g => {
    if (g.tier === 'ultra' && wealth < ULTRA_UNLOCK) return false;
    return true;
  });
  if (eco) {
    const affectedIds = ECO_EVENTS[eco.treeId].goods.filter(id => unlocked.some(g => g.id === id));
    const rest = unlocked.filter(g => !affectedIds.includes(g.id));
    return affectedIds.concat(weightedSample(rest, Math.max(0, count - affectedIds.length), g => g.market.listingWeight).map(g => g.id));
  }
  return weightedSample(unlocked, count, g => g.market.listingWeight).map(g => g.id);
}

function ultraGoodsUnlocked() {
  return !!state && Math.max(netWorth(), state.peakNetWorth || 0) >= ULTRA_UNLOCK;
}

function goodById(id) {
  return GOODS.find(g => g.id === id);
}

function activeEventFor(goodId) {
  return state.events.find(e => e.goodId === goodId);
}
