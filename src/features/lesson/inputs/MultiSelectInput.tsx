import { OptionCard, type OptionRevealState } from "./OptionCard";

import type { MultiSelectQuestion } from "../../../domain/content/types";

interface MultiSelectInputProps {
  /** The multiselect question being answered. */
  question: MultiSelectQuestion;
  /** The currently-selected option ids. */
  selectedIds: string[];
  /** Called when the learner toggles an option on or off. */
  onToggle: (optionId: string) => void;
  /** Whether the answer has been checked and the result revealed. */
  revealed: boolean;
}

/**
 * Classifies an option into a reveal feedback state once the answer is
 * revealed: correct-selected, correct-missed, wrong-selected, or dimmed.
 *
 * @param optionId - The option being classified.
 * @param question - The multiselect question.
 * @param selectedIds - The learner's selection.
 * @returns The reveal state, or undefined when not revealed.
 */
function revealStateOf(
  optionId: string,
  question: MultiSelectQuestion,
  selectedIds: string[],
): OptionRevealState {
  const isCorrect = question.correctOptionIds.includes(optionId);
  const isSelected = selectedIds.includes(optionId);
  if (isCorrect && isSelected) return "correct";
  if (isCorrect && !isSelected) return "correct-missed";
  if (!isCorrect && isSelected) return "wrong-selected";
  return "dimmed";
}

/**
 * An accessible "select all that apply" input rendered as a checkbox group of
 * option cards. Each option toggles independently without clearing others.
 *
 * @param props - The component props.
 * @param props.question - The multiselect question being answered.
 * @param props.selectedIds - The currently-selected option ids.
 * @param props.onToggle - Selection toggle handler.
 * @param props.revealed - Whether the result is revealed (locks the inputs).
 * @returns The rendered checkbox group.
 */
export function MultiSelectInput({
  question,
  selectedIds,
  onToggle,
  revealed,
}: Readonly<MultiSelectInputProps>) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={revealed}>
      <legend className="sr-only">Select every option that applies</legend>
      {question.options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <OptionCard
            key={option.id}
            option={option}
            selected={isSelected}
            revealed={revealed}
            revealState={
              revealed
                ? revealStateOf(option.id, question, selectedIds)
                : undefined
            }
            control={
              <input
                type="checkbox"
                value={option.id}
                checked={isSelected}
                onChange={() => onToggle(option.id)}
                className="size-5 accent-brand"
              />
            }
          />
        );
      })}
    </fieldset>
  );
}
