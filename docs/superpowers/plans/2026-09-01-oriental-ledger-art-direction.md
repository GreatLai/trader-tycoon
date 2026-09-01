# Oriental Ledger Art Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce, normalize, integrate, and verify a responsive 19-asset oriental merchant-ledger art package for `trader-tycoon`.

**Architecture:** Built-in image generation produces independent source artwork using the approved style anchor. A deterministic Pillow script crops, centers, resizes, and exports runtime variants from source PNGs. Existing HTML/CSS remains responsible for layout and interaction states; JavaScript only maps commodity IDs to responsive image assets.

**Tech Stack:** Built-in image generation, Python 3.13 with Pillow 12, vanilla HTML/CSS/JavaScript, Node.js built-in test runner.

---

## File Structure

- Create `assets/art/reference/style-anchor-v1.png`: approved visual reference.
- Create `assets/art/source/brand/`: original transparent brand generations.
- Create `assets/art/source/goods/`: original transparent commodity generations.
- Create `assets/art/source/environment/`: original texture and scenery generations.
- Create `assets/art/runtime/brand/`: optimized brand files used by the page.
- Create `assets/art/runtime/goods/`: `128px` and `256px` WebP commodity icons.
- Create `assets/art/runtime/environment/`: optimized paper, harbor, and tassel files.
- Create `assets/art/manifest.json`: exact source/runtime paths, dimensions, and responsive roles.
- Create `scripts/process-art-assets.py`: deterministic normalization and export pipeline.
- Create `tests/art-assets.test.js`: manifest, output, alpha, dimensions, and integration regressions.
- Modify `js/config.js`: add commodity art paths and release version.
- Modify `js/ui.js`: render commodity images with emoji fallback.
- Modify `index.html`: responsive brand markup and updated cache versions.
- Modify `css/style.css`: oriental visual tokens, image sizing, responsive decoration, and stable loading dimensions.
- Modify `README.md`, `CHANGELOG.md`, and `version.json`: document and release the art update.

## Task 1: Asset Contract And Processing Pipeline

**Files:**
- Create: `assets/art/manifest.json`
- Create: `scripts/process-art-assets.py`
- Create: `tests/art-assets.test.js`

- [ ] **Step 1: Write the failing manifest and pipeline tests**

Add tests that require all 19 source entries, all 13 commodity IDs, explicit runtime sizes, and a processing script with `icon`, `brand`, `texture`, and `scenery` modes. The commodity list must be:

```js
const GOOD_IDS = [
  'wheat', 'wood', 'coal', 'tea', 'coffee', 'copper', 'oil',
  'chip', 'phone', 'gold', 'diamond', 'antique', 'spacecraft'
];
```

The test must also create a temporary RGBA image, run the processing script, and assert that the normalized output is `512x512`, retains alpha, and contains a non-empty centered subject.

- [ ] **Step 2: Run tests and verify they fail**

Run: `node --test tests/art-assets.test.js`

Expected: FAIL because the manifest and processing script do not exist.

- [ ] **Step 3: Create the asset manifest**

Use this structure:

```json
{
  "version": 1,
  "reference": "assets/art/reference/style-anchor-v1.png",
  "brand": {
    "horizontal": { "source": "assets/art/source/brand/logo-horizontal.png", "runtime": "assets/art/runtime/brand/logo-horizontal.webp" },
    "seal": { "source": "assets/art/source/brand/logo-seal.png", "runtime": "assets/art/runtime/brand/logo-seal.webp" }
  },
  "goods": {},
  "environment": {
    "paper": { "source": "assets/art/source/environment/paper-tile.png", "runtime": "assets/art/runtime/environment/paper-tile.webp" },
    "harborDesktop": { "source": "assets/art/source/environment/harbor-desktop.png", "runtime": "assets/art/runtime/environment/harbor-desktop.webp" },
    "harborMobile": { "source": "assets/art/source/environment/harbor-mobile.png", "runtime": "assets/art/runtime/environment/harbor-mobile.webp" },
    "tassel": { "source": "assets/art/source/environment/coin-tassel.png", "runtime": "assets/art/runtime/environment/coin-tassel.webp" }
  }
}
```

Populate `goods` with one source PNG plus `128` and `256` WebP outputs for every required ID.

- [ ] **Step 4: Implement deterministic Pillow processing**

The script must:

