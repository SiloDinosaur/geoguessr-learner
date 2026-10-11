import { DATA_URL, DDD_COLORS, MAP_SELECTORS } from "./data";
import { assertFeatureCollection, normalizeDddFeatures } from "./geometry";
import type { DddFeatureCollection, LabelPoint, NormalizedDddData } from "./types";

type XmlHttpRequestDetails = {
  method: "GET";
  url: string;
  timeout: number;
  onload: (response: { status: number; responseText: string }) => void;
  ontimeout: () => void;
  onerror: () => void;
};

declare const GM_xmlhttpRequest: (details: XmlHttpRequestDetails) => void;
declare const unsafeWindow: Window & { google?: GoogleMapsApi };

type GoogleMap = {
  getDiv(): HTMLElement;
  getZoom(): number;
  getCenter(): GoogleLatLng | null;
  getBounds(): unknown;
};

type GoogleLatLng = {
  lat(): number;
  lng(): number;
};

type DataFeature = {
  getProperty(name: string): unknown;
};

type DataLayer = {
  addGeoJson(collection: DddFeatureCollection): void;
  setMap(map: GoogleMap | null): void;
  setStyle(style: (feature: DataFeature) => GoogleDataStyle): void;
};

type GoogleDataStyle = {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  clickable: false;
  zIndex: number;
};

type OverlayView = {
  onAdd: (() => void) | null;
  draw: (() => void) | null;
  onRemove: (() => void) | null;
  getPanes(): { overlayLayer: HTMLElement };
  getProjection(): {
    fromLatLngToDivPixel(location: unknown): { x: number; y: number } | null;
  } | null;
  setMap(map: GoogleMap | null): void;
};

type GoogleMapsApi = {
  maps: {
    Data: new (options: { map: GoogleMap | null }) => DataLayer;
    OverlayView: new () => OverlayView;
    LatLng: new (lat: number, lng: number) => unknown;
  };
};

type FoundMap = { map: GoogleMap; element: HTMLElement };
type ActiveOverlay = {
  map: GoogleMap;
  layer: DataLayer | null;
  labels: OverlayView | null;
  visible: boolean | null;
  loading: boolean;
  gone: boolean;
  syncVisibility?: () => void;
};

const BRAZIL_VIEW = {
  north: 5.5,
  south: -34.5,
  west: -74.5,
  east: -34.5,
  minZoom: 4,
} as const;

function googleApi(): GoogleMapsApi | undefined {
  const scriptWindow: Window & { google?: GoogleMapsApi } =
    typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  return scriptWindow.google;
}

function isGoogleMap(value: unknown): value is GoogleMap {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GoogleMap>;
  return (
    typeof candidate.getDiv === "function" &&
    typeof candidate.getZoom === "function" &&
    typeof candidate.getCenter === "function" &&
    typeof candidate.getBounds === "function"
  );
}

function reactFiberFrom(element: HTMLElement): unknown {
  const key = Object.keys(element).find((name) => name.startsWith("__reactFiber$"));
  return key ? (element as unknown as Record<string, unknown>)[key] : undefined;
}

function findGuessMap(): FoundMap | null {
  for (const element of document.querySelectorAll<HTMLElement>(MAP_SELECTORS)) {
    let fiber: unknown = reactFiberFrom(element);
    for (let depth = 0; fiber && depth < 18; depth += 1) {
      const node = fiber as {
        return?: unknown;
        memoizedProps?: { map?: unknown; googleMap?: unknown };
        memoizedState?: { current?: { instance?: unknown }; memoizedState?: { current?: { instance?: unknown } } };
        stateNode?: { map?: unknown };
      };
      const possibilities = [
        node.memoizedProps?.map,
        node.memoizedProps?.googleMap,
        node.memoizedState?.memoizedState?.current?.instance,
        node.memoizedState?.current?.instance,
        node.stateNode?.map,
      ];
      for (const candidate of possibilities) {
        if (isGoogleMap(candidate) && document.contains(candidate.getDiv())) {
          return { map: candidate, element };
        }
      }
      fiber = node.return;
    }
  }
  return null;
}

export function isBrazilFocusedView(map: Pick<GoogleMap, "getCenter" | "getZoom">): boolean {
  const center = map.getCenter();
  if (!center || map.getZoom() < BRAZIL_VIEW.minZoom) return false;

  const lat = center.lat();
  const lng = center.lng();
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= BRAZIL_VIEW.south &&
    lat <= BRAZIL_VIEW.north &&
    lng >= BRAZIL_VIEW.west &&
    lng <= BRAZIL_VIEW.east
  );
}

