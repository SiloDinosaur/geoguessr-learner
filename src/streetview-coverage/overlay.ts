import { MAP_SELECTORS } from "../brazil-ddd/data";
import { assertFeatureCollection } from "../brazil-ddd/geometry";
import { COUNTRY_DATA_URL, STREET_VIEW_COUNTRY_IDS, UNRENDERABLE_COUNTRY_IDS } from "./data";
import { countriesWithoutStreetView, type CountryFeatureCollection } from "./geometry";

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
  getCenter(): unknown;
  getBounds(): unknown;
};

type DataLayer = {
  addGeoJson(collection: CountryFeatureCollection): void;
  setMap(map: GoogleMap | null): void;
  setStyle(style: GoogleDataStyle): void;
};

type GoogleDataStyle = {
  fillColor: string;
  fillOpacity: number;
  strokeOpacity: number;
  strokeWeight: number;
  clickable: false;
  zIndex: number;
};

type GoogleMapsApi = {
  maps: {
    Data: new (options: { map: GoogleMap | null }) => DataLayer;
  };
};

type FoundMap = { map: GoogleMap };
type ActiveOverlay = { map: GoogleMap; layer: DataLayer };

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
        if (isGoogleMap(candidate) && document.contains(candidate.getDiv())) return { map: candidate };
      }
      fiber = node.return;
    }
  }
  return null;
}

function requestCountryData(): Promise<CountryFeatureCollection> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url: COUNTRY_DATA_URL,
      timeout: 30_000,
      onload: (response) => {
        if (response.status < 200 || response.status >= 300) {
          reject(new Error(`Country data HTTP ${response.status}`));
          return;
        }
        try {
          resolve(
            countriesWithoutStreetView(
              assertFeatureCollection(JSON.parse(response.responseText)),
              STREET_VIEW_COUNTRY_IDS,
              UNRENDERABLE_COUNTRY_IDS,
            ),
          );
        } catch (error) {
          reject(error);
        }
      },
      ontimeout: () => reject(new Error("Country data request timed out")),
      onerror: () => reject(new Error("Country data request failed")),
    });
  });
}

export function startStreetViewCoverageOverlay(): void {
  let active: ActiveOverlay | null = null;
  let dataPromise: Promise<CountryFeatureCollection> | null = null;
  let attaching = false;

  const loadData = () => {
    dataPromise ??= requestCountryData().catch((error: unknown) => {
      dataPromise = null;
      throw error;
    });
    return dataPromise;
  };

  const attach = async ({ map }: FoundMap) => {
    attaching = true;
    try {
      const data = await loadData();
      const google = googleApi();
      if (!google?.maps.Data || !document.contains(map.getDiv()) || active) return;

      const layer = new google.maps.Data({ map });
      layer.addGeoJson(data);
      layer.setStyle({
        fillColor: "#5b6470",
        fillOpacity: 0.58,
        strokeOpacity: 0,
        strokeWeight: 0,
        clickable: false,
        zIndex: 0,
      });
      active = { map, layer };
    } catch (error) {
      console.error("[GeoGuessr Street View coverage]", error);
    } finally {
      attaching = false;
    }
  };

  const check = () => {
    if (active && !document.contains(active.map.getDiv())) {
      active.layer.setMap(null);
      active = null;
    }
    if (!active && !attaching) {
      const found = findGuessMap();
      if (found) void attach(found);
    }
  };

  window.setInterval(check, 1_000);
  check();
}
