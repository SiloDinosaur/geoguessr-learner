/**
 * Lightweight world-country boundaries. We filter this data locally so only
 * countries without official Google Street View coverage are rendered.
 */
export const COUNTRY_DATA_URL =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

/**
 * ISO 3166-1 alpha-3 codes with official Google Street View coverage.
 *
 * Territories are included where the boundary source exposes them separately.
 * The list follows GeoGuessr's current Explorer coverage catalogue, which is
 * based on Google Street View availability rather than user-contributed 360°
 * photos.
 */
export const STREET_VIEW_COUNTRY_IDS = new Set([
  "ALB", "AND", "ARE", "ARG", "ASM", "AUS", "AUT", "BEL", "BGD", "BGR", "BIH", "BOL", "BRA", "BTN",
  "BWA", "CAN", "CHE", "CHL", "COL", "CRI", "CUW", "CYP", "CZE", "DEU", "DNK", "DOM", "ECU", "ESP",
  "EST", "FIN", "FRA", "FRO", "GBR", "GEO", "GHA", "GIB", "GRC", "GRL", "GTM", "GUM", "HKG", "HRV",
  "HUN", "IDN", "IMN", "IND", "IRL", "ISL", "ISR", "ITA", "JEY", "JOR", "JPN", "KAZ", "KEN", "KGZ",
  "KHM", "KOR", "LAO", "LBN", "LIE", "LKA", "LSO", "LUX", "MAC", "MCO", "MDG", "MEX", "MKD", "MLT",
  "MNE", "MNG", "MNP", "MYS", "NAM", "NGA", "NLD", "NOR", "NPL", "NZL", "OMN", "PAN", "PER", "PHL",
  "POL", "PRI", "PRT", "PRY", "QAT", "ROU", "RUS", "RWA", "SEN", "SGP", "SMR", "SRB", "STP",
  "SWE", "SWZ", "THA", "TUN", "TUR", "TWN", "UGA", "UKR", "URY", "USA", "VIR", "VNM", "ZAF",
]);

/**
 * The source's Antarctica outline is interpreted by Google Maps as an
 * inverted world-spanning polygon. Do not render it until it is replaced with
 * a Google Maps-compatible boundary.
 */
export const UNRENDERABLE_COUNTRY_IDS = new Set(["ATA"]);
