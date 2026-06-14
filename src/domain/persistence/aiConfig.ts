/**
 * Persistence for the learner's AI provider configuration, following the
 * StorageLike injection pattern from storage.ts.
 *
 * @module domain/persistence/aiConfig
 * @author John Grimes
 */

import type { StorageLike } from "./storage";

/** The learner's AI provider configuration (see contracts/markingApi.md). */
export interface AiConfig {
  /** Full URL of the OpenAI-compatible chat completions endpoint. */
  baseUrl: string;
  /** Bearer token for authenticating requests. */
  apiKey: string;
  /** Model name to pass in the request body. */
  model: string;
}

/** The localStorage key for AI configuration. */
export const STORAGE_KEY = "studybub.aiConfig.v1";

/**
 * Retrieves the default storage backend (localStorage), or null when
 * unavailable (SSR, sandboxed iframe).
 *
 * @returns The global localStorage, or null.
 */
function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Checks whether a parsed value is a valid {@link AiConfig}.
 *
 * @param value - The value to check.
 * @returns True when the value has all required string fields.
 */
function isValidAiConfig(value: unknown): value is AiConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).baseUrl === "string" &&
    typeof (value as Record<string, unknown>).apiKey === "string" &&
    typeof (value as Record<string, unknown>).model === "string"
  );
}

/**
 * Loads the saved AI config, returning null when no config exists, the stored
 * data is corrupt, or the storage backend throws.
 *
 * @param storage - The storage backend; defaults to the global localStorage.
 * @returns The saved {@link AiConfig}, or null when unavailable.
 */
export function loadAiConfig(
  storage: StorageLike | null = defaultStorage(),
): AiConfig | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidAiConfig(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persists an AI config, returning true on success and false when the storage
 * backend is unavailable or throws.
 *
 * @param config - The config to persist.
 * @param storage - The storage backend; defaults to the global localStorage.
 * @returns True if the write succeeded, false otherwise.
 */
export function saveAiConfig(
  config: AiConfig,
  storage: StorageLike | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes the saved AI config from storage so short-text marking reverts to an
 * unconfigured state.
 *
 * @param storage - The storage backend; defaults to the global localStorage.
 */
export function clearAiConfig(
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Swallow storage errors on clear — the config is effectively gone.
  }
}
