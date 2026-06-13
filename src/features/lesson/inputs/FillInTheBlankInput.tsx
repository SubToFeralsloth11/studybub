import { RichBlocks } from "../../../components/RichBlocks";

import type { RichBlock } from "../../../domain/content/types";

interface FillInTheBlankInputProps {
  template: RichBlock[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  revealed: boolean;
}

/**
 *
 */
export function FillInTheBlankInput({
  template,
  value,
  onChange,
  onSubmit,
  revealed,
}: Readonly<FillInTheBlankInputProps>) {
  // Find the block containing ___ and split the template around it.
  const parts: { before: RichBlock[]; after: RichBlock[] } = {
    before: [],
    after: [],
  };
  let found = false;

  for (const block of template) {
    if (found) {
      // Everything after the gap goes into after.
      parts.after.push(block);
    } else if (block.kind === "text" && block.text.includes("___")) {
      const [beforeText, afterText] = block.text.split("___", 2);
      if (beforeText) {
        parts.before.push({ kind: "text", text: beforeText });
      }
      // The gap goes here.
      found = true;
      if (afterText) {
        parts.after.push({ kind: "text", text: afterText });
      }
    } else {
      parts.before.push(block);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg leading-relaxed text-ink">
        {parts.before.length > 0 && <RichBlocks blocks={parts.before} />}
        <input
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          disabled={revealed}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="inline-block w-40 rounded-bub border-0 bg-card px-3 py-1 text-center text-lg text-ink ring-2 ring-hairline transition focus:ring-brand disabled:opacity-70"
          placeholder="..."
          aria-label="Fill in the blank"
        />
        {parts.after.length > 0 && <RichBlocks blocks={parts.after} />}
      </div>
    </div>
  );
}
