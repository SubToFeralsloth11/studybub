import { createFileRoute } from "@tanstack/react-router";

import { GameScreen } from "../features/game/GameScreen";

/**
 * The arcade-game route. A gamified practise mode that pauses to ask questions
 * from the track identified by `:trackId`.
 */
export const Route = createFileRoute("/game/$trackId")({
  component: GameScreen,
});
