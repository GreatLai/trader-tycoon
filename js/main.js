// ==================== 交互 ====================
const INTRO_SLIDES = [
  { emoji: '🧳', title: '旧商行，新掌柜', text: '港口重新开市，这间旧商行和账上仅剩的 ¥5,000 都交到了你手里。\n九十天后封账，能留下多少身家，只看你的眼光。', hint: '接下这间商行', button: '接下委托' },
  { emoji: '📈', title: '先看价，再下手', text: '每天只有一部分商品摆上货架。价格低时收货，行情起来后卖出，现金和仓位都要留有余地。\n经营费前期温和，却会在第 16、31、61 天进入更高压力阶段；国际生态行情出现时，市场会扩展到 7 种商品。', hint: '每次推进日期，市场都会重新洗牌', button: '记住了' },
  { emoji: '⚖️', title: '选一条生意路', text: '四种职业从开局起全部开放。\n无用之人守常规，牙商用风险换高价，行商让库存重新报价，投机商则追着突发风声下注。', hint: '职业只能在开局时选择', button: '选择职业' }
];
let introStep = 0;

function showIntro() {
  introStep = 0;
  $('introOverlay').classList.remove('hidden');
  renderIntroSlide();
}

function renderIntroSlide() {
  const s = INTRO_SLIDES[introStep];
  $('introEmoji').textContent = s.emoji;
  $('introTitle').textContent = s.title;
  $('introText').textContent = s.text;
  $('introHint').textContent = s.hint;
  $('introBtn').textContent = s.button;
}

function advanceIntro() {
  introStep++;
  if (introStep >= INTRO_SLIDES.length) {
    $('introOverlay').classList.add('hidden');
    $('versionOverlay').classList.add('hidden');
    openProfessionSelect();
  } else {
    renderIntroSlide();
  }
}


function checkVersion() {
  $('versionInfo').innerHTML = '<div>当前版本：<b>' + APP_VERSION + '</b></div><div style="color:var(--muted);">正在检查最新版本...</div>';
  $('versionUpdateBtn').style.display = 'none';
  $('versionOverlay').classList.remove('hidden');

  fetch('version.json?t=' + Date.now())
    .then(r => { if (!r.ok) throw new Error('http'); return r.json(); })
    .then(data => {
      const latest = data.version || '0.0.0';
      const isLatest = latest === APP_VERSION;
      $('versionInfo').innerHTML =
        '<div>当前版本：<b>' + APP_VERSION + '</b></div>' +
        '<div>最新版本：<b>' + latest + '</b></div>' +
        (data.notes ? '<div style="color:var(--muted);margin-top:6px;">' + data.notes + '</div>' : '') +
        '<div style="margin-top:10px;font-weight:700;">' + (isLatest ? '✅ 已是最新版本' : '⬆️ 发现新版本，更新后将继续当前存档') + '</div>';
      if (!isLatest) $('versionUpdateBtn').style.display = 'block';
    })
    .catch(() => {
      $('versionInfo').innerHTML = '<div>当前版本：<b>' + APP_VERSION + '</b></div><div style="color:var(--red);">无法检查最新版本，请确认已通过 GitHub Pages 访问。</div>';
    });
}

