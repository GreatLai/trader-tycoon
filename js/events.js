// ==================== 价格 / 事件 ====================
function makeEvent(goodId, forcedPositive = null, options = {}) {
  const target = goodById(goodId);
  if (!target) return null;
    const forcedDirection = forcedPositive != null;
    const forcedByCard = forcedDirection && options.forcedByCard !== false;
    if (!forcedDirection && !options.guaranteedMovement && Math.random() >= eventMovementChance(target.tier)) return null;
    const rare = options.allowRare === false ? false : Math.random() < eventRareChance(forcedByCard);
    const positive = forcedPositive == null ? Math.random() < eventPositiveChance(target.tier, rare, target) : forcedPositive;

  let impactMult;
  let title, desc;

  // 不同档位普通事件幅度拉开差距：低档最疯，高档最稳
  const tier = target.tier;
  if (rare) {
    if (positive) {
      impactMult = forcedByCard
        ? 250 + Math.pow(Math.random(), 1.8) * 250
        : 6 + Math.pow(Math.random(), 1.8) * 6;
      title = '🌟 超级风口';
      desc = `${target.name}出现历史级抢购潮，今日价格暴涨！`;
    } else {
      impactMult = forcedByCard
        ? 0.005 + (1 - Math.pow(Math.random(), 1.8)) * 0.015
        : 0.05 + (1 - Math.pow(Math.random(), 1.8)) * 0.15;
      title = '💥 黑天鹅';
      desc = `${target.name}遭遇毁灭性打击，今日价格崩盘！`;
    }
  } else if (tier === 'low') {
    if (positive) {
      impactMult = 2.5 + Math.pow(Math.random(), 1.8) * 1.5;
      title = '📈 突发利好';
      desc = `${target.name}需求突然大增，今日价格暴涨！`;
    } else {
      impactMult = 0.20 + (1 - Math.pow(Math.random(), 1.8)) * 0.20;
      title = '📉 突发利空';
      desc = `${target.name}供给突然过剩，今日价格崩盘！`;
    }
  } else if (tier === 'mid') {
    if (positive) {
      impactMult = 2.0 + Math.pow(Math.random(), 1.8) * 1.0;
      title = '📈 突发利好';
      desc = `${target.name}需求突然大增，今日价格大涨！`;
    } else {
      impactMult = 0.30 + (1 - Math.pow(Math.random(), 1.8)) * 0.20;
      title = '📉 突发利空';
      desc = `${target.name}供给突然过剩，今日价格大跌！`;
    }
    } else if (tier === 'ultra') {
      if (positive) {
        impactMult = 3 + Math.pow(Math.random(), 1.8) * 3;
        title = '📈 突发利好';
        desc = `${target.name}出现历史级抢购潮，今日价格暴涨！`;
      } else {
        impactMult = 0.30 + (1 - Math.pow(Math.random(), 1.8)) * 0.30;
        title = '📉 突发利空';
        desc = `${target.name}遭遇恐慌性抛售，今日价格大跌！`;
      }
    } else {
    if (positive) {
      impactMult = 1.5 + Math.pow(Math.random(), 1.8) * 0.5;
      title = '📈 突发利好';
      desc = `${target.name}需求突然大增，今日价格上涨！`;
    } else {
      impactMult = 0.40 + (1 - Math.pow(Math.random(), 1.8)) * 0.20;
      title = '📉 突发利空';
      desc = `${target.name}供给突然过剩，今日价格下跌！`;
    }
  }

  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    goodId: target.id,
    title,
    desc,
    impactMult: +Math.pow(impactMult, (forcedByCard ? 1 : BALANCE_CONFIG.SUDDEN_EVENT_SCALE) * target.market.eventImpact * professionNaturalEventIntensity()).toFixed(3),
    type: impactMult >= 1 ? 'good' : 'bad',
    isRare: rare
  };
}

function eventMovementChance(tier) {
  if (tier === 'ultra') return 0.55;
  if (tier === 'high') return 0.70;
  return 0.85;
}

