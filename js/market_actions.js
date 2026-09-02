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
  const event = !firstAppearance && Math.random() < eventChance ? makeEvent(id) : null;
  updateGoodPrice(good, event);
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
  if (!profession.activeAbility || state.profession.activeUsedDay === state.day) return [];
  if (profession.activeAbility.id === 'raisePrice') {
    return state.availableGoods.filter(id => (state.inventory[id] || 0) > 0);
  }
  return [];
}

function useProfessionAbility(targetId) {
  const profession = PROFESSIONS[normalizeProfessionId(state.profession && state.profession.id)];
  if (!profession.activeAbility) return { ok: false, reason: 'no-active-ability' };
  if (state.profession.activeUsedDay === state.day) return { ok: false, reason: 'already-used' };
  if (!eligibleProfessionAbilityTargets().includes(targetId)) return { ok: false, reason: 'invalid-target' };

  if (profession.activeAbility.id === 'raisePrice') {
    const good = goodById(targetId);
    const oldPrice = state.prices[targetId];
    const factor = 1.15 + Math.random() * 0.30;
    state.prices[targetId] = +(good.base * factor).toFixed(2);
    state.prevPrices[targetId] = oldPrice;
    state.factors[targetId] = state.prices[targetId] / good.base;
    recordCurrentPrice(targetId);
    state.profession.activeUsedDay = state.day;
    const desc = `${good.name}被抬至 ¥${fmt(state.prices[targetId], 2)}，今日可按新价格交易。`;
    state.logs.unshift(`第${state.day}天：牙商使用抬价。${desc}`);
    queueNotice('牙商 · 抬价', desc);
    return { ok: true, goodId: targetId, price: state.prices[targetId] };
  }

  return { ok: false, reason: 'unsupported-ability' };
}
