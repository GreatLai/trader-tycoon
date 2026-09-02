function createBaseRules() {
  return {
    marketSize: CONFIG.MARKET_SIZE,
    ecoMarketSize: CONFIG.ECO_MARKET_SIZE,
    dailyFeeMultiplier: 1,
    warehouseCapacityMultiplier: 1,
    listingWeights: {},
    price: {},
    events: {}
  };
}

function applyProfessionRules(baseRules, profession, professionState) {
  const rules = {
    ...baseRules,
    listingWeights: { ...baseRules.listingWeights },
    price: { ...baseRules.price },
    events: { ...baseRules.events }
  };
  if (profession && profession.modifyRules) profession.modifyRules(rules, professionState);
  return rules;
}

function getEffectiveRules(professionState = null) {
  const rules = createBaseRules();
  const professionId = normalizeProfessionId(professionState && professionState.id);
  const profession = PROFESSIONS[professionId];
  return applyProfessionRules(rules, profession, professionState);
}
