const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT_FILES = [
  'js/config.js',
  'js/utils.js',
  'js/eco.js',
  'js/state.js',
  'js/shop.js',
  'js/events.js',
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
      CONFIG,
      ECO_EVENTS,
      GOODS,
      WAREHOUSE_CAPACITY_BY_MILESTONE,
      applyDailyCosts,
      buy,
      buyCard,
      calcDailyFee,
      capacity,
      ecoCurrentMult,
      ecoBranchWeight,
      ecoVolatileBranchWeight,
      ecoRel,
      forecastCategories,
      generateShopStock,
      eventPositiveChance,
      eventMovementChance,
      eventRareChance,
      refreshShopIfNeeded,
      getState() { return state; },
      loadSave: load,
      netWorth,
      newState() { return newState(); },
      nextDay,
      parseTradeQuantity,
      pickGoods,
      reset() { state = null; state = newState(); generateShopStock(); return state; },
      sell,
      setRandom(value) { Math.random = value; },
      setState(value) { state = value; },
      spawnEvents,
      totalUnits,
      updateGoodPrice,
      useCard
    };
  `, context);

  return { api: context.gameApi, storage };
}

module.exports = { ROOT, createGame };
