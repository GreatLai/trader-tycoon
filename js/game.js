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
    let treeId = null;
    if (Math.random() < BALANCE_CONFIG.ECO_EVENT_CHANCE) {
      const keys = Object.keys(ECO_EVENTS).filter(id => !ECO_EVENTS[id].unlock || netWorth() >= ECO_EVENTS[id].unlock);
      treeId = keys[Math.floor(Math.random() * keys.length)];
    }
    if (treeId) {
      state.eco = { treeId, startDay: state.day, A: null, B: null, C: null, byCard: false };
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
  const rules = getEffectiveRules(state.profession);
  state.availableGoods = pickGoods(state.eco ? rules.ecoMarketSize : rules.marketSize);
  spawnEvents();
  updatePrices();
  updateSeenPrices();
  recordDayHistory();
  state.logs.unshift(`进入第${state.day}天，仓库管理费已结算`);
  state.logs = state.logs.slice(0, 50);
  state.peakNetWorth = Math.max(state.peakNetWorth || CONFIG.START_CASH, netWorth());
  state.runStats.maxDayReached = Math.max(state.runStats.maxDayReached, state.day);
  state.runStats.peakNetWorth = Math.max(state.runStats.peakNetWorth, state.peakNetWorth);
  unlockEligibleProfessions({ peakNetWorth: state.peakNetWorth });
  checkEnd();
}

function nextDay() {
  if (state.gameOver) return;
  applyDailyCosts(state.day);
  if (state.gameOver) {
    save(); render();
    return;
  }
  if (state.day >= CONFIG.DAYS_LIMIT) {
    state.gameOver = 'time';
    state.logs.unshift('⏰ 游戏结束：90 天到期');
    recordFinishedRun();
    save(); render();
    return;
  }
  const oldRandom = Math.random;
  Math.random = mulberry32(state.nextDaySeed);
  resolveNextDayState();
  Math.random = oldRandom;
  state.nextDaySeed = Math.floor(Math.random() * 1e9);
  recordFinishedRun();
  save(); render();
}

function recordFinishedRun() {
  if (!state.gameOver || state.resultRecorded) return false;
  recordRunResult({
    professionId: state.profession.id,
    survived: state.gameOver === 'time',
    finalNetWorth: netWorth(),
    peakNetWorth: state.runStats.peakNetWorth
  });
  state.resultRecorded = true;
  return true;
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
  unlockEligibleProfessions({ peakNetWorth: state.peakNetWorth });
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
