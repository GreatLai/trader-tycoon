// ==================== 价格 / 事件 ====================
function makeEvent(goodId) {
  const target = goodById(goodId);
  if (!target) return null;
  const rare = Math.random() < 0.06;
  const positive = Math.random() < 0.55;

  let targetMult;
  let title, desc;

  // 不同档位普通事件幅度拉开差距：低档最疯，高档最稳
  const tier = target.tier;
  if (rare) {
    if (positive) {
      targetMult = 6 + Math.random() * 6; // 6~12 倍
      title = '🌟 超级风口';
      desc = `${target.name}出现历史级抢购潮，今日价格暴涨！`;
    } else {
      targetMult = 0.05 + Math.random() * 0.15; // 0.05~0.20 倍
      title = '💥 黑天鹅';
      desc = `${target.name}遭遇毁灭性打击，今日价格崩盘！`;
    }
  } else if (tier === 'low') {
    if (positive) {
      targetMult = 2.5 + Math.random() * 1.5; // 2.5~4 倍
      title = '📈 突发利好';
      desc = `${target.name}需求突然大增，今日价格暴涨！`;
    } else {
      targetMult = 0.20 + Math.random() * 0.20; // 0.20~0.40 倍
      title = '📉 突发利空';
      desc = `${target.name}供给突然过剩，今日价格崩盘！`;
    }
  } else if (tier === 'mid') {
    if (positive) {
      targetMult = 2.0 + Math.random() * 1.0; // 2~3 倍
      title = '📈 突发利好';
      desc = `${target.name}需求突然大增，今日价格大涨！`;
    } else {
      targetMult = 0.30 + Math.random() * 0.20; // 0.30~0.50 倍
      title = '📉 突发利空';
      desc = `${target.name}供给突然过剩，今日价格大跌！`;
    }
  } else {
    if (positive) {
      targetMult = 1.5 + Math.random() * 0.5; // 1.5~2 倍
      title = '📈 突发利好';
      desc = `${target.name}需求突然大增，今日价格上涨！`;
    } else {
      targetMult = 0.40 + Math.random() * 0.20; // 0.40~0.60 倍
      title = '📉 突发利空';
      desc = `${target.name}供给突然过剩，今日价格下跌！`;
    }
  }

  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    goodId: target.id,
    title,
    desc,
    targetMult: +targetMult.toFixed(3),
    type: targetMult >= 1 ? 'good' : 'bad',
    isRare: rare
  };
}

function spawnEvents() {
  // 每天 0~3 个事件，只作用于今天可交易的商品
  // 生态事件第 2 天起，受影响商品不再参与普通突发事件
  // 从未出现过的商品，第一次出现当天不触发突发事件
  let pool = state.availableGoods.filter(id => state.lastSeenPrice[id] != null);
  if (ecoRel() >= 2 && state.eco) {
    const affected = ECO_EVENTS[state.eco.treeId].goods;
    pool = pool.filter(id => !affected.includes(id));
  }

  const roll = Math.random();
  let count = 0;
  if (roll < 0.20) count = 0;
  else if (roll < 0.60) count = 1;
  else if (roll < 0.90) count = 2;
  else count = 3;

  count = Math.min(count, pool.length);
  const targets = shuffle(pool).slice(0, count);
  for (const goodId of targets) {
    const ev = makeEvent(goodId);
    if (!ev) continue;
    state.events.push(ev);
    state.logs.unshift(`第${state.day}天：${ev.title} ${ev.desc}`);
  }
  state.logs = state.logs.slice(0, 50);
}

function updatePrices() {
  GOODS.forEach(g => {
    const oldPrice = state.prices[g.id];
    const oldFactor = state.factors[g.id] || 1;
    let logF = Math.log(Math.max(0.001, oldFactor));

    const ecoOn = state.eco && ecoAffected(g.id) && ecoRel() >= 2;
    if (ecoOn) {
      // 生态事件：围绕“事件开始价 × 累计倍率”逐步过渡
      const targetLog = Math.log(ecoTargetFactor(g.id));
      logF += (targetLog - logF) * 0.6;
    } else {
      // 1. 向基础价回归：价格围绕 base 波动，不按前一天价格复利滚动
      logF += -logF * 0.18;

      // 2. 每日随机波动（围绕基础价的独立扰动）
      logF += randn() * g.vol;

      // 3. 日常涨跌：幅度控制在小波动，真正的大涨大跌留给事件
      if (g.tier === 'low') {
        if (Math.random() < 0.08) {
          logF += Math.log(1.08 + Math.random() * 0.12); // 涨 8%~20%
        } else if (Math.random() < 0.05) {
          logF -= Math.log(1.087 + Math.random() * 0.163); // 跌到 0.80~0.92 倍
        }
      } else if (g.tier === 'mid') {
        if (Math.random() < 0.05) {
          logF += Math.log(1.05 + Math.random() * 0.10); // 涨 5%~15%
        } else if (Math.random() < 0.03) {
          logF -= Math.log(1.075 + Math.random() * 0.101); // 跌到 0.85~0.93 倍
        }
      } else {
        // 高档：日常波动更小
        if (Math.random() < 0.03) {
          logF += Math.log(1.03 + Math.random() * 0.07); // 涨 3%~10%
        } else if (Math.random() < 0.02) {
          logF -= Math.log(1.053 + Math.random() * 0.083); // 跌到 0.88~0.95 倍
        }
      }

      // 普通日硬边界：价格限制在基础价 ±20% 内，不允许漂移形成大行情
      logF = Math.max(Math.log(0.8), Math.min(Math.log(1.2), logF));

      // 4. 事件影响：以基础价为锚直接落点
      //    比如 targetMult=4，当天价格 = 基础价 × 4，而不是“前一天价格 × 4”
      const ev = activeEventFor(g.id);
      if (ev) {
        logF = Math.log(ev.targetMult);
      }
    }

    // 限制倍数范围，避免极端值
    logF = Math.max(Math.log(0.02), Math.min(Math.log(50), logF));

    const newFactor = Math.exp(logF);
    const newPrice = +(g.base * newFactor).toFixed(2);
    state.factors[g.id] = newFactor;
    state.prices[g.id] = newPrice;
    state.prevPrices[g.id] = oldPrice;
  });

  // 生态事件宣告日：记录“事件开始价”
  if (state.eco && !state.eco.startPrices) {
    const sp = {};
    ECO_EVENTS[state.eco.treeId].goods.forEach(id => {
      sp[id] = state.prices[id];
    });
    state.eco.startPrices = sp;
  }
}

function updateSeenPrices() {
  state.availableGoods.forEach(id => {
    if (state.lastSeenPrice[id] != null) {
      state.prevSeenPrice[id] = state.lastSeenPrice[id];
    } else {
      state.prevSeenPrice[id] = null;
    }
    state.lastSeenPrice[id] = state.prices[id];
  });
}

function applyDailyCosts() {
  const fee = +(totalUnits() * CONFIG.STORAGE_FEE_PER_UNIT).toFixed(2);
  const interest = +(state.loan * CONFIG.LOAN_INTEREST_RATE).toFixed(2);
  const totalCost = fee + interest;
  if (totalCost <= 0) return;

  let cash = state.cash - totalCost;
  if (cash < 0) {
    state.loan = +(state.loan - cash).toFixed(2); // 现金不够自动转贷款
    state.cash = 0;
  } else {
    state.cash = +cash.toFixed(2);
  }
}

