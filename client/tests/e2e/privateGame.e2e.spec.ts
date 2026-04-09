import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createAndLoadGame, createNewUser } from "./testUtils.ts";

let userContext1: BrowserContext;
let userContext2: BrowserContext;
let userContext3: BrowserContext;
let page1: Page;
let page2: Page;
let page3: Page;

let display1: string;

test.beforeEach(async ({ browser }) => {
  userContext1 = await browser.newContext();
  userContext2 = await browser.newContext();
  userContext3 = await browser.newContext();
  page1 = await userContext1.newPage();
  page2 = await userContext2.newPage();
  page3 = await userContext3.newPage();
});

test.afterEach(async () => {
  await userContext1.close();
  await userContext2.close();
  await userContext3.close();
});

test.describe("The creation of a private game", () => {
  test.beforeEach(async () => {
    await createAndLoadGame(page1, page2, "nim", true, false, true, {
      username1: "user0",
      password1: "pwd0000",
      display1: "The Knight Of Games",
      username2: "user1",
      password2: "pwd1111",
      display2: "Yāo",
    });
    display1 = "The Knight Of Games";
  });
  test("New game should show up for both users, who are friends", async () => {
    await page1.getByLabel("HomePageButton").click();
    await page1.waitForURL("/");
    await page2.getByLabel("HomePageButton").click();
    await page2.waitForURL("/");

    await expect(page1.getByRole("listitem").filter({ hasText: "You" })).not.toHaveCount(0);
    await expect(page2.getByRole("listitem").filter({ hasText: display1 })).not.toHaveCount(0);
  });

  test("Should not show newly-created game for third, non-friend user", async () => {
    await createNewUser(page3, "newUserForTest" + Math.floor(Math.random() * 2_000_000), "pwd");
    await page3.getByRole("listitem").first().waitFor({ state: "visible" });
    await expect(
      page3.getByRole("listitem").filter({ hasText: display1 }).filter({ hasText: "Private" }),
    ).toHaveCount(0);
  });
});
