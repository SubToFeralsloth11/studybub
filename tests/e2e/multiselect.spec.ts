import { expect, test, type Page } from "@playwright/test";

// Advances through learn cards to reach the practice phase. Clicks "Next" up
// to 5 times (fewer if buttons disappear), then clicks "Start practice".
async function advanceToPractice(page: Page): Promise<void> {
  for (let index = 0; index < 5; index++) {
    const nextButton = page.getByRole("button", { name: /^Next/ });
    const visible = await nextButton
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (!visible) break;
    await nextButton.click();
    await page.waitForTimeout(300);
  }
  await page
    .getByRole("button", { name: /start practice/i })
    .click({ timeout: 10_000 });
}

// Selects a single-select MCQ option by its option id and advances.
async function answerMcq(page: Page, optionId: string): Promise<void> {
  await page.locator(`input[type=radio][value="${optionId}"]`).check();
  await page.getByRole("button", { name: /check answer/i }).click();
  await page.getByRole("button", { name: /next/i }).click();
}

test("a multiselect question can be answered by selecting all correct options", async ({
  page,
}) => {
  await page.goto("/lesson/chemistry/elements-intro");
  await page.waitForLoadState("networkidle");
  await advanceToPractice(page);

  // Work through the three single-select MCQs before the multiselect one.
  await answerMcq(page, "b"); // helium coolant property
  await answerMcq(page, "c"); // definition of an element
  await answerMcq(page, "c"); // calcium atoms

  // el-p4: select Carbon and Gold, then check.
  await page.getByRole("checkbox", { name: /carbon/i }).check();
  await page.getByRole("checkbox", { name: /gold/i }).check();
  await page.getByRole("button", { name: /check answer/i }).click();

  await expect(page.getByRole("status")).toContainText(/correct/i);
});

test("a partial multiselect selection is marked incorrect", async ({
  page,
}) => {
  await page.goto("/lesson/chemistry/elements-intro");
  await page.waitForLoadState("networkidle");
  await advanceToPractice(page);

  await answerMcq(page, "b");
  await answerMcq(page, "c");
  await answerMcq(page, "c");

  // Select only Carbon (missing Gold), then check.
  await page.getByRole("checkbox", { name: /carbon/i }).check();
  await page.getByRole("button", { name: /check answer/i }).click();

  await expect(page.getByRole("status")).toContainText(/not quite/i);
  // The missed correct option (Gold) is surfaced with the missed cue.
  await expect(page.getByText("missed")).toBeVisible();
});
