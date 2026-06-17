/**
 * A progress bar component for the stats screen.
 *
 * Shows the XP progress bar with a label underneath.
 *
 * @author John Grimes
 * @module components/StatsXpBar
 */

interface StatsXpBarProps {
  /** The current XP amount into this level. */
  intoLevel: number;
  /** The total XP span of the current level. */
  span: number;
  /** The label to display below the bar. */
  label?: string;
}

/**
 * Renders an XP progress bar with label.
 *
 * @param props - The component props.
 * @param props.intoLevel - The XP earned into the current level.
 * @param props.span - The total XP span of the current level.
 * @param props.label - The text label to display below the bar.
 * @returns The rendered progress bar.
 */
export function StatsXpBar({
  intoLevel,
  span,
  label,
}: Readonly<StatsXpBarProps>) {
  const percent = span > 0 ? Math.round((intoLevel / span) * 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-2 overflow-hidden rounded bg-cream-deep"
        role="progressbar"
        aria-label="XP toward next level"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${percent}%` }}
      />
      {label ? <span className="text-xs text-muted">{label}</span> : null}
    </div>
  );
}
