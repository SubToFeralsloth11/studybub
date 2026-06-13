import { useRef } from "react";

import { MathSymbolButtons } from "../../../components/MathSymbolButtons";
import { TextAnswerField } from "../../../components/TextAnswerField";

interface ShortTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  revealed: boolean;
}

/**
 *
 */
export function ShortTextInput({
  value,
  onChange,
  onSubmit,
  revealed,
}: Readonly<ShortTextInputProps>) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <TextAnswerField
        ref={inputRef}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        disabled={revealed}
        label="Your answer"
        placeholder="Type your answer"
      />
      <MathSymbolButtons
        inputRef={inputRef}
        value={value}
        onChange={onChange}
        disabled={revealed}
      />
    </div>
  );
}
