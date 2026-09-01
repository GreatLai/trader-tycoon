// ==================== 渲染 ====================
function render() {
  const inGame = !!state && !state.gameOver;
  if (!state) {
    $('startScreen').classList.remove('hidden');
    $('gameScreen').classList.add('hidden');
    $('overlay').classList.add('hidden');
    $('eventOverlay').classList.add('hidden');
    $('milestoneOverlay').classList.add('hidden');
    $('historyOverlay').classList.add('hidden');
    $('chartOverlay').classList.add('hidden');
    $('continueBtn').classList.toggle('hidden', !load());
    return;
  }

  $('startScreen').classList.add('hidden');
  $('gameScreen').classList.remove('hidden');
  $('overlay').classList.add('hidden');
  if (state.gameOver) {
    $('eventOverlay').classList.add('hidden');
    $('milestoneOverlay').classList.add('hidden');
    $('historyOverlay').classList.add('hidden');
    $('chartOverlay').classList.add('hidden');
  }

  const nw = netWorth();
  const cap = capacity();
  const used = totalUnits();

  // 头部
  $('dayText').textContent = `第 ${state.day} 天 / ${CONFIG.DAYS_LIMIT}`;
  $('cashText').textContent = '¥' + fmt(state.cash, 2);
  const feeNow = +calcDailyFee().toFixed(2);
  const interestNow = +(state.loan * CONFIG.LOAN_INTEREST_RATE).toFixed(2);
  $('cashExpense').textContent = `今日支出 -¥${fmt(feeNow + interestNow, 2)}`;
  $('networthText').textContent = '¥' + fmt(nw, 2);
  $('networthText').className = 'value ' + (nw >= 0 ? 'green' : 'red');
  const rankIdx = state.highestMilestone;
  const nextMilestone = MILESTONES[rankIdx + 1];
  $('rankText').textContent = rankIdx >= 0 ? MILESTONES[rankIdx].title : '起步商人';
  $('targetText').textContent = nextMilestone ? '¥' + fmt(nextMilestone.value, 0) : '已登神坛';
  $('nextDayBtn').disabled = !!state.gameOver;
  checkMilestones();

  // 市场
  $('marketCount').textContent = `${state.availableGoods.length} / ${GOODS.length}`;
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
    const maxBuy = Math.min(Math.floor(state.cash / price), cap - used);
    const buyDisabled = maxBuy === 0 ? 'disabled' : '';
    const sellDisabled = owned === 0 ? 'disabled' : '';
    return `
      <div class="market-row${ecoClass}">
        <div class="market-info">
          <div class="good-name"><button class="good-icon-btn" data-chart-good="${id}" title="查看走势">${g.icon}</button><span>${g.name}</span></div>
          <div class="price-col">
            <div class="price">¥${fmt(price, 2)}</div>
            <div class="change ${seenCls}">${seenArrow} ${seenChange >= 0 ? '+' : ''}${fmt(seenChange, 1)}% 较上次</div>
            <div class="base-meta">${seenText}${holdText}</div>
          </div>
          <div class="owned">持有 <strong>${owned}</strong></div>
        </div>
        <div class="trade-row trade-buy">
          <span class="trade-label">买入</span>
          <button class="btn btn-small trade-preset" data-action="buy" data-good="${id}" data-qty="1" ${buyDisabled}>+1</button>
          <button class="btn btn-small trade-preset" data-action="buy" data-good="${id}" data-qty="10" ${buyDisabled}>+10</button>
          <button class="btn btn-small trade-preset" data-action="buy" data-good="${id}" data-qty="100" ${buyDisabled}>+100</button>
          <button class="btn btn-small trade-fill" data-action="buy" data-good="${id}" data-qty="max" ${buyDisabled}>买满</button>
          <input class="trade-custom-input" type="number" min="1" step="1" inputmode="numeric" placeholder="数量" aria-label="${g.name}买入数量" data-trade-input="buy" data-good="${id}" ${buyDisabled}>
          <button class="btn btn-small btn-green trade-submit" data-custom-trade="buy" data-good="${id}" ${buyDisabled}>买入</button>
        </div>
        <div class="trade-row trade-sell">
          <span class="trade-label">卖出</span>
          <button class="btn btn-small btn-ghost trade-preset" data-action="sell" data-good="${id}" data-qty="1" ${sellDisabled}>-1</button>
          <button class="btn btn-small btn-ghost trade-preset" data-action="sell" data-good="${id}" data-qty="10" ${sellDisabled}>-10</button>
          <button class="btn btn-small btn-ghost trade-preset" data-action="sell" data-good="${id}" data-qty="100" ${sellDisabled}>-100</button>
          <button class="btn btn-small btn-ghost trade-fill" data-action="sell" data-good="${id}" data-qty="all" ${sellDisabled}>全卖</button>
          <input class="trade-custom-input" type="number" min="1" step="1" inputmode="numeric" placeholder="数量" aria-label="${g.name}卖出数量" data-trade-input="sell" data-good="${id}" ${sellDisabled}>
          <button class="btn btn-small btn-red trade-submit" data-custom-trade="sell" data-good="${id}" ${sellDisabled}>卖出</button>
        </div>
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
    return `<div class="inventory-row${ecoClass}">
      <span>${g.icon} ${g.name} <span class="qty">×${qty}</span> <span style="font-size:11px;color:var(--muted);">${stateLabel}</span></span>
      <span class="value">
        <div class="price-line">${priceLabel}</div>
        <div class="pnl-line" style="color:${color}">${pnlPer >= 0 ? '+' : ''}${fmt(pnlPer, 2)}/单位 (${fmt(pnlPct, 1)}%) ｜ ${pnl >= 0 ? '+' : ''}${fmt(pnl, 2)}</div>
      </span>
    </div>`;
  }).join('');
  $('inventoryList').innerHTML = invRows || '<div style="color:var(--muted);font-size:14px;">仓库是空的</div>';


  // 银行
  const maxBorrow = Math.max(0, Math.floor(creditLimit() - state.loan));
  $('bankInfo').innerHTML = `
    <div class="loan-row"><span>可借额度</span><span>¥${fmt(creditLimit(), 0)}</span></div>
    <div class="loan-row"><span>已借</span><span>¥${fmt(state.loan, 2)}</span></div>
    <div class="loan-row"><span>还可借</span><span>¥${fmt(maxBorrow, 0)}</span></div>
    <div class="loan-row"><span>日利率</span><span>${(CONFIG.LOAN_INTEREST_RATE * 100).toFixed(1)}%</span></div>`;

  // 每日支出
  const fee = +calcDailyFee().toFixed(2);
  const interest = +(state.loan * CONFIG.LOAN_INTEREST_RATE).toFixed(2);
  $('expenseInfo').innerHTML = `
    <div class="loan-row"><span>仓库管理费</span><span>¥${fmt(fee, 2)}</span></div>
    <div class="loan-row"><span>贷款利息</span><span>¥${fmt(interest, 2)}</span></div>
    <div class="loan-row" style="font-weight:700;"><span>今日合计</span><span>¥${fmt(fee + interest, 2)}</span></div>`;

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
      ${state.ecoPopup.mults ? `<div class="news-meta">行情：${describeMults(state.ecoPopup.mults)}</div>` : ''}
    </div>` : '';
  const news = (suddenNewsHtml + ecoNewsHtml) || '<div style="color:var(--muted);font-size:14px;">今天没有突发新闻。</div>';
  $('newsList').innerHTML = news;

  // 弹窗：普通突发先弹，国际新闻（生态事件）最后弹
  const popupHtml = suddenNewsHtml + ecoNewsHtml;
  if (popupHtml && !state.popupShown && !state.gameOver) {
    $('eventPopupList').innerHTML = popupHtml;
    $('eventOverlay').classList.remove('hidden');
    state.popupShown = true;
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

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1600);
}
