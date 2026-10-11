+# GeoGuessr Brazil DDD Area Codes

A TypeScript userscript that overlays Brazilian phone area-code (DDD) polygons
and labels onto GeoGuessr's guessing map. It does not access the Street View
panorama, a player's guess, or game coordinates.

## Build

```sh
npm install
npm test
npm run build
```

Install `dist/brazil-ddd.user.js` in a compatible userscript manager. When a
GeoGuessr guessing map is available, the overlay adds:

- colour-coded DDD boundaries;
- a label for each area code at zoom level 5 or closer;
- a compact toggle immediately above the map.

The data is fetched once per page load from the source GeoJSON URL configured
in [data.ts](src/brazil-ddd/data.ts).

## Project layout

- `src/brazil-ddd/geometry.ts`: typed GeoJSON parsing, DDD detection, and label placement.
- `src/brazil-ddd/overlay.ts`: Google Maps layer, labels, controls, lifecycle handling.
- `tests/geometry.test.ts`: parser and geometry tests.
