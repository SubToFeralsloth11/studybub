/**
 * Imperative canvas renderer for "Bub Quest".
 *
 * Drawing is intentionally separated from the pure game state: this module turns
 * a {@link GameState} into pixels and touches no game rules. It is only invoked
 * from the React component's animation-frame loop, so it is exercised by the
 * Playwright end-to-end test rather than the jsdom unit suite.
 *
 * @module features/game/gameRenderer
 */

import type { GameState } from "../../domain/game/types";

/** Colours used across the game artwork. */
const COLOURS = {
  floor: "#FFF8EE",
  floorAlt: "#FDEFE0",
  wall: "#3B2A6B",
  wallTop: "#5A3F9E",
  orb: "#FFC93C",
  orbShine: "#FFF3C4",
  orbSpent: "#E6D9C9",
  player: "#38BDF8",
  playerDark: "#0EA5E9",
  playerMouth: "#0C4A6E",
  enemy: "#A855F7",
  enemyDark: "#7E22CE",
  exitLocked: "#CBD5E1",
  exitOpen: "#22C55E",
  exitRing: "#86EFAC",
} as const;

/**
 * Renders the full game frame.
 *
 * @param ctx - The canvas 2D context.
 * @param state - The current game state.
 * @param now - The current timestamp in milliseconds (for invulnerability flicker).
 */
export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
): void {
  const { cols, rows, config, walls, orbs, player, enemy, exit, collected } =
    state;
  const t = config.tileSize;
  const width = cols * t;
  const height = rows * t;

  ctx.clearRect(0, 0, width, height);

  // Floor with a checkerboard tint.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? COLOURS.floor : COLOURS.floorAlt;
      ctx.fillRect(col * t, row * t, t, t);
    }
  }

  // Walls.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!walls[row][col]) continue;
      ctx.fillStyle = COLOURS.wall;
      ctx.fillRect(col * t, row * t, t, t);
      ctx.fillStyle = COLOURS.wallTop;
      ctx.fillRect(col * t, row * t, t, Math.max(3, t * 0.18));
    }
  }

  // Exit portal: locked (grey) until every orb is collected, then glowing green.
  const allCollected = collected === orbs.length;
  ctx.save();
  ctx.translate(exit.x, exit.y);
  ctx.fillStyle = allCollected ? COLOURS.exitOpen : COLOURS.exitLocked;
  ctx.beginPath();
  ctx.arc(0, 0, t * 0.42, 0, Math.PI * 2);
  ctx.fill();
  if (allCollected) {
    ctx.strokeStyle = COLOURS.exitRing;
    ctx.lineWidth = Math.max(2, t * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, t * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Orbs.
  for (const orb of orbs) {
    if (orb.collected) continue;
    ctx.save();
    ctx.translate(orb.pos.x, orb.pos.y);
    ctx.fillStyle = COLOURS.orb;
    ctx.beginPath();
    ctx.arc(0, 0, config.orbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOURS.orbShine;
    ctx.beginPath();
    ctx.arc(
      -config.orbRadius * 0.3,
      -config.orbRadius * 0.3,
      config.orbRadius * 0.35,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  // Enemy wisp.
  if (enemy) {
    ctx.save();
    ctx.translate(enemy.pos.x, enemy.pos.y);
    ctx.fillStyle = COLOURS.enemy;
    ctx.beginPath();
    ctx.arc(0, 0, config.enemyRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOURS.enemyDark;
    ctx.beginPath();
    ctx.arc(
      -config.enemyRadius * 0.3,
      -config.enemyRadius * 0.2,
      config.enemyRadius * 0.28,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      config.enemyRadius * 0.3,
      -config.enemyRadius * 0.2,
      config.enemyRadius * 0.28,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  // Player bubble (flickers while invulnerable).
  const invulnerable = now < state.invulnUntil;
  if (!invulnerable || Math.floor(now / 100) % 2 === 0) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = COLOURS.player;
    ctx.beginPath();
    ctx.arc(0, 0, config.playerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOURS.playerDark;
    ctx.beginPath();
    ctx.arc(
      -config.playerRadius * 0.35,
      -config.playerRadius * 0.25,
      config.playerRadius * 0.22,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      config.playerRadius * 0.35,
      -config.playerRadius * 0.25,
      config.playerRadius * 0.22,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = COLOURS.playerMouth;
    ctx.lineWidth = Math.max(1.5, config.playerRadius * 0.18);
    ctx.beginPath();
    ctx.arc(
      0,
      config.playerRadius * 0.15,
      config.playerRadius * 0.35,
      0.15 * Math.PI,
      0.85 * Math.PI,
    );
    ctx.stroke();
    ctx.restore();
  }
}
