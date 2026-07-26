import { describe, expect, it } from "vitest";

import { gameReducer, initGame } from "./gameReducer";

import type { GameConfig, GameState } from "./types";

/** Open room: player top-left, one orb mid-row, exit lower-right. */
const MAP_OPEN = ["#######", "#P..o.#", "#.....#", "#....X#", "#######"];

/** Horizontal corridor: player, two orbs, then the exit. */
const MAP_CORRIDOR = ["#########", "#P.o.o.X#", "#########"];

/** Corridor with a static enemy between player and the orbs. */
const MAP_ENEMY = ["#######", "#P.E.X#", "#.....#", "#######"];

/** Small open room used to exercise enemy patrol bounds. */
const MAP_PATROL = ["#######", "#P...X#", "#.E...#", "#######"];

/** Builds a config with small, deterministic tuning. */
function makeConfig(
  map: readonly string[],
  overrides: Partial<GameConfig> = {},
): GameConfig {
  return {
    map: [...map],
    tileSize: 10,
    playerSpeed: 10,
    enemySpeed: 0,
    playerRadius: 3,
    enemyRadius: 3,
    orbRadius: 3,
    lives: 3,
    questionEveryOrbs: 2,
    questionBonus: 50,
    orbPoints: 10,
    invulnMs: 1000,
    ...overrides,
  };
}

/** Starts a game and returns the playing state. */
function startPlaying(state: GameState): GameState {
  return gameReducer(state, { type: "START" });
}

/** Dispatches one tick with a fixed clock value. */
function tick(
  state: GameState,
  dt: number,
  now: number,
  questionsRemaining = 10,
): GameState {
  return gameReducer(state, {
    type: "TICK",
    dt,
    now,
    questionsRemaining,
  });
}

describe("initGame", () => {
  it("starts in the intro phase with full lives and parsed orbs", () => {
    const state = initGame(makeConfig(MAP_OPEN));
    expect(state.phase).toBe("intro");
    expect(state.lives).toBe(3);
    expect(state.collected).toBe(0);
    expect(state.orbs).toHaveLength(1);
    expect(state.player).toEqual(state.playerStart);
    expect(state.inputDir).toBeNull();
  });

  it("omits the enemy when the map has no E", () => {
    const state = initGame(makeConfig(MAP_OPEN));
    expect(state.enemy).toBeNull();
  });

  it("creates an enemy from an E tile", () => {
    const state = initGame(makeConfig(MAP_ENEMY));
    expect(state.enemy).not.toBeNull();
  });
});

describe("gameReducer - phase transitions", () => {
  it("START moves intro to playing and is a no-op otherwise", () => {
    const intro = initGame(makeConfig(MAP_OPEN));
    const playing = gameReducer(intro, { type: "START" });
    expect(playing.phase).toBe("playing");
    expect(gameReducer(playing, { type: "START" })).toBe(playing);
  });

  it("SET_INPUT only changes direction while playing", () => {
    const intro = initGame(makeConfig(MAP_OPEN));
    expect(gameReducer(intro, { type: "SET_INPUT", dir: "right" })).toBe(intro);
    const playing = startPlaying(intro);
    const moved = gameReducer(playing, { type: "SET_INPUT", dir: "right" });
    expect(moved.inputDir).toBe("right");
  });

  it("RESET rebuilds the intro state from the config", () => {
    const playing = startPlaying(initGame(makeConfig(MAP_OPEN)));
    const reset = gameReducer(playing, { type: "RESET" });
    expect(reset.phase).toBe("intro");
    expect(reset.collected).toBe(0);
  });
});

