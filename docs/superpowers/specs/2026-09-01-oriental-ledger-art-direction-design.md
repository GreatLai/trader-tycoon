# Oriental Ledger Art Direction Design

## Goal

Upgrade `trader-tycoon` from a clean utility-style interface to a recognizable Chinese merchant-ledger game aesthetic without reducing trading speed, numeric clarity, or mobile usability.

The generated concept image is a style reference, not a source sheet. Production assets are generated separately, normalized locally, and integrated into the existing responsive HTML/CSS interface.

## Visual Direction

- Theme: late-imperial merchant ledger blended with modern trading clarity.
- Surfaces: warm off-white paper, subtle fiber texture, restrained ink-blue structure, muted gold detail.
- State colors: emerald for buy/profit, vermilion for sell/loss, neutral stone gray for disabled controls.
- Decoration: seal marks, coin and tassel details, and a quiet harbor-trade landscape.
- Density: operational and compact. Decorative artwork must not displace prices, holdings, or trade controls.
- Avoid: ornate fantasy frames, heavy gradients, excessive shadows, text baked into generated artwork, and decorative elements that compete with controls.

## Core Asset Inventory

The first production pass contains 19 source assets.

### Brand Assets: 2

1. `logo-horizontal.png`: transparent horizontal calligraphic title for desktop and tablet.
2. `logo-seal.png`: compact transparent seal mark for narrow mobile headers and favicon-style use.

### Commodity Icons: 13

- `good-wheat.png`
- `good-wood.png`
- `good-coal.png`
- `good-tea.png`
- `good-coffee.png`
- `good-copper.png`
- `good-oil.png`
- `good-chip.png`
- `good-phone.png`
- `good-gold.png`
- `good-diamond.png`
- `good-antique.png`
- `good-spacecraft.png`

Each icon uses a transparent square canvas, a centered single subject, consistent three-quarter lighting, and the same painted-realism treatment. Frames, rarity rings, hover states, and disabled states remain CSS.

### Environmental Assets: 4

1. `paper-tile.png`: subtle seamless paper texture.
2. `harbor-desktop.png`: wide low-contrast merchant-harbor landscape.
3. `harbor-mobile.png`: simplified narrow composition with less detail and stronger safe margins.
4. `coin-tassel.png`: transparent vertical decorative element for wide screens only.

## Source And Delivery Sizes

### Commodity Icons

- Generated source: at least `1024x1024`.
- Normalized master: `512x512` transparent PNG.
- Runtime outputs: `256x256` and `128x128` WebP.
- Subject bounding box: approximately 76% of the canvas.
- Safe margin: at least 10% on every edge.
- Expected display size: 52px desktop, 44px tablet, 38-42px mobile.

### Brand Assets

- Horizontal logo master: approximately `1600x480`, transparent PNG.
- Compact seal master: `512x512`, transparent PNG.
- Runtime WebP variants are produced without deleting the PNG masters.

### Environmental Assets

- Desktop harbor: approximately `2048x320`.
- Mobile harbor: approximately `768x240`.
- Paper tile: `512x512`, seamless on all edges.
- Coin tassel: approximately `256x1024`, transparent PNG.

## Local Production Pipeline

1. Generate one style-anchor asset first and inspect it before producing the full set.
2. Generate each production asset independently using the approved style anchor.
3. Recover every built-in image result to a validated local file when necessary.
4. Inspect each image at original resolution.
5. Remove unwanted background, preserve alpha, and crop transparent padding.
6. Place the subject on the standard canvas and normalize scale and visual center.
7. Export runtime PNG/WebP variants.
8. Generate a contact sheet for consistency review.
9. Regenerate only assets that fail silhouette, scale, palette, or style checks.

Source assets live under `assets/art/source/`. Runtime assets live under `assets/art/runtime/` with `brand/`, `goods/`, and `environment/` subdirectories.

## Responsive Integration

- Above 1120px: show the horizontal logo, desktop harbor, and coin tassel. Keep the existing two-column market/sidebar layout.
- 761-1120px: use the horizontal logo at a smaller size, hide the tassel, and move the sidebar below the market.
- 361-760px: switch to the compact seal, use the mobile harbor only where it does not increase the first-screen height, and retain the fixed information/buy/sell commodity rows.
- 320-360px: hide nonessential environmental decoration and preserve only the compact brand mark and commodity icons.
- The interface must never select a different commodity icon by viewport; one normalized icon set scales across all layouts.

CSS continues to own panels, borders, buttons, inputs, progress bars, separators, state colors, hover effects, and disabled states. No generated image contains live values or interface labels.

## Performance Rules

- Prefer WebP at runtime while retaining PNG masters.
- Keep the initial visible art payload under approximately 500 KB where practical.
- Lazy-load noncritical event or lower-page artwork if added later.
- Avoid loading both desktop and mobile harbor images when only one is needed.
- Use explicit width and height or aspect ratio so image loading cannot shift the layout.

## Acceptance Criteria

- All 19 source assets are present and visually consistent.
- Every commodity remains identifiable at 38px.
- Transparent assets have clean edges and no baked checkerboard or solid background.
- Desktop, tablet, 390px, 360px, and 320px layouts have no horizontal overflow.
- Images do not change row height after loading.
- Buy, sell, profit, loss, disabled, and focus states remain immediately distinguishable.
- Generated text appears only in the two brand assets and is manually inspected for correctness.
- The existing 18 regression tests continue to pass, with additional asset-path and responsive-image checks added during implementation.

## Deferred Scope

Event illustrations, milestone art, ending screens, and custom panel-header icons are deferred until the core 19-asset set is integrated and validated. This prevents an oversized first pass and gives the established style anchor a chance to prove itself in the live interface.
