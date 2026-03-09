import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { logInUser } from "./testUtils.ts";

let userContext1: BrowserContext;
let userContext2: BrowserContext;
let userContext3: BrowserContext;
let page1: Page;
let page2: Page;
let page3: Page;

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

test.describe("The username hide/reveal logic", () => {
  test("should support hiding a username", async () => {
    // ensure user0 starts from known state
    await page1.request.post("http://localhost:8000/api/user/user1", {
      data: { auth: { username: "user0", password: "pwd0000" }, payload: { hideUsername: false } },
    });

    await logInUser(page1, "user0", "pwd0000");
    await logInUser(page2, "user1", "pwd1111");
    await logInUser(page3, "user2", "pwd2222");

    await page1.getByRole("link", { name: "Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.getByRole("button", { name: "Toggle hide username" }).click();
    await page1.getByRole("button", { name: "Submit profile edits" }).click();

    // has only one link on home page
    await page2.getByRole("link", { name: "The Knight Of Games" }).click();
    await page2.waitForURL("/profile/user0");
    // wait for the user information to have loaded
    await page2.getByText("Profile for").waitFor();
    expect(await page2.getByText("user0").count()).toBe(0);

    await page2.getByRole("link", { name: "Home" }).click();
    await page2.waitForURL("/");

    await logInUser(page1, "user0", "pwd0000");
    await page1.getByRole("link", { name: "Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.getByRole("button", { name: "Toggle hide username" }).click();
    await page1.getByRole("button", { name: "Submit profile edits" }).click();

    await page3.getByRole("link", { name: "The Knight Of Games" }).click();
    await page3.waitForURL("/profile/user0");
    // wait for the user information to have loaded
    await page3.getByText("Profile for").waitFor();
    expect(await page3.getByText("user0").count()).toBe(1);
  });
});
