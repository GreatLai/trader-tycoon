# Debt Settlement Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parameterize and compare doubled operating costs with full-price listed liquidation and 20%-of-cost off-market liquidation.

**Architecture:** Keep live defaults unchanged while extending the shared engine with explicit balance parameters. The backend simulator applies candidate values through its existing scenario mechanism so baseline and candidate runs share identical seeds and strategies.

**Tech Stack:** Browser JavaScript game engine, Node.js test runner, deterministic backend balance simulator.

---

### Task 1: Define executable liquidation rules

**Files:**
- Modify: `tests/game-regressions.test.js`
- Modify: `js/config.js`
- Modify: `js/events.js`

- [ ] Write failing regression tests proving operating cost multiplication, full current-price listed liquidation, and off-market liquidation at 20% of inventory average cost.
- [ ] Run `node --test tests/game-regressions.test.js` and confirm the new assertions fail under v1.14.0 behavior.
- [ ] Add `OPERATING_COST_MULTIPLIER` and `OFF_MARKET_LIQUIDATION_RATE`, then select liquidation price by whether the good is listed.
- [ ] Re-run the regression file and confirm all tests pass.

### Task 2: Expose candidate rules to simulations

**Files:**
- Modify: `tests/balance-framework.test.js`
- Modify: `scripts/balance/index.js`

- [ ] Write a failing scenario test proving the simulator can apply the operating multiplier and off-market liquidation rate without leaking values into the next run.
- [ ] Run `node --test tests/balance-framework.test.js` and confirm the scenario test fails for missing mappings.
- [ ] Extend `applyOverrides()` and forced-liquidation attribution for listed and unlisted inventory.
- [ ] Re-run the balance framework tests and confirm they pass.

### Task 3: Run paired 100-seed comparison

**Files:**
- Create: `docs/balance/debt-settlement-candidate-v1.md`

- [ ] Run all pure trading strategies over the same first 100 calibration seeds under baseline and candidate scenarios.
- [ ] Record survival, survivor wealth, bankruptcy timing, liquidation frequency, and cash-danger changes, with a focused conclusion for the skilled strategy.
- [ ] Run `npm test` and confirm the full suite passes before presenting the result.