function eventRareChance(forcedByCard) {
  return forcedByCard ? 0.20 : 0.06;
}

function eventPositiveChance(tier, rare, good = null) {
  const base = tier === 'ultra' ? (rare ? 0.18 : 0.22) : (rare ? 0.30 : 0.38);
  return good ? Math.max(0.12, Math.min(0.70, base + good.market.positiveBias - 0.45)) : base;
}

function initializeOpeningMarket() {
  if (!state || state.day !== 1 || state.events.length) return { applied: false, reason: 'already-initialized' };
  const targets = weightedSample(state.availableGoods, 2, id => goodById(id).market.eventWeight);
  if (targets.length < 2) return { applied: false, reason: 'not-enough-goods' };

  const directions = shuffle([true, false]);
  targets.forEach((id, index) => {
    const event = makeEvent(id, directions[index], {
      forcedByCard: false,
      allowRare: false,
      guaranteedMovement: true
    });
    event.source = 'opening';
    state.events.push(event);
    updateGoodPrice(goodById(id), event);
    recordCurrentPrice(id);
    state.logs.unshift(`第1天：${event.title} ${event.desc}`);
  });
  state.popupShown = false;
  if (typeof recordDayHistory === 'function') recordDayHistory();
  return { applied: true, goodIds: targets };
}

function spawnEvents() {
  // 每天 0~3 个事件，只作用于今天可交易的商品
  // 生态事件第 2 天起，受影响商品不再参与普通突发事件
  // 从未出现过的商品，第一次出现当天不触发突发事件
  const existingTargets = new Set(state.events.map(event => event.goodId));
  let pool = state.availableGoods.filter(id => state.lastSeenPrice[id] != null && !existingTargets.has(id));
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
  const targets = weightedSample(pool, count, id => goodById(id).market.eventWeight);
  for (const goodId of targets) {
    const ev = makeEvent(goodId);
    if (!ev) continue;
    ev.source = 'natural';
    state.events.push(ev);
    state.logs.unshift(`第${state.day}天：${ev.title} ${ev.desc}`);
  }
  state.logs = state.logs.slice(0, 50);
}

function toMarketFactor(displayFactor, deviationScale) {
  return Math.pow(Math.max(0.001, displayFactor), 1 / deviationScale);
}

function toDisplayLog(marketLog, deviationScale) {
  return marketLog * deviationScale;
}

function resolveDirectionalImpactLog(event, oldFactor, baselineLog, deviationScale) {
  const oldLog = Math.log(Math.max(0.02, Math.min(50, oldFactor)));
  const safeBaselineLog = Math.max(Math.log(0.02), Math.min(Math.log(50), baselineLog));
  const referenceLog = event.type === 'good'
    ? Math.max(oldLog, safeBaselineLog)
    : event.type === 'bad'
      ? Math.min(oldLog, safeBaselineLog)
      : safeBaselineLog;
  const rawLog = referenceLog + toDisplayLog(Math.log(event.impactMult), deviationScale);
  if (event.type === 'good') {
    return Math.max(rawLog, Math.min(Math.log(50), oldLog + Math.log(1.05)));
  }
  if (event.type === 'bad') {
    return Math.min(rawLog, Math.max(Math.log(0.02), oldLog + Math.log(0.95)));
  }
  return rawLog;
}

