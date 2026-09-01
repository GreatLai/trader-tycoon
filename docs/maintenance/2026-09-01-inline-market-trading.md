# Inline Market Trading Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with test-first changes and verify each checkpoint before continuing.

**Goal:** Replace the market trade modal with immediate inline buy and sell controls while keeping desktop and mobile layouts stable as values change.

**Architecture:** Render all product information and trade controls inside each market row. Reuse the existing delegated `data-action`, `data-good`, and `data-qty` route for preset trades, and add one small delegated custom-quantity path for the paired input and submit button. CSS uses explicit grid areas, fixed control tracks, tabular numbers, and mobile breakpoints so each product has one information row plus buy and sell rows without value-driven reflow.

**Tech Stack:** Static HTML, CSS Grid, vanilla JavaScript, Node.js built-in test runner.

---

### Task 1: Lock the interaction contract with regression tests

**Files:**
- Modify: `tests/game-regressions.test.js`

- [x] Assert that generated market markup contains separate buy and sell rows, immediate preset buttons, custom quantity inputs, and disabled sell controls for zero holdings.
- [x] Assert that `index.html` no longer contains the trade overlay or its legacy IDs.
- [x] Assert that the delegated handler supports preset, custom-button, and Enter-key transactions and clears a successful custom input.
- [x] Assert that stable-layout CSS includes named market grid areas, no-wrap controls, tabular numeric rendering, fixed input sizing, and a three-row mobile layout.
- [x] Run `npm test` and confirm the new tests fail because the inline feature is not implemented yet.

### Task 2: Implement inline immediate trading

**Files:**
- Modify: `js/ui.js`
- Modify: `js/main.js`
- Modify: `index.html`

- [x] Replace the single market `交易` button with buy and sell control rows.
- [x] Keep preset quantities on the existing immediate `buy`/`sell` path, including `买满` and `全卖`.
- [x] Add custom quantity submission from the adjacent input on button click and Enter, rejecting non-positive quantities.
- [x] Clear the input only when the transaction changed cash or holdings.
- [x] Disable sell controls when the player owns none of that product.
- [x] Remove all legacy trade overlay markup, state, rendering, and click branches.
- [x] Run `npm test` and confirm interaction tests pass.

### Task 3: Stabilize desktop and mobile layout

**Files:**
- Modify: `css/style.css`

- [x] Use explicit market grid areas and constrained columns on desktop.
- [x] Keep price, holdings, percentages, controls, and header statistics on one line with tabular digits and bounded overflow behavior.
- [x] At mobile width, render each product as exactly three logical rows: information, buy, sell.
- [x] Give preset buttons and custom input/button tracks stable dimensions that do not change with values.
- [x] Remove the stray closing style tag from the standalone stylesheet.
- [x] Run `npm test` and syntax checks.

### Task 4: Browser verification and release metadata

**Files:**
- Modify: `js/config.js`
- Modify: `version.json`
- Modify: `index.html`
- Modify: `CHANGELOG.md`
- Modify: `README.md` only if the screenshot or instructions are now inaccurate.

- [x] Start a local static server and exercise preset and custom trades at desktop and mobile widths.
- [x] Verify there is no horizontal overflow, control text clipping, unpredictable wrapping, or row-height shift after large numeric changes.
- [x] Capture and inspect desktop and mobile screenshots.
- [x] Set the release version to `1.5.0`, update all cache-busting parameters, and add changelog notes.
- [x] Run the full test suite again and review the final diff before committing.
