// ==================== 交互 ====================
function renderChart() {
  const id = state.chartGood;
  const g = goodById(id);
  const data = state.priceHistory[id] || [];
  $('chartTitle').textContent = `${g.icon} ${g.name} 走势（开局 ¥${fmt(data[0] ? data[0].price : 0, 2)}）`;
  $('chartGoods').innerHTML = GOODS.map(x => `
    <button class="btn btn-small ${x.id === id ? '' : 'btn-ghost'}" data-chart-good="${x.id}" style="font-size:18px;padding:4px 10px;">${x.icon}</button>
  `).join('');

  const W = 620, H = 300, padL = 60, padR = 20, padT = 20, padB = 40;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices, g.base * 0.5);
  const max = Math.max(...prices, g.base * 1.5);
  const range = (max - min) || 1;
  const x = i => padL + (data.length === 1 ? (W - padL - padR) / 2 : i / (data.length - 1) * (W - padL - padR));
  const y = p => padT + (1 - (p - min) / range) * (H - padT - padB);

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = 0; i <= 4; i++) {
    const gy = padT + (H - padT - padB) * i / 4;
    const val = max - (max - min) * i / 4;
    svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="#eef2f7"/>`;
    svg += `<text x="${padL - 6}" y="${gy + 4}" text-anchor="end" font-size="10" fill="#6b7280">${fmt(val, 1)}</text>`;
  }
  const step = Math.max(1, Math.floor(data.length / 8));
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      svg += `<text x="${x(i)}" y="${H - 12}" text-anchor="middle" font-size="10" fill="#6b7280">D${d.day}</text>`;
    }
  });

  if (data.length >= 2) {
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.price).toFixed(1)}`).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="#2f6fed" stroke-width="2.5"/>`;
  }
  data.forEach((d, i) => {
    svg += `<circle cx="${x(i)}" cy="${y(d.price)}" r="3" fill="#2f6fed"/>`;
  });

  const y0 = y(data[0].price);
  svg += `<line x1="${padL}" y1="${y0}" x2="${W - padR}" y2="${y0}" stroke="#f59e0b" stroke-dasharray="4 4" stroke-width="1"/>`;
  svg += `<text x="${W - padR}" y="${y0 - 5}" text-anchor="end" font-size="10" fill="#d97706">开局价 ¥${fmt(data[0].price, 2)}</text>`;
  svg += `</svg>`;
  $('chartSvgWrap').innerHTML = svg;
}

function openChart() {
  renderChart();
  $('chartOverlay').classList.remove('hidden');
}

function openHistory() {
  const rows = (state.dailyHistory || []).slice().reverse().map(rec => {
    const items = rec.items.map(it => {
      const color = it.type === 'international' ? '#7c3aed' : '#374151';
      const goodText = it.good ? `（${it.good}）` : '';
      return `<div style="font-size:13px;margin-top:4px;"><span style="font-weight:600;color:${color};">${it.title}</span>${goodText} — ${it.desc}</div>`;
    }).join('');
    return `<div style="margin-bottom:14px;border-left:3px solid #cbd5e1;padding-left:10px;"><div style="font-weight:700;margin-bottom:4px;">第 ${rec.day} 天</div>${items}</div>`;
  }).join('');
  $('historyList').innerHTML = rows || '<div style="color:var(--muted);">暂无事件记录</div>';
  $('historyOverlay').classList.remove('hidden');
}

function startNewGame() {
  state = newState();
  state.logs = ['第1天：游戏开始。市场每天只上架5种商品。'];
  $('eventOverlay').classList.add('hidden');
  $('milestoneOverlay').classList.add('hidden');
  $('historyOverlay').classList.add('hidden');
  $('chartOverlay').classList.add('hidden');
  clearSave();
  save();
  render();
}

function handleClick(e) {
  const target = e.target.closest('button');
  if (!target || !state) return;

  const action = target.dataset.action;
  const good = target.dataset.good;
  const qty = target.dataset.qty;

  if (action === 'buy' && good) {
    let n;
    if (qty === 'max') {
      const price = state.prices[good];
      n = Math.min(
        Math.floor(state.cash / price),
        capacity() - totalUnits()
      );
    } else {
      n = parseInt(qty, 10);
    }
    if (n > 0) buy(good, n);
  } else if (action === 'sell' && good) {
    let n;
    if (qty === 'all') {
      n = state.inventory[good] || 0;
    } else {
      n = parseInt(qty, 10);
    }
    if (n > 0) sell(good, n);
  }
}

// 全局点击委托
document.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target) return;

  if (target.id === 'startBtn') {
    startNewGame();
  } else if (target.id === 'continueBtn') {
    const s = load();
    if (s) { state = s; render(); }
  } else if (target.id === 'nextDayBtn') {
    nextDay();
  } else if (target.id === 'newGameBtn') {
    if (confirm('确定放弃当前进度，重新开始？')) startNewGame();
  } else if (target.id === 'restartBtn') {
    startNewGame();
  } else if (target.id === 'eventCloseBtn') {
    $('eventOverlay').classList.add('hidden');
  } else if (target.id === 'milestoneCloseBtn') {
    $('milestoneOverlay').classList.add('hidden');
  } else if (target.id === 'historyBtn') {
    openHistory();
  } else if (target.id === 'historyCloseBtn') {
    $('historyOverlay').classList.add('hidden');
  } else if (target.id === 'chartBtn') {
    openChart();
  } else if (target.id === 'chartCloseBtn') {
    $('chartOverlay').classList.add('hidden');
  } else if (target.dataset.chartGood) {
    state.chartGood = target.dataset.chartGood;
    save();
    renderChart();
  } else if (target.id === 'upgradeBtn') {
    const next = CAPACITY_LEVELS[state.capacityLevel + 1];
    if (next && state.cash >= next.cost) {
      state.cash = +(state.cash - next.cost).toFixed(2);
      state.capacityLevel++;
      state.logs.unshift(`仓库扩容到 ${capacity()} 容量`);
      save();
      render();
    } else {
      toast('现金不足');
    }
  } else if (target.id === 'borrowBtn') {
    const amount = Math.min(5000, Math.max(0, Math.floor(creditLimit() - state.loan)));
    borrow(amount || 0);
  } else if (target.id === 'repayBtn') {
    repay(Math.min(5000, state.loan, state.cash));
  } else {
    handleClick(e);
  }
});

// 初始化：有存档则显示继续
(function init() {
  const s = load();
  $('continueBtn').classList.toggle('hidden', !s);
  if (s) {
    state = s;
    render();
  }
})();
