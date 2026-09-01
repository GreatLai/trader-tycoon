# Shop Cards Design

## Goal

Replace the bank with a seven-day rotating cash shop. Reduce the value of passive, naturally generated trading opportunities separately, while letting purchased cards create controlled high-value opportunities through the existing low-buy/high-sell loop.

The first card set contains exactly six consumable cards:

- Add Good
- Refresh Price
- Sudden Rise
- Sudden Fall
- Future Market
- I Am the Trend

There is no global daily card-use limit and no card inventory limit. Limits exist only where the underlying game state makes an action invalid.

## Existing Rules Preserved

- A run lasts 90 days.
- The natural market opens with five goods per day.
- Prices remain fixed between explicit refresh operations.
- Trading is immediate and unlimited while a good is listed.
- Unlisted goods cannot normally be traded.
- Warehouse capacity remains a hard constraint.
- Natural ecological events remain single-instance A/B/C event chains.
- Ultra goods remain gated by the existing wealth threshold.

Cards may explicitly extend these rules. Add Good may increase the current market beyond five goods, and card-generated events may temporarily override an ecological event's current quote. These exceptions do not cancel or rewrite the underlying ecological event.

## Bank Removal And Save Policy

Remove the bank UI and all unrestricted credit behavior:

- `loan`
- `borrow()`
- `repay()`
- `creditLimit()`
- loan interest

No legacy-save migration is required. Change `CONFIG.SAVE_KEY` so older saves are ignored and the new version starts from a clean state.

## Shop Cycle

- Generate the first shop stock on day 1.
- Refresh on days 8, 15, 22, and every seven days through day 85.
- Each cycle contains four independently generated stock entries.
- Stock remains available until the next refresh or until purchased.
- Buying a card immediately subtracts cash, adds one copy to the card inventory, and saves.
- Unaffordable entries remain visible but disabled.
- Duplicate cards may appear and may be accumulated across cycles.
- Card prices are fixed for the life of the stock entry.

Shop pricing uses a permanent `peakNetWorth` value so players cannot lower prices by temporarily selling, losing, or rearranging assets.

The pricing anchor follows wealth magnitude beyond the named milestone list:

```js
const anchor = peakNetWorth < 10000
  ? 5000
  : 10 ** Math.floor(Math.log10(peakNetWorth));
```

Initial card weights and price rates:

| Card | Weight | Price before variation |
| --- | ---: | ---: |
| Add Good | 29% | 4% of anchor |
| Refresh Price | 27% | 8% of anchor |
| Future Market | 22% | 6% of anchor |
| Sudden Rise | 10% | 12% of anchor |
| Sudden Fall | 10% | 18% of anchor |
| I Am the Trend | 2% | 120% of anchor |

Each generated price receives a `0.85-1.15` variation and is rounded to a whole currency unit.

These values are starting calibration data, not hardcoded behavior. They must live in shop configuration and be covered by deterministic simulation before release.

## Shared Single-Good Refresh Pipeline

Natural daily updates and card actions must share one single-good price engine. Extract the per-good logic currently embedded in `updatePrices()` into a reusable function.

The engine needs two distinct anchoring modes:

### Natural anchoring

Natural random movement, natural sudden events, and ecological-event progression continue to use the existing base-price and ecological target rules. Natural sudden-event multipliers remain anchored to `good.base`.

### Card anchoring

Card-generated sudden events are anchored to the price at the moment the card is resolved:

```js
newPrice = cardResolutionStartPrice * cardEventMultiplier;
```

This rule applies even when the selected good is currently controlled by an ecological event. The card changes the current quote only. It does not end the ecological event, change its branch, or remove the good from the ecological event.

On the next natural day, normal ecological progression resumes from the card-modified current factor.

## Ordinary Event Chance For Single Refreshes

The natural market generates an average of 1.3 sudden events for five goods. A card-triggered single-good normal refresh therefore starts with a 26% sudden-event chance.

The chance and rare-event rate must be named configuration values. A first-ever appearance retains the existing protection and cannot produce a sudden event.

## Card Rules

### Add Good

Eligibility:

- unlocked by current wealth
- not already in `state.availableGoods`

There is no explicit ecological exclusion. Active ecological goods are already forced into the market by existing market selection, so they naturally fail the "not already listed" condition.

Resolution:

1. Add the selected good to today's market without removing an existing good.
2. Refresh that good once through the normal single-good refresh path.
3. Roll the configured single-refresh ordinary-event chance.
4. If an event occurs, resolve it immediately and enqueue its news popup.
5. Update seen-price state and replace the good's current-day chart point.

Multiple Add Good cards may expand the current market beyond five entries.

