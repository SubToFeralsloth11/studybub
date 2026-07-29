import { expect, test, type Page } from "@playwright/test";

const GAME = "/game/algebra";

/**
 * Answer whatever question type appears — the algebra track has mcq, expression,
 * numeric, fillInTheBlank, and matching questions, so the test must work with
 * each input widget.
 */
async function answerQuestion(page: Page) {
  // 1. MCQ: radio group
  const radios = page.locator('input[type="radio"]');
  if ((await radios.count()) > 0) {
    await radios.first().check();
    return;
  }

  // 2. Matching: pair up all items, then submit
  const leftButtons = page.locator('button[aria-label^="Left:"]');
  const rightButtons = page.locator('button[aria-label^="Right:"]');
  if ((await leftButtons.count()) > 0 && (await rightButtons.count()) > 0) {
    const count = Math.min(
      await leftButtons.count(),
      await rightButtons.count(),
    );
    for (let index = 0; index < count; index++) {
      await leftButtons.nth(index).click();
      await rightButtons.nth(index).click();
    }
    // MatchingInput renders its own "Check answer" button; the parent
    // QuestionView hides its button for matching types.
    await page.getByRole("button", { name: /check answer/i }).click();
    return;
  }

  // 3. Expression, numeric, fillInTheBlank, shortText: type an answer
  // FillInTheBlank renders multiple text inputs; fill each blank.
  const blanks = page.locator('input[type="text"]');
  for (let index = 0; index < (await blanks.count()); index++) {
    await blanks.nth(index).fill("42");
  }
}

test("select a game, start a session, and answer a practice question", async ({
  page,
}) => {
  await page.goto(GAME);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Arcade mode", exact: true }),
  ).toBeVisible();

  // Start button is disabled until a game is selected
  const startButton = page.getByRole("button", { name: /Start session/ });
  await expect(startButton).toBeDisabled();

  await page.getByRole("button", { name: /Rigs of Rods/ }).click();
  await expect(startButton).not.toBeDisabled();
  await startButton.click();

  // The playing view shows the selected game's instruction
  await expect(page.getByText(/Launch Rigs of Rods/)).toBeVisible();

  await page.getByRole("button", { name: /Practise now/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/answer to power up/)).toBeVisible();

  // A burst has 3-5 questions; answer each one, then click through.
  // Loop until the dialog closes (the burst finishes).
  for (let attempt = 0; attempt < 5; attempt++) {
    await answerQuestion(page);

    // For non-matching types the "Check answer" button lives in QuestionView;
    // matching types submit inline inside answerQuestion above.
    const checkButton = page.getByRole("button", { name: /check answer/i });
    if (await checkButton.isVisible().catch(() => false)) {
      await checkButton.click();
    }

    const continueButton = page.getByRole("button", { name: /back to game/i });
    if (!(await continueButton.isVisible().catch(() => false))) break;
    await continueButton.click();

    // If the dialog disappeared, the burst is done.
    if (
      !(await page
        .getByRole("dialog")
        .isVisible()
        .catch(() => false))
    )
      break;
  }

  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
  await expect(page.getByText(/Launch Rigs of Rods/)).toBeVisible();
});