function updateGoodPrice(g, forcedEvent = null, options = {}) {
    const oldPrice = state.prices[g.id];
    const oldFactor = state.factors[g.id] || 1;
    const priceRules = getEffectiveRules(state.profession).price;
    const goodPriceRules = priceRules.byGood[g.id] || {};
    const deviationScale = goodPriceRules.deviationScale || 1;
    const modelOldFactor = toMarketFactor(oldFactor, deviationScale);
    let modelLogF = Math.log(modelOldFactor);
    let logF;

    const ecoOn = !options.skipEcology && !forcedEvent && state.eco && ecoAffected(g.id) && ecoRel() >= 2;
    if (ecoOn) {
      // 价格高度由锚点目标控制，阶段间倍率同时保证当日方向与新闻一致。
      const targetLog = Math.log(ecoTargetFactor(g.id));
      const targetCandidateLog = modelLogF + (targetLog - modelLogF) * 0.6;
      const movementMult = ecoCurrentMovementMults()[g.id] || 1;
      const movementCandidateLog = modelLogF + Math.log(movementMult) * 0.6;
      modelLogF = movementMult > 1
        ? Math.max(targetCandidateLog, movementCandidateLog)
        : movementMult < 1
          ? Math.min(targetCandidateLog, movementCandidateLog)
          : targetCandidateLog;
      logF = toDisplayLog(modelLogF, deviationScale);
    } else {
      const inEventAftershock = modelOldFactor < g.market.ordinaryFloor || modelOldFactor > g.market.ordinaryCeiling;
      const previousPrice = state.prevPrices[g.id] || oldPrice;
      const previousFactor = Math.max(0.001, previousPrice / g.base);
      const modelPreviousFactor = toMarketFactor(previousFactor, deviationScale);
      const previousReturn = Math.max(-0.12, Math.min(0.12, Math.log(modelOldFactor / modelPreviousFactor)));
      const recovery = inEventAftershock ? Math.max(0.18, g.market.meanReversion) : g.market.meanReversion;
      modelLogF += -modelLogF * recovery;
      modelLogF += previousReturn * g.market.momentum;
      modelLogF += randn() * g.market.volatility * BALANCE_CONFIG.NATURAL_VOLATILITY_SCALE * (inEventAftershock ? 0.35 : 1);

      if (!inEventAftershock && Math.random() < 0.08) {
        const positive = Math.random() < g.market.positiveBias;
        const pulse = 0.03 + Math.random() * g.market.volatility * 1.5;
        modelLogF += positive ? pulse : -pulse;
      }

      if (!inEventAftershock) {
        modelLogF += priceRules.ordinaryLogBias || 0;
        const minFactor = Math.max(0.2, g.market.ordinaryFloor + (priceRules.ordinaryFloorShift || 0));
        const maxFactor = Math.min(g.market.ordinaryCeiling, priceRules.ordinaryCeilingCap || Infinity);
        modelLogF = Math.max(Math.log(minFactor), Math.min(Math.log(maxFactor), modelLogF));
      }
      logF = toDisplayLog(modelLogF, deviationScale);

      // 4. 方向冲击同时战胜昨日实际价与当日无事件基准价。
      const ev = forcedEvent || (options.ignoreActiveEvent ? null : activeEventFor(g.id));
      if (ev) {
        logF = resolveDirectionalImpactLog(ev, oldFactor, logF, deviationScale);
      }
    }

    // 限制倍数范围，避免极端值
    logF = Math.max(Math.log(0.02), Math.min(Math.log(50), logF));

    const newFactor = Math.exp(logF);
    const newPrice = +(g.base * newFactor).toFixed(2);
    state.factors[g.id] = newFactor;
    state.prices[g.id] = newPrice;
    state.prevPrices[g.id] = oldPrice;
}

