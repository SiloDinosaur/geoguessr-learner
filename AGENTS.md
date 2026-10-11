@/Users/szogyenyid/.codex/RTK.md

# GeoGuessr map overlays

# Userscript releases

- `package.json` is the single source of truth for the userscript version. Follow semantic versioning: major for incompatible changes, minor for backward-compatible features, and patch for fixes.
- The Vite configuration must derive the userscript metadata version from `package.json`; never hard-code a second version. Keep the root package entry in `package-lock.json` synchronized whenever the package version changes.
- Before distributing a changed userscript, bump the version, run the full test suite and build, and verify the generated userscript header has the expected name and version.

- Never render `UNRENDERABLE_COUNTRY_IDS` from `src/streetview-coverage/data.ts` in a Google Maps data layer. In particular, the source GeoJSON's Antarctica (`ATA`) polygon is interpreted as an inverted, world-spanning polygon by Google Maps.
- Any new feature that renders world-country GeoJSON must pass `UNRENDERABLE_COUNTRY_IDS` to its country filter and add a regression test that confirms `ATA` is excluded.
