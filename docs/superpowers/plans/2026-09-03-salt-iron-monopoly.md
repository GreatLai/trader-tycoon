# Salt Iron Monopoly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Salt Iron Monopoly profession and complete ecological-event coverage for all twenty goods.

**Architecture:** Extend effective profession rules with trade permissions and per-good ordinary-price modifiers. Reuse the existing ecology state machine for Wind Vane by selecting an eligible existing tree, and add three data-driven ecology trees for the previously uncovered goods.

**Tech Stack:** Browser JavaScript, static HTML/CSS, Node.js deterministic tests and balance simulator.

---

### Task 1: Complete ecology coverage

**Files:**
- Modify: `js/config.js`
- Modify: `tests/game-regressions.test.js`

- [ ] Add failing tests requiring every good to appear in at least one complete ecology tree.
- [ ] Add Civil Supply Control, Manufacturing Revival, and Lunar Resource Development with complete A/B/C multipliers.
- [ ] Run the regression tests and verify all event structures pass.

### Task 2: Add profession rules and trade enforcement

**Files:**
- Modify: `js/professions.js`
- Modify: `js/rules.js`
- Modify: `js/events.js`
- Modify: `js/trading.js`
- Modify: `js/ui.js`
- Modify: `tests/profession-gameplay.test.js`

- [ ] Add failing tests for the five-profession roster, four licensed goods, unchanged U-good lock, denied non-licensed trades, and expanded ordinary price rules.
- [ ] Add `canTradeGood()` and per-good price modifiers to effective rules.
- [ ] Enforce permissions in buy, sell, percentage quantities and rendered controls.
- [ ] Run profession and regression tests.

### Task 3: Add Wind Vane

**Files:**
- Modify: `js/market_actions.js`
- Modify: `js/main.js`
- Modify: `tests/profession-gameplay.test.js`

- [ ] Add failing tests for eligible ecology filtering, seven-day cooldown, active-ecology rejection and next-day branch progression.
- [ ] Implement the targetless ability through the existing profession button and event notice queue.
- [ ] Verify that use does not bypass event unlock requirements or alter event multipliers.

### Task 4: Verify and release

**Files:**
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `CHANGELOG.md`
- Modify: `version.json`
- Modify: `index.html`
- Modify: `js/config.js`

- [ ] Run targeted profession simulations and the complete test suite.
- [ ] Update player-facing documentation and release metadata to v1.16.0.
- [ ] Commit, push main, tag v1.16.0 and create the GitHub Release.
