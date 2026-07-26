/**
 * The pure game state machine for "Bub Quest".
 *
 * The reducer owns every game rule: movement with wall sliding, orb collection,
 * a patrolling enemy, question pacing, scoring, and the win/lose transitions.
 * It is deterministic and free of React/DOM, so the whole loop is unit-tested
 * without a canvas. The React layer drives it with `TICK` from a rAF loop and
 * renders a question overlay whenever the phase becomes `"question"`.
 *
 * @module domain/game/gameReducer
 */

import {
  DEFAULT_CONFIG,
  directionVelocity,
  distance,
  moveAxis,
  parseMap,
} from "./map";

import type { Direction, Enemy, GameConfig, GameState, Orb } from "./types";

/** Actions driving the game. */
export type GameAction =
  | { type: "START" }
  | { type: "SET_INPUT"; dir: Direction }
  | {
      type: "TICK";
      dt: number;
      now: number;
      questionsRemaining: number;
    }
  | { type: "ANSWER"; correct: boolean }
  | { type: "RESUME" }
  | { type: "RESET" };

/**
 * Builds the initial game state for a configuration. The state starts in the
 * `"intro"` phase; dispatch `START` to begin play.
 *
 * @param config - The game configuration; defaults to {@link DEFAULT_CONFIG}.
 * @returns A fresh game state.
 */
export function initGame(config: GameConfig = DEFAULT_CONFIG): GameState {
  const parsed = parseMap(config.map, config.tileSize);
  const orbs: Orb[] = parsed.orbPositions.map((pos, index) => ({
    id: `orb-${index}`,
    pos,
    collected: false,
  }));
  const enemy: Enemy | null = parsed.enemyStart
    ? {
        pos: parsed.enemyStart,
        // Start moving diagonally; the step function reflects off walls.
        vel:
          config.enemySpeed > 0
            ? { x: config.enemySpeed * 0.6, y: config.enemySpeed * 0.8 }
            : { x: 0, y: 0 },
      }
    : null;

  return {
    phase: "intro",
    config,
    cols: parsed.cols,
    rows: parsed.rows,
    walls: parsed.walls,
    player: parsed.playerStart,
    playerStart: parsed.playerStart,
    exit: parsed.exit,
    enemy,
    orbs,
    collected: 0,
    lives: config.lives,
    score: 0,
    questionsAsked: 0,
    questionsCorrect: 0,
    inputDir: null,
    invulnUntil: 0,
    lastAnswerCorrect: null,
  };
}

/**
 * Advances the patrolling enemy, reflecting its velocity off walls on each axis.
 *
 * @param enemy - The current enemy.
 * @param dt - The elapsed seconds.
 * @param config - The game configuration.
 * @param walls - The wall grid.
 * @returns The moved enemy.
 */
function stepEnemy(
  enemy: Enemy,
  dt: number,
  config: GameConfig,
  walls: readonly boolean[][],
): Enemy {
  if (config.enemySpeed === 0) return enemy;
  let pos = enemy.pos;
  const vel = { ...enemy.vel };

  pos = moveAxis(
    pos,
    vel.x * dt,
    "x",
    config.enemyRadius,
    walls,
    config.tileSize,
  );
  // If x did not advance, the wall blocked us: reflect x.
  if (pos.x === enemy.pos.x) vel.x = -vel.x;

  pos = moveAxis(
    pos,
    vel.y * dt,
    "y",
    config.enemyRadius,
    walls,
    config.tileSize,
  );
  if (pos.y === enemy.pos.y) vel.y = -vel.y;

  return { pos, vel };
}

/**
 * Applies a single tick of simulation. Only runs while playing; returns the
 * unchanged state otherwise.
 *
 * @param state - The current state.
 * @param dt - Elapsed seconds since the last tick.
 * @param now - The current timestamp in milliseconds.
 * @param questionsRemaining - How many questions the pool still has; a cadence
 *   hit with none remaining is skipped so play is never paused without a prompt.
 * @returns The next state.
 */
