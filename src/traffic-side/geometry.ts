import type { GeoJsonFeatureCollection } from "../brazil-ddd/types";
import type { CountryFeature, CountryFeatureCollection } from "../streetview-coverage/geometry";

export type TrafficSide = "left" | "right";

/** Returns country boundaries whose road-traffic side matches the requested side. */
export function countriesWithTrafficSide(
  data: GeoJsonFeatureCollection,
  trafficSide: TrafficSide,
  leftHandTrafficCountryIds: ReadonlySet<string>,
  omittedCountryIds: ReadonlySet<string> = new Set(),
): CountryFeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.features.filter(
      (feature): feature is CountryFeature =>
        Boolean(feature.geometry) &&
        typeof feature.id === "string" &&
        leftHandTrafficCountryIds.has(feature.id) === (trafficSide === "left") &&
        !omittedCountryIds.has(feature.id),
    ),
  };
}
