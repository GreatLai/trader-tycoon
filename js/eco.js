// ==================== 生态事件 ====================
function ecoRel() {
  if (!state.eco) return 0;
  return state.day - state.eco.startDay + 1;
}

function ecoTree() {
  return state.eco ? ECO_EVENTS[state.eco.treeId] : null;
}

function ecoAffected(goodId) {
  if (!state.eco) return false;
  return ECO_EVENTS[state.eco.treeId].goods.includes(goodId);
}

function ecoCurrentMult(goodId) {
  const tree = ecoTree();
  const rel = ecoRel();
  const A = tree.A[state.eco.A];
  if (rel <= 2) return A.mults[goodId];
  const B = A.B[state.eco.B];
  if (rel === 3) return B.mults[goodId];
  return B.C[state.eco.C].mults[goodId];
}

function ecoTargetFactor(goodId) {
  return ecoCurrentMult(goodId);
}

function describeMults(mults) {
  return Object.entries(mults).map(([id, mult]) => {
    const g = goodById(id);
    let label, arrow;
    if (mult >= 3) { label = '暴涨'; arrow = '↑'; }
    else if (mult >= 1.5) { label = '大涨'; arrow = '↑'; }
    else if (mult >= 1.1) { label = '上涨'; arrow = '↑'; }
    else if (mult >= 0.95) { label = '平稳'; arrow = '—'; }
    else if (mult >= 0.7) { label = '下跌'; arrow = '↓'; }
    else if (mult >= 0.4) { label = '大跌'; arrow = '↓'; }
    else { label = '崩盘'; arrow = '↓'; }
    return `${g.name} ${arrow} ${label}`;
  }).join('、');
}
