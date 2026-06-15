import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Feedback } from "./Feedback";
import { ExpressionInput } from "./inputs/ExpressionInput";
import { FillInTheBlankInput } from "./inputs/FillInTheBlankInput";
import { MatchingInput } from "./inputs/MatchingInput";
import { McqInput } from "./inputs/McqInput";
import { NumericInput } from "./inputs/NumericInput";
import { ShortTextInput } from "./inputs/ShortTextInput";
import { Button } from "../../components/Button";
import { Figure } from "../../components/Figure";
import { RichBlocks } from "../../components/RichBlocks";
import { shuffleMcqOptions } from "../../domain/content/shuffleOptions";
import { markAnswer } from "../../domain/marking/markAnswer";
import { useAiConfig } from "../../state/aiConfigContext";

import type { McqQuestion, Question } from "../../domain/content/types";
import type { MarkResult } from "../../domain/marking/markResult";

interface QuestionViewProps {
  /** The question to present. */
  question: Question;
  /** Called once when a readable answer is checked. */
  onAnswered: (correct: boolean, xp: number) => void;
  /** Called to advance to the next step. */
  onContinue: () => void;
  /** Label for the continue action (e.g. "Next" or "Finish"). */
  continueLabel?: string;
}

/**
 * Presents one question: prompt, optional figure, the type-appropriate input,
 * immediate feedback, and a check/continue action. Marking is delegated to
 * `markAnswer`, so this view never branches on question type for marking.
 *
 * @param props - The component props.
 * @param props.question - The question to present.
 * @param props.onAnswered - Invoked once when a readable answer is checked.
 * @param props.onContinue - Invoked to advance to the next step.
 * @param props.continueLabel - Optional label for the continue button.
 * @returns The rendered question step.
 */
export function QuestionView({
  question,
  onAnswered,
  onContinue,
  continueLabel = "Next",
}: Readonly<QuestionViewProps>) {
  const { aiConfig } = useAiConfig();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<MarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Shuffle MCQ options so the correct answer is not always the first option.
  // The shuffle is memoised to avoid re-shuffling on every render.
  const displayedQuestion = useMemo(
    () =>
      question.type === "mcq" ? shuffleMcqOptions(question) : question,
    [question],
  );

  const hasAnswer =
    question.type === "mcq"
      ? selectedId !== null
      : question.type === "matching"
        ? false // matching handles its own submit
        : value.trim() !== "";

  const handleCheck = useCallback(
    async (input?: string) => {
      if (!hasAnswer && !input) return;
      if (checked || loading) return;

      // Cancel any in-flight request.
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const answer =
        input ?? (question.type === "mcq" ? (selectedId ?? "") : value);

      // Only short-text questions use AI marking.
      if (question.type === "shortText") {
        setLoading(true);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const marked = await markAnswer(question, answer, {
            aiConfig: aiConfig ?? undefined,
            signal: controller.signal,
          });

          // If the request was aborted by a new submission, don't update state.
          if (controller.signal.aborted) return;

          setResult(marked);
          if (marked.status === "unreadable") return;
          if (
            marked.status === "aiNotConfigured" ||
            marked.status === "aiError"
          ) {
            // Error states keep the question editable for retry.
            return;
          }
          setChecked(true);
          onAnswered(marked.status === "correct", question.xp);
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
        return;
      }

      // Synchronous marking for all other question types.
      const marked = await markAnswer(question, answer);
      setResult(marked);
      if (marked.status === "unreadable") return;
      setChecked(true);
      onAnswered(marked.status === "correct", question.xp);
    },
    [
      hasAnswer,
      checked,
      loading,
      question,
      selectedId,
      value,
      aiConfig,
      onAnswered,
    ],
  );

  function handleRetry() {
    setResult(null);
    setLoading(false);
    handleCheck();
  }

  function handleMatchingSubmit(mapping: string) {
    handleCheck(mapping);
  }

  const showSpinner = question.type === "shortText" && loading;

  // Cancel in-flight AI request on unmount (navigate-away edge case).
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xl text-ink md:text-2xl">
        <RichBlocks blocks={question.prompt} />
      </div>

      {question.figure ? <Figure figure={question.figure} /> : null}

      {question.type === "mcq" ? (
        <McqInput
          question={displayedQuestion as McqQuestion}
          selectedId={selectedId}
          onSelect={setSelectedId}
          revealed={checked}
        />
      ) : question.type === "expression" ? (
        <ExpressionInput
          value={value}
          onChange={setValue}
          onSubmit={() => handleCheck()}
          revealed={checked}
        />
      ) : question.type === "shortText" ? (
        <ShortTextInput
          value={value}
          onChange={setValue}
          onSubmit={() => handleCheck()}
          revealed={checked}
          loading={showSpinner}
        />
      ) : question.type === "fillInTheBlank" ? (
        <FillInTheBlankInput
          template={question.template}
          value={value}
          onChange={setValue}
          onSubmit={() => handleCheck()}
          revealed={checked}
        />
      ) : question.type === "matching" ? (
        <MatchingInput
          pairs={question.pairs}
          onSubmit={handleMatchingSubmit}
          revealed={checked}
          result={
            result?.status === "correct"
              ? "correct"
              : result?.status === "incorrect"
                ? "incorrect"
                : null
          }
        />
      ) : (
        <NumericInput
          value={value}
          onChange={setValue}
          onSubmit={() => handleCheck()}
          revealed={checked}
          unit={question.unit}
        />
      )}

      {result ? (
        <Feedback result={result} question={question} onRetry={handleRetry} />
      ) : null}

      <div className="flex justify-end">
        {checked ? (
          <Button onClick={onContinue}>{continueLabel} →</Button>
        ) : question.type === "matching" ? null : (
          <Button
            onClick={() => handleCheck()}
            disabled={!hasAnswer || loading}
          >
            {showSpinner ? "Judging your answer…" : "Check answer"}
          </Button>
        )}
      </div>
    </div>
  );
}
