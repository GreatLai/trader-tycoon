const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT_FILES = [
  'js/config.js',
  'js/utils.js',
  'js/eco.js',
  'js/professions.js',
  'js/rules.js',
  'js/profile.js',
  'js/state.js',
  'js/market_actions.js',
  'js/events.js',
  'js/achievements.js',
  'js/trading.js',
  'js/game.js',
  'js/save.js'
];

function createElement() {
  return {
    className: '',
    disabled: false,
    innerHTML: '',
    style: {},
    textContent: '',
    classList: {
      add() {},
      remove() {},
      toggle() {}
    }
  };
}

function createGame(options = {}) {
  const storage = new Map();
  if (options.savedState) {
    storage.set('trader-tycoon-save-v17', JSON.stringify(options.savedState));
  }

  const math = Object.create(Math);
  if (options.random) math.random = options.random;

  const context = {
    Math: math,
    clearTimeout() {},
    confirm() { return true; },
    console,
    document: { getElementById: createElement },
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      removeItem(key) { storage.delete(key); },
      setItem(key, value) { storage.set(key, value); }
    },
    setTimeout() {}
  };

  vm.createContext(context);
  for (const relativePath of SCRIPT_FILES) {
    const filename = path.join(ROOT, relativePath);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  }

  vm.runInContext(`
    function toast() {}
    function render() { checkMilestones(); }
    globalThis.gameApi = {
      APP_VERSION,
      BALANCE_CONFIG,
      CONFIG,
      DEFAULT_PROFESSION_ID: typeof DEFAULT_PROFESSION_ID === 'undefined' ? undefined : DEFAULT_PROFESSION_ID,
      ECO_EVENTS,
      GOODS,
      PROFESSIONS: typeof PROFESSIONS === 'undefined' ? undefined : PROFESSIONS,
      WAREHOUSE_CAPACITY_BY_MILESTONE,
      applyDailyCosts,
      applyProfessionMarketPassive: typeof applyProfessionMarketPassive === 'function' ? applyProfessionMarketPassive : undefined,
      applyProfessionNextDayMarket: typeof applyProfessionNextDayMarket === 'function' ? applyProfessionNextDayMarket : undefined,
      applyProfessionRules: typeof applyProfessionRules === 'function' ? applyProfessionRules : undefined,
      advanceEcology: typeof advanceEcology === 'function' ? advanceEcology : undefined,
      buy,
      calcDailyFee,
      calcOperatingCost: typeof calcOperatingCost === 'function' ? calcOperatingCost : undefined,
      calcRemainingOperatingCost: typeof calcRemainingOperatingCost === 'function' ? calcRemainingOperatingCost : undefined,
      calcTotalDailyCost: typeof calcTotalDailyCost === 'function' ? calcTotalDailyCost : undefined,
      calculateSaleSettlement: typeof calculateSaleSettlement === 'function' ? calculateSaleSettlement : undefined,
      capacity,
      clearSave,
      createBaseRules: typeof createBaseRules === 'function' ? createBaseRules : undefined,
      ecoCurrentMult,
      ecoBranchWeight,
      ecoVolatileBranchWeight,
      ecoRel,
      eventPositiveChance,
      eventMovementChance,
      eventRareChance,
      refreshMarketGood: typeof refreshMarketGood === 'function' ? refreshMarketGood : undefined,
      getState() { return state; },
      loadSave: load,
      netWorth,
      newState() { return newState(); },
      nextDay,
      parseTradeQuantity,
      getPercentageTradeQuantity: typeof getPercentageTradeQuantity === 'function' ? getPercentageTradeQuantity : undefined,
      getEffectiveRules: typeof getEffectiveRules === 'function' ? getEffectiveRules : undefined,
      canTradeGood: typeof canTradeGood === 'function' ? canTradeGood : undefined,
      initializeOpeningMarket: typeof initializeOpeningMarket === 'function' ? initializeOpeningMarket : undefined,
      isGoodSaleLocked: typeof isGoodSaleLocked === 'function' ? isGoodSaleLocked : undefined,
      loadProfile: typeof loadProfile === 'function' ? loadProfile : undefined,
      makeEvent: typeof makeEvent === 'function' ? makeEvent : undefined,
      newProfile: typeof newProfile === 'function' ? newProfile : undefined,
      newProfessionState: typeof newProfessionState === 'function' ? newProfessionState : undefined,
      normalizeProfessionId: typeof normalizeProfessionId === 'function' ? normalizeProfessionId : undefined,
      recordRunResult: typeof recordRunResult === 'function' ? recordRunResult : undefined,
      resolveProfessionScheduledEvents: typeof resolveProfessionScheduledEvents === 'function' ? resolveProfessionScheduledEvents : undefined,
      saveProfile: typeof saveProfile === 'function' ? saveProfile : undefined,
      pickGoods,
      reset() { state = null; state = newState(); return state; },
      advanceBaselineDay(seed) {
        if (state.gameOver) return;
        applyDailyCosts(state.day);
        if (state.gameOver) return;
        if (state.day >= CONFIG.DAYS_LIMIT) {
          state.gameOver = 'time';
          return;
        }
        const oldRandom = Math.random;
        Math.random = mulberry32(seed);
        resolveNextDayState();
        Math.random = oldRandom;
        render();
      },
      sell,
      evaluateTradeAchievements: typeof evaluateTradeAchievements === 'function' ? evaluateTradeAchievements : undefined,
      setTradeInputMode: typeof setTradeInputMode === 'function' ? setTradeInputMode : undefined,
      setRandom(value) { Math.random = value; },
      setState(value) { state = value; },
      spawnEvents,
      totalUnits,
      updateGoodPrice,
      eligibleProfessionAbilityTargets: typeof eligibleProfessionAbilityTargets === 'function' ? eligibleProfessionAbilityTargets : undefined,
      eligibleProfessionEcoEvents: typeof eligibleProfessionEcoEvents === 'function' ? eligibleProfessionEcoEvents : undefined,
      unlockEligibleProfessions: typeof unlockEligibleProfessions === 'function' ? unlockEligibleProfessions : undefined,
      useProfessionAbility: typeof useProfessionAbility === 'function' ? useProfessionAbility : undefined
    };
  `, context);

  return { api: context.gameApi, storage };
}

module.exports = { ROOT, createGame };
