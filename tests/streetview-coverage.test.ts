import { describe, expect, it } from "vitest";
import type { GeoJsonFeatureCollection } from "../src/brazil-ddd/types";
import { STREET_VIEW_COUNTRY_IDS, UNRENDERABLE_COUNTRY_IDS } from "../src/streetview-coverage/data";
import { countriesWithoutStreetView } from "../src/streetview-coverage/geometry";

const countries: GeoJsonFeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", id: "BRA", properties: { name: "Brazil" }, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "VEN", properties: { name: "Venezuela" }, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "ATA", properties: { name: "Antarctica" }, geometry: { type: "Polygon", coordinates: [] } },
    { type: "Feature", id: "BAD", properties: { name: "No geometry" }, geometry: null },
  ],
};

describe("Street View country filtering", () => {
  it("marks official-coverage countries as available", () => {
    expect(STREET_VIEW_COUNTRY_IDS.has("BRA")).toBe(true);
    expect(STREET_VIEW_COUNTRY_IDS.has("VEN")).toBe(false);
  });

  it("keeps only countries without official Street View coverage", () => {
    const result = countriesWithoutStreetView(countries, new Set(["BRA"]), UNRENDERABLE_COUNTRY_IDS);

    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.id).toBe("VEN");
  });
});
