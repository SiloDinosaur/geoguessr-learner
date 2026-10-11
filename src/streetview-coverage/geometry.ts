import type { GeoJsonFeature, GeoJsonFeatureCollection, Geometry } from "../brazil-ddd/types";

export type CountryFeature = GeoJsonFeature & {
  id: string;
  geometry: Geometry;
};

export type CountryFeatureCollection = {
  type: "FeatureCollection";
  features: CountryFeature[];
};

export function countriesWithoutStreetView(
  data: GeoJsonFeatureCollection,
  coveredCountryIds: ReadonlySet<string>,
  omittedCountryIds: ReadonlySet<string> = new Set(),
): CountryFeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.features.filter(
      (feature): feature is CountryFeature =>
        Boolean(feature.geometry) &&
        typeof feature.id === "string" &&
        !coveredCountryIds.has(feature.id) &&
        !omittedCountryIds.has(feature.id),
    ),
  };
}
