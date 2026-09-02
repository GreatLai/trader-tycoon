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
  const scale = BALANCE_CONFIG.ECO_EVENT_SCALE;
  const A = tree.A[state.eco.A];
  if (rel <= 2) return Math.pow(A.mults[goodId], scale);
  const B = A.B[state.eco.B];
  if (rel === 3) return Math.pow(B.mults[goodId], scale);
  return Math.pow(B.C[state.eco.C].mults[goodId], scale);
}

function ecoBranchWeight(stage) {
  const values = Object.values(stage.mults);
  const impact = values.reduce((sum, mult) => sum + Math.abs(Math.log(mult)), 0) / values.length;
  return 1 / Math.pow(1 + impact, 2);
}

function ecoVolatileBranchWeight(stage) {
  return 1 / ecoBranchWeight(stage);
}

function pickEcoBranchByWeight(stages, weightFor) {
  const weights = stages.map(weightFor);
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < weights.length; index++) {
    roll -= weights[index];
    if (roll <= 0) return index;
  }
  return stages.length - 1;
}

function pickWeightedEcoBranch(stages) {
  return pickEcoBranchByWeight(stages, ecoBranchWeight);
}

function pickVolatileEcoBranch(stages) {
  return pickEcoBranchByWeight(stages, ecoVolatileBranchWeight);
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
