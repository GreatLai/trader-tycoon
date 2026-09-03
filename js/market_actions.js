function recordCurrentPrice(id) {
  const history = state.priceHistory[id];
  if (history.length && history[history.length - 1].day === state.day) history[history.length - 1].price = state.prices[id];
  else history.push({ day: state.day, price: state.prices[id] });
  if (state.availableGoods.includes(id)) state.lastSeenPrice[id] = state.prices[id];
}

function queueNotice(title, desc, source = 'profession') {
  state.eventNoticeQueue.push({ title, desc, source });
}

function refreshMarketGood(id, options = {}) {
  const good = goodById(id);
  if (!good) return { ok: false, reason: 'unknown-good' };
  if (options.requireListed && !state.availableGoods.includes(id)) return { ok: false, reason: 'not-listed' };

  const firstAppearance = state.lastSeenPrice[id] == null;
  const eventChance = Number.isFinite(options.eventChance) ? Math.max(0, options.eventChance) : 0;
  const event = !firstAppearance && Math.random() < eventChance
    ? makeEvent(id, null, { guaranteedMovement: options.guaranteedEvent === true })
    : null;
  updateGoodPrice(good, event, { skipEcology: options.skipEcology === true });
  recordCurrentPrice(id);
  if (event) {
    event.source = options.source || 'system';
    state.events.push(event);
    state.logs.unshift(`第${state.day}天：${event.title} ${event.desc}`);
    queueNotice(event.title, event.desc);
  }
  return { ok: true, event };
}

function eligibleProfessionAbilityTargets() {
  const profession = PROFESSIONS[normalizeProfessionId(state.profession && state.profession.id)];
  if (!profession.activeAbility || professionAbilityReadyDay(profession) > state.day) return [];
  if (profession.activeAbility.id === 'raisePrice') {
    return state.availableGoods.filter(id =>
      (state.inventory[id] || 0) > 0 &&
      state.goodsBoughtDay[id] !== state.day &&
      !isGoodSaleLocked(id) &&
      state.prices[id] / goodById(id).base < 1.45
    );
  }
  if (profession.activeAbility.id === 'marketTrip') {
    return Object.keys(state.inventory).filter(id =>
      (state.inventory[id] || 0) > 0
    );
  }
  if (profession.activeAbility.id === 'stokeMarket') {
    return [...new Set(state.events
      .filter(event => event.source === 'natural')
      .map(event => event.goodId))];
  }
  return [];
}

function forceGoodsIntoMarket(goodIds) {
  const requiredIds = [...new Set(goodIds)].filter(id => goodById(id));
  const protectedIds = new Set(requiredIds);
  const added = [];
  requiredIds.forEach(id => {
    if (state.availableGoods.includes(id)) return;
    const candidates = state.availableGoods
      .filter(candidateId => !protectedIds.has(candidateId))
      .sort((a, b) => (state.factors[b] || 0) - (state.factors[a] || 0) || a.localeCompare(b));
    if (!candidates.length) return;
    const replaceIndex = state.availableGoods.indexOf(candidates[0]);
    state.availableGoods.splice(replaceIndex, 1, id);
    added.push(id);
  });
  return added;
}

function applyProfessionNextDayMarket(previousEvents = []) {
  if (!state.profession || state.profession.id !== 'speculator') return { applied: false, reason: 'unsupported-profession' };
  const requiredIds = previousEvents
    .filter(event => event.source === 'natural')
    .map(event => event.goodId);
  const pending = state.profession.data.pendingFollowUp;
  if (pending && pending.dueDay === state.day) requiredIds.push(pending.goodId);
  const addedGoodIds = forceGoodsIntoMarket(requiredIds);
  return addedGoodIds.length
    ? { applied: true, addedGoodIds }
    : { applied: false, reason: 'no-follow-targets' };
}

