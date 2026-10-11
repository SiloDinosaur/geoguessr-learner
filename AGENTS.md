@/Users/szogyenyid/.codex/RTK.md

# GeoGuessr map overlays

- Never render `UNRENDERABLE_COUNTRY_IDS` from `src/streetview-coverage/data.ts` in a Google Maps data layer. In particular, the source GeoJSON's Antarctica (`ATA`) polygon is interpreted as an inverted, world-spanning polygon by Google Maps.
- Any new feature that renders world-country GeoJSON must pass `UNRENDERABLE_COUNTRY_IDS` to its country filter and add a regression test that confirms `ATA` is excluded.
