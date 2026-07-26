import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "../../components/AppHeader";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { NotFound } from "../../components/NotFound";
import { RewardBar } from "../../components/RewardBar";
import { gameQuestions } from "../../domain/game/questions";
import { localDateIso } from "../../domain/progress/dates";
import { useProgress } from "../../state/progressContext";
import { useTrackFromRoute } from "../../state/useTrackFromRoute";
import { QuestionView } from "../lesson/QuestionView";

/**
 * The live, third-party game embedded by the arcade mode. Framing the public
 * site (rather than forking it) avoids redistributing the game's code or assets.
 * PokéRogue is a browser Pokémon roguelite and sends no frame-ancestors header,
 * so it can be embedded directly.
 */
const GAME_URL = "https://pokerogue.net";

/** Seconds of play between automatic question pauses. */
const QUESTION_INTERVAL_SECONDS = 90;

interface SessionStats {
  /** Questions answered this session. */
  answered: number;
  /** Questions answered correctly this session. */
  correct: number;
  /** XP banked this session. */
  xp: number;
}

/**
 * The arcade-game route. Embeds the real PokéRogue in an iframe and overlays a
 * StudyBub question from the current track at regular intervals (or on demand):
 * correct answers feed the shared XP/streak/badge system, then play resumes.
 *
 * @returns The rendered game screen.
 */
export function GameScreen() {
  const { track } = useTrackFromRoute();
  const { dispatch: progressDispatch } = useProgress();

  const pool = useMemo(() => (track ? gameQuestions(track) : []), [track]);
  const [phase, setPhase] = useState<"intro" | "playing">("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_INTERVAL_SECONDS);
  const [stats, setStats] = useState<SessionStats>({
    answered: 0,
    correct: 0,
    xp: 0,
  });

  const hasQuestions = pool.length > 0;

  // Countdown to the next automatic question pause. Paused while a question is
  // open or when the track has no questions to ask.
  useEffect(() => {
    if (phase !== "playing" || showQuestion || !hasQuestions) return;
    const id = setInterval(() => {
      setSecondsLeft((remaining) => {
        if (remaining <= 1) {
          setShowQuestion(true);
          return QUESTION_INTERVAL_SECONDS;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, showQuestion, hasQuestions]);

  if (!track) {
    return <NotFound title="Game not found" />;
  }

  const currentQuestion = pool[questionIndex % pool.length];

  const handleAnswered = (correct: boolean, xp: number): void => {
    if (correct) {
      progressDispatch({ type: "ANSWER_CORRECT", xp, today: localDateIso() });
    }
    setStats((previous) => ({
      answered: previous.answered + 1,
      correct: previous.correct + (correct ? 1 : 0),
      xp: previous.xp + (correct ? xp : 0),
    }));
  };

  const handleContinue = (): void => {
    setQuestionIndex((index) => index + 1);
    setShowQuestion(false);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <AppHeader
        back={{ to: "/subject/$subjectId/track/$trackId", label: "Map" }}
        title="Arcade"
        right={<RewardBar />}
      />

      <GameHud
        stats={stats}
        secondsLeft={secondsLeft}
        hasQuestions={hasQuestions}
        playing={phase === "playing"}
        onPause={() => setShowQuestion(true)}
      />

      <main className="flex flex-1 flex-col items-center px-5 py-4">
        {phase === "intro" ? (
          <Intro
            onStart={() => setPhase("playing")}
            questionCount={pool.length}
            trackTitle={track.title}
            subjectId={track.subjectId}
            trackId={track.id}
          />
        ) : null}

        {phase === "playing" ? (
          <div className="relative w-full">
            <iframe
              src={GAME_URL}
              title="PokéRogue"
              className="h-[70vh] w-full rounded-bub shadow-bub-lg ring-1 ring-hairline"
              allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
            />
            {showQuestion && currentQuestion ? (
              <QuestionOverlay
                question={currentQuestion}
                onAnswered={handleAnswered}
                onContinue={handleContinue}
              />
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

interface GameHudProps {
  stats: SessionStats;
  secondsLeft: number;
  hasQuestions: boolean;
  playing: boolean;
  onPause: () => void;
}

function GameHud({
  stats,
  secondsLeft,
  hasQuestions,
  playing,
  onPause,
}: GameHudProps) {
  if (!playing) return null;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-5 pb-2 text-sm">
      <span className="font-semibold text-ink">
        ✅ {stats.correct}/{stats.answered}
      </span>
      <span className="text-muted">·</span>
      <span className="font-semibold text-ink">⭐ {stats.xp} XP</span>
      {hasQuestions ? (
        <>
          <span className="text-muted">·</span>
          <span className="text-muted">Next question in {secondsLeft}s</span>
          <button
            type="button"
            onClick={onPause}
            className="rounded-pill bg-brand-soft px-3 py-1 font-semibold text-brand transition hover:bg-brand-deep/15"
          >
            ⚡ Practise now
          </button>
        </>
      ) : (
        <span className="text-muted">No questions for this track yet</span>
      )}
    </div>
  );
}

interface IntroProps {
  onStart: () => void;
  questionCount: number;
  trackTitle: string;
  subjectId: string;
  trackId: string;
}

function Intro({
  onStart,
  questionCount,
  trackTitle,
  subjectId,
  trackId,
}: IntroProps) {
  return (
    <Card raised className="w-full max-w-xl p-8 text-center">
      <div className="mb-3 text-5xl" aria-hidden>
        🎮
      </div>
      <h1 className="text-2xl text-ink">Arcade mode</h1>
      <p className="mt-3 text-muted">
        Play <strong>PokéRogue</strong> — a browser Pokémon roguelite — in full.
        Every {QUESTION_INTERVAL_SECONDS} seconds the game is paused with a{" "}
        {trackTitle} question. Answer right to bank XP and keep your streak
        going; answer whenever you like with “Practise now”.
      </p>
      <p className="mt-2 text-sm text-muted">
        {questionCount > 0
          ? `${questionCount} questions ready.`
          : "This track has no questions yet — you can still play for fun."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/subject/$subjectId/track/$trackId"
          params={{ subjectId, trackId }}
          className="rounded-pill bg-cream-deep px-6 py-3 font-display font-semibold text-muted transition hover:text-ink"
        >
          ← Back to map
        </Link>
        <Button onClick={onStart}>Play PokéRogue →</Button>
      </div>
      <p className="mt-4 text-xs text-muted">
        PokéRogue is a third-party open-source game loaded from pokerogue.net.
      </p>
    </Card>
  );
}

interface QuestionOverlayProps {
  question: import("../../domain/content/types").Question;
  onAnswered: (correct: boolean, xp: number) => void;
  onContinue: () => void;
}

function QuestionOverlay({
  question,
  onAnswered,
  onContinue,
}: QuestionOverlayProps) {
  const navigate = useNavigate();
  return (
    <div
      role="dialog"
      aria-label="Practice question"
      aria-modal="true"
      className="absolute inset-0 flex items-start justify-center overflow-auto rounded-bub bg-ink/60 px-4 py-6"
    >
      <Card raised className="w-full max-w-xl p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-brand">
            Pause! Answer to power up
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="text-sm text-muted transition hover:text-ink"
          >
            Quit ✕<span className="sr-only">to home</span>
          </button>
        </div>
        <QuestionView
          question={question}
          onAnswered={onAnswered}
          onContinue={onContinue}
          continueLabel="Back to game"
        />
      </Card>
    </div>
  );
}
