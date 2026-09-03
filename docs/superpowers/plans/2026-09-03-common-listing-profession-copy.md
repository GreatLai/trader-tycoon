# Common Listing and Profession Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the three-use universal “通商令” action and replace every player-visible profession surface with consistent, distinctive outside-game copy and detailed in-run rules.

**Architecture:** Keep profession IDs stable while moving visible names, taglines, selection copy, structured rule facts, and numeric mechanic constants into `js/professions.js`. Add a separate run-level common-action state and reuse `refreshMarketGood()` for repricing and event generation so the common action follows the same price engine as professions and ecology.

**Tech Stack:** Browser JavaScript, static HTML/CSS, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Structured profession definitions

**Files:**
- Modify: `js/professions.js`
- Modify: `js/rules.js`
- Test: `tests/profession-gameplay.test.js`

- [ ] Add failing tests asserting the five new three-character names, four-character taglines, selection declarations, three short tags, structured in-run sections, and shared numeric constants.
- [ ] Run `node --test tests/profession-gameplay.test.js` and confirm the new assertions fail against the old definitions.
- [ ] Replace player-visible names with `生意人`, `牙行商`, `行脚商`, `投机客`, and `盐铁商`; add `tagline`, `selectionQuote`, `selectionTags`, and structured `inRun` content.
- [ ] Move the existing 20%, 65%, 15%, 70%, cooldown, fee, ceiling, lock, and deviation values into frozen profession mechanic objects consumed by both rules and descriptions.
- [ ] Run the profession tests and commit the completed definition layer.

### Task 2: Common listing state and engine

**Files:**
- Modify: `js/config.js`
- Modify: `js/state.js`
- Modify: `js/save.js`
- Modify: `js/market_actions.js`
- Test: `tests/profession-gameplay.test.js`
- Test: `tests/game-regressions.test.js`

- [ ] Add failing tests for three uses, owned unlisted targets, same-day multiple uses, repeat use on later days, temporary listing, normal buy/sell, invalid-target non-consumption, 15% ordinary events, ecology pricing, and independence from profession cooldown.
- [ ] Run the focused tests and confirm failures because the common-action API and state do not exist.
- [ ] Add frozen common-action configuration `{ maxUses: 3, eventChance: 0.15 }` and state `{ listingUses: 0 }`, with load normalization for missing or malformed saves.
- [ ] Implement `eligibleCommonListingTargets()` and `useCommonListing(targetId)`; append the target, call `refreshMarketGood()` with ordinary event generation and ecology enabled, increment uses only after successful validation, and queue a concise notice.
- [ ] Remove temporary goods naturally on the next market selection without adding persistence rules.
- [ ] Run focused tests and commit the common engine.

### Task 3: Outside and in-run profession UI

**Files:**
- Modify: `index.html`
- Modify: `css/style.css`
- Modify: `js/main.js`
- Modify: `js/ui.js`
- Test: `tests/profession-gameplay.test.js`
- Test: `tests/game-regressions.test.js`

- [ ] Add failing source and DOM-structure tests for uniform outside cards, detailed in-run sections, common-action button, common-action target overlay, stable mobile layout, and absence of the old visible names.
- [ ] Run focused tests and confirm the UI assertions fail.
- [ ] Render each outside choice as name, tagline, quote, three tags, and active-skill label with identical structure.
- [ ] Rebuild the in-run panel as play judgment plus `本事`, `手段`, and `代价`, keeping exact numbers visible and sourced from structured profession data.
- [ ] Add `通商令 n / 3` with the one-line helper, a target overlay titled `另开货路`, clear empty state, success notice, and disabled state at zero uses or no eligible inventory.
- [ ] Add responsive CSS with stable button height, non-shifting counters, and mobile-safe text wrapping.
- [ ] Run focused tests and commit the UI.

### Task 4: Complete visible-copy migration

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `js/ui.js`
- Modify: `js/market_actions.js`
- Modify: `js/achievements.js`
- Modify: `README.md`
- Modify: `docs/README.md`
- Test: `tests/profession-gameplay.test.js`

- [ ] Add a failing repository scan asserting old player-visible profession names do not remain outside migration IDs or archived documents.
- [ ] Update homepage rules, opening story, ability titles, button states, event notices, logs, history, achievements, empty states, and help copy to the new names and tone.
- [ ] Preserve internal IDs and save compatibility.
- [ ] Run the scan and focused tests, then commit the copy migration.

### Task 5: Balance, release, and delivery

**Files:**
- Modify: `js/config.js`
- Modify: `version.json`
- Modify: `index.html`
- Modify: `CHANGELOG.md`
- Modify: `docs/balance/useless-trader-v1.json`
- Modify: `docs/balance/useless-trader-v1.md`

- [ ] Run `npm test` and require every test to pass.
- [ ] Run 100-run comparisons for all five professions with the common action available to the simulation strategy where appropriate; verify no invalid state and record material strength changes.
- [ ] Increment the patch/minor version consistently, update cache-busting URLs and changelog, and regenerate the current balance report if baseline mechanics changed.
- [ ] Run `git diff --check` and the complete test suite again.
- [ ] Commit, merge to `main`, push, create the matching annotated tag and GitHub Release, and verify GitHub Pages `version.json` reports the new version.
