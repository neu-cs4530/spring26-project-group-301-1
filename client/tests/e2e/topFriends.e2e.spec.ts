import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { logInUser } from "./testUtils";

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

test.describe("The most-played-with friends list", () => {
  test.beforeEach(async () => {
    await logInUser(page1, "user0", "pwd0000");
    await logInUser(page2, "user1", "pwd1111");
  });

  test("Should show three friends for user0", async () => {
    await page2.getByRole("link", { name: "The Knight Of Games" }).first().click();
    await page2.waitForURL("/profile/user0");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render

    await page2.getByText("Knight Of Games").waitFor();
    await page2.getByText("Top Friends").waitFor();

    expect(await page2.getByText("Sénior Dos").count()).toBe(1);
    expect(await page2.getByText("Yāo").count()).toBe(1);
    expect(await page2.getByText("Frau Drei").count()).toBe(1);
  });

  test("Should show only two friends on user1's profile", async () => {
    await page1.getByRole("link", { name: "Yāo" }).first().click();
    await page1.waitForURL("/profile/user1");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render

    await page1.getByText("Yāo").waitFor();
    await page1.getByText("Top Friends").waitFor();

    expect(await page1.getByText("Sénior Dos").count()).toBe(1);
    expect(await page1.getByText("The Knight Of Games").count()).toBe(1);
    expect(await page1.getByText("Frau Drei").count()).toBe(0);
  });
});
