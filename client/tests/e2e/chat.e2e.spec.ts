import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createAndLoadGame } from "./testUtils.ts";
import { MESSAGE_COOLDOWN_MS } from "@gamenite/shared";

let userContext1: BrowserContext;
let userContext2: BrowserContext;
let page1: Page;
let page2: Page;

const ITERATIONS = 3; // keep runtime reasonable with cooldown

test.beforeEach(async ({ browser }) => {
  userContext1 = await browser.newContext();
  userContext2 = await browser.newContext();
  page1 = await userContext1.newPage();
  page2 = await userContext2.newPage();
});

test.afterEach(async () => {
  await userContext1.close();
  await userContext2.close();
});

test.describe("Chat in the context of a Nim game", () => {
  let username1: string;

  test.beforeEach(async () => {
    username1 = await createAndLoadGame(page1, page2, "nim", true, false);
  });

  test("avoids race conditions", async () => {
    await page1.getByPlaceholder("Send a message to chat").focus();
    await page2.getByPlaceholder("Send a message to chat").focus();

    // Simultaneously send messages from both players, respecting cooldown
    for (let i = 0; i < ITERATIONS; i += 1) {
      await page1.keyboard.type(`message ${i} A`);
      await page2.keyboard.type(`message ${i} B`);
      await Promise.all([page1.keyboard.press("Enter"), page2.keyboard.press("Enter")]);

      // Ensure both live messages appeared before continuing
      await expect(page1.getByText(`message ${i} A`)).toBeVisible();
      await expect(page1.getByText(`message ${i} B`)).toBeVisible();

      // Wait for cooldown window before next send
      if (i < ITERATIONS - 1) {
        await page1.waitForTimeout(MESSAGE_COOLDOWN_MS + 200);
      }
    }

    for (let i = 0; i < ITERATIONS; i += 1) {
      await expect(page1.getByText(new RegExp(`^message ${i} [AB]$`)).first()).toBeVisible();
      await expect(page1.getByText(`message ${i} A`)).toBeVisible();
      await expect(page1.getByText(`message ${i} B`)).toBeVisible();
    }

    await page2.getByRole("button", { name: "Open navigation menu" }).click();
    await page2
      .getByRole("toolbar", { name: "Application dock" })
      .getByRole("button", { name: "Games" })
      .click();
    await expect(page2.getByRole("listitem").filter({ hasText: username1 })).toHaveCount(1);
    await page2.getByRole("listitem").filter({ hasText: username1 }).first().click();

    for (let i = 0; i < ITERATIONS; i += 1) {
      await expect(page2.getByText(new RegExp(`^message ${i} [AB]$`)).first()).toBeVisible();
    }
  });
});