```python
image = Image.open(source).convert("RGBA")
bbox = image.getbbox()
subject = image.crop(bbox)
subject.thumbnail((389, 389), Image.Resampling.LANCZOS)
canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
offset = ((512 - subject.width) // 2, (512 - subject.height) // 2)
canvas.alpha_composite(subject, offset)
```

Export PNG masters losslessly and WebP runtime variants with explicit dimensions and method `6`. Texture mode preserves seamless edges; scenery mode performs fixed aspect-ratio center crops; brand mode trims transparent padding without forcing a square canvas.

- [ ] **Step 5: Run the pipeline tests**

Run: `node --test tests/art-assets.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add assets/art/manifest.json scripts/process-art-assets.py tests/art-assets.test.js
git commit -m "build: add art asset pipeline"
```

## Task 2: Brand And Environment Style Anchors

**Files:**
- Create: `assets/art/reference/style-anchor-v1.png`
- Create: `assets/art/source/brand/logo-horizontal.png`
- Create: `assets/art/source/brand/logo-seal.png`
- Create: `assets/art/source/environment/paper-tile.png`
- Create: `assets/art/source/environment/harbor-desktop.png`
- Create: `assets/art/source/environment/harbor-mobile.png`
- Create: `assets/art/source/environment/coin-tassel.png`

- [ ] **Step 1: Copy the approved style anchor into the project**

Use the validated recovered image as `assets/art/reference/style-anchor-v1.png`. Do not overwrite or transform the recovered source.

- [ ] **Step 2: Generate the horizontal logo and seal independently**

Use the approved palette and brush treatment. The horizontal logo must contain exactly `倒卖大亨`; the seal contains no required readable text and may use an abstract merchant mark. Recover and inspect every result before accepting it.

- [ ] **Step 3: Generate the four environment assets independently**

Use these production requirements:

```text
paper-tile: subtle seamless rice-paper fibers, no border, no objects, low contrast
harbor-desktop: 2048:320 wide shallow merchant harbor, quiet lower-edge composition
harbor-mobile: 768:240 simplified harbor, large safe margins, no tiny architectural detail
coin-tassel: isolated vertical aged-brass coin and muted vermilion tassel, transparent background
```

- [ ] **Step 4: Process and inspect runtime outputs**

Run the pipeline for brand, texture, and scenery modes. Inspect original and runtime files for text correctness, alpha, crop, seams, and compression artifacts.

- [ ] **Step 5: Commit**

```powershell
git add assets/art/reference assets/art/source/brand assets/art/source/environment assets/art/runtime/brand assets/art/runtime/environment
git commit -m "feat: add oriental brand and environment art"
```

## Task 3: Thirteen Commodity Icons

**Files:**
- Create: `assets/art/source/goods/*.png`
- Create: `assets/art/runtime/goods/*-128.webp`
- Create: `assets/art/runtime/goods/*-256.webp`
- Modify: `assets/art/manifest.json`

- [ ] **Step 1: Use one locked prompt template for every commodity**

```text
Use case: stylized-concept
Asset type: transparent commodity icon for a management game
Subject: ONE <commodity>, isolated and centered
Style: refined 2D painted oriental merchant-ledger asset, crisp silhouette, tactile materials, restrained realism
Camera: consistent three-quarter view, centered, square canvas
Lighting: soft upper-left studio light, controlled shadow contained within the subject
Palette: warm ivory, deep ink navy, muted jade, vermilion, aged brass; preserve the subject's natural identifying colors
Constraints: genuinely transparent background, no text, no border, no medallion, no extra objects, no watermark
```

- [ ] **Step 2: Generate icons in low-to-ultra tier order**

Generate and validate:

```text
wheat: a compact bundle of ripe wheat ears
wood: two cleanly cut merchant lumber logs
coal: a small pile of faceted black coal with one traditional mining pick
tea: a tied paper packet of tea leaves with a few loose leaves
coffee: a burlap coffee sack with roasted beans
copper: stacked copper ingots with oxidized green edge detail
oil: a single vermilion-red steel oil barrel
chip: a square black-and-gold computer processor
phone: one modern smartphone with a dark teal screen
gold: three stacked gold bars
diamond: one faceted clear diamond with restrained blue highlights
antique: one aged Chinese ceramic vase
spacecraft: one compact modern launch vehicle or orbital spacecraft
```

