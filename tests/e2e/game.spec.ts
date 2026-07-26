import { expect, test } from "@playwright/test";

// End-to-end flow for arcade mode. The dev server runs with VITE_BYPASS_AUTH=true
// (see playwright.config.ts). The flow starts the game, confirms the real
// PokéRogue is embedded, and surfaces a practice question on demand. The full
// countdown is avoided by using the "Practise now" button.

const GAME = "/game/algebra";

test("embed the real game and answer a practice question", async ({ page }) => {
  await page.goto(GAME);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Arcade mode", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Play PokéRogue/ }).click();

  // The real third-party game is embedded.
  const frame = page.frameLocator('iframe[title="PokéRogue"]');
  await expect(frame.owner()).toBeVisible();

  // Trigger a practice break and answer the MCQ.
  await page.getByRole("button", { name: /Practise now/i }).click();
  await expect(page.getByText(/Pause! Answer to power up/i)).toBeVisible();
  await page.locator('input[type="radio"]').first().check();
  await page.getByRole("button", { name: /check answer/i }).click();
  await page.getByRole("button", { name: /back to game/i }).click();

  // The overlay has closed; the game is still embedded.
  await expect(page.getByText(/Pause! Answer to power up/i)).toBeHidden();
  await expect(frame.owner()).toBeVisible();
});