function resolveProfessionScheduledEvents() {
  if (!state.profession || state.profession.id !== 'speculator') return null;
  const pending = state.profession.data.pendingFollowUp;
  if (!pending || pending.dueDay !== state.day) return null;
  const continues = Math.random() < 0.70;
  const positive = continues ? pending.originalPositive : !pending.originalPositive;
  const event = makeEvent(pending.goodId, positive, { forcedByCard: false, allowRare: false, guaranteedMovement: true });
  const currentFactor = state.prices[pending.goodId] / goodById(pending.goodId).base;
  event.targetMult = positive
    ? +Math.min(50, Math.max(event.targetMult, currentFactor * 1.08)).toFixed(3)
    : +Math.max(0.02, Math.min(event.targetMult, currentFactor * 0.92)).toFixed(3);
  event.source = 'profession-follow-up';
  event.title = positive ? '📈 后续报道 · 风声续涨' : '📉 后续报道 · 风向突变';
  event.desc = `${goodById(pending.goodId).name}的后续消息落地，行情${positive ? '继续走高' : '转向下跌'}。`;
  state.events.push(event);
  state.logs.unshift(`第${state.day}天：${event.title} ${event.desc}`);
  const followUpMemory = state.tradeMemories[pending.goodId] || (state.tradeMemories[pending.goodId] = {});
  followUpMemory.speculatorFollowUp = true;
  delete state.profession.data.pendingFollowUp;
  return event;
}

function applyProfessionMarketPassive() {
  const professionId = normalizeProfessionId(state.profession && state.profession.id);
  if (professionId !== 'travelingMerchant') return { applied: false, reason: 'unsupported-profession' };

  const heldIds = Object.keys(state.inventory).filter(id => (state.inventory[id] || 0) > 0);
  if (heldIds.some(id => state.availableGoods.includes(id))) return { applied: false, reason: 'inventory-listed' };
  if (!heldIds.length) return { applied: false, reason: 'no-inventory' };
  if (Math.random() >= 0.65) return { applied: false, reason: 'roll-failed' };

  const broughtGoodId = heldIds.sort((a, b) =>
    (state.costBasis[b] || 0) - (state.costBasis[a] || 0) || a.localeCompare(b)
  )[0];
  const replaceable = state.availableGoods.filter(id => !(state.inventory[id] > 0));
  if (!replaceable.length) return { applied: false, reason: 'no-replacement' };
  const replacedGoodId = replaceable.sort((a, b) =>
    (state.factors[b] || 0) - (state.factors[a] || 0) || a.localeCompare(b)
  )[0];
  const index = state.availableGoods.indexOf(replacedGoodId);
  state.availableGoods.splice(index, 1, broughtGoodId);
  state.logs.unshift(`第${state.day}天：行商沿熟路带回${goodById(broughtGoodId).name}。`);
  return { applied: true, broughtGoodId, replacedGoodId };
}

function calculateSaleSettlement(id, qty, unitPrice) {
  const gross = +(qty * unitPrice).toFixed(2);
  const data = state.profession && state.profession.data || {};
  const feeRate = state.profession && state.profession.id === 'travelingMerchant' &&
    data.marketTripGoodId === id && data.marketTripDay === state.day ? 0.05 : 0;
  const fee = +(gross * feeRate).toFixed(2);
  return { gross, fee, net: +(gross - fee).toFixed(2), feeRate };
}

function professionAbilityReadyDay(profession = PROFESSIONS[normalizeProfessionId(state.profession && state.profession.id)]) {
  const usedDay = state.profession && state.profession.activeUsedDay;
  if (!profession.activeAbility || !Number.isFinite(usedDay)) return state.day;
  return usedDay + (profession.activeAbility.cooldownDays || 1);
}

function eligibleProfessionEcoEvents() {
  const profession = PROFESSIONS[normalizeProfessionId(state.profession && state.profession.id)];
  if (!profession.activeAbility || profession.activeAbility.id !== 'windVane') return [];
  const allowed = getEffectiveRules(state.profession).trade.allowedGoodIds || [];
  const wealth = Math.max(netWorth(), state.peakNetWorth || 0);
  return Object.entries(ECO_EVENTS)
    .filter(([, event]) => (!event.unlock || wealth >= event.unlock) && event.goods.some(id => allowed.includes(id)))
    .map(([id]) => id);
}