function createLabels(map: GoogleMap, points: Map<string, LabelPoint>): OverlayView {
  const google = googleApi();
  if (!google?.maps.OverlayView) throw new Error("Google Maps is unavailable");

  const overlay = new google.maps.OverlayView();
  let root: HTMLDivElement | null = null;
  const labels: Array<{ point: LabelPoint; element: HTMLSpanElement }> = [];

  overlay.onAdd = () => {
    root = document.createElement("div");
    root.className = "br-ddd-labels";
    root.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;";

    for (const [code, point] of points) {
      const element = document.createElement("span");
      element.textContent = code;
      element.style.cssText =
        "position:absolute;transform:translate(-50%,-50%);font:700 11px/1.2 Arial,sans-serif;" +
        "letter-spacing:.1px;color:#101820;background:rgba(255,255,255,.85);padding:1px 3px;" +
        "border-radius:3px;box-shadow:0 0 2px rgba(0,0,0,.35);white-space:nowrap;pointer-events:none;";
      root.appendChild(element);
      labels.push({ point, element });
    }

    overlay.getPanes().overlayLayer.appendChild(root);
  };

  overlay.draw = () => {
    if (!root) return;
    root.style.display = map.getZoom() >= 5 ? "" : "none";
    const projection = overlay.getProjection();
    if (!projection) return;

    for (const { point, element } of labels) {
      const position = projection.fromLatLngToDivPixel(new google.maps.LatLng(point.lat, point.lng));
      if (position) {
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;
      }
    }
  };

  overlay.onRemove = () => {
    root?.remove();
    root = null;
  };
  overlay.setMap(map);
  return overlay;
}

function requestData(): Promise<NormalizedDddData> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url: DATA_URL,
      timeout: 30_000,
      onload: (response) => {
        if (response.status < 200 || response.status >= 300) {
          reject(new Error(`DDD data HTTP ${response.status}`));
          return;
        }
        try {
          resolve(normalizeDddFeatures(assertFeatureCollection(JSON.parse(response.responseText))));
        } catch (error) {
          reject(error);
        }
      },
      ontimeout: () => reject(new Error("DDD data request timed out")),
      onerror: () => reject(new Error("DDD data request failed")),
    });
  });
}

export function startBrazilDddOverlay(): void {
  let active: ActiveOverlay | null = null;
  let dataPromise: Promise<NormalizedDddData> | null = null;
  const opacity = 0.28;

  const loadData = () => {
    dataPromise ??= requestData().catch((error: unknown) => {
      dataPromise = null;
      throw error;
    });
    return dataPromise;
  };

  const styleForDdd = (feature: DataFeature): GoogleDataStyle => {
    const code = String(feature.getProperty("_ddd"));
    return {
      fillColor: DDD_COLORS[code[0] ?? ""] ?? "#777",
      fillOpacity: opacity,
      strokeColor: "#28343e",
      strokeOpacity: 0.72,
      strokeWeight: 0.75,
      clickable: false,
      zIndex: 1,
    };
  };

  const attach = ({ map }: FoundMap): void => {
    const instance: ActiveOverlay = {
      map,
      layer: null,
      labels: null,
      visible: null,
      loading: false,
      gone: false,
    };
    active = instance;

    const addLayer = async () => {
      instance.loading = true;
      try {
        const data = await loadData();
        if (instance.gone || active !== instance) return;

        const google = googleApi();
        if (!google?.maps.Data || !google.maps.OverlayView) throw new Error("Google Maps is unavailable");
        instance.layer = new google.maps.Data({ map: instance.visible ? map : null });
        instance.layer.addGeoJson(data.features);
        instance.layer.setStyle(styleForDdd);
        instance.labels = createLabels(map, data.labelPoints);
        if (!instance.visible) instance.labels.setMap(null);
      } catch (error) {
        console.error("[GeoGuessr Brazil DDD]", error);
      } finally {
        instance.loading = false;
      }
    };

    const syncVisibility = () => {
      const visible = isBrazilFocusedView(map);
      if (visible === instance.visible) return;

      instance.visible = visible;
      instance.layer?.setMap(visible ? map : null);
      instance.labels?.setMap(visible ? map : null);
      if (visible && !instance.layer && !instance.loading) void addLayer();
    };

    instance.syncVisibility = syncVisibility;
    syncVisibility();
  };

  const check = () => {
    if (active && !document.contains(active.map.getDiv())) {
      active.gone = true;
      active.labels?.setMap(null);
      active.layer?.setMap(null);
      active = null;
    }
    if (!active) {
      const found = findGuessMap();
      if (found) attach(found);
    }
    active?.syncVisibility?.();
  };

  window.setInterval(check, 1_000);
  check();
}
