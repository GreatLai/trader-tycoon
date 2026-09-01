// ==================== 推进日期 ====================
function advanceEcology() {
  if (state.eco) {
    const rel = ecoRel();
    const tree = ecoTree();
    if (rel >= 5) state.eco = null;
    else if (rel === 2) {
      state.eco.A = state.eco.byCard ? pickVolatileEcoBranch(tree.A) : pickWeightedEcoBranch(tree.A);
      const stage = tree.A[state.eco.A];
      state.ecoPopup = { special: false, title: '国际新闻', desc: `此前报道的${tree.name}仍在持续——${stage.news}`, mults: stage.mults };
    } else if (rel === 3) {
      const branches = tree.A[state.eco.A].B;
      state.eco.B = state.eco.byCard ? pickVolatileEcoBranch(branches) : pickWeightedEcoBranch(branches);
      const stage = tree.A[state.eco.A].B[state.eco.B];
      state.ecoPopup = { special: false, title: '国际新闻', desc: `${tree.name}进一步发展——${stage.news}`, mults: stage.mults };
    } else if (rel === 4) {
      const branches = tree.A[state.eco.A].B[state.eco.B].C;
      state.eco.C = state.eco.byCard ? pickVolatileEcoBranch(branches) : pickWeightedEcoBranch(branches);
      const stage = tree.A[state.eco.A].B[state.eco.B].C[state.eco.C];
      state.ecoPopup = { special: false, title: '国际新闻', desc: `这场持续一周的${tree.name}最终——${stage.news}`, mults: stage.mults };
    }
  }

  if (!state.eco && state.day >= 8 && state.day <= 83) {
    let treeId = state.scheduledEco;
    let byCard = !!state.scheduledEcoByCard;
    if (!treeId && Math.random() < 0.20) {
      const keys = Object.keys(ECO_EVENTS).filter(id => !ECO_EVENTS[id].unlock || netWorth() >= ECO_EVENTS[id].unlock);
      treeId = keys[Math.floor(Math.random() * keys.length)];
      byCard = false;
    }
    if (treeId) {
      state.scheduledEco = null;
      state.scheduledEcoByCard = false;
      state.eco = { treeId, startDay: state.day, A: null, B: null, C: null, byCard };
      state.ecoPopup = { special: true, title: '国际新闻', desc: ECO_EVENTS[treeId].announce.desc };
    }
  }
}

function recordDayHistory() {
  GOODS.forEach(g => state.priceHistory[g.id].push({ day: state.day, price: state.prices[g.id] }));
  const items = state.events.map(event => ({ type: 'sudden', title: event.title, desc: event.desc, good: goodById(event.goodId).name }));
  if (state.ecoPopup) items.push({ type: 'international', title: state.ecoPopup.title, desc: state.ecoPopup.desc, special: state.ecoPopup.special });
  if (items.length) state.dailyHistory.push({ day: state.day, items });
}

function resolveNextDayState() {
  state.day++;
  state.events = [];
  state.popupShown = false;
  state.ecoPopup = null;
  state.ecoPopupShown = false;
  state.eventNoticeQueue = [];
  advanceEcology();
  applyDailyCosts();
  state.availableGoods = pickGoods(CONFIG.MARKET_SIZE);
  spawnEvents();
  updatePrices();
  updateSeenPrices();
  recordDayHistory();
  state.logs.unshift(`进入第${state.day}天，仓库管理费已结算`);
  state.logs = state.logs.slice(0, 50);
  state.peakNetWorth = Math.max(state.peakNetWorth || CONFIG.START_CASH, netWorth());
  checkEnd();
}

function nextDay() {
  if (state.gameOver) return;
  if (state.day >= CONFIG.DAYS_LIMIT) {
    state.gameOver = 'time';
    state.logs.unshift('⏰ 游戏结束：90 天到期');
    save(); render();
    return;
  }
  const oldRandom = Math.random;
  Math.random = mulberry32(state.nextDaySeed);
  resolveNextDayState();
  Math.random = oldRandom;
  state.nextDaySeed = Math.floor(Math.random() * 1e9);
  refreshShopIfNeeded();
  save(); render();
}

function checkEnd() {
  if (netWorth() <= 0) {
    state.gameOver = 'lose';
    state.logs.unshift('💀 游戏结束：破产');
  }
}

function checkMilestones() {
  if (state.gameOver) return;
  const nw = netWorth();
  state.peakNetWorth = Math.max(state.peakNetWorth || CONFIG.START_CASH, nw);
  let idx = state.highestMilestone;
  while (idx + 1 < MILESTONES.length && nw >= MILESTONES[idx + 1].value) idx++;
  if (idx > state.highestMilestone) {
    state.highestMilestone = idx;
    const milestone = MILESTONES[idx];
    $('milestoneTitle').textContent = milestone.title;
    $('milestoneMsg').textContent = milestone.msg;
    $('milestoneOverlay').classList.remove('hidden');
    state.logs.unshift(`🏆 财富评级提升：${milestone.title}`);
    save();
  }
}
