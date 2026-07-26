import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONFIG,
  DEFAULT_MAP,
  circleHitsWall,
  directionVelocity,
  distance,
  moveAxis,
  parseMap,
} from "./map";

import type { Vec } from "./types";

const TEST_MAP = ["###", "#P#", "###"];

describe("parseMap", () => {
  it("reads dimensions and walls", () => {
    const parsed = parseMap(TEST_MAP, 10);
    expect(parsed.cols).toBe(3);
    expect(parsed.rows).toBe(3);
    expect(parsed.walls[0]).toEqual([true, true, true]);
    expect(parsed.walls[1]).toEqual([true, false, true]);
  });

  it("locates player, enemy, orbs, and exit centres", () => {
    const parsed = parseMap(["#####", "#PEo#", "#####"], 10);
    // Player at tile (1,1) -> centre (15,15).
    expect(parsed.playerStart).toEqual({ x: 15, y: 15 });
    // Enemy at tile (2,1) -> centre (25,15).
    expect(parsed.enemyStart).toEqual({ x: 25, y: 15 });
    // Orb at tile (3,1) -> centre (35,15).
    expect(parsed.orbPositions).toEqual([{ x: 35, y: 15 }]);
  });

  it("provides fallbacks for missing player and exit", () => {
    // 3 rows of 5 floor tiles: cols=5, rows=3.
    const parsed = parseMap([".....", ".....", "....."], 10);
    // No P: defaults to interior top-left tile (1,1) -> (15,15).
    expect(parsed.playerStart).toEqual({ x: 15, y: 15 });
    // No X: defaults to bottom-right interior tile (cols-2, rows-2) = (3,1).
    expect(parsed.exit).toEqual({ x: 35, y: 15 });
    expect(parsed.enemyStart).toBeNull();
  });

  it("pads ragged rows with floor tiles", () => {
    const parsed = parseMap(["##", "#"], 10);
    expect(parsed.cols).toBe(2);
    expect(parsed.walls[1]).toEqual([true, false]);
  });

  it("default shipped map has orbs, an enemy, and an exit", () => {
    const parsed = parseMap(DEFAULT_MAP, DEFAULT_CONFIG.tileSize);
    expect(parsed.orbPositions.length).toBeGreaterThan(0);
    expect(parsed.enemyStart).not.toBeNull();
    expect(parsed.exit).toBeDefined();
  });
});

describe("circleHitsWall", () => {
  const walls = parseMap(TEST_MAP, 10).walls;

  it("is false on open floor", () => {
    expect(circleHitsWall(15, 15, 3, walls, 10)).toBe(false);
  });

  it("is true when overlapping a wall tile", () => {
    // Centre of the open tile is (15,15); a radius of 8 reaches the walls.
    expect(circleHitsWall(15, 15, 8, walls, 10)).toBe(true);
  });

  it("is false for an empty grid", () => {
    expect(circleHitsWall(5, 5, 3, [], 10)).toBe(false);
  });
});

describe("moveAxis", () => {
  const walls = parseMap(["#####", "#...#", "#####"], 10).walls;
  const centre: Vec = { x: 15, y: 15 };

  it("moves freely on floor", () => {
    const moved = moveAxis(centre, 5, "x", 3, walls, 10);
    expect(moved.x).toBe(20);
  });

  it("blocks movement into a wall and returns the original position", () => {
    // Corridor floor runs x=10..40; tile col 4 (x=40..50) is a wall. A 30px
    // jump from x=15 lands the centre on x=45, squarely inside that wall.
    const moved = moveAxis(centre, 30, "x", 3, walls, 10);
    expect(moved).toEqual(centre);
  });
});

describe("directionVelocity", () => {
  it("maps each direction to a unit-axis velocity at the given speed", () => {
    expect(directionVelocity("up", 10)).toEqual({ x: 0, y: -10 });
    expect(directionVelocity("down", 10)).toEqual({ x: 0, y: 10 });
    expect(directionVelocity("left", 10)).toEqual({ x: -10, y: 0 });
    expect(directionVelocity("right", 10)).toEqual({ x: 10, y: 0 });
  });

  it("is stationary for null", () => {
    expect(directionVelocity(null, 10)).toEqual({ x: 0, y: 0 });
  });
});

describe("distance", () => {
  it("computes Euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("is zero for coincident points", () => {
    expect(distance({ x: 7, y: 7 }, { x: 7, y: 7 })).toBe(0);
  });
});
