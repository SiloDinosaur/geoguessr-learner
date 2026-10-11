export type Position = [longitude: number, latitude: number];

export type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] }
  | { type: "GeometryCollection"; geometries: Geometry[] };

export type GeoJsonFeature = {
  type?: "Feature";
  properties?: Record<string, unknown> | null;
  geometry?: Geometry | null;
  [key: string]: unknown;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export type DddFeature = GeoJsonFeature & {
  geometry: Geometry;
  properties: Record<string, unknown> & { _ddd: string };
};

export type DddFeatureCollection = {
  type: "FeatureCollection";
  features: DddFeature[];
};

export type LabelPoint = {
  area: number;
  lat: number;
  lng: number;
};

export type NormalizedDddData = {
  features: DddFeatureCollection;
  labelPoints: Map<string, LabelPoint>;
};
