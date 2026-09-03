function createBaseRules() {
  return {
    marketSize: CONFIG.MARKET_SIZE,
    ecoMarketSize: CONFIG.ECO_MARKET_SIZE,
    dailyFeeMultiplier: 1,
    warehouseCapacityMultiplier: 1,
    listingWeights: {},
    trade: { allowedGoodIds: null },
    price: { byGood: {} },
    events: {}
  };
}

function applyProfessionRules(baseRules, profession, professionState) {
  const rules = {
    ...baseRules,
    listingWeights: { ...baseRules.listingWeights },
    trade: { ...baseRules.trade },
    price: { ...baseRules.price, byGood: { ...baseRules.price.byGood } },
    events: { ...baseRules.events }
  };
  if (profession && profession.modifyRules) profession.modifyRules(rules, professionState);
  return rules;
}

function canTradeGood(id, professionState = null) {
  const activeProfession = professionState || (state && state.profession);
  const allowed = getEffectiveRules(activeProfession).trade.allowedGoodIds;
  return !Array.isArray(allowed) || allowed.includes(id);
}

function getEffectiveRules(professionState = null) {
  const rules = createBaseRules();
  const professionId = normalizeProfessionId(professionState && professionState.id);
  const profession = PROFESSIONS[professionId];
  return applyProfessionRules(rules, profession, professionState);
}