describe("gameReducer - TICK movement and walls", () => {
  it("is a no-op outside the playing phase", () => {
    const intro = initGame(makeConfig(MAP_OPEN));
    expect(tick(intro, 1, 100)).toBe(intro);
  });

  it("moves the player by speed*dt in the input direction", () => {
    let state = startPlaying(initGame(makeConfig(MAP_OPEN)));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    state = tick(state, 1, 100);
    // Started at (15,15); +10 on x.
    expect(state.player.x).toBe(25);
    expect(state.player.y).toBe(15);
  });

  it("stops the player at a wall (move reverts when blocked)", () => {
    let state = startPlaying(initGame(makeConfig(MAP_OPEN)));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    // Floor runs to x=60; a single 50px jump lands the centre on x=65, inside
    // the right border wall, so the whole move is reverted.
    state = tick(state, 5, 100);
    expect(state.player.x).toBe(15);
  });

  it("does not move when no input is set", () => {
    let state = startPlaying(initGame(makeConfig(MAP_OPEN)));
    state = tick(state, 1, 100);
    expect(state.player).toEqual({ x: 15, y: 15 });
  });
});

describe("gameReducer - orb collection", () => {
  it("collects an orb the player overlaps and awards points", () => {
    let state = startPlaying(initGame(makeConfig(MAP_OPEN)));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    // Orb sits at tile (4,1) -> centre (45,15); reach it in three steps.
    state = tick(state, 1, 100);
    state = tick(state, 1, 200);
    state = tick(state, 1, 300);
    expect(state.collected).toBe(1);
    expect(state.score).toBe(10);
    expect(state.orbs.every((orb) => orb.collected)).toBe(true);
  });
});

describe("gameReducer - question cadence", () => {
  it("pauses for a question every N orbs when one is available", () => {
    const config = makeConfig(MAP_CORRIDOR, { questionEveryOrbs: 1 });
    let state = startPlaying(initGame(config));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    // First orb at (35,15): step 15 -> 25 -> 35.
    state = tick(state, 1, 100);
    state = tick(state, 1, 200);
    state = tick(state, 1, 300);
    expect(state.collected).toBe(1);
    expect(state.phase).toBe("question");
  });

  it("does not pause when no questions remain in the pool", () => {
    const config = makeConfig(MAP_CORRIDOR, { questionEveryOrbs: 1 });
    let state = startPlaying(initGame(config));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    // The collecting tick must see zero questions remaining.
    state = tick(state, 1, 100, 0);
    state = tick(state, 1, 200, 0);
    state = tick(state, 1, 300, 0);
    expect(state.collected).toBe(1);
    expect(state.phase).toBe("playing");
  });
});

describe("gameReducer - answering and resuming", () => {
  function reachQuestion(): GameState {
    const config = makeConfig(MAP_CORRIDOR, { questionEveryOrbs: 1 });
    let state = startPlaying(initGame(config));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    state = tick(state, 1, 100);
    state = tick(state, 1, 200);
    return tick(state, 1, 300);
  }

  it("ANSWER is a no-op outside the question phase", () => {
    const playing = startPlaying(initGame(makeConfig(MAP_OPEN)));
    expect(gameReducer(playing, { type: "ANSWER", correct: true })).toBe(
      playing,
    );
  });

  it("a correct answer awards bonus points and counts the question", () => {
    let state = reachQuestion();
    state = gameReducer(state, { type: "ANSWER", correct: true });
    expect(state.questionsAsked).toBe(1);
    expect(state.questionsCorrect).toBe(1);
    expect(state.score).toBe(60); // 10 orb + 50 bonus
    expect(state.lastAnswerCorrect).toBe(true);
  });

  it("a wrong answer costs a life", () => {
    let state = reachQuestion();
    const livesBefore = state.lives;
    state = gameReducer(state, { type: "ANSWER", correct: false });
    expect(state.lives).toBe(livesBefore - 1);
    expect(state.lastAnswerCorrect).toBe(false);
  });

  it("RESUME returns to playing and clears input", () => {
    let state = reachQuestion();
    state = gameReducer(state, { type: "ANSWER", correct: true });
    state = gameReducer(state, { type: "RESUME" });
    expect(state.phase).toBe("playing");
    expect(state.inputDir).toBeNull();
  });

  it("RESUME ends the game when a wrong answer used the last life", () => {
    const config = makeConfig(MAP_CORRIDOR, {
      questionEveryOrbs: 1,
      lives: 1,
    });
    let state = startPlaying(initGame(config));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    state = tick(state, 1, 100);
    state = tick(state, 1, 200);
    state = tick(state, 1, 300);
    state = gameReducer(state, { type: "ANSWER", correct: false });
    expect(state.lives).toBe(0);
    state = gameReducer(state, { type: "RESUME" });
    expect(state.phase).toBe("lost");
  });
});

