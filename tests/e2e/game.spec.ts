import { expect, test } from "@playwright/test";

// End-to-end flow for the Bub Quest arcade game. The dev server is started by
// Playwright with VITE_BYPASS_AUTH=true (see playwright.config.ts), so the
// /game/$trackId route renders without a passkey. The flow starts a game,
// moves to collect orbs until a question pause appears, answers it, and
// confirms play resumes.

const GAME = "/game/algebra";

test("play, answer a question pause, and resume", async ({ page }) => {
  await page.goto(GAME);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Bub Quest", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Start/ }).click();
  await expect(page.getByRole("img", { name: /play field/i })).toBeVisible();

  // Hold right to sweep up the two orbs on the starting row. With default
  // tuning (cadence 2) the second orb triggers the question pause.
  await page.keyboard.down("ArrowRight");
  await expect(page.getByText(/Pause! Answer to power up/i)).toBeVisible({
    timeout: 8000,
  });
  await page.keyboard.up("ArrowRight");

  // Answer the MCQ: select the first option, check, then keep playing.
  await page.locator('input[type="radio"]').first().check();
  await page.getByRole("button", { name: /check answer/i }).click();
  await page.getByRole("button", { name: /keep playing/i }).click();

  // The overlay has closed and the play field is back in view.
  await expect(page.getByText(/Pause! Answer to power up/i)).toBeHidden();
  await expect(page.getByRole("img", { name: /play field/i })).toBeVisible();
});
