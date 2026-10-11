import { describe, expect, it } from "vitest";
import type { GeoJsonFeatureCollection } from "../src/brazil-ddd/types";
import { UNRENDERABLE_COUNTRY_IDS } from "../src/streetview-coverage/data";
import { LEFT_HAND_TRAFFIC_COUNTRY_IDS } from "../src/traffic-side/data";
import { countriesWithTrafficSide } from "../src/traffic-side/geometry";

const countries: GeoJsonFeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", id: "AUS", properties: {}, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "GBR", properties: {}, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "FRA", properties: {}, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "USA", properties: {}, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "ATA", properties: {}, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "BAD", properties: {}, geometry: null },
  ],
};

describe("traffic-side country filtering", () => {
  it("contains major left-hand-traffic countries", () => {
    for (const countryId of ["AUS", "GBR", "IND", "JPN", "ZAF"]) {
      expect(LEFT_HAND_TRAFFIC_COUNTRY_IDS.has(countryId)).toBe(true);
    }
    expect(LEFT_HAND_TRAFFIC_COUNTRY_IDS.has("FRA")).toBe(false);
  });

  it("selects only countries driving on the requested side", () => {
    expect(countriesWithTrafficSide(countries, "left", LEFT_HAND_TRAFFIC_COUNTRY_IDS, UNRENDERABLE_COUNTRY_IDS).features.map(({ id }) => id))
      .toEqual(["AUS", "GBR"]);
    expect(countriesWithTrafficSide(countries, "right", LEFT_HAND_TRAFFIC_COUNTRY_IDS, UNRENDERABLE_COUNTRY_IDS).features.map(({ id }) => id))
      .toEqual(["FRA", "USA"]);
  });
});
