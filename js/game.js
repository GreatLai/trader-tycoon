// ==================== 推进日期 ====================
function nextDay() {
  if (state.gameOver) return;
  if (state.day >= CONFIG.DAYS_LIMIT) {
    state.gameOver = 'time';
    state.logs.unshift('⏰ 游戏结束：90 天到期');
    save();
    render();
    return;
  }
  state.day++;
  state.events = [];
  state.popupShown = false;
  state.ecoPopup = null;
  state.ecoPopupShown = false;

  // 生态事件阶段推进 / 结束
  if (state.eco) {
    const rel = ecoRel();
    const tree = ecoTree();
      if (rel >= 5) {
        state.eco = null;
      } else if (rel === 2) {
        state.eco.A = Math.floor(Math.random() * 3);
        const A = tree.A[state.eco.A];
        state.ecoPopup = { special: false, title: '国际新闻', desc: '此前报道的' + tree.name + '仍在持续——' + A.news, mults: A.mults };
      } else if (rel === 3) {
        state.eco.B = Math.floor(Math.random() * 3);
        const B = tree.A[state.eco.A].B[state.eco.B];
        state.ecoPopup = { special: false, title: '国际新闻', desc: tree.name + '进一步发展——' + B.news, mults: B.mults };
      } else if (rel === 4) {
        state.eco.C = Math.floor(Math.random() * 3);
        const C = tree.A[state.eco.A].B[state.eco.B].C[state.eco.C];
        state.ecoPopup = { special: false, title: '国际新闻', desc: '这场持续一周的' + tree.name + '最终——' + C.news, mults: C.mults };
      }
  }

  // 启动新的生态事件（正式规则：第 8~83 天每天 20% 概率）
  if (!state.eco && state.day >= 8 && state.day <= 83) {
    if (Math.random() < 0.20) {
      const keys = Object.keys(ECO_EVENTS).filter(k => !ECO_EVENTS[k].unlock || netWorth() >= ECO_EVENTS[k].unlock);
      const treeId = keys[Math.floor(Math.random() * keys.length)];
      state.eco = { treeId, startDay: state.day, A: null, B: null, C: null };
      state.ecoPopup = { special: true, title: '国际新闻', desc: ECO_EVENTS[treeId].announce.desc };
    }
  }

  applyDailyCosts();
  state.availableGoods = pickGoods(CONFIG.MARKET_SIZE);
  spawnEvents();
  updatePrices();
  updateSeenPrices();

  // 记录每日价格走势
  GOODS.forEach(g => {
    state.priceHistory[g.id].push({ day: state.day, price: state.prices[g.id] });
  });

  // 记录当天发布的事件信息
  const dayRecord = { day: state.day, items: [] };
  state.events.forEach(ev => {
    dayRecord.items.push({ type: 'sudden', title: ev.title, desc: ev.desc, good: goodById(ev.goodId).name });
  });
  if (state.ecoPopup) {
    dayRecord.items.push({ type: 'international', title: state.ecoPopup.title, desc: state.ecoPopup.desc, special: state.ecoPopup.special });
  }
  if (dayRecord.items.length) {
    state.dailyHistory.push(dayRecord);
  }

  state.logs.unshift(`进入第${state.day}天，仓库费与利息已结算`);
  state.logs = state.logs.slice(0, 50);
  checkEnd();
  save();
  render();
}

function checkEnd() {
  const nw = netWorth();
  if (nw <= 0) {
    state.gameOver = 'lose';
    state.logs.unshift('💀 游戏结束：破产');
  }
}

function checkMilestones() {
  if (state.gameOver) return;
  const nw = netWorth();
  let idx = state.highestMilestone;
  while (idx + 1 < MILESTONES.length && nw >= MILESTONES[idx + 1].value) {
    idx++;
  }
  if (idx > state.highestMilestone) {
    state.highestMilestone = idx;
    const m = MILESTONES[idx];
    $('milestoneTitle').textContent = m.title;
    $('milestoneMsg').textContent = m.msg;
    $('milestoneOverlay').classList.remove('hidden');
    state.logs.unshift(`🏆 财富评级提升：${m.title}`);
    save();
  }
}

