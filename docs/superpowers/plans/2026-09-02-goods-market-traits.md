# Goods Market Traits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the market to twenty goods and make ordinary and sudden price behavior depend on stable per-good traits without altering authored ecology multipliers.

**Architecture:** Extend each `GOODS` entry with a validated market profile. Keep ordinary pricing, sudden events, ecology events, profession modifiers, and shelf selection as separate layers with explicit precedence.

**Tech Stack:** Vanilla JavaScript, Node.js test runner, Vite, generated WebP assets.

---

### Task 1: Lock Data Contracts With Tests

**Files:**
- Modify: `tests/game-regressions.test.js`
- Modify: `tests/profession-gameplay.test.js`

- [ ] Add failing tests for twenty complete goods, unique IDs, three-or-fewer labels, six-slot weighted markets, deterministic seeded sequences, momentum/reversion behavior, weighted sudden targets, event impact, ecology immunity, and tooth-merchant ordinary-only modifiers.
- [ ] Run `npm test` and verify failures are caused by missing market profiles and goods.

### Task 2: Implement Goods Profiles and Weighted Selection

**Files:**
- Modify: `js/config.js`
- Modify: `js/utils.js`
- Modify: `js/state.js`

- [ ] Add the seven approved goods and numeric profiles for all twenty goods.
- [ ] Add weighted sampling without replacement and use `listingWeight` in `pickGoods`.
- [ ] Preserve the U-good unlock boundary and deterministic seeded behavior.
- [ ] Run focused regression tests.

### Task 3: Implement the Ordinary Price Model

**Files:**
- Modify: `js/events.js`
- Modify: `js/rules.js`
- Modify: `js/professions.js`

- [ ] Replace tier-shared ordinary drift with per-good reversion, momentum, volatility, pulse bias, and ordinary bounds.
- [ ] Apply profession modifiers after per-good attributes without affecting event or ecology prices.
- [ ] Keep event aftershock recovery bounded and deterministic.
- [ ] Run pricing and profession tests.

### Task 4: Integrate Sudden Events

**Files:**
- Modify: `js/events.js`
- Modify: `js/eco.js`

- [ ] Select natural sudden targets by `eventWeight` without replacement.
- [ ] Apply `positiveBias` and `eventImpact` to natural sudden events.
- [ ] Confirm ecology continues to use configured branch multipliers only.
- [ ] Run event and ecology tests.

### Task 5: Add Runtime Artwork and Tags

**Files:**
- Add: `assets/art/runtime/goods/good-{salt,cloth,steel,medicine,car,machine-tool,lunar-soil}-128.webp`
- Modify: `js/ui.js`
- Modify: `tests/art-assets.test.js`

- [ ] Generate seven transparent product icons matching the existing oriental ledger artwork.
- [ ] Normalize them through the existing asset pipeline and validate dimensions and alpha.
- [ ] Render compact trait tags without changing row width or mobile layout.
- [ ] Run asset and UI tests.

### Task 6: Verify Balance and Delivery

**Files:**
- Modify: `scripts/balance/index.js`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `version.json`
- Modify: `index.html`

- [ ] Run `npm test`, `npm run balance -- 200`, and `git diff --check`.
- [ ] Verify desktop and 320px layouts against a local Vite server.
- [ ] Set the release version to `1.10.0` and document the twenty-good trait engine.
- [ ] Commit the branch, merge it into `main`, create tag `v1.10.0`, and push branch, main, and tag.