### Refresh Price

Eligibility:

- currently listed

Ecological goods are valid targets.

Resolution:

1. Capture the current price as the refresh anchor.
2. Remove or supersede any earlier same-day ordinary event for this good.
3. Run one ordinary single-good refresh.
4. Roll the configured ordinary-event chance.
5. If a card-triggered event occurs, anchor its multiplier to the captured current price.
6. Replace the current-day chart point and enqueue any resulting event notice.

Multiple cards may refresh the same good repeatedly. Every refresh begins from the price produced by the previous refresh.

### Sudden Rise

Eligibility pool:

- all currently listed goods

Ecological goods remain eligible.

Resolution:

1. Select one eligible listed good uniformly.
2. Capture its current price.
3. Force a positive sudden event using the selected good's tier profile.
4. Retain the configured chance to upgrade to a Super Trend.
5. Apply the multiplier to the captured current price.
6. Enqueue the event popup and record the card source in daily history.

### Sudden Fall

Eligibility and execution mirror Sudden Rise, except the event is forced negative and may upgrade to a Black Swan.

This card is priced above Sudden Rise because it lets a cash-heavy player manufacture a low-price entry. It must not ship until natural post-event recovery is no longer a deterministic return to the base-price floor.

### Future Market

Eligibility:

- any unlocked good whose price has previously been seen, including currently unlisted holdings

The card reveals the selected good's actual next-day price category relative to its final current-day price:

- major fall
- minor fall
- stable
- minor rise
- major rise

It does not reveal whether the good will be listed tomorrow. All goods continue updating internally, so the forecast remains meaningful when the selected good is absent from the next market.

The forecast must be derived from the same stored random outcome that the next-day engine later applies. Refreshing the page cannot reroll it.

Current-day card actions may change the selected good's price or schedule an ecological event. The forecast entitlement remains active and its displayed category is recomputed from the same stable next-day seed and the updated current state.

### I Am the Trend

Eligibility:

- no active ecological event
- no already scheduled ecological event
- current day is no later than day 86

Resolution:

1. Select one ecological event from the set unlocked by current wealth.
2. Store it as `scheduledEco` and save immediately.
3. On the next day, publish its announcement and suppress the natural ecological-event roll.
4. Continue through the existing A/B/C timing on subsequent days.

The card guarantees an ecological-event opportunity, not a positive outcome.

## Event Notice Queue

The existing `popupShown` boolean cannot represent multiple card-generated events in one day. Replace it with a queue of event notices.

- Every natural or card-generated event appends one notice.
- Closing the popup advances to the next notice.
- Every notice is stored in daily history with its source.
- Repeated card use must never overwrite an unseen notice.

## Current-Day Price History

The chart currently assumes one point per good per day. Card refreshes must replace the current day's point rather than append duplicate day labels.

Daily event history remains append-only and records every intermediate card event even when the final chart contains only the last quote.

## Future-Outcome Architecture

Future Market requires reproducible next-day resolution. Introduce a saved `nextDaySeed` and a deterministic local random generator for next-day planning.

The planning layer must cover:

- next ecological transition or natural ecological roll
- next market selection
- next ordinary sudden events
- per-good random price movement
- final per-good price categories

The normal next-day action applies the planned result. Current-day card actions rebuild projections using the same seed and current state, so previously purchased forecasts remain live rather than becoming silently stale.

## UI

Replace the bank panel with:

- refresh countdown
- four stock entries
- card name, concise rule, price, and purchase button
- owned-card counts
- contextual use buttons

Use one reusable card-action modal for selecting goods and confirming card effects. Buttons must show only valid targets; invalid use must not consume a card.

Card-generated news uses the same visual language as natural sudden and ecological events.

## Verification

Automated tests must cover:

- shop refresh days and fixed stock pricing
- unaffordable purchases
- repeated same-day card use
- markets expanded beyond five goods by Add Good
- first-ever goods remaining protected from sudden events
- repeated Refresh Price resolution on the same good
- card event anchoring to current price during ecological events
- ecological events continuing normally on the following day
- multiple queued event popups
- Sudden Rise and Sudden Fall selecting ecological goods
- Future Market matching the actual next-day category after reload
- Future Market remaining valid when the good is not listed
- I Am the Trend scheduling, unlock filtering, natural-roll suppression, and day-86 boundary
- removal of all bank and loan behavior
- deterministic 90-day simulations remaining finite and valid

## Release Boundary

The shop and cards may be implemented locally before the broader balance pass, but Sudden Fall must not be released while the existing deterministic event-recovery exploit remains. The release candidate must combine the shop with the revised natural reward curve and simulation evidence.
