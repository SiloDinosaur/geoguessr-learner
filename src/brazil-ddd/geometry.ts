import type {
  DddFeature,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  Geometry,
  LabelPoint,
  NormalizedDddData,
  Position,
} from "./types";

export const KNOWN_DDDS = new Set(
  (
    "11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 " +
    "41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 " +
    "71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99"
  ).split(" "),
);

const DDD_PROPERTY_NAME = /ddd|phone|dial|area.?code|codigo|código|^code$|^cod$/i;

export function getDdd(properties: Record<string, unknown> = {}): string | null {
  const entries = Object.entries(properties);
  const preferred = entries.filter(([key]) => DDD_PROPERTY_NAME.test(key));

  for (const [, value] of [...preferred, ...entries]) {
    const match = String(value ?? "").trim().match(/^(?:DDD\s*)?(\d{2})$/i);
    if (match?.[1] && KNOWN_DDDS.has(match[1])) return match[1];
  }

  return null;
}

export function outerRings(geometry: Geometry | null | undefined): Position[][] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates[0] ? [geometry.coordinates[0]] : [];
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => (polygon[0] ? [polygon[0]] : []));
  }
  return geometry.geometries.flatMap(outerRings);
}

/** Returns the planar centroid of the largest outer ring for one label per DDD. */
export function labelPosition(geometry: Geometry | null | undefined): LabelPoint | null {
  let biggest: LabelPoint | null = null;

  for (const ring of outerRings(geometry)) {
    if (ring.length < 3) continue;

    let crossSum = 0;
    let longitudeSum = 0;
    let latitudeSum = 0;

    for (let index = 0; index < ring.length; index += 1) {
      const first = ring[index];
      const second = ring[(index + 1) % ring.length];
      if (!first || !second) continue;
      const cross = first[0] * second[1] - second[0] * first[1];
      crossSum += cross;
      longitudeSum += (first[0] + second[0]) * cross;
      latitudeSum += (first[1] + second[1]) * cross;
    }

    if (Math.abs(crossSum) < 1e-8) continue;
    const candidate: LabelPoint = {
      area: Math.abs(crossSum),
      lng: longitudeSum / (3 * crossSum),
      lat: latitudeSum / (3 * crossSum),
    };
    if (!biggest || candidate.area > biggest.area) biggest = candidate;
  }

  return biggest;
}

export function assertFeatureCollection(value: unknown): GeoJsonFeatureCollection {
  if (!value || typeof value !== "object") throw new Error("Expected a GeoJSON FeatureCollection");
  const candidate = value as Partial<GeoJsonFeatureCollection>;
  if (candidate.type !== "FeatureCollection" || !Array.isArray(candidate.features)) {
    throw new Error("Expected a GeoJSON FeatureCollection");
  }
  return candidate as GeoJsonFeatureCollection;
}

export function normalizeDddFeatures(data: GeoJsonFeatureCollection): NormalizedDddData {
  const labelPoints = new Map<string, LabelPoint>();
  const features: DddFeature[] = [];

  for (const feature of data.features) {
    const ddd = getDdd(feature.properties ?? {});
    if (!ddd || !feature.geometry) continue;

    const normalizedFeature: DddFeature = {
      ...feature,
      geometry: feature.geometry,
      properties: { ...(feature.properties ?? {}), _ddd: ddd },
    };
    features.push(normalizedFeature);

    const point = labelPosition(feature.geometry);
    const previousPoint = labelPoints.get(ddd);
    if (point && (!previousPoint || point.area > previousPoint.area)) {
      labelPoints.set(ddd, point);
    }
  }

  if (!features.length) {
    throw new Error("No DDD polygons found. The data format may have changed.");
  }

  return {
    features: { type: "FeatureCollection", features },
    labelPoints,
  };
}

export function asFeatureCollection(feature: GeoJsonFeature): GeoJsonFeatureCollection {
  return { type: "FeatureCollection", features: [feature] };
}
