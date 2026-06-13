import type { RefObject } from "react";

interface MathSymbolButtonsProps {
  /** Ref to the text input for cursor-position insertion. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Current value for rebuilding after insertion. */
  value: string;
  /** Change handler to update the input value. */
  onChange: (value: string) => void;
  /** Whether the field is locked after checking. */
  disabled: boolean;
}

/** Math symbols available as tap-in buttons. */
const SYMBOLS = [
  { label: "\u00F7", name: "divide" },
  { label: "\u00D7", name: "multiply" },
  { label: "+", name: "plus" },
  { label: "\u2212", name: "minus" },
];

/**
 * Inserts a symbol into the input value at the current cursor position.
 */
function insertSymbol(
  input: HTMLInputElement,
  symbol: string,
  value: string,
  onChange: (value: string) => void,
) {
  const start = input.selectionStart ?? value.length;
  const end = input.selectionEnd ?? value.length;
  const next = value.slice(0, start) + symbol + value.slice(end);
  onChange(next);
  // Restore cursor after the inserted symbol on the next frame
  requestAnimationFrame(() => {
    const after = start + symbol.length;
    input.setSelectionRange(after, after);
    input.focus();
  });
}

/**
 * A row of tap-in symbol buttons (÷, ×, +, −) placed below a math
 * answer input so learners can insert symbols without typing them.
 */
export function MathSymbolButtons({
  inputRef,
  value,
  onChange,
  disabled,
}: Readonly<MathSymbolButtonsProps>) {
  return (
    <div className="flex gap-1" role="group" aria-label="Math symbols">
      {SYMBOLS.map((symbol) => (
        <button
          key={symbol.name}
          type="button"
          disabled={disabled}
          aria-label={`Insert ${symbol.name} symbol`}
          className="rounded-bub border-0 bg-card px-4 py-2 text-xl text-ink ring-1 ring-hairline transition hover:bg-muted focus:ring-brand disabled:opacity-50"
          onMouseDown={(event) => {
            // Prevent focus loss from the text input
            event.preventDefault();
            const input = inputRef.current;
            if (input) {
              insertSymbol(input, symbol.label, value, onChange);
            }
          }}
        >
          {symbol.label}
        </button>
      ))}
    </div>
  );
}
