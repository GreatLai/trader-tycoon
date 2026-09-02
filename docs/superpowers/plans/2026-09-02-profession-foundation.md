# Profession Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add profession-ready engine boundaries while preserving the exact standard `v1.8.1` game.

**Architecture:** Register professions as immutable definitions, derive effective run rules through a copied rule context, store permanent progression separately from run state, and route intentional market mutations through shared commands. The `useless` profession is the compatibility baseline and changes no values or random calls.

**Tech Stack:** Plain JavaScript, browser `localStorage`, Node.js built-in test runner, VM-based game test harness.

---

### Task 1: Profession registry and rule context

**Files:**
- Create: `js/professions.js`
- Create: `js/rules.js`
- Modify: `index.html`
- Modify: `tests/helpers/load-game.js`
- Test: `tests/profession-foundation.test.js`

- [ ] Write failing tests asserting `useless` is the default profession, invalid ids normalize to `useless`, and base effective rules equal current market, fee, and capacity values.
- [ ] Run `node --test tests/profession-foundation.test.js` and verify the missing registry and rule functions fail.
- [ ] Implement `PROFESSIONS`, `DEFAULT_PROFESSION_ID`, `normalizeProfessionId()`, `newProfessionState()`, and `getEffectiveRules()` without profession-specific branches.
- [ ] Add the scripts before state and rule consumers in `index.html` and the VM test loader.
- [ ] Run the focused test and verify it passes.
- [ ] Commit with `git commit -m "refactor: add profession rule foundation"`.

### Task 2: Run state and compatibility normalization

**Files:**
- Modify: `js/state.js`
- Modify: `js/save.js`
- Test: `tests/profession-foundation.test.js`

- [ ] Add failing tests for new-run profession state, new-run statistics, and legacy saves missing or containing invalid profession data.
- [ ] Run the focused test and verify the new assertions fail.
- [ ] Add serializable `profession` and `runStats` fields to `newState()` and normalize both fields in `normalizeSave()`.
- [ ] Run the focused test and the full `npm test` suite.
- [ ] Commit with `git commit -m "feat: persist profession run state"`.

### Task 3: Route base rules through the context

**Files:**
- Modify: `js/game.js`
- Modify: `js/events.js`
- Modify: `js/state.js`
- Test: `tests/profession-foundation.test.js`

- [ ] Add failing tests asserting normal and ecology market sizes, fees, and capacity are unchanged under `useless`.
- [ ] Add a deterministic same-seed 90-day no-trade comparison fixture for the base rules.
- [ ] Replace direct market-size, fee multiplier, and capacity multiplier reads with `getEffectiveRules()` values while preserving random call order.
- [ ] Update `runStats` during daily advancement, fee payment, and forced liquidation.
- [ ] Run focused and full tests.
- [ ] Commit with `git commit -m "refactor: route gameplay through effective rules"`.

### Task 4: Permanent career profile

**Files:**
- Create: `js/profile.js`
- Modify: `js/config.js`
- Modify: `index.html`
- Modify: `tests/helpers/load-game.js`
- Test: `tests/profession-foundation.test.js`

- [ ] Add failing tests for the default profile, normalization, separate storage key, `clearSave()` preservation, and per-profession best records.
- [ ] Implement `PROFILE_SAVE_KEY`, `newProfile()`, `normalizeProfile()`, `loadProfile()`, `saveProfile()`, and `recordRunResult()`.
- [ ] Ensure the initial unlocked list contains only `useless` and unknown profession ids are discarded.
- [ ] Run focused and full tests.
- [ ] Commit with `git commit -m "feat: add persistent career profile"`.

### Task 5: Shared market commands

**Files:**
- Create: `js/market_actions.js`
- Modify: `index.html`
- Modify: `tests/helpers/load-game.js`
- Test: `tests/profession-foundation.test.js`

- [ ] Add failing tests for refreshing a listed good, rejecting unavailable goods, and preserving event notifications.
- [ ] Keep market mutation and profession ability validation outside the UI layer.
- [ ] Run focused and full tests.
- [ ] Commit with `git commit -m "refactor: share market mutation commands"`.

### Task 6: Documentation and final compatibility audit

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-02-profession-foundation-design.md`

- [ ] Document the run/profile separation and profession extension points without claiming concrete careers exist.
- [ ] Run `git diff --check`.
- [ ] Run `npm test` and require all existing and new tests to pass.
- [ ] Inspect `git diff main...HEAD` for balance changes, random-call changes, and accidental UI additions.
- [ ] Commit with `git commit -m "docs: document profession architecture"`.