- [ ] **Step 3: Process every accepted source**

Run `icon` mode to produce normalized `512x512` PNG masters and `128`/`256` WebP runtime variants.

- [ ] **Step 4: Generate and inspect a contact sheet**

Create a 4-column contact sheet from normalized masters. Reject icons whose subject scale differs visibly, whose silhouette is unclear at 38px, or whose palette breaks the approved anchor.

- [ ] **Step 5: Run asset tests**

Run: `node --test tests/art-assets.test.js`

Expected: all required files exist, dimensions match, and alpha checks pass.

- [ ] **Step 6: Commit**

```powershell
git add assets/art/source/goods assets/art/runtime/goods assets/art/manifest.json
git commit -m "feat: add commodity art set"
```

## Task 4: Responsive UI Integration

**Files:**
- Modify: `js/config.js`
- Modify: `js/ui.js`
- Modify: `index.html`
- Modify: `css/style.css`
- Modify: `tests/game-regressions.test.js`

- [ ] **Step 1: Write failing integration tests**

Require every `GOODS` entry to expose an art path, require market and inventory rendering to use an `<img>` with fixed dimensions and emoji fallback, require responsive brand markup, and require CSS to hide the tassel and desktop harbor at the approved breakpoints.

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm test`

Expected: FAIL because art paths and responsive markup are absent.

- [ ] **Step 3: Add commodity art paths**

Each commodity receives:

```js
art: `assets/art/runtime/goods/${id}-256.webp`
```

Keep the existing emoji as an accessible fallback and as a no-image failure state.

- [ ] **Step 4: Render stable responsive images**

Market and inventory images must use explicit dimensions, `decoding="async"`, empty alt text when adjacent text names the commodity, and an error fallback that restores the emoji without shifting the row.

- [ ] **Step 5: Integrate brand and environment assets**

Add a `<picture>` for desktop/mobile brand art. Apply paper texture as a low-opacity body layer. Position the harbor as a noninteractive bottom decoration and the tassel only above 1120px. Use explicit aspect ratios and reserved dimensions.

- [ ] **Step 6: Restyle with CSS tokens rather than image slices**

Update color variables, borders, shadows, and button states to the approved ink/jade/vermilion/brass palette. Do not convert panels, buttons, inputs, or progress bars into bitmap backgrounds.

- [ ] **Step 7: Run tests and syntax checks**

Run:

```powershell
npm test
node --check js/config.js
node --check js/ui.js
git diff --check
```

- [ ] **Step 8: Commit**

```powershell
git add js/config.js js/ui.js index.html css/style.css tests/game-regressions.test.js
git commit -m "feat: integrate oriental art direction"
```

## Task 5: Browser QA And Release

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `version.json`
- Modify: `index.html`
- Modify: `js/config.js`
- Modify: `docs/assets/trader-tycoon-preview.png`

- [ ] **Step 1: Start the local static server**

Run: `python -m http.server 4173 --bind 127.0.0.1`

- [ ] **Step 2: Verify responsive breakpoints**

Inspect `1280x900`, `1121x800`, `1024x800`, `760x900`, `390x844`, `360x800`, and `320x720`.

At every width verify no horizontal overflow, fixed row heights after image loading, no image/text overlap, correct desktop/mobile logo selection, correct decoration visibility, and readable 38px commodity icons.

- [ ] **Step 3: Exercise game behavior**

Verify preset buy/sell, custom buy/sell, Enter submission, empty quantity rejection, disabled states, next-day updates, inventory rendering, overlays, and new-game flow.

- [ ] **Step 4: Capture final screenshots**

Replace `docs/assets/trader-tycoon-preview.png` with the verified desktop view and retain a mobile QA screenshot under `docs/maintenance/`.

- [ ] **Step 5: Release as `v1.6.0`**

Set `APP_VERSION`, `version.json`, and all 11 cache-busting parameters to `1.6.0`. Document the art pipeline, responsive asset system, and asset count in `CHANGELOG.md` and `README.md`.

- [ ] **Step 6: Run final verification**

Run:

```powershell
npm test
node --check js/config.js
node --check js/ui.js
node --check js/main.js
git diff --check
git status --short
```

- [ ] **Step 7: Final review and commit**

Request code review, resolve all critical and important findings, then commit the release. Do not push until local verification and user visual review are complete.
