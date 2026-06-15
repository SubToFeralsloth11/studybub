/**
 * Design tokens for StudyBub, mirrored from the Tailwind theme in `index.css`.
 *
 * The CSS layer is the source of truth for styling; these constants exist so
 * non-CSS code (confetti colours, per-track theming, chart fills) can reference
 * the same palette without hard-coding hex values in components.
 *
 * @module theme/tokens
 */

/** The core StudyBub colour palette. */
export const palette = {
  /** Warm cream page background. */
  cream: "#FBF4EA",
  /** Primary ink for body text and headings. */
  ink: "#2A2342",
  /** Muted ink for secondary text. */
  muted: "#6B6480",
  /** Signature brand colour (logo, primary actions, focus rings). */
  brand: "#6D4AFF",
  /** Reward colour for XP and level indicators. */
  xp: "#FFB020",
  /** Positive feedback colour. */
  success: "#1FA971",
  /** Gentle incorrect-answer colour (never harsh). */
  warn: "#F2545B",
} as const;

/**
 * Accent colours for matching pair-box borders and number markers.
 *
 * Six visually distinct colours assigned to matching connections in round-robin
 * order. Pair 1 uses index 0, pair 2 uses index 1, etc. The 7th pair recycles
 * the first colour. The number marker (always unique) provides primary identity.
 */
export const MATCHING_PAIR_COLOURS: readonly string[] = [
  "#6D4AFF", // Purple — brand.
  "#0FB6A8", // Teal.
  "#FF7A4D", // Orange.
  "#3498DB", // Blue.
  "#9B59B6", // Magenta.
  "#E67E22", // Gold.
];

/** Deterministic palette for auto-generated accent colours. */
const HASH_PALETTE = [
  "#6D4AFF",
  "#0FB6A8",
  "#FF7A4D",
  "#2ECC71",
  "#E67E22",
  "#3498DB",
  "#E63946",
  "#9B59B6",
  "#1ABC9C",
  "#F39C12",
];

/** Hardcoded accent colours for known tracks. */
const knownAccents: Record<string, string> = {
  algebra: "#6D4AFF",
  geometry: "#0FB6A8",
  time: "#FF7A4D",
};

function hashTrackId(trackId: string): number {
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = Math.trunc((hash << 5) - hash + trackId.codePointAt(i)!);
  }
  return Math.abs(hash);
}

/**
 * Returns the accent colour for a track id. Known tracks use predefined colours;
 * unknown tracks get a deterministic colour from a hash-based palette.
 *
 * @param trackId - The track id to look up.
 * @returns A hex colour string.
 */
export function accentForTrack(trackId: string): string {
  if (trackId in knownAccents) return knownAccents[trackId];
  return HASH_PALETTE[hashTrackId(trackId) % HASH_PALETTE.length];
}

/**
 * Accent colours keyed by track id. Direct access for known ids;
 * unknown ids fall back to a deterministic hash-based colour.
 *
 * For new code, prefer `accentForTrack()`.
 */
export const trackAccent: Record<string, string> = new Proxy(
  Object.assign(Object.create(null), knownAccents),
  {
    get(target, property: string) {
      if (property in target) return target[property];
      return HASH_PALETTE[hashTrackId(property) % HASH_PALETTE.length];
    },
  },
);

/**
 * The ordered colours used for the level-up confetti burst.
 *
 * @returns A list of hex colour strings drawn from the brand palette.
 */
export function confettiColours(): string[] {
  return [palette.brand, palette.xp, palette.success, trackAccent.geometry];
}
