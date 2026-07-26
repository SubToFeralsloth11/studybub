/**
 * Map parsing and collision helpers for the game.
 *
 * All functions are pure: they take data and return data with no I/O. Collision
 * uses circle-versus-axis-aligned-rect tests against the wall grid, which keeps
 * movement smooth (wall sliding) while staying integer-tile friendly.
 *
 * @module domain/game/map
 */

import type { Direction, GameConfig, Vec } from "./types";

/** A parsed tile map. */
export interface ParsedMap {
  /** Number of tile columns. */
  cols: number;
  /** Number of tile rows. */
  rows: number;
  /** `walls[y][x]` true when the tile is solid (`#`). */
  walls: boolean[][];
  /** Player start centre in pixels. */
  playerStart: Vec;
  /** Enemy start centre in pixels, or null when the map has no `E`. */
  enemyStart: Vec | null;
  /** Exit centre in pixels. */
  exit: Vec;
  /** Centre positions of every orb (`o`). */
  orbPositions: Vec[];
}

/** Tile characters recognised in a map row. */
export const WALL_CHAR = "#";
const PLAYER_CHAR = "P";
const ENEMY_CHAR = "E";
const ORB_CHAR = "o";
const EXIT_CHAR = "X";

/**
 * Parses a string-tile map into structured geometry. Every row is padded to the
 * length of the longest row with floor tiles, so ragged maps degrade gracefully
 * instead of throwing. The first `P` and `X` are used; if absent, sensible
 * defaults (top-left and bottom-right interior tiles) keep the game playable.
 *
 * @param map - The tile grid as an array of row strings.
 * @param tileSize - The pixel size of one tile, used to convert tile to pixel.
 * @returns The parsed map geometry.
 */
export function parseMap(map: readonly string[], tileSize: number): ParsedMap {
  const rows = map.length;
  const cols = map.reduce((max, row) => Math.max(max, row.length), 0);

  const walls: boolean[][] = [];
  const orbPositions: Vec[] = [];
  let playerStart: Vec | null = null;
  let enemyStart: Vec | null = null;
  let exit: Vec | null = null;

  const centre = (col: number, row: number): Vec => ({
    x: col * tileSize + tileSize / 2,
    y: row * tileSize + tileSize / 2,
  });

  for (let row = 0; row < rows; row++) {
    const line = map[row] ?? "";
    const wallRow: boolean[] = [];
    for (let col = 0; col < cols; col++) {
      const ch = line[col] ?? ".";
      wallRow.push(ch === WALL_CHAR);
      if (ch === PLAYER_CHAR && !playerStart) playerStart = centre(col, row);
      else if (ch === ENEMY_CHAR && !enemyStart) enemyStart = centre(col, row);
      else if (ch === ORB_CHAR) orbPositions.push(centre(col, row));
      else if (ch === EXIT_CHAR && !exit) exit = centre(col, row);
    }
    walls.push(wallRow);
  }

  return {
    cols,
    rows,
    walls,
    playerStart: playerStart ?? centre(1, 1),
    enemyStart,
    exit: exit ?? centre(cols - 2, rows - 2),
    orbPositions,
  };
}

/**
 * Tests whether a circle overlaps any wall tile. Only tiles within the circle's
 * bounding box are checked, so the cost is constant for a given radius.
 *
 * @param cx - The circle centre x in pixels.
 * @param cy - The circle centre y in pixels.
 * @param r - The circle radius in pixels.
 * @param walls - The wall grid from {@link parseMap}.
 * @param tileSize - The pixel size of one tile.
 * @returns True when the circle overlaps at least one wall tile.
 */
export function circleHitsWall(
  cx: number,
  cy: number,
  r: number,
  walls: readonly boolean[][],
  tileSize: number,
): boolean {
  const rows = walls.length;
  if (rows === 0) return false;
  const cols = walls[0].length;

  const minCol = Math.max(0, Math.floor((cx - r) / tileSize));
  const maxCol = Math.min(cols - 1, Math.floor((cx + r) / tileSize));
  const minRow = Math.max(0, Math.floor((cy - r) / tileSize));
  const maxRow = Math.min(rows - 1, Math.floor((cy + r) / tileSize));

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!walls[row][col]) continue;
      const rx = col * tileSize;
      const ry = row * tileSize;
      const closestX = Math.max(rx, Math.min(cx, rx + tileSize));
      const closestY = Math.max(ry, Math.min(cy, ry + tileSize));
      const dx = cx - closestX;
      const dy = cy - closestY;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

/**
 * Moves a position along one axis, reverting it when the resulting circle would
 * overlap a wall. This produces wall sliding when both axes are tried in turn.
 *
 * @param pos - The starting position.
 * @param delta - The signed pixel delta for this axis.
 * @param axis - `"x"` or `"y"`.
 * @param r - The circle radius.
 * @param walls - The wall grid.
 * @param tileSize - The pixel size of one tile.
 * @returns The new position on this axis.
 */
export function moveAxis(
  pos: Vec,
  delta: number,
  axis: "x" | "y",
  r: number,
  walls: readonly boolean[][],
  tileSize: number,
): Vec {
  const next = { ...pos, [axis]: pos[axis] + delta };
  if (!circleHitsWall(next.x, next.y, r, walls, tileSize)) return next;
  return pos;
}

/**
 * Distance between two points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns The Euclidean distance in pixels.
 */
export function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The velocity vector for a direction at a given speed.
 *
 * @param dir - The direction, or null when still.
 * @param speed - Magnitude in pixels per second.
 * @returns The velocity vector, or (0,0) when still.
 */
export function directionVelocity(
  dir: Direction,
  speed: number,
): { x: number; y: number } {
  switch (dir) {
    case "up": {
      return { x: 0, y: -speed };
    }
    case "down": {
      return { x: 0, y: speed };
    }
    case "left": {
      return { x: -speed, y: 0 };
    }
    case "right": {
      return { x: speed, y: 0 };
    }
    default: {
      return { x: 0, y: 0 };
    }
  }
}

// Imported type used only for the Direction alias above.

/**
 * Convenience: the default tile map shipped with the game. A compact room with a
 * border wall, interior pillars, eight orbs, one patrolling wisp, and an exit.
 * Kept here so the config can reference a single source of truth.
 */
export const DEFAULT_MAP: readonly string[] = [
  "#############",
  "#P..o....o..#",
  "#.#.###.#.#.#",
  "#...o.E.o...#",
  "#.###.#.###.#",
  "#o..o...o..o#",
  "#.#.#####.#.#",
  "#..o...X...o#",
  "#############",
];

/**
 * The default game configuration. The React layer builds the initial state from
 * this; tests override individual fields as needed.
 */
export const DEFAULT_CONFIG: GameConfig = {
  map: [...DEFAULT_MAP],
  tileSize: 36,
  playerSpeed: 150,
  enemySpeed: 90,
  playerRadius: 12,
  enemyRadius: 12,
  orbRadius: 9,
  lives: 3,
  questionEveryOrbs: 2,
  questionBonus: 50,
  orbPoints: 10,
  invulnMs: 1500,
};
