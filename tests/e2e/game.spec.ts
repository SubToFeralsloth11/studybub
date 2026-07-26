import { expect, test } from "@playwright/test";

const GAME = "/game/algebra";

test("embed Eaglercraft and answer a practice question", async ({ page }) => {
  await page.goto(GAME);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Arcade mode", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Play Eaglercraft/ }).click();

  const frame = page.frameLocator('iframe[title="Eaglercraft"]');
  await expect(frame.owner()).toBeVisible();

  await page.getByRole("button", { name: /Practise now/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/answer to power up/)).toBeVisible();
  await page.locator('input[type="radio"]').first().check();
  await page.getByRole("button", { name: /check answer/i }).click();
  await page.getByRole("button", { name: /back to game/i }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(frame.owner()).toBeVisible();
});
