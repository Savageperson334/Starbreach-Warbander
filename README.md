# Star Breach Warband Builder

Mobile-first, unofficial warband builder and BREACH play-reference companion for **Star Breach 1st Edition**.

The builder is based on the freely available 1st Edition errata rules PDF and links back to the official hosted manual for rule references. It is not an official Star Breach product.

## Modes

**BUILD** constructs and validates a warband: UC totals, specialist limits, faction/profile restrictions, equipment, Alpha Skills, psychic abilities, faction-specific rules, save/load, and JSON import/export.

**BREACH** is the table-side reference view: completed roster, equipped weapon profiles, skills, psychic abilities, special rules, notes, base guidance, and a scenario-agnostic turn walkthrough.

## Structure

- `index.html` — tiny cache-busting GitHub Pages loader.
- `app.html` — core builder, embedded rules/reference data, BUILD UI, and BREACH renderer.
- `starbreach-ui.css` — current UI/theme extension styling.
- `starbreach-ui.js` — current UI enhancements and BREACH turn guide.
- `scripts/smoke_test.py` — lightweight structural and JavaScript syntax checks.

The public site intentionally has one responsive/mobile-first interface. There is no separate desktop version.

## Development rule

Keep `app.html` as the core application and use the stable `starbreach-ui.css` / `starbreach-ui.js` extension points for UI refinements. Avoid creating another versioned patch file for every small change.