function useProfessionAbility(targetId) {
  const profession = PROFESSIONS[normalizeProfessionId(state.profession && state.profession.id)];
  if (!profession.activeAbility) return { ok: false, reason: 'no-active-ability' };
  if (state.profession.activeUsedDay === state.day) return { ok: false, reason: 'already-used' };
  const readyDay = professionAbilityReadyDay(profession);
  if (readyDay > state.day) return { ok: false, reason: 'cooldown', readyDay };
  if (profession.activeAbility.id === 'windVane') {
    if (state.eco) return { ok: false, reason: 'active-ecology' };
    const candidates = eligibleProfessionEcoEvents();
    if (!candidates.length) return { ok: false, reason: 'no-eligible-ecology' };
    const treeId = candidates[Math.floor(Math.random() * candidates.length)];
    const tree = ECO_EVENTS[treeId];
    state.profession.activeUsedDay = state.day;
    state.eco = { treeId, startDay: state.day, A: null, B: null, C: null, byCard: false, byProfession: true };
    state.ecoPopup = { special: true, title: tree.announce.title || '国际新闻', desc: tree.announce.desc };
    state.ecoPopupShown = false;
    state.logs.unshift(`第${state.day}天：盐铁专营使用风向标。${tree.announce.desc}`);
    queueNotice('盐铁专营 · 风向标', tree.announce.desc);
    return { ok: true, treeId, startDay: state.day };
  }
  if (!eligibleProfessionAbilityTargets().includes(targetId)) return { ok: false, reason: 'invalid-target' };

  if (profession.activeAbility.id === 'raisePrice') {
    const good = goodById(targetId);
    const oldPrice = state.prices[targetId];
    state.profession.activeUsedDay = state.day;
    if (Math.random() < 0.20) {
      const unlockDay = state.day + 3;
      state.saleLockUntilDay[targetId] = unlockDay;
      const desc = `${good.name}抬价失败，货物被查封；第${unlockDay}天恢复出售。`;
      state.logs.unshift(`第${state.day}天：牙商抬价失败。${desc}`);
      queueNotice('牙商 · 抬价失败', desc);
      return { ok: false, reason: 'raise-failed', goodId: targetId, unlockDay };
    }
    const oldFactor = oldPrice / good.base;
    const minFactor = Math.max(1.15, oldFactor + 0.05);
    const factor = minFactor + Math.random() * Math.max(0, 1.45 - minFactor);
    state.prices[targetId] = +(good.base * Math.min(1.45, factor)).toFixed(2);
    state.prevPrices[targetId] = oldPrice;
    state.factors[targetId] = state.prices[targetId] / good.base;
    recordCurrentPrice(targetId);
    const raiseMemory = state.tradeMemories[targetId] || (state.tradeMemories[targetId] = {});
    raiseMemory.toothRaised = true;
    const desc = `${good.name}被抬至 ¥${fmt(state.prices[targetId], 2)}，今日可按新价格交易。`;
    state.logs.unshift(`第${state.day}天：牙商使用抬价。${desc}`);
    queueNotice('牙商 · 抬价', desc);
    return { ok: true, goodId: targetId, price: state.prices[targetId] };
  }

  if (profession.activeAbility.id === 'marketTrip') {
    state.profession.activeUsedDay = state.day;
    if (!state.availableGoods.includes(targetId)) state.availableGoods.push(targetId);
    state.profession.data.marketTripGoodId = targetId;
    state.profession.data.marketTripDay = state.day;
    const refresh = refreshMarketGood(targetId, { eventChance: 0.15, guaranteedEvent: true, source: 'profession', skipEcology: true });
    const good = goodById(targetId);
    const tripMemory = state.tradeMemories[targetId] || (state.tradeMemories[targetId] = {});
    tripMemory.marketTrip = true;
    const desc = `${good.name}已赶集上架，今日成交收入将扣除 5% 路费。`;
    state.logs.unshift(`第${state.day}天：行商使用赶集。${desc}`);
    queueNotice('行商 · 赶集', desc);
    return { ok: true, goodId: targetId, price: state.prices[targetId], event: refresh.event };
  }

  if (profession.activeAbility.id === 'stokeMarket') {
    const sourceEvent = state.events.find(event => event.source === 'natural' && event.goodId === targetId);
    state.profession.activeUsedDay = state.day;
    state.profession.data.pendingFollowUp = {
      goodId: targetId,
      originalPositive: sourceEvent.type === 'good',
      dueDay: state.day + 1
    };
    const good = goodById(targetId);
    const desc = `${good.name}已安排次日后续报道，风向可能延续，也可能反转。`;
    state.logs.unshift(`第${state.day}天：投机商使用煽风点火。${desc}`);
    queueNotice('投机商 · 煽风点火', desc);
    return { ok: true, goodId: targetId, dueDay: state.day + 1 };
  }

  return { ok: false, reason: 'unsupported-ability' };
}
