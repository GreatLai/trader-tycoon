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

function pickGoods(count) {
  return shuffle(GOODS.map(g => g.id)).slice(0, count);
}

function goodById(id) {
  return GOODS.find(g => g.id === id);
}

function activeEventFor(goodId) {
  return state.events.find(e => e.goodId === goodId);
}