describe("gameReducer - winning", () => {
  it("wins when every orb is collected and the player reaches the exit", () => {
    // Never pause (cadence huge) and no questions so play flows straight to X.
    const config = makeConfig(MAP_CORRIDOR, {
      questionEveryOrbs: 999,
    });
    let state = startPlaying(initGame(config));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    for (let i = 1; i <= 7; i++) {
      state = tick(state, 1, i * 100, 0);
    }
    expect(state.collected).toBe(2);
    expect(state.phase).toBe("won");
  });

  it("does not win before the exit is reached even with all orbs", () => {
    const config = makeConfig(MAP_CORRIDOR, { questionEveryOrbs: 999 });
    let state = startPlaying(initGame(config));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    // Reach both orbs (x=55) but stop short of the exit (x=75).
    for (let i = 1; i <= 4; i++) {
      state = tick(state, 1, i * 100, 0);
    }
    expect(state.collected).toBe(2);
    expect(state.phase).toBe("playing");
  });
});

describe("gameReducer - enemy", () => {
  it("a static enemy hit costs a life and knocks the player back", () => {
    // Enemy at (35,15); player walks right into it.
    let state = startPlaying(initGame(makeConfig(MAP_ENEMY)));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    state = tick(state, 1, 100);
    state = tick(state, 1, 200); // x=35 overlaps the enemy.
    expect(state.lives).toBe(2);
    expect(state.player).toEqual(state.playerStart);
    expect(state.invulnUntil).toBe(200 + 1000);
  });

  it("invulnerability prevents a second hit within the window", () => {
    let state = startPlaying(initGame(makeConfig(MAP_ENEMY)));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    state = tick(state, 1, 100);
    state = tick(state, 1, 200); // hit -> lives 2, knocked back, invuln until 1200.
    const livesAfterHit = state.lives;
    // Move straight back into the enemy during the i-frame window.
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    state = tick(state, 1, 300);
    state = tick(state, 1, 400);
    expect(state.lives).toBe(livesAfterHit);
  });

  it("losing the last life to the enemy ends the game", () => {
    let state = startPlaying(initGame(makeConfig(MAP_ENEMY, { lives: 1 })));
    state = gameReducer(state, { type: "SET_INPUT", dir: "right" });
    state = tick(state, 1, 100);
    state = tick(state, 1, 200);
    expect(state.lives).toBe(0);
    expect(state.phase).toBe("lost");
  });

  it("a patrolling enemy stays within the map bounds", () => {
    const config = makeConfig(MAP_PATROL, { enemySpeed: 50 });
    let state = startPlaying(initGame(config));
    for (let i = 1; i <= 200; i++) {
      state = tick(state, 0.1, i * 10);
    }
    const enemy = state.enemy!;
    expect(enemy).toBeDefined();
    expect(enemy.pos.x).toBeGreaterThanOrEqual(config.tileSize);
    expect(enemy.pos.x).toBeLessThanOrEqual((state.cols - 1) * config.tileSize);
    expect(enemy.pos.y).toBeGreaterThanOrEqual(config.tileSize);
    expect(enemy.pos.y).toBeLessThanOrEqual((state.rows - 1) * config.tileSize);
  });
});
