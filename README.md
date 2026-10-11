# Geoguessr Learner Map

Geoguessr Learner Map is a browser userscript that adds visual study aids to
the GeoGuessr guessing map. It combines three map overlays that are useful for
learning geographic clues without reading the panorama, your guess, or game
coordinates.

## What it shows

- **Brazilian DDD areas.** Colour-coded Brazilian telephone area-code regions
  appear when the map is focused on Brazil at zoom level 4 or closer. Area-code
  labels appear from zoom level 5.
- **Street View coverage.** Countries without official Google Street View
  coverage are tinted grey by default.
- **Traffic side.** Use the lower-left `L / Off / R` control to grey countries
  that drive on the opposite side of the road: `L` greys right-driving
  countries and `R` greys left-driving countries.

The coverage layer is always on. The traffic-side layer is off until selected.
Each external boundary dataset is fetched at most once per page load.

## Install

1. Install a compatible userscript manager, such as Tampermonkey or
   Violentmonkey.
2. Download or build `dist/geoguessr-learner-map.user.js`.
3. Open that file with your userscript manager and confirm the installation.
4. Open a GeoGuessr game mode that displays a guessing map.

When upgrading from the former Brazil DDD script, remove that old userscript
after installing this one. The new display name is **Geoguessr Learner Map**.

## Develop and build

Use a supported current Node.js release and npm.

```sh
npm install
npm test
npm run build
```

The build writes the installable userscript to
`dist/geoguessr-learner-map.user.js`. `npm run dev` starts Vite's development
server for local iteration.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/userscript/index.ts` | Starts all overlays. |
| `src/brazil-ddd/` | Brazilian DDD data handling, rendering, and labels. |
| `src/streetview-coverage/` | Official Street View country filtering and the default coverage tint. |
| `src/traffic-side/` | Left/right traffic data, filtering, and map control. |
| `tests/` | Geometry, visibility, coverage, and traffic-side regression tests. |

## Data and limitations

Brazilian DDD boundaries come from the GeoJSON URL in
`src/brazil-ddd/data.ts`. World-country boundaries come from
[johan/world.geo.json](https://github.com/johan/world.geo.json); coverage and
traffic-side lists are maintained in this repository. The script needs network
access to these datasets when a relevant overlay is first used.

GeoGuessr's map implementation and page markup can change without notice. If
the guessing map is not detected or a data source is unavailable, the affected
overlay may not appear; open the browser console for an error message. The
userscript is intentionally a visual map aid and does not inspect Street View
imagery, player guesses, or game coordinates.

## Releasing

`package.json` is the source of truth for the userscript version. The Vite
configuration copies that version into the generated userscript header, so a
release has one version everywhere. Follow semantic versioning: use a major
version for incompatible changes, a minor version for new backward-compatible
features, and a patch version for fixes.

Before sharing a new build, update `package.json` (and the root package entry
in `package-lock.json`), run the tests and build, then confirm the generated
header reports `Geoguessr Learner Map` and the expected version.

## License

This project is released under the [Unlicense](LICENSE).
