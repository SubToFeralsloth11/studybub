import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { drawGame } from "./gameRenderer";
import { AppHeader } from "../../components/AppHeader";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ConfettiBurst } from "../../components/ConfettiBurst";
import { NotFound } from "../../components/NotFound";
import { RewardBar } from "../../components/RewardBar";
import { initGame, gameReducer } from "../../domain/game/gameReducer";
import { gameQuestions } from "../../domain/game/questions";
import { localDateIso } from "../../domain/progress/dates";
import { useProgress } from "../../state/progressContext";
import { useTrackFromRoute } from "../../state/useTrackFromRoute";
import { QuestionView } from "../lesson/QuestionView";

import type { Direction } from "../../domain/game/types";

/** Maps a keyboard key to a movement direction, or null when unmapped. */
function keyToDirection(key: string): Direction | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W": {
      return "up";
    }
    case "ArrowDown":
    case "s":
    case "S": {
      return "down";
    }
    case "ArrowLeft":
    case "a":
    case "A": {
      return "left";
    }
    case "ArrowRight":
    case "d":
    case "D": {
      return "right";
    }
    default: {
      return null;
    }
  }
}

/**
 * The arcade game route. A top-down orb hunt whose loop pauses to ask questions
 * drawn from the current track; correct answers earn in-game points and feed the
 * shared XP/streak/badge system, wrong answers cost a life.
 *
 * @returns The rendered game screen.
 */
