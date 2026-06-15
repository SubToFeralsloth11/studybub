import { useRef } from "react";

import { MathSymbolButtons } from "../../../components/MathSymbolButtons";
import { TextAnswerField } from "../../../components/TextAnswerField";

interface ShortTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  revealed: boolean;
  /** When true, the input is disabled for AI marking in-flight. */
  loading?: boolean;
}

/**
 * A single-line text input for short-text questions, with math symbol
 * insertion buttons. Supports an optional loading state for AI marking.
 *
 * @param props - The component props.
 * @param props.value - The current input value.
 * @param props.onChange - Called when the value changes.
 * @param props.onSubmit - Called when the learner presses Enter or clicks submit.
 * @param props.revealed - When true, the input is disabled (answer shown).
 * @param props.loading - When true, the input is disabled (AI in flight).
 * @returns The rendered short-text input.
 */
export function ShortTextInput({
  value,
  onChange,
  onSubmit,
  revealed,
  loading = false,
}: Readonly<ShortTextInputProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = revealed || loading;

  return (
    <div className="flex flex-col gap-2">
      <TextAnswerField
        ref={inputRef}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        disabled={disabled}
        label="Your answer"
        placeholder="Type your answer"
      />
      <MathSymbolButtons
        inputRef={inputRef}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
