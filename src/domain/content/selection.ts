/**
 * Pure selection-state helpers for option-set questions.
 *
 * @module domain/content/selection
 */

/**
 * Toggles an option id in a set of selected ids: removes it when already
 * present, adds it otherwise. Other selections are never cleared, so each
 * option toggles independently.
 *
 * @param selectedIds - The currently-selected option ids.
 * @param optionId - The option id to toggle.
 * @returns A new selected-id array with the option toggled.
 */
export function toggleOptionId(
  selectedIds: string[],
  optionId: string,
): string[] {
  return selectedIds.includes(optionId)
    ? selectedIds.filter((id) => id !== optionId)
    : [...selectedIds, optionId];
}