export function GameScreen() {
  const { track } = useTrackFromRoute();
  const { dispatch: progressDispatch } = useProgress();

  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    initGame(),
  );
  const pool = useMemo(() => (track ? gameQuestions(track) : []), [track]);
  const stateRef = useRef(state);
  stateRef.current = state;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showHint, setShowHint] = useState(true);

  // Simulation + render loop. Only runs while playing; stops on every other
  // phase so key handling and the question overlay take over cleanly.
  useEffect(() => {
    if (state.phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const remaining = pool.length - stateRef.current.questionsAsked;
      dispatch({ type: "TICK", dt, now, questionsRemaining: remaining });
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawGame(ctx, stateRef.current, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.phase, pool.length]);

  // Keyboard controls, attached only while playing so the question overlay's
  // text inputs keep working normally.
  useEffect(() => {
    if (state.phase !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const dir = keyToDirection(event.key);
      if (dir) {
        event.preventDefault();
        setShowHint(false);
        dispatch({ type: "SET_INPUT", dir });
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const dir = keyToDirection(event.key);
      if (dir) {
        event.preventDefault();
        dispatch({ type: "SET_INPUT", dir: null });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [state.phase]);

  if (!track) {
    return <NotFound title="Game not found" />;
  }

  const totalOrbs = state.orbs.length;
  const currentQuestion = pool[state.questionsAsked];

  const backTo = {
    to: "/subject/$subjectId/track/$trackId",
    params: { subjectId: track.subjectId, trackId: track.id },
  };

  const handleAnswered = (correct: boolean, xp: number): void => {
    dispatch({ type: "ANSWER", correct });
    if (correct) {
      progressDispatch({ type: "ANSWER_CORRECT", xp, today: localDateIso() });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <AppHeader
        back={{ to: "/subject/$subjectId/track/$trackId", label: "Map" }}
        title={`Bub Quest · ${track.title}`}
        right={<RewardBar />}
      />

      <GameHud
        lives={state.lives}
        score={state.score}
        collected={state.collected}
        totalOrbs={totalOrbs}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-6">
        {state.phase === "intro" ? (
          <Intro
            onStart={() => dispatch({ type: "START" })}
            backTo={backTo}
            trackTitle={track.title}
            questionCount={pool.length}
          />
        ) : null}

        {state.phase === "playing" || state.phase === "question" ? (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={state.cols * state.config.tileSize}
              height={state.rows * state.config.tileSize}
              className="rounded-bub shadow-bub-lg ring-1 ring-hairline"
              aria-label="Bub Quest play field"
              role="img"
            />
            {showHint && state.phase === "playing" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-pill bg-ink/80 px-4 py-2 text-sm font-semibold text-white">
                  Arrow keys / WASD to move
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {state.phase === "question" && currentQuestion ? (
          <Card raised className="w-full max-w-xl p-6 md:p-8">
            <p className="mb-4 text-sm font-semibold text-brand">
              Pause! Answer to power up
            </p>
            <QuestionView
              question={currentQuestion}
              onAnswered={handleAnswered}
              onContinue={() => dispatch({ type: "RESUME" })}
              continueLabel="Keep playing"
            />
          </Card>
        ) : null}

        {state.phase === "won" ? (
          <Result
            emoji="🏆"
            heading="You win!"
            state={state}
            onAgain={() => dispatch({ type: "RESET" })}
            backTo={backTo}
            celebrate
          />
        ) : null}

        {state.phase === "lost" ? (
          <Result
            emoji="💥"
            heading="Out of lives"
            state={state}
            onAgain={() => dispatch({ type: "RESET" })}
            backTo={backTo}
          />
        ) : null}
      </main>
    </div>
  );
}

interface GameHudProps {
  lives: number;
  score: number;
  collected: number;
  totalOrbs: number;
}

function GameHud({ lives, score, collected, totalOrbs }: GameHudProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 pb-2 text-sm">
      <span aria-label="Lives" className="font-semibold text-ink">
        {"❤️".repeat(Math.max(0, lives)) || "—"}
      </span>
      <span className="text-muted">·</span>
      <span className="font-semibold text-ink">⭐ {score}</span>
      <span className="text-muted">·</span>
      <span className="text-muted">
        🫧 {collected}/{totalOrbs} orbs
      </span>
    </div>
  );
}

interface IntroProps {
  onStart: () => void;
  backTo: { to: string; params: Record<string, string> };
  trackTitle: string;
  questionCount: number;
}

function Intro({ onStart, backTo, trackTitle, questionCount }: IntroProps) {
  return (
    <Card raised className="w-full max-w-xl p-8 text-center">
      <div className="mb-3 text-5xl" aria-hidden>
        🫧
      </div>
      <h1 className="text-2xl text-ink">Bub Quest</h1>
      <p className="mt-3 text-muted">
        Roam the room, scoop up every orb, and dodge the purple wisp. Every
        couple of orbs the game pauses with a {trackTitle} question — answer
        right to bank points and XP, wrong and you lose a life. Reach the green
        portal once every orb is gone to win.
      </p>
      <p className="mt-2 text-sm text-muted">
        Move with arrow keys or WASD. {questionCount} questions ready.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to={backTo.to}
          params={backTo.params}
          className="rounded-pill bg-cream-deep px-6 py-3 font-display font-semibold text-muted transition hover:text-ink"
        >
          ← Back to map
        </Link>
        <Button onClick={onStart}>Start →</Button>
      </div>
    </Card>
  );
}

interface ResultProps {
  emoji: string;
  heading: string;
  state: { score: number; questionsCorrect: number; questionsAsked: number };
  onAgain: () => void;
  backTo: { to: string; params: Record<string, string> };
  celebrate?: boolean;
}

function Result({
  emoji,
  heading,
  state,
  onAgain,
  backTo,
  celebrate,
}: ResultProps) {
  const navigate = useNavigate();
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5 text-center">
      {celebrate ? <ConfettiBurst /> : null}
      <div className="flex size-24 animate-bub-pop items-center justify-center rounded-full bg-brand-soft text-5xl shadow-bub">
        {emoji}
      </div>
      <h1 className="text-3xl text-ink">{heading}</h1>
      <Card raised className="w-full p-6">
        <div className="font-display text-3xl font-bold text-ink">
          ⭐ {state.score}
        </div>
        <p className="mt-2 text-muted">
          {state.questionsCorrect}/{state.questionsAsked} questions correct
        </p>
      </Card>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onAgain}>
          Play again
        </Button>
        <Button
          onClick={() => navigate({ to: backTo.to, params: backTo.params })}
        >
          Back to map →
        </Button>
      </div>
    </div>
  );
}
