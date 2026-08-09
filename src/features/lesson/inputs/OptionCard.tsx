import { RichBlocks } from "../../../components/RichBlocks";

import type { McqOption } from "../../../domain/content/types";
import type { ReactNode } from "react";

/** The reveal feedback state for an option card. */
export type OptionRevealState =
  | "correct"
  | "correct-missed"
  | "wrong-selected"
  | "dimmed";

interface OptionCardProps {
  /** The option being rendered. */
  option: McqOption;
  /** The interactive control (radio or checkbox) for this option. */
  control: ReactNode;
  /** Whether this option is currently selected. */
  selected: boolean;
  /** Whether the answer has been checked and the result revealed. */
  revealed: boolean;
  /** The reveal feedback state (ignored until `revealed`). */
  revealState?: OptionRevealState;
}

/**
 * Decides the card's ring/background classes from its selection and reveal
 * state.
 *
 * @param selected - Whether the option is selected.
 * @param revealed - Whether the answer is revealed.
 * @param revealState - The reveal feedback state.
 * @returns Tailwind classes for the option card.
 */
function cardClasses(
  selected: boolean,
  revealed: boolean,
  revealState?: OptionRevealState,
): string {
  if (revealed) {
    switch (revealState) {
      case "correct": {
        return "ring-success bg-success-soft text-ink";
      }
      case "correct-missed": {
        return "ring-success ring-dashed bg-success-soft text-ink";
      }
      case "wrong-selected": {
        return "ring-warn bg-warn-soft text-ink line-through decoration-warn/60";
      }
      default: {
        return "ring-hairline opacity-60";
      }
    }
  }
  if (selected) {
    return "ring-brand bg-brand-soft text-ink";
  }
  return "ring-hairline hover:ring-brand/40";
}

/**
 * The reveal cue shown at the right edge of a revealed option.
 *
 * @param revealState - The reveal feedback state.
 * @returns The rendered cue, or null for the dimmed state.
 */
function revealCue(revealState?: OptionRevealState): ReactNode {
  switch (revealState) {
    case "correct": {
      return (
        <span aria-label="Correct" className="text-success">
          ✓
        </span>
      );
    }
    case "correct-missed": {
      return (
        <span
          aria-label="Missed"
          className="rounded-pill bg-success px-2 py-0.5 text-sm font-semibold text-white"
        >
          missed
        </span>
      );
    }
    case "wrong-selected": {
      return (
        <span aria-label="Wrong" className="text-warn">
          ✕
        </span>
      );
    }
    default: {
      return null;
    }
  }
}

/**
 * A presentational option card: a styled label wrapping a control and the
 * option's rich content, with select-ring and reveal feedback states. Shared
 * by the single-select `McqInput` and the checkbox `MultiSelectInput`.
 *
 * @param props - The component props.
 * @returns The rendered option card.
 */
export function OptionCard({
  option,
  control,
  selected,
  revealed,
  revealState,
}: Readonly<OptionCardProps>) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-bub bg-card px-5 py-4 text-lg ring-2 transition ${cardClasses(selected, revealed, revealState)} ${revealed ? "cursor-default" : ""}`}
    >
      {control}
      <span className="flex-1">
        <RichBlocks blocks={option.label} />
      </span>
      {revealed ? revealCue(revealState) : null}
    </label>
  );
}
