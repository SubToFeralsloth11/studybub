/**
 * Pure domain types for the StudyBub arcade game ("Bub Quest").
 *
 * The game is a single-player, top-down orb hunt: move a bubble around a tiled
 * room, collect orbs, answer a question from the current track every few orbs,
 * dodge a patrolling wisp, and reach the exit once every orb is collected.
 *
 * All game rules (movement, collision, scoring, pacing) live in pure functions
 * and a pure reducer under this module, so they are unit-testable without React
 * or the DOM. The React layer only drives the reducer and draws its state.
 *
 * @module domain/game/types
 */

/** A phase of the game loop. */
export type GamePhase = "intro" | "playing" | "question" | "won" | "lost";

/** A two-dimensional vector in pixel coordinates. */
export interface Vec {
  /** The x coordinate in pixels. */
  x: number;
  /** The y coordinate in pixels. */
  y: number;
}

/** The four movement directions, or null when the player is still. */
export type Direction = "up" | "down" | "left" | "right" | null;

/** A collectible orb on the map. */
export interface Orb {
  /** Stable id unique within a game. */
  id: string;
  /** Centre position in pixels. */
  pos: Vec;
  /** Whether this orb has already been collected. */
  collected: boolean;
}

/** A patrolling enemy that bounces around the room. */
export interface Enemy {
  /** Centre position in pixels. */
  pos: Vec;
  /** Velocity in pixels per second. */
  vel: Vec;
}

/**
 * The static configuration for a game instance. Kept in state so the reducer is
 * fully self-contained and deterministic for tests.
 */
export interface GameConfig {
  /** The tile grid; each string is a row. `#` wall, `.` floor, `P` player start, `E` enemy start, `o` orb, `X` exit. */
  map: string[];
  /** Pixel size of one tile. */
  tileSize: number;
  /** Player movement speed in pixels per second. */
  playerSpeed: number;
  /** Enemy movement speed in pixels per second (0 disables the enemy). */
  enemySpeed: number;
  /** Player collision radius in pixels. */
  playerRadius: number;
  /** Enemy collision radius in pixels. */
  enemyRadius: number;
  /** Orb collection radius in pixels. */
  orbRadius: number;
  /** Starting number of lives. */
  lives: number;
  /** A question is asked after every N orbs collected. */
  questionEveryOrbs: number;
  /** Game points awarded for a correct answer. */
  questionBonus: number;
  /** Game points awarded per orb collected. */
  orbPoints: number;
  /** Invulnerability window after being hit, in milliseconds. */
  invulnMs: number;
}

/** The full, serialisable game state driven by {@link gameReducer}. */
export interface GameState {
  /** The current phase. */
  phase: GamePhase;
  /** The static config the game was started with. */
  config: GameConfig;
  /** Number of tile columns in the map. */
  cols: number;
  /** Number of tile rows in the map. */
  rows: number;
  /** `walls[y][x]` is true when tile (x,y) is solid. */
  walls: boolean[][];
  /** Player centre position in pixels. */
  player: Vec;
  /** The starting position the player is knocked back to after a hit. */
  playerStart: Vec;
  /** The exit position in pixels. */
  exit: Vec;
  /** The patrolling enemy, or null when the map has none. */
  enemy: Enemy | null;
  /** The orbs on the map. */
  orbs: Orb[];
  /** How many orbs have been collected so far. */
  collected: number;
  /** Remaining lives. */
  lives: number;
  /** Game points (separate from StudyBub XP). */
  score: number;
  /** How many questions have been asked. */
  questionsAsked: number;
  /** How many questions were answered correctly. */
  questionsCorrect: number;
  /** The current input direction, set by the React layer. */
  inputDir: Direction;
  /** Timestamp (ms) until which the player cannot be hit again. */
  invulnUntil: number;
  /** The result of the most recently answered question, for feedback. */
  lastAnswerCorrect: boolean | null;
}
