import { MAP_SELECTORS } from "../brazil-ddd/data";
import { assertFeatureCollection } from "../brazil-ddd/geometry";
import { COUNTRY_DATA_URL, UNRENDERABLE_COUNTRY_IDS } from "../streetview-coverage/data";
import type { CountryFeatureCollection } from "../streetview-coverage/geometry";
import { LEFT_HAND_TRAFFIC_COUNTRY_IDS } from "./data";
import { countriesWithTrafficSide, type TrafficSide } from "./geometry";

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
  controls?: Record<number, GoogleMapControls>;
};

type GoogleMapControls = {
  getAt(index: number): HTMLElement;
  getLength(): number;
  push(element: HTMLElement): number;
  removeAt(index: number): HTMLElement;
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
    ControlPosition?: { LEFT_BOTTOM: number };
  };
};

type FoundMap = { map: GoogleMap };
type TrafficFilter = TrafficSide | "off";
type ActiveOverlay = {
  map: GoogleMap;
  layer: DataLayer | null;
  control: HTMLDivElement;
  removeControl: () => void;
  filter: TrafficFilter;
  gone: boolean;
};

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

function requestCountryData(trafficSide: TrafficSide): Promise<CountryFeatureCollection> {
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
            countriesWithTrafficSide(
              assertFeatureCollection(JSON.parse(response.responseText)),
              trafficSide,
              LEFT_HAND_TRAFFIC_COUNTRY_IDS,
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

function createControl(onChange: (filter: TrafficFilter) => void): HTMLDivElement {
  const control = document.createElement("div");
  control.className = "geoguessr-traffic-filter";
  control.style.cssText =
    "display:flex;overflow:hidden;pointer-events:auto;" +
    "border:1px solid rgba(0,0,0,.35);border-radius:4px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.35);";
  for (const eventName of ["mousedown", "pointerdown", "dblclick", "touchstart", "wheel"]) {
    control.addEventListener(eventName, (event) => event.stopPropagation());
  }

  const options: Array<{ filter: TrafficFilter; label: string; title: string }> = [
    { filter: "left", label: "L", title: "Grey right-hand-traffic countries" },
    { filter: "off", label: "Off", title: "Do not grey countries by traffic side" },
    { filter: "right", label: "R", title: "Grey left-hand-traffic countries" },
  ];
  const buttons = new Map<TrafficFilter, HTMLButtonElement>();

  const update = (filter: TrafficFilter) => {
    for (const [value, button] of buttons) {
      const selected = value === filter;
      button.setAttribute("aria-pressed", String(selected));
      button.style.background = selected ? "#dbe8f5" : "#fff";
      button.style.fontWeight = selected ? "700" : "500";
    }
    onChange(filter);
  };

  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.label;
    button.title = option.title;
    button.setAttribute("aria-label", option.title);
    button.style.cssText =
      "appearance:none;border:0;border-right:1px solid rgba(0,0,0,.18);padding:4px 6px;min-width:27px;" +
      "font:500 11px/1.2 Arial,sans-serif;color:#263238;cursor:pointer;background:#fff;";
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      update(option.filter);
    });
    control.appendChild(button);
    buttons.set(option.filter, button);
  }
  const lastButton = control.lastElementChild as HTMLButtonElement;
  lastButton.style.borderRight = "0";
  update("off");
  return control;
}

/** Add the control through Google Maps so map-pane styles cannot resize it. */
function addControl(map: GoogleMap, control: HTMLDivElement): () => void {
  const controlPosition = googleApi()?.maps.ControlPosition?.LEFT_BOTTOM;
  const controls = controlPosition === undefined ? undefined : map.controls?.[controlPosition];
  if (controls) {
    controls.push(control);
    return () => {
      for (let index = 0; index < controls.getLength(); index += 1) {
        if (controls.getAt(index) === control) {
          controls.removeAt(index);
          return;
        }
      }
    };
  }

  // A fallback for map implementations that do not expose the Controls API.
  // The host may be sized by Google Maps, but the actual control stays small.
  const host = document.createElement("div");
  host.style.cssText =
    "position:absolute!important;inset:0!important;width:100%!important;height:100%!important;" +
    "pointer-events:none!important;background:transparent!important;z-index:1000!important;";
  control.style.position = "absolute";
  control.style.bottom = "12px";
  control.style.left = "12px";
  host.appendChild(control);
  map.getDiv().appendChild(host);
  return () => host.remove();
}

export function startTrafficSideOverlay(): void {
  let active: ActiveOverlay | null = null;
  const dataPromises = new Map<TrafficSide, Promise<CountryFeatureCollection>>();

  const loadData = (trafficSide: TrafficSide) => {
    let promise = dataPromises.get(trafficSide);
    if (!promise) {
      promise = requestCountryData(trafficSide).catch((error: unknown) => {
        dataPromises.delete(trafficSide);
        throw error;
      });
      dataPromises.set(trafficSide, promise);
    }
    return promise;
  };

  const attach = ({ map }: FoundMap) => {
    const instance: ActiveOverlay = {
      map,
      layer: null,
      control: document.createElement("div"),
      removeControl: () => undefined,
      filter: "off",
      gone: false,
    };

    const setFilter = async (filter: TrafficFilter) => {
      instance.filter = filter;
      if (filter === "off") {
        instance.layer?.setMap(null);
        return;
      }

      const greyTrafficSide: TrafficSide = filter === "left" ? "right" : "left";
      try {
        const data = await loadData(greyTrafficSide);
        if (instance.gone || active !== instance || instance.filter !== filter) return;

        const google = googleApi();
        if (!google?.maps.Data) throw new Error("Google Maps is unavailable");
        instance.layer?.setMap(null);
        instance.layer = new google.maps.Data({ map });
        instance.layer.addGeoJson(data);
        instance.layer.setStyle({
          fillColor: "#5b6470",
          fillOpacity: 0.58,
          strokeOpacity: 0,
          strokeWeight: 0,
          clickable: false,
          zIndex: 2,
        });
      } catch (error) {
        console.error("[GeoGuessr traffic side]", error);
      }
    };

    instance.control = createControl((filter) => void setFilter(filter));
    instance.removeControl = addControl(map, instance.control);
    active = instance;
  };

  const check = () => {
    if (active && !document.contains(active.map.getDiv())) {
      active.gone = true;
      active.layer?.setMap(null);
      active.removeControl();
      active = null;
    }
    if (!active) {
      const found = findGuessMap();
      if (found) attach(found);
    }
  };

  window.setInterval(check, 1_000);
  check();
}
