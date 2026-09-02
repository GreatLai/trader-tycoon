# Profession Foundation Design

## Objective

Prepare the game engine for unlockable professions without changing the current `v1.8.1` market behavior. The first registered profession is `useless`, which has no passive effect, active ability, or drawback and must remain identical to the existing standard game.

## Boundaries

- This branch adds architecture only. It does not implement the proposed merchant professions or tune balance numbers.
- A run stores only the selected profession id and serializable profession runtime data.
- Permanent unlocks and per-profession records live in a separate profile save.
- Cards and professions must call shared market operations instead of duplicating price refresh or listing behavior.
- Market, event, fee, and capacity rules are exposed through one rule context. Default rules reproduce the current constants exactly.

## Modules

### `js/professions.js`

Owns the profession registry, validation, default profession, and rule-modifier dispatch. Profession definitions are immutable configuration; functions are never written into a save.

### `js/rules.js`

Builds the effective rules for the current run. Base values come from `CONFIG`; the selected profession may modify a copied rule object. Consumers read effective values rather than branching on profession ids.

### `js/market_actions.js`

Owns reusable commands that intentionally mutate the market, beginning with single-good price refresh. Cards and future profession active abilities use the same command and validation path.

### `js/profile.js`

Owns the permanent career profile: schema version, unlocked profession ids, per-profession records, profile loading, normalization, and run-result recording. Clearing a run must not clear this profile.

## Run State

New runs contain:

```js
profession: {
  id: 'useless',
  activeUsedDay: null,
  data: {}
},
runStats: {
  maxDayReached: 1,
  peakNetWorth: CONFIG.START_CASH,
  forcedLiquidations: 0,
  totalFeesPaid: 0
}
```

Only fields needed for robust unlock and balance measurements are recorded. Trade-click counts are deliberately excluded because trades can be split and farmed.

## Rule Context

The initial effective rules expose:

```js
{
  marketSize: CONFIG.MARKET_SIZE,
  ecoMarketSize: CONFIG.ECO_MARKET_SIZE,
  dailyFeeMultiplier: 1,
  warehouseCapacityMultiplier: 1,
  listingWeights: {},
  price: {},
  events: {}
}
```

Empty price and event sections reserve stable extension points. They do not alter random call order or current output.

## Compatibility Contract

- Existing run saves without profession fields normalize to `useless`.
- Existing gameplay with `useless` uses the same random calls in the same order.
- Base market sizes remain five and seven.
- Base fees and warehouse capacities remain unchanged.
- Shop price-refresh behavior remains unchanged after moving to the shared market command.
- Profile data is never removed by `clearSave()`.

## Verification

- Unit tests cover profession validation, default rules, legacy run normalization, profile separation, run statistics, and shared market actions.
- A same-seed regression compares a standard run before and after rule-context integration.
- The complete existing test suite must pass without changed balance expectations.