function updatePrices() {
  GOODS.forEach(g => updateGoodPrice(g));

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

function calcDailyFee() {
  const baseFee = GOODS.reduce((sum, g) => sum + (state.inventory[g.id] || 0) * BALANCE_CONFIG.STORAGE_FEE_RATE * g.base, 0);
  return baseFee * getEffectiveRules(state.profession).dailyFeeMultiplier;
}

function calcOperatingCost(day = state.day) {
  const safeDay = Math.max(1, Math.min(CONFIG.DAYS_LIMIT, Math.floor(Number(day) || 1)));
  const stage = BALANCE_CONFIG.OPERATING_COST_STAGES.find(item => safeDay >= item.startDay && safeDay <= item.endDay);
  return stage.base * Math.pow(stage.growth, safeDay - stage.startDay) * BALANCE_CONFIG.OPERATING_COST_MULTIPLIER;
}

function professionNaturalEventIntensity() {
  return state && state.profession && state.profession.id === 'speculator' ? 1.2 : 1;
}

function calcRemainingOperatingCost(day = state.day) {
  const safeDay = Math.max(1, Math.min(CONFIG.DAYS_LIMIT, Math.floor(Number(day) || 1)));
  let total = 0;
  for (let currentDay = safeDay; currentDay <= CONFIG.DAYS_LIMIT; currentDay++) total += calcOperatingCost(currentDay);
  return total;
}

function calcTotalDailyCost(day = state.day) {
  return calcOperatingCost(day) + calcDailyFee();
}

function liquidateInventory(shortfall, liquidationItems = []) {
  let need = shortfall;
  const entries = Object.keys(state.inventory)
    .filter(id =>
      state.inventory[id] > 0 &&
      !isGoodSaleLocked(id) &&
      (BALANCE_CONFIG.ALLOW_OFF_MARKET_LIQUIDATION || state.availableGoods.includes(id))
    )
    .map(id => {
      const qty = state.inventory[id];
      const avg = (state.costBasis[id] || 0) / qty;
      const listed = state.availableGoods.includes(id);
      const price = listed
        ? knownPrice(id) * BALANCE_CONFIG.LIQUIDATION_RATE
        : avg * BALANCE_CONFIG.OFF_MARKET_LIQUIDATION_RATE;
      return { id, qty, avg, listed, price };
    });
  entries.sort((a, b) => Number(b.listed) - Number(a.listed) || b.qty - a.qty || b.avg - a.avg);
  for (const e of entries) {
    if (need <= 0) break;
    const netUnitPrice = calculateSaleSettlement(e.id, 1, e.price).net;
    if (netUnitPrice <= 0) continue;
    let qtyToSell = Math.min(e.qty, Math.ceil(need / netUnitPrice));
    if (qtyToSell <= 0) continue;
    const settlement = calculateSaleSettlement(e.id, qtyToSell, e.price);
    state.cash += settlement.net;
    state.inventory[e.id] -= qtyToSell;
    state.costBasis[e.id] = (state.costBasis[e.id] || 0) - e.avg * qtyToSell;
    if (state.inventory[e.id] <= 0) { delete state.inventory[e.id]; delete state.costBasis[e.id]; }
    liquidationItems.push({
      goodId: e.id,
      goodName: goodById(e.id).name,
      quantity: qtyToSell,
      listed: e.listed,
      unitPrice: +e.price.toFixed(2),
      grossRevenue: settlement.gross,
      saleFee: settlement.fee,
      netRevenue: settlement.net
    });
    need -= settlement.net;
  }
  return need <= 0;
}

function applyDailyCosts(day = state.day) {
  const operating = +calcOperatingCost(day).toFixed(2);
  const fee = +calcDailyFee().toFixed(2);
  const totalCost = +(operating + fee).toFixed(2);
  const liquidationItems = [];
  const result = { operating, storage: fee, total: totalCost, forcedLiquidations: liquidationItems };
  if (totalCost <= 0) return result;
  state.runStats.totalFeesPaid = +(state.runStats.totalFeesPaid + fee).toFixed(2);

  if (state.cash >= totalCost) {
    state.cash = +(state.cash - totalCost).toFixed(2);
  } else {
    state.runStats.forcedLiquidations++;
    const shortfall = totalCost - state.cash;
    state.cash = 0;
    const ok = liquidateInventory(shortfall, liquidationItems);
    if (ok) {
      state.cash = +Math.max(0, state.cash - shortfall).toFixed(2);
    } else {
      state.cash = +state.cash.toFixed(2);
      state.gameOver = 'lose';
      state.logs.unshift('💀 游戏结束：破产（强制平仓后仍无法支付支出）');
    }
  }
  return result;
}

