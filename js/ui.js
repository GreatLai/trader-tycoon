function goodArt(g, extraClass = '') {
  return `<span class="good-art ${extraClass}"><img class="good-art-image" src="${g.art}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="good-art-fallback" hidden>${g.icon}</span></span>`;
}

const TRADE_PERCENTAGES = [25, 50, 75, 100];

function professionRuleHtml(text) {
  return text.replace(/(\d+(?:\.\d+)?(?:%|\s*万|\s*天|\s*倍|\s*个百分点)?)/g, '<strong class="profession-number">$1</strong>');
}

function percentageTradeButtons(side, id, disabled) {
  const colorClass = side === 'sell' ? ' btn-ghost' : '';
  return TRADE_PERCENTAGES.map(percent => `
    <button class="btn btn-small${colorClass} trade-preset" data-action="${side}" data-good="${id}" data-percentage="${percent}" ${disabled}>${percent}%</button>
  `).join('');
}

// ==================== 渲染 ====================
function render() {
  const inGame = !!state && !state.gameOver;
  if (!state) {
    $('startScreen').classList.remove('hidden');
    $('gameScreen').classList.add('hidden');
    $('overlay').classList.add('hidden');
    $('eventOverlay').classList.add('hidden');
    $('milestoneOverlay').classList.add('hidden');
    $('achievementOverlay').classList.add('hidden');
    $('historyOverlay').classList.add('hidden');
    $('chartOverlay').classList.add('hidden');
    $('professionAbilityOverlay').classList.add('hidden');
    $('commonListingOverlay').classList.add('hidden');
    $('continueBtn').classList.toggle('hidden', !load());
    return;
  }

  $('startScreen').classList.add('hidden');
  $('gameScreen').classList.remove('hidden');
  $('overlay').classList.add('hidden');
  if (state.gameOver) {
    $('eventOverlay').classList.add('hidden');
    $('milestoneOverlay').classList.add('hidden');
    $('achievementOverlay').classList.add('hidden');
    $('historyOverlay').classList.add('hidden');
    $('chartOverlay').classList.add('hidden');
    $('professionAbilityOverlay').classList.add('hidden');
    $('commonListingOverlay').classList.add('hidden');
  }

  const nw = netWorth();
  const cap = capacity();
  const used = totalUnits();

  // 头部
  $('dayText').textContent = `第 ${state.day} 天 / ${CONFIG.DAYS_LIMIT}`;
  $('cashText').textContent = '¥' + fmt(state.cash, 2);
  const totalCostNow = +calcTotalDailyCost().toFixed(2);
  $('cashExpense').textContent = `今日支出 -¥${fmt(totalCostNow, 2)}`;
  $('networthText').textContent = '¥' + fmt(nw, 2);
  $('networthText').className = 'value ' + (nw >= 0 ? 'green' : 'red');
  const rankIdx = state.highestMilestone;
  const nextMilestone = MILESTONES[rankIdx + 1];
  $('rankText').textContent = rankIdx >= 0 ? MILESTONES[rankIdx].title : '起步商人';
  $('targetText').textContent = nextMilestone ? '¥' + fmt(nextMilestone.value, 0) : '已登神坛';
  $('nextDayBtn').disabled = !!state.gameOver;
  checkMilestones();

  const profession = PROFESSIONS[state.profession.id];
  $('professionName').textContent = profession.name;
  $('professionTagline').textContent = profession.tagline;
  $('professionDescription').textContent = profession.inRun.judgment;
  $('professionPassive').innerHTML = professionRuleHtml(profession.inRun.passive);
  $('professionActive').innerHTML = professionRuleHtml(profession.inRun.active);
  $('professionDrawback').innerHTML = professionRuleHtml(profession.inRun.drawback);
  const abilityButton = $('professionAbilityBtn');
  if (!profession.activeAbility) {
    abilityButton.textContent = '无专属手段';
    abilityButton.disabled = true;
  } else if (professionAbilityReadyDay(profession) > state.day) {
    abilityButton.textContent = `${profession.activeAbility.name} · 第${professionAbilityReadyDay(profession)}天可用`;
    abilityButton.disabled = true;
  } else if (profession.activeAbility.id === 'windVane' && state.eco) {
    abilityButton.textContent = '风向标 · 当前生态行情进行中';
    abilityButton.disabled = true;
  } else if (profession.activeAbility.id === 'windVane') {
    abilityButton.textContent = '使用 风向标';
    abilityButton.disabled = eligibleProfessionEcoEvents().length === 0;
  } else {
    abilityButton.textContent = `使用 ${profession.activeAbility.name}`;
    abilityButton.disabled = eligibleProfessionAbilityTargets().length === 0;
  }
  const commonListingButton = $('commonListingBtn');
  const commonListingRemaining = commonListingUsesRemaining();
  commonListingButton.textContent = `通商令 ${commonListingRemaining} / ${COMMON_ACTIONS.listing.maxUses}`;
  commonListingButton.disabled = commonListingRemaining <= 0 || eligibleCommonListingTargets().length === 0;

  // 市场
  $('marketCount').textContent = `${state.availableGoods.length} / ${GOODS.length}`;
  const percentageMode = state.tradeInputMode === 'percentage';
  ['quantity', 'percentage'].forEach(mode => {
    const button = $(mode === 'quantity' ? 'tradeModeQuantity' : 'tradeModePercentage');
    const active = state.tradeInputMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const marketHtml = state.availableGoods.map(id => {
    const g = goodById(id);
    const price = state.prices[id];
    const prev = state.prevSeenPrice[id];

    // 涨跌 = 较上次出现在市场时
    const seenChange = prev ? (price - prev) / prev * 100 : 0;
    const seenCls = seenChange > 0.01 ? 'up' : seenChange < -0.01 ? 'down' : 'flat';
    const seenArrow = seenChange > 0.01 ? '▲' : seenChange < -0.01 ? '▼' : '—';
    const seenText = prev != null ? `上次 ¥${fmt(prev, 2)}` : '首次上架';

    const owned = state.inventory[id] || 0;
    const avgCost = owned > 0 ? (state.costBasis[id] || 0) / owned : null;
    const holdPnl = avgCost ? (price - avgCost) / avgCost * 100 : 0;
    const holdColor = holdPnl >= 0 ? 'var(--green)' : 'var(--red)';
    const holdText = owned > 0 ? ` ｜ 持仓 <span style="color:${holdColor};font-weight:600;">${holdPnl >= 0 ? '+' : ''}${fmt(holdPnl, 1)}%</span>` : '';
    const ecoClass = state.eco && ECO_EVENTS[state.eco.treeId].goods.includes(id) ? ' eco-affected' : '';
    const saleLocked = isGoodSaleLocked(id);
    const lockLabel = saleLocked ? ` ｜ 禁售中，第${state.saleLockUntilDay[id]}天恢复` : '';
    const marketTripToday = state.profession.id === 'travelingMerchant' && state.profession.data.marketTripGoodId === id && state.profession.data.marketTripDay === state.day;
    const travelFeeLabel = marketTripToday ? ' ｜ 赶集路费 5%' : '';
    const tradeAllowed = canTradeGood(id);
    const licenseLabel = tradeAllowed ? '' : ' ｜ 无专营权';
    const maxBuy = Math.min(Math.floor(state.cash / price), cap - used);
    const buyDisabled = !tradeAllowed || maxBuy === 0 ? 'disabled' : '';
    const sellDisabled = !tradeAllowed || owned === 0 || saleLocked ? 'disabled' : '';
    const buyPresets = percentageMode ? percentageTradeButtons('buy', id, buyDisabled) : `
          <button class="btn btn-small trade-preset" data-action="buy" data-good="${id}" data-qty="1" ${buyDisabled}>+1</button>
          <button class="btn btn-small trade-preset" data-action="buy" data-good="${id}" data-qty="10" ${buyDisabled}>+10</button>
          <button class="btn btn-small trade-preset" data-action="buy" data-good="${id}" data-qty="100" ${buyDisabled}>+100</button>
          <button class="btn btn-small trade-fill" data-action="buy" data-good="${id}" data-qty="max" ${buyDisabled}>买满</button>`;
    const sellPresets = percentageMode ? percentageTradeButtons('sell', id, sellDisabled) : `
          <button class="btn btn-small btn-ghost trade-preset" data-action="sell" data-good="${id}" data-qty="1" ${sellDisabled}>-1</button>
          <button class="btn btn-small btn-ghost trade-preset" data-action="sell" data-good="${id}" data-qty="10" ${sellDisabled}>-10</button>
          <button class="btn btn-small btn-ghost trade-preset" data-action="sell" data-good="${id}" data-qty="100" ${sellDisabled}>-100</button>
          <button class="btn btn-small btn-ghost trade-fill" data-action="sell" data-good="${id}" data-qty="all" ${sellDisabled}>全卖</button>`;
    const feedback = state.lastTradeFeedback && state.lastTradeFeedback.day === state.day && state.lastTradeFeedback.goodId === id && state.lastTradeFeedback.realizedProfit > 0
      ? `<div class="trade-feedback"><strong>本次利润 +¥${fmt(state.lastTradeFeedback.realizedProfit, 2)}</strong><span>收益率 +${fmt(state.lastTradeFeedback.returnRate * 100, 1)}%</span></div>`
      : '';
    return `
      <div class="market-row${ecoClass}${tradeAllowed ? '' : ' trade-unlicensed'}">
        <div class="market-info">
          <div class="good-name"><button class="good-icon-btn" data-chart-good="${id}" title="查看走势" aria-label="查看${g.name}走势">${goodArt(g)}</button><span>${g.name}<span class="good-traits">${g.tags.map(tag => `<small>${tag}</small>`).join('')}</span></span></div>
          <div class="price-col">
            <div class="price">¥${fmt(price, 2)}</div>
            <div class="change ${seenCls}">${seenArrow} ${seenChange >= 0 ? '+' : ''}${fmt(seenChange, 1)}% 较上次</div>
            <div class="base-meta">${seenText}${holdText}<span class="red">${lockLabel}${travelFeeLabel}${licenseLabel}</span></div>
          </div>
          <div class="owned">持有 <strong>${owned}</strong></div>
        </div>
        <div class="trade-row trade-buy">
          <span class="trade-label">买入</span>
          ${buyPresets}
          <input class="trade-custom-input" type="number" min="1" step="1" inputmode="numeric" placeholder="数量" aria-label="${g.name}买入数量" data-trade-input="buy" data-good="${id}" ${buyDisabled}>
          <button class="btn btn-small btn-green trade-submit" data-custom-trade="buy" data-good="${id}" ${buyDisabled}>买入</button>
        </div>
        <div class="trade-row trade-sell">
          <span class="trade-label">卖出</span>
          ${sellPresets}
          <input class="trade-custom-input" type="number" min="1" step="1" inputmode="numeric" placeholder="数量" aria-label="${g.name}卖出数量" data-trade-input="sell" data-good="${id}" ${sellDisabled}>
          <button class="btn btn-small btn-red trade-submit" data-custom-trade="sell" data-good="${id}" ${sellDisabled}>卖出</button>
        </div>
        ${feedback}
      </div>`;
  }).join('');
  $('marketList').innerHTML = marketHtml;

  // 仓库
  $('capText').textContent = `${used} / ${cap}`;
  $('capFill').style.width = Math.min(100, used / cap * 100) + '%';
  const invRows = GOODS.filter(g => (state.inventory[g.id] || 0) > 0).map(g => {
    const qty = state.inventory[g.id] || 0;
    const isToday = state.availableGoods.includes(g.id);
    const cur = knownPrice(g.id);
    const value = qty * cur;
    const avg = (state.costBasis[g.id] || 0) / qty;
    const pnl = (cur - avg) * qty;
    const pnlPer = cur - avg;
    const pnlPct = avg > 0 ? (cur - avg) / avg * 100 : 0;
    const color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
    const priceLabel = isToday
      ? `购入 ¥${fmt(avg, 2)} → 现价 ¥${fmt(cur, 2)}`
      : `购入 ¥${fmt(avg, 2)} → 上次出现 ¥${fmt(cur, 2)}`;
    const stateLabel = isToday ? '' : '（今日未上架）';
    const ecoClass = state.eco && ECO_EVENTS[state.eco.treeId].goods.includes(g.id) ? ' eco-affected' : '';
    const lockLabel = isGoodSaleLocked(g.id) ? `（禁售中，第${state.saleLockUntilDay[g.id]}天恢复）` : '';
    return `<div class="inventory-row${ecoClass}">
      <span class="inventory-good">${goodArt(g, 'good-art-small')}<span>${g.name} <span class="qty">×${qty}</span> <span style="font-size:11px;color:var(--muted);">${stateLabel}</span> <span style="font-size:11px;color:var(--red);">${lockLabel}</span></span></span>
      <span class="value">
        <div class="price-line">${priceLabel}</div>
        <div class="pnl-line" style="color:${color}">${pnlPer >= 0 ? '+' : ''}${fmt(pnlPer, 2)}/单位 (${fmt(pnlPct, 1)}%) ｜ ${pnl >= 0 ? '+' : ''}${fmt(pnl, 2)}</div>
      </span>
    </div>`;
  }).join('');
  $('inventoryList').innerHTML = invRows || '<div style="color:var(--muted);font-size:14px;">仓库是空的</div>';

  // 每日支出
  const operatingCost = +calcOperatingCost().toFixed(2);
  const fee = +calcDailyFee().toFixed(2);
  const totalCost = +(operatingCost + fee).toFixed(2);
  const remainingPressure = +calcRemainingOperatingCost().toFixed(2);
  const operatingStageIndex = BALANCE_CONFIG.OPERATING_COST_STAGES.findIndex(
    stage => state.day >= stage.startDay && state.day <= stage.endDay
  );
  const operatingStage = BALANCE_CONFIG.OPERATING_COST_STAGES[operatingStageIndex];
  const nextOperatingStage = BALANCE_CONFIG.OPERATING_COST_STAGES[operatingStageIndex + 1];
  const stageLabel = operatingStage
    ? `第 ${operatingStage.startDay}-${operatingStage.endDay} 天·每日固定`
    : '封账期';
  const nextStageLabel = nextOperatingStage
    ? `第 ${nextOperatingStage.startDay} 天升至 ¥${fmt(nextOperatingStage.base, 2)}`
    : '本局不再涨费';
  $('expenseInfo').innerHTML = `
    <div class="expense-row"><span>基础经营费</span><span>¥${fmt(operatingCost, 2)}</span></div>
    <div class="expense-row"><span>${stageLabel}</span><span>${nextStageLabel}</span></div>
    <div class="expense-row"><span>仓库管理费</span><span>¥${fmt(fee, 2)}</span></div>
    <div class="expense-row" style="font-weight:700;"><span>今日合计</span><span>¥${fmt(totalCost, 2)}</span></div>
    <div class="expense-row"><span>剩余经营压力</span><span>¥${fmt(remainingPressure, 2)}</span></div>`;

  // 今日突发 + 国际新闻（生态事件）
  const suddenNewsHtml = state.events.map(ev => `
    <div class="news-item ${ev.isRare ? 'super' : ev.type}">
      <div class="news-title">${ev.title}</div>
      <div>${ev.desc}</div>
      <div class="news-meta">影响：${goodById(ev.goodId).name}</div>
    </div>`).join('');
  const ecoNewsHtml = state.ecoPopup ? `
    <div class="news-item international ${state.ecoPopup.special ? 'special' : ''}">
      <div class="news-title">${state.ecoPopup.title}</div>
      <div>${state.ecoPopup.desc}</div>
      ${state.ecoPopup.mults ? `<div class="news-meta">行情：${describeMults(state.ecoPopup.movementMults || state.ecoPopup.mults)}</div>` : ''}
    </div>` : '';
  const news = (suddenNewsHtml + ecoNewsHtml) || '<div style="color:var(--muted);font-size:14px;">今天没有突发新闻。</div>';
  $('newsList').innerHTML = news;

  // 主动技能事件逐条播报；每日自然事件仍合并播报。
  const settlement = state.dailySettlement && state.dailySettlement.day === state.day
    ? state.dailySettlement
    : null;
  const liquidationHtml = settlement && settlement.forcedLiquidations.length
    ? `<div class="settlement-liquidations">
        <div class="settlement-subtitle">强制清算</div>
        ${settlement.forcedLiquidations.map(item => `
          <div class="settlement-sale">
            <span>${item.goodName} ×${item.quantity} · ${item.listed ? '已上架' : '未上架'}</span>
            <strong>¥${fmt(item.unitPrice, 2)}/件，到账 ¥${fmt(item.netRevenue, 2)}</strong>
            ${item.saleFee > 0 ? `<small>成交 ¥${fmt(item.grossRevenue, 2)}，扣除路费 ¥${fmt(item.saleFee, 2)}</small>` : ''}
          </div>`).join('')}
      </div>`
    : '';
  const revaluation = settlement ? settlement.marketRevaluation : 0;
  const netWorthChange = settlement ? +(settlement.todayOpen.netWorth - settlement.previousClose.netWorth).toFixed(2) : 0;
  const dailySettlementHtml = settlement ? `
    <div class="daily-settlement">
      <div class="settlement-title">昨日收盘 → 今日开盘</div>
      <div class="settlement-grid">
        <span>昨日现金</span><strong>¥${fmt(settlement.previousClose.cash, 2)}</strong>
        <span>昨日总资产</span><strong>¥${fmt(settlement.previousClose.netWorth, 2)}</strong>
        <span>基础经营费</span><strong class="red">-¥${fmt(settlement.costs.operating, 2)}</strong>
        <span>仓库管理费</span><strong class="red">-¥${fmt(settlement.costs.storage, 2)}</strong>
        <span>市场重估</span><strong class="${revaluation >= 0 ? 'green' : 'red'}">${revaluation >= 0 ? '+' : '-'}¥${fmt(Math.abs(revaluation), 2)}</strong>
      </div>
      ${liquidationHtml}
      <div class="settlement-open">
        <div><span>今日现金</span><strong>¥${fmt(settlement.todayOpen.cash, 2)}</strong></div>
        <div><span>今日总资产</span><strong>¥${fmt(settlement.todayOpen.netWorth, 2)}</strong></div>
        <div><span>资产变化</span><strong class="${netWorthChange >= 0 ? 'green' : 'red'}">${netWorthChange >= 0 ? '+' : '-'}¥${fmt(Math.abs(netWorthChange), 2)}</strong></div>
      </div>
    </div>` : '';
  const popupHtml = dailySettlementHtml + suddenNewsHtml + ecoNewsHtml;
  if (state.eventNoticeQueue.length && !state.gameOver) {
    $('achievementOverlay').classList.add('hidden');
    const notice = state.eventNoticeQueue[0];
    $('eventPopupEmoji').textContent = '⚡';
    $('eventPopupTitle').textContent = '突发新闻';
    $('eventPopupList').innerHTML = `<div class="news-item"><div class="news-title">${notice.title}</div><div>${notice.desc}</div></div>`;
    $('eventOverlay').classList.remove('hidden');
  } else if (popupHtml && !state.popupShown && !state.gameOver && $('milestoneOverlay').classList.contains('hidden')) {
    $('achievementOverlay').classList.add('hidden');
    $('eventPopupEmoji').textContent = settlement ? '🧾' : '⚡';
    $('eventPopupTitle').textContent = settlement ? `第 ${state.day} 天开市` : '突发新闻';
    $('eventPopupList').innerHTML = popupHtml;
    $('eventOverlay').classList.remove('hidden');
    state.popupShown = true;
    save();
  } else if (state.achievementQueue.length && state.achievementShownDay !== state.day && !state.gameOver && $('milestoneOverlay').classList.contains('hidden')) {
    const achievement = state.achievementQueue[0];
    $('achievementTitle').textContent = achievement.title;
    $('achievementDescription').textContent = achievement.description;
    const profitStats = achievement.realizedProfit > 0 ? `
      <div><span>本次利润</span><strong>+¥${fmt(achievement.realizedProfit, 2)}</strong></div>
      <div><span>交易收益率</span><strong>+${fmt(achievement.returnRate * 100, 1)}%</strong></div>` : '';
    $('achievementStats').innerHTML = `${profitStats}
      <div><span>总资产</span><strong>¥${fmt(achievement.netWorthBefore, 0)} → ¥${fmt(achievement.netWorthAfter, 0)}</strong></div>`;
    $('achievementOverlay').classList.remove('hidden');
    state.achievementShownDay = state.day;
    save();
  }

  // 结算：破产 / 90 天到期
  if (state.gameOver) {
    const timeUp = state.gameOver === 'time';
    $('overlay').classList.remove('hidden');
    $('overlayEmoji').textContent = timeUp ? '⏰' : '💀';
    $('overlayTitle').textContent = timeUp ? '时间到' : '破产了';
    $('overlayDesc').innerHTML = `第 ${state.day} 天，总资产 <b>¥${fmt(nw, 2)}</b>。<br>${timeUp ? '90 天商途结束，下次再战！' : '商海无情，下次再来。'}`;
  }
}

function closeEventNotice() {
  if (state.eventNoticeQueue.length) state.eventNoticeQueue.shift();
  if (state.eventNoticeQueue.length) render();
  else {
    $('eventOverlay').classList.add('hidden');
    render();
  }
  save();
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1600);
}