function doVersionUpdate() {
  location.href = location.href.split('?')[0] + '?v=' + Date.now();
}
// ==================== 交互 ====================
function renderChart() {
  const id = state.chartGood;
  const g = goodById(id);
  const data = state.priceHistory[id] || [];
  $('chartTitle').innerHTML = `${goodArt(g, 'good-art-small')}<span>${g.name} 走势（开局 ¥${fmt(data[0] ? data[0].price : 0, 2)}）</span>`;
  $('chartGoods').innerHTML = GOODS.map(x => `
    <button class="btn btn-small chart-good-btn ${x.id === id ? '' : 'btn-ghost'}" data-chart-good="${x.id}" aria-label="查看${x.name}走势">${goodArt(x, 'good-art-small')}</button>
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

function openProfessionSelect() {
  const profile = loadProfile();
  $('professionChoices').innerHTML = Object.values(PROFESSIONS).map(profession => {
    const unlocked = profile.unlockedProfessionIds.includes(profession.id);
    const active = profession.activeAbility
      ? `<strong>${profession.activeAbility.name}</strong>：${profession.activeAbility.description}`
      : '无主动技能。';
    return `<button class="profession-choice" data-profession-select="${profession.id}" ${unlocked ? '' : 'disabled'}>
      <div class="profession-choice-name">${profession.name}</div>
      <div class="profession-choice-copy">${profession.description}</div>
      <div class="profession-choice-facts">
        <div><span class="profession-choice-label">被动</span><span>${profession.passive}</span></div>
        <div><span class="profession-choice-label">主动</span><span>${active}</span></div>
        <div><span class="profession-choice-label cost">代价</span><span>${profession.drawback}</span></div>
      </div>
      ${unlocked ? '' : `<div class="profession-choice-lock">解锁：${profession.unlock.text}</div>`}
    </button>`;
  }).join('');
  $('professionOverlay').classList.remove('hidden');
}

function startNewGame(professionId = DEFAULT_PROFESSION_ID) {
  const profile = loadProfile();
  const selectedId = normalizeProfessionId(professionId);
  if (!profile.unlockedProfessionIds.includes(selectedId)) return false;
  state = newState(selectedId);
  state.logs = ['第1天：商行开张。常规市场上架6种商品，生态行情期间扩展到7种。'];
  $('eventOverlay').classList.add('hidden');
  $('milestoneOverlay').classList.add('hidden');
  $('achievementOverlay').classList.add('hidden');
  $('historyOverlay').classList.add('hidden');
  $('chartOverlay').classList.add('hidden');
  $('introOverlay').classList.add('hidden');
  $('versionOverlay').classList.add('hidden');
  $('professionOverlay').classList.add('hidden');
  $('professionAbilityOverlay').classList.add('hidden');
  clearSave();
  save();
  render();
  return true;
}

function returnToStartScreen() {
  clearSave();
  state = null;
  ['overlay', 'eventOverlay', 'milestoneOverlay', 'achievementOverlay', 'historyOverlay', 'chartOverlay', 'introOverlay', 'versionOverlay', 'professionOverlay', 'professionAbilityOverlay'].forEach(id => $(id).classList.add('hidden'));
  render();
}

function openProfessionAbility() {
  const profession = PROFESSIONS[state.profession.id];
  if (!profession.activeAbility) return;
  const targets = eligibleProfessionAbilityTargets();
  $('professionAbilityTitle').textContent = `${profession.name} · ${profession.activeAbility.name}`;
  $('professionAbilityInfo').textContent = profession.activeAbility.description;
  const emptyTargetText = profession.activeAbility.id === 'marketTrip'
    ? '当前没有库存商品。'
    : profession.activeAbility.id === 'stokeMarket'
      ? '今天还没有可利用的自然突发事件。'
      : '当前没有既已上架又持有库存的商品。';
  $('professionAbilityTargets').innerHTML = targets.length
    ? targets.map(id => `<button class="btn btn-small" data-profession-ability-target="${id}">${goodById(id).name}${profession.activeAbility.id === 'marketTrip' ? '' : ` · ¥${fmt(state.prices[id], 2)}`}</button>`).join('')
    : `<div style="grid-column:1/-1;color:var(--muted);font-size:13px;">${emptyTargetText}</div>`;
  $('professionAbilityOverlay').classList.remove('hidden');
}

function handleClick(e) {
  const target = e.target.closest('button');
  if (!target || !state) return;

  const action = target.dataset.action;
  const good = target.dataset.good;
  const qty = target.dataset.qty;
  const percentage = target.dataset.percentage;

  if (action === 'buy' && good) {
    let n;
    if (percentage) {
      n = getPercentageTradeQuantity('buy', good, percentage);
    } else if (qty === 'max') {
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
    if (percentage) {
      n = getPercentageTradeQuantity('sell', good, percentage);
    } else if (qty === 'all') {
      n = state.inventory[good] || 0;
    } else {
      n = parseInt(qty, 10);
    }
    if (n > 0) sell(good, n);
  }
}

function executeCustomTrade(target) {
  const side = target.dataset.customTrade || target.dataset.tradeInput;
  const good = target.dataset.good;
  const row = target.closest('.trade-row');
  const input = target.matches('input') ? target : row && row.querySelector('[data-trade-input]');
  const qty = input ? parseTradeQuantity(input.value) : 0;
  if (!side || !good || !input || qty <= 0) return;

  const cashBefore = state.cash;
  const ownedBefore = state.inventory[good] || 0;
  if (side === 'buy') buy(good, qty);
  else sell(good, qty);

  const succeeded = state.cash !== cashBefore || (state.inventory[good] || 0) !== ownedBefore;
  if (succeeded) input.value = '';
}

// 全局点击委托
document.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target) return;

  if (target.id === 'startBtn') {
    openProfessionSelect();
  } else if (target.id === 'continueBtn') {
    const s = load();
    if (s) { state = s; render(); }
  } else if (target.id === 'nextDayBtn') {
    nextDay();
  } else if (target.id === 'newGameBtn') {
    if (confirm('确定放弃当前进度，返回首页？')) returnToStartScreen();
  } else if (target.id === 'restartBtn') {
    returnToStartScreen();
  } else if (target.id === 'introBtn') {
    advanceIntro();
  } else if (target.id === 'versionBtn' || target.id === 'versionFab') {
    checkVersion();
  } else if (target.id === 'versionUpdateBtn') {
    doVersionUpdate();
  } else if (target.id === 'versionCloseBtn') {
    $('versionOverlay').classList.add('hidden');
  } else if (target.id === 'eventCloseBtn') {
    closeEventNotice();
  } else if (target.id === 'milestoneCloseBtn') {
    $('milestoneOverlay').classList.add('hidden');
    render();
  } else if (target.id === 'achievementCloseBtn') {
    completeCurrentAchievement();
    $('achievementOverlay').classList.add('hidden');
    save();
    render();
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
    openChart();
  } else if (target.dataset.tradeMode) {
    setTradeInputMode(target.dataset.tradeMode);
  } else if (target.dataset.professionSelect) {
    startNewGame(target.dataset.professionSelect);
  } else if (target.id === 'professionSelectCloseBtn') {
    $('professionOverlay').classList.add('hidden');
  } else if (target.id === 'professionAbilityBtn') {
    openProfessionAbility();
  } else if (target.dataset.professionAbilityTarget) {
    const result = useProfessionAbility(target.dataset.professionAbilityTarget);
    if (result.ok || result.reason === 'raise-failed') {
      $('professionAbilityOverlay').classList.add('hidden');
      save();
      render();
    }
  } else if (target.id === 'professionAbilityCloseBtn') {
    $('professionAbilityOverlay').classList.add('hidden');
  } else if (target.dataset.customTrade) {
    executeCustomTrade(target);
  } else {
    handleClick(e);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !e.target.matches('[data-trade-input]')) return;
  e.preventDefault();
  const input = e.target;
  executeCustomTrade(input);
});
// 初始化：有存档自动继续，无存档自动进入开场剧情
(function init() {
  const s = load();
  $('continueBtn').classList.toggle('hidden', !s);
  if (s) {
    state = s;
    render();
  } else {
    showIntro();
  }
})();
