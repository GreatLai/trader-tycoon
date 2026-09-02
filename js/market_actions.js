function recordCurrentPrice(id) {
  const history = state.priceHistory[id];
  if (history.length && history[history.length - 1].day === state.day) history[history.length - 1].price = state.prices[id];
  else history.push({ day: state.day, price: state.prices[id] });
  if (state.availableGoods.includes(id)) state.lastSeenPrice[id] = state.prices[id];
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

