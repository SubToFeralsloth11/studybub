import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const GAME_URL = "/eaglercraft/";
const GAME_NAME = "Eaglercraft";

const INTERVAL_MIN = 180;
const INTERVAL_MAX = 300;
const BURST_MIN = 3;
const BURST_MAX = 5;
const RECENT_LIMIT = 10;

interface SessionStats {
  answered: number;
  correct: number;
  xp: number;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickUnused(poolSize: number, recentlyUsed: number[]): number {
  const recentlySet = new Set(recentlyUsed);
  const available = Array.from({ length: poolSize }, (_, i) => i).filter(
    (i) => !recentlySet.has(i),
  );
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return Math.floor(Math.random() * poolSize);
}

export function GameScreen() {
  const { track } = useTrackFromRoute();
  const { dispatch: progressDispatch } = useProgress();

  const pool = useMemo(() => (track ? gameQuestions(track) : []), [track]);
  const recentlyUsed = useRef<number[]>([]);

  const [phase, setPhase] = useState<"intro" | "playing">("intro");
  const [secondsLeft, setSecondsLeft] = useState(
    randomBetween(INTERVAL_MIN, INTERVAL_MAX),
  );
  const [burstSize, setBurstSize] = useState(0);
  const [burstAnswered, setBurstAnswered] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>({
    answered: 0,
    correct: 0,
    xp: 0,
  });

  const hasQuestions = pool.length > 0;

  const markUsed = useCallback((idx: number) => {
    recentlyUsed.current.push(idx);
    if (recentlyUsed.current.length > RECENT_LIMIT) {
      recentlyUsed.current = recentlyUsed.current.slice(-RECENT_LIMIT);
    }
  }, []);

  const nextQuestion = useCallback(() => {
    const idx = pickUnused(pool.length, recentlyUsed.current);
    setQuestionIndex(idx);
    setBurstAnswered((n) => n + 1);
  }, [pool.length]);

  const triggerBurst = useCallback(() => {
    const size = randomBetween(BURST_MIN, BURST_MAX);
    setBurstSize(size);
    setBurstAnswered(0);
    const idx = pickUnused(pool.length, recentlyUsed.current);
    setQuestionIndex(idx);
    setShowQuestion(true);
  }, [pool.length]);

  const handleAnswered = useCallback(
    (correct: boolean, xp: number) => {
      if (correct) {
        progressDispatch({
          type: "ANSWER_CORRECT",
          xp,
          today: localDateIso(),
        });
      }
      setStats((prev) => ({
        answered: prev.answered + 1,
        correct: prev.correct + (correct ? 1 : 0),
        xp: prev.xp + (correct ? xp : 0),
      }));
    },
    [progressDispatch],
  );

  const handleContinue = useCallback(() => {
    markUsed(questionIndex);
    if (burstAnswered + 1 < burstSize) {
      nextQuestion();
    } else {
      setShowQuestion(false);
      setSecondsLeft(randomBetween(INTERVAL_MIN, INTERVAL_MAX));
    }
  }, [burstAnswered, burstSize, markUsed, nextQuestion, questionIndex]);

  const handleStart = useCallback(() => {
    setSecondsLeft(randomBetween(INTERVAL_MIN, INTERVAL_MAX));
    setPhase("playing");
  }, []);

  // Countdown between bursts.
  useEffect(() => {
    if (phase !== "playing" || showQuestion || !hasQuestions) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, showQuestion, hasQuestions]);

  // When countdown reaches 0, trigger a burst.
  useEffect(() => {
    if (
      secondsLeft === 0 &&
      phase === "playing" &&
      !showQuestion &&
      hasQuestions
    ) {
      triggerBurst();
    }
  }, [secondsLeft, phase, showQuestion, hasQuestions, triggerBurst]);

  if (!track) {
    return <NotFound title="Game not found" />;
  }

  const currentQuestion = pool[questionIndex];

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
        showQuestion={showQuestion}
        burstSize={burstSize}
        burstIndex={burstAnswered}
        onPause={triggerBurst}
      />

      <main className="flex flex-1 flex-col items-center px-5 py-4">
        {phase === "intro" ? (
          <Intro
            onStart={handleStart}
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
              title={GAME_NAME}
              className="h-[70vh] w-full rounded-bub shadow-bub-lg ring-1 ring-hairline"
              allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
            />
            {showQuestion && currentQuestion ? (
              <QuestionOverlay
                key={`${questionIndex}-${burstAnswered}`}
                question={currentQuestion}
                burstIndex={burstAnswered}
                burstSize={burstSize}
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
  showQuestion: boolean;
  burstSize: number;
  burstIndex: number;
  onPause: () => void;
}

function GameHud({
  stats,
  secondsLeft,
  hasQuestions,
  playing,
  showQuestion,
  burstSize,
  burstIndex,
  onPause,
}: GameHudProps) {
  if (!playing) return null;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-5 pb-2 text-sm">
      <span className="font-semibold text-ink">
        {stats.correct}/{stats.answered}
      </span>
      <span className="text-muted">·</span>
      <span className="font-semibold text-ink">{stats.xp} XP</span>
      {hasQuestions ? (
        <>
          <span className="text-muted">·</span>
          {showQuestion ? (
            <span className="text-muted">
              Question {burstIndex + 1} of {burstSize}
            </span>
          ) : (
            <>
              <span className="text-muted">Next quiz in {secondsLeft}s</span>
              <button
                type="button"
                onClick={onPause}
                className="rounded-pill bg-brand-soft px-3 py-1 font-semibold text-brand transition hover:bg-brand-deep/15"
              >
                Practise now
              </button>
            </>
          )}
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
        Play Eaglercraft (Minecraft in your browser). The game pauses
        periodically with a quick quiz of {BURST_MIN}–{BURST_MAX} {trackTitle}{" "}
        questions — answer right to bank XP and keep your streak going, or tap
        &ldquo;Practise now&rdquo; any time.
      </p>
      {questionCount > 0 ? (
        <p className="mt-2 text-sm text-muted">
          {questionCount} questions ready.
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">
          This track has no questions yet — you can still play for fun.
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/subject/$subjectId/track/$trackId"
          params={{ subjectId, trackId }}
          className="rounded-pill bg-cream-deep px-6 py-3 font-display font-semibold text-muted transition hover:text-ink"
        >
          ← Back to map
        </Link>
        <Button onClick={onStart}>Play Eaglercraft →</Button>
      </div>
      <p className="mt-4 text-xs text-muted">
        Eaglercraft is a browser-compatible Minecraft client, self-hosted from
        this server.
      </p>
    </Card>
  );
}

interface QuestionOverlayProps {
  question: import("../../domain/content/types").Question;
  burstIndex: number;
  burstSize: number;
  onAnswered: (correct: boolean, xp: number) => void;
  onContinue: () => void;
}

function QuestionOverlay({
  question,
  burstIndex,
  burstSize,
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
            Question {burstIndex + 1} of {burstSize} — answer to power up
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
