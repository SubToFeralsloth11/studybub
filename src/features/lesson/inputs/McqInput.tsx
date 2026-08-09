import { useId } from "react";

import { OptionCard } from "./OptionCard";

import type { McqQuestion } from "../../../domain/content/types";

interface McqInputProps {
  /** The MCQ being answered. */
  question: McqQuestion;
  /** The currently-selected option id, or null. */
  selectedId: string | null;
  /** Called when the learner selects an option. */
  onSelect: (optionId: string) => void;
  /** Whether the answer has been checked and the result revealed. */
  revealed: boolean;
}

/**
 * Decides the reveal feedback state for an option once the answer is revealed.
 *
 * @param optionId - The option being styled.
 * @param question - The MCQ, for the correct option id.
 * @param selectedId - The learner's selection.
 * @returns The reveal state, or undefined when not revealed.
 */
function revealStateOf(
  optionId: string,
  question: McqQuestion,
  selectedId: string | null,
) {
  if (optionId === question.correctOptionId) return "correct" as const;
  if (optionId === selectedId) return "wrong-selected" as const;
  return "dimmed" as const;
}

/**
 * An accessible multiple-choice input rendered as a radio group of option cards.
 *
 * @param props - The component props.
 * @param props.question - The MCQ being answered.
 * @param props.selectedId - The selected option id, or null.
 * @param props.onSelect - Selection handler.
 * @param props.revealed - Whether the result is revealed (locks the inputs).
 * @returns The rendered option group.
 */
export function McqInput({
  question,
  selectedId,
  onSelect,
  revealed,
}: Readonly<McqInputProps>) {
  const groupName = useId();

  return (
    <fieldset className="flex flex-col gap-3" disabled={revealed}>
      <legend className="sr-only">Choose the correct answer</legend>
      {question.options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <OptionCard
            key={option.id}
            option={option}
            selected={isSelected}
            revealed={revealed}
            revealState={
              revealed
                ? revealStateOf(option.id, question, selectedId)
                : undefined
            }
            control={
              <input
                type="radio"
                name={groupName}
                value={option.id}
                checked={isSelected}
                onChange={() => onSelect(option.id)}
                className="size-5 accent-brand"
              />
            }
          />
        );
      })}
    </fieldset>
  );
}
