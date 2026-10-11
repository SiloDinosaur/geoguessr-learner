import { describe, expect, it } from "vitest";
import { isBrazilFocusedView } from "../src/brazil-ddd/overlay";

function mapAt(zoom: number, lat: number, lng: number) {
  return {
    getZoom: () => zoom,
    getCenter: () => ({ lat: () => lat, lng: () => lng }),
  };
}

describe("Brazil DDD overlay visibility", () => {
  it("shows the overlay when the map is zoomed into Brazil", () => {
    expect(isBrazilFocusedView(mapAt(4, -14.2, -51.9))).toBe(true);
  });

  it("keeps the overlay hidden on a world-level Brazil view", () => {
    expect(isBrazilFocusedView(mapAt(3, -14.2, -51.9))).toBe(false);
  });

  it("keeps the overlay hidden when the view is focused outside Brazil", () => {
    expect(isBrazilFocusedView(mapAt(6, 40.4, -3.7))).toBe(false);
  });
});
