import { describe, expect, it } from "vitest";

import {
  MATCHING_PAIR_COLOURS,
  accentForTrack,
  confettiColours,
  palette,
  trackAccent,
} from "./tokens";

describe("palette", () => {
  it("exports all expected colour keys", () => {
    expect(palette.cream).toBe("#FBF4EA");
    expect(palette.ink).toBe("#2A2342");
    expect(palette.muted).toBe("#6B6480");
    expect(palette.brand).toBe("#6D4AFF");
    expect(palette.xp).toBe("#FFB020");
    expect(palette.success).toBe("#1FA971");
    expect(palette.warn).toBe("#F2545B");
  });
});

describe("MATCHING_PAIR_COLOURS", () => {
  it("contains six distinct colours", () => {
    expect(MATCHING_PAIR_COLOURS).toHaveLength(6);
    expect(new Set(MATCHING_PAIR_COLOURS).size).toBe(6);
  });
});

describe("accentForTrack", () => {
  it("returns the known accent for known track ids", () => {
    expect(accentForTrack("algebra")).toBe("#6D4AFF");
    expect(accentForTrack("geometry")).toBe("#0FB6A8");
    expect(accentForTrack("time")).toBe("#FF7A4D");
  });

  it("returns a deterministic colour for an unknown track id", () => {
    const colour = accentForTrack("unknown-track");
    expect(colour).toMatch(/^#[0-9A-Fa-f]{6}$/);
    // Same input produces the same output.
    expect(accentForTrack("unknown-track")).toBe(colour);
  });
});

describe("trackAccent", () => {
  it("returns the known accent for a known track id via proxy", () => {
    expect(trackAccent.algebra).toBe("#6D4AFF");
    expect(trackAccent.geometry).toBe("#0FB6A8");
  });

  it("returns a deterministic colour for an unknown track id via proxy fallback", () => {
    const colour = trackAccent["some-random-track"];
    expect(colour).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(trackAccent["some-random-track"]).toBe(colour);
  });

  it("does not have own properties for unknown track ids", () => {
    // The proxy fallback does not set own properties.
    expect(
      Object.prototype.hasOwnProperty.call(trackAccent, "unknown-xyz"),
    ).toBe(false);
  });
});

describe("confettiColours", () => {
  it("returns a list of four hex colours from the brand palette", () => {
    const colours = confettiColours();
    expect(colours).toHaveLength(4);
    for (const colour of colours) {
      expect(colour).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
    expect(colours).toContain(palette.brand);
    expect(colours).toContain(palette.xp);
    expect(colours).toContain(palette.success);
  });
});
