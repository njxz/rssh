import { describe, expect, it } from "vitest";
import { groupWaveColor, wavePlaybackRate } from "./environment-wave";

describe("group terminal waves", () => {
  it("starts quickly and continuously settles into slow motion", () => {
    expect(wavePlaybackRate(0)).toBe(40);
    expect(wavePlaybackRate(900)).toBe(10.75);
    expect(wavePlaybackRate(1800)).toBe(1);
    expect(wavePlaybackRate(60000)).toBe(1);
    expect(wavePlaybackRate(-1)).toBe(40);
  });
  const production = {
    id: "prod", name: "Production", color: "#E05868", sort_order: 0,
    terminal_background: "#3B1518",
  };

  it("uses the current group color rather than a stored background override", () => {
    expect(groupWaveColor(production)).toBe("#E05868");
    expect(groupWaveColor({ ...production, color: "#4A6CF7" })).toBe("#4A6CF7");
    expect(production.terminal_background).toBe("#3B1518");
  });

  it("removes the decoration when disabled, ungrouped or deleted", () => {
    expect(groupWaveColor({ ...production, terminal_background: null })).toBeNull();
    expect(groupWaveColor({ ...production, terminal_background: undefined })).toBeNull();
    expect(groupWaveColor(null)).toBeNull();
    expect(groupWaveColor()).toBeNull();
  });

  it("does not insert malformed colors into SVG styles", () => {
    for (const color of ["", "red", "#fff", "#123456; color:red"]) {
      expect(groupWaveColor({ ...production, color })).toBeNull();
    }
  });
});
