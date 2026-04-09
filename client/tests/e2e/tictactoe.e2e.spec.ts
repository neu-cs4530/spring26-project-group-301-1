import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createAndLoadGame } from "./testUtils.ts";

let userContext1: BrowserContext;
let userContext2: BrowserContext;
let page1: Page;
let page2: Page;

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

test.describe("The game selection infrastructure", () => {
  test("should support creating a new Tic-Tac-Toe game and having a second user join it", async () => {
    await createAndLoadGame(page1, page2, "tictactoe", true, true);
  });
});

test.describe("The game of Tic-Tac-Toe", () => {
  test.beforeEach(async () => {
    await createAndLoadGame(page1, page2, "tictactoe", true, false);
  });

  test("should start player 2 (X) with enabled buttons and player 1 (O) with disabled buttons", async () => {
    await expect(page1.getByRole("button", { name: "Place O at row 1, column 1" })).toBeDisabled();
    await expect(page1.getByRole("button", { name: "Place O at row 2, column 2" })).toBeDisabled();
    await expect(page1.getByRole("button", { name: "Place O at row 3, column 3" })).toBeDisabled();

    await expect(page2.getByRole("button", { name: "Place X at row 1, column 1" })).toBeEnabled();
    await expect(page2.getByRole("button", { name: "Place X at row 2, column 2" })).toBeEnabled();
    await expect(page2.getByRole("button", { name: "Place X at row 3, column 3" })).toBeEnabled();
  });

  test("supports a playthrough with player 2 (X) winning the top row", async () => {
    await page2.getByRole("button", { name: "Place X at row 1, column 1" }).click();
    await page1.getByRole("button", { name: "Place O at row 2, column 1" }).click();
    await page2.getByRole("button", { name: "Place X at row 1, column 2" }).click();
    await page1.getByRole("button", { name: "Place O at row 2, column 2" }).click();
    await page2.getByRole("button", { name: "Place X at row 1, column 3" }).click();

    await expect(page2.getByText("You won!")).toBeVisible();
    await expect(page1.getByText("You lost.")).toBeVisible();
  });

  test("supports a playthrough with player 1 (O) winning the middle row", async () => {
    await page2.getByRole("button", { name: "Place X at row 1, column 1" }).click();
    await page1.getByRole("button", { name: "Place O at row 2, column 1" }).click();
    await page2.getByRole("button", { name: "Place X at row 1, column 2" }).click();
    await page1.getByRole("button", { name: "Place O at row 2, column 2" }).click();
    await page2.getByRole("button", { name: "Place X at row 3, column 3" }).click();
    await page1.getByRole("button", { name: "Place O at row 2, column 3" }).click();

    await expect(page1.getByText("You won!")).toBeVisible();
    await expect(page2.getByText("You lost.")).toBeVisible();
  });

  test("supports a draw game", async () => {
    await page2.getByRole("button", { name: "Place X at row 1, column 1" }).click();
    await page1.getByRole("button", { name: "Place O at row 1, column 2" }).click();
    await page2.getByRole("button", { name: "Place X at row 1, column 3" }).click();
    await page1.getByRole("button", { name: "Place O at row 2, column 3" }).click();
    await page2.getByRole("button", { name: "Place X at row 2, column 1" }).click();
    await page1.getByRole("button", { name: "Place O at row 3, column 1" }).click();
    await page2.getByRole("button", { name: "Place X at row 2, column 2" }).click();
    await page1.getByRole("button", { name: "Place O at row 3, column 3" }).click();
    await page2.getByRole("button", { name: "Place X at row 3, column 2" }).click();

    await expect(page1.getByText("Draw game.")).toBeVisible();
    await expect(page2.getByText("Draw game.")).toBeVisible();
  });
});