function tick(
  state: GameState,
  dt: number,
  now: number,
  questionsRemaining: number,
): GameState {
  const { config, walls } = state;

  // 1. Move the player with axis-separated wall sliding.
  const vel = directionVelocity(state.inputDir, config.playerSpeed);
  let player = moveAxis(
    state.player,
    vel.x * dt,
    "x",
    config.playerRadius,
    walls,
    config.tileSize,
  );
  player = moveAxis(
    player,
    vel.y * dt,
    "y",
    config.playerRadius,
    walls,
    config.tileSize,
  );

  // 2. Step the enemy.
  const enemy = state.enemy ? stepEnemy(state.enemy, dt, config, walls) : null;

  // 3. Enemy collision: lose a life and knock the player back, with i-frames.
  let { lives, invulnUntil, phase } = state;
  if (
    enemy &&
    now >= state.invulnUntil &&
    distance(player, enemy.pos) < config.playerRadius + config.enemyRadius
  ) {
    lives -= 1;
    invulnUntil = now + config.invulnMs;
    player = state.playerStart;
    if (lives <= 0) phase = "lost";
  }

  if (phase === "lost") {
    return { ...state, player, enemy, lives, invulnUntil, phase };
  }

  // 4. Collect any orbs the player overlaps.
  let orbs = state.orbs;
  const collectedNow = new Set<number>();
  for (const [i, orb] of orbs.entries()) {
    if (orb.collected) continue;
    if (distance(player, orb.pos) < config.playerRadius + config.orbRadius) {
      collectedNow.add(i);
    }
  }
  const collected = state.collected + collectedNow.size;
  const score = state.score + collectedNow.size * config.orbPoints;
  if (collectedNow.size > 0) {
    orbs = orbs.map((orb, i) =>
      collectedNow.has(i) ? { ...orb, collected: true } : orb,
    );
  }

  // 5. Win: every orb collected and the player has reached the exit.
  if (
    collected === orbs.length &&
    distance(player, state.exit) < config.tileSize * 0.5
  ) {
    return {
      ...state,
      player,
      enemy,
      orbs,
      collected,
      score,
      lives,
      invulnUntil,
      phase: "won",
    };
  }

  // 6. Question cadence: pause every N orbs when a question is available.
  if (
    config.questionEveryOrbs > 0 &&
    collected > 0 &&
    collected % config.questionEveryOrbs === 0 &&
    collected > state.collected &&
    questionsRemaining > 0
  ) {
    return {
      ...state,
      player,
      enemy,
      orbs,
      collected,
      score,
      lives,
      invulnUntil,
      phase: "question",
      inputDir: null,
    };
  }

  return {
    ...state,
    player,
    enemy,
    orbs,
    collected,
    score,
    lives,
    invulnUntil,
    phase,
  };
}

/**
 * Advances the game in response to an action.
 *
 * @param state - The current game state.
 * @param action - The action to apply.
 * @returns The next game state.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START": {
      if (state.phase !== "intro") return state;
      return { ...state, phase: "playing" };
    }

    case "SET_INPUT": {
      if (state.phase !== "playing") return state;
      return { ...state, inputDir: action.dir };
    }

    case "TICK": {
      if (state.phase !== "playing") return state;
      return tick(state, action.dt, action.now, action.questionsRemaining);
    }

    case "ANSWER": {
      if (state.phase !== "question") return state;
      if (action.correct) {
        return {
          ...state,
          questionsAsked: state.questionsAsked + 1,
          questionsCorrect: state.questionsCorrect + 1,
          score: state.score + state.config.questionBonus,
          lastAnswerCorrect: true,
        };
      }
      return {
        ...state,
        questionsAsked: state.questionsAsked + 1,
        lives: state.lives - 1,
        lastAnswerCorrect: false,
      };
    }

    case "RESUME": {
      if (state.phase !== "question") return state;
      return {
        ...state,
        phase: state.lives <= 0 ? "lost" : "playing",
        inputDir: null,
      };
    }

    case "RESET": {
      return initGame(state.config);
    }

    default: {
      return state;
    }
  }
}
