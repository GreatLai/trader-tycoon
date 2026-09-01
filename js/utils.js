// ==================== 工具函数 ====================
const $ = id => document.getElementById(id);

function fmt(n, digits = 0) {
  return Number(n).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function randn() {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickGoods(count, currentNetWorth = null, activeEco = undefined) {
  const wealth = currentNetWorth == null
    ? (state ? netWorth() : CONFIG.START_CASH)
    : currentNetWorth;
  const eco = activeEco === undefined ? (state ? state.eco : null) : activeEco;
  const unlocked = GOODS.filter(g => {
    if (g.tier === 'ultra' && wealth < ULTRA_UNLOCK) return false;
    return true;
  }).map(g => g.id);
  if (eco) {
    const affected = ECO_EVENTS[eco.treeId].goods.filter(id => unlocked.includes(id));
    const rest = unlocked.filter(id => !affected.includes(id));
    return affected.concat(shuffle(rest).slice(0, Math.max(0, count - affected.length)));
  }
  return shuffle(unlocked).slice(0, count);
}

function goodById(id) {
  return GOODS.find(g => g.id === id);
}

function activeEventFor(goodId) {
  return state.events.find(e => e.goodId === goodId);
}

