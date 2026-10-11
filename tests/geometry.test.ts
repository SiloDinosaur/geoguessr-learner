import { describe, expect, it } from "vitest";
import { getDdd, labelPosition, normalizeDddFeatures } from "../src/brazil-ddd/geometry";
import type { GeoJsonFeatureCollection, Geometry } from "../src/brazil-ddd/types";

const square: Geometry = {
  type: "Polygon" as const,
  coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
};

describe("Brazil DDD GeoJSON parsing", () => {
  it("finds DDD codes from likely property names before unrelated values", () => {
    expect(getDdd({ name: "11", area_code: "DDD 21" })).toBe("21");
    expect(getDdd({ phone: "60" })).toBeNull();
  });

  it("calculates a label point for a polygon", () => {
    expect(labelPosition(square)).toMatchObject({ lng: 1, lat: 1 });
  });

  it("adds normalized DDD fields and retains the largest label geometry per code", () => {
    const data: GeoJsonFeatureCollection = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { ddd: "11" }, geometry: square },
        {
          type: "Feature",
          properties: { ddd: "11" },
          geometry: { type: "Polygon", coordinates: [[[10, 10], [14, 10], [14, 14], [10, 14], [10, 10]]] },
        },
        { type: "Feature", properties: { ddd: "invalid" }, geometry: square },
      ],
    };

    const normalized = normalizeDddFeatures(data);
    expect(normalized.features.features).toHaveLength(2);
    expect(normalized.features.features[0]?.properties._ddd).toBe("11");
    expect(normalized.labelPoints.get("11")).toMatchObject({ lng: 12, lat: 12 });
  });
});
