export const DATA_URL =
  "https://gist.githubusercontent.com/guilhermeprokisch/080c2cb1bd28e8aca54d114e453c91a4/raw/brazil_phone_area_codes.geojson";

export const DDD_COLORS: Record<string, string> = {
  "1": "#b878d5",
  "2": "#f0d878",
  "3": "#ee9d56",
  "4": "#2bc3c3",
  "5": "#66d5a8",
  "6": "#f0dc39",
  "7": "#dc8ce1",
  "8": "#ed8e97",
  "9": "#42d567",
};

export const MAP_SELECTORS = [
  '[class*="guess-map_canvas"]',
  '[class*="run-game-guess-map-contents_canvas"]',
  '[class*="region-map_mapCanvas"]',
].join(",");
