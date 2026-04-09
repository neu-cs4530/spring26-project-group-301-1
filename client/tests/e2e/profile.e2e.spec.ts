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
    await page1.request.post("http://localhost:8000/api/user/user0", {
      data: { auth: { username: "user0", password: "pwd0000" }, payload: { hideUsername: false } },
    });

    await logInUser(page1, "user0", "pwd0000");
    await logInUser(page2, "user1", "pwd1111");
    await logInUser(page3, "user2", "pwd2222");

    await page1.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.getByRole("button", { name: "Privacy" }).click();
    await page1.getByLabel("Toggle hide username").waitFor({ state: "visible" });
    await page1.getByLabel("Toggle hide username").click();
    await page1.getByRole("button", { name: "Submit profile edits" }).click();
    await page1.waitForURL("/login");

    // has a link on home page
    await page2.getByRole("link", { name: "The Knight Of Games" }).first().click();
    await page2.waitForURL("/profile/user0");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render

    // wait for the user information to have loaded
    expect(await page2.getByText("@user0").count()).toBe(0);

    await page2.getByRole("button", { name: "Home" }).click();
    await page2.waitForURL("/");

    await logInUser(page1, "user0", "pwd0000");
    await page1.getByRole("button", { name: "Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.getByRole("button", { name: "Privacy" }).click();
    await page1.getByLabel("Toggle hide username").waitFor({ state: "visible" });
    await page1.getByLabel("Toggle hide username").click();
    await page1.getByRole("button", { name: "Submit profile edits" }).click();
    await page1.waitForURL("/login");

    await page3.getByRole("link", { name: "The Knight Of Games" }).first().click();
    await page3.waitForURL("/profile/user0");
    // wait for the user information to have loaded
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    expect(await page3.getByText("@user0").count()).toBe(1);
  });
});

test.describe("The private profile logic", () => {
  test("should support making a profile private", async () => {
    await page1.request.post("http://localhost:8000/api/user/user1", {
      data: {
        auth: { username: "user1", password: "pwd1111" },
        payload: { privateProfile: false },
      },
    });

    await logInUser(page1, "user1", "pwd1111");
    await logInUser(page2, "user3", "pwd3333");

    await page1.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user1");
    await page1.getByRole("button", { name: "Privacy" }).click();
    await page1.getByLabel("Toggle private profile").waitFor({ state: "visible" });
    await page1.getByLabel("Toggle private profile").click();
    await page1.getByRole("button", { name: "Submit profile edits" }).click();
    await page1.waitForURL("/login");

    // has only one link on home page
    await page2.getByRole("link", { name: "Yāo" }).first().click();
    await page2.waitForURL("/profile/user1");
    // wait for the user information to have loaded
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    expect(await page2.getByText("Account created").count()).toBe(0);

    await page2.getByRole("button", { name: "Home" }).click();
    await page2.waitForURL("/");

    await logInUser(page1, "user1", "pwd1111");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user1");
    await page1.getByRole("button", { name: "Privacy" }).click();
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    await page1.getByLabel("Toggle private profile").click();
    await page1.getByRole("button", { name: "Submit profile edits" }).click();
    await page1.waitForURL("/login");

    await logInUser(page2, "user3", "pwd3333");
    await page2.getByRole("link", { name: "Yāo" }).first().click();
    await page2.waitForURL("/profile/user1");
    // wait for the user information to have loaded
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    expect(await page2.getByText("Joined").count()).toBe(1);
  });
});

test.describe("Display name editing", () => {
  test("should allow updating display name from profile page", async () => {
    await page1.request.post("http://localhost:8000/api/user/user0", {
      data: {
        auth: { username: "user0", password: "pwd0000" },
        payload: { display: "The Knight Of Games" },
      },
    });

    await logInUser(page1, "user0", "pwd0000");

    await page1.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user0");

    await page1.getByRole("button", { name: "Display Name" }).click();
    await page1.getByPlaceholder("Display name").fill("Display Name Updated");
    await page1.getByRole("button", { name: "Submit profile edits" }).click();
    await page1.waitForURL("/login");

    await logInUser(page1, "user0", "pwd0000");
    await expect(
      page1.getByRole("heading", { name: "Welcome, Display Name Updated!" }),
    ).toBeVisible();

    // Clean up test state for any subsequent tests.
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.getByRole("button", { name: "Display Name" }).click();
    await page1.getByPlaceholder("Display name").fill("The Knight Of Games");
    await page1.getByRole("button", { name: "Submit profile edits" }).click();
    await page1.waitForURL("/login");
  });
});

test.describe("Friends count badge", () => {
  test("should update after accepting and removing a friend", async () => {
    const user0 = "user0";
    const user1 = "user1";

    // Check initial friend count for user0 is 3
    await logInUser(page1, user0, "pwd0000");
    await page1.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.waitForTimeout(1000); // Wait 1 second for content to render
    const friendsButtonOnA = page1.getByRole("button", { name: "Friends" });
    await expect(friendsButtonOnA).toContainText("3");

    // -------- Remove user0 as a friend on user1's profile --------
    await page2.goto("/");
    await page2.waitForURL("/");
    await logInUser(page2, user1, "pwd1111");

    //Check initial friend count for user1 is 2
    await page2.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page2.getByRole("link", { name: "View Profile" }).click();
    await page2.waitForURL("/profile/user1");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    const friendsButtonOnB = page2.getByRole("button", { name: "Friends" });
    await expect(friendsButtonOnB).toContainText("2");

    // Remove user0 as a friend
    await page2.getByRole("button", { name: "Home" }).click();
    await page2.waitForURL("/");
    await page2.getByRole("link", { name: "The Knight Of Games" }).click();
    await page2.waitForURL("/profile/user0");
    await page2.getByRole("button", { name: "Remove Friend" }).click();
    await expect(page2.getByText("Add Friend")).toBeVisible();

    // Check that user1's friend count has decreased to 1
    await page2.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page2.getByRole("link", { name: "View Profile" }).click();
    await page2.waitForURL("/profile/user1");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    const friendsButtonOnC = page2.getByRole("button", { name: "Friends" });
    await expect(friendsButtonOnC).toContainText("1");

    // Check that user0's friend count has decreased to 2
    await logInUser(page1, user0, "pwd0000");

    await page1.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.waitForTimeout(1000); // Wait 1 second for content to render
    const friendsButtonOnD = page1.getByRole("button", { name: "Friends" });
    await expect(friendsButtonOnD).toContainText("2");

    // -------- Add user1 as a friend again on user0's profile --------
    await page1.getByRole("button", { name: "Home" }).click();
    await page1.waitForURL("/");
    await page1.waitForTimeout(1000); // Wait 1 second for content to render
    await page1.getByRole("link", { name: "Yāo" }).first().click();
    await page1.waitForURL("/profile/user1");
    await page1.getByRole("button", { name: "Add Friend" }).click();
    await expect(page1.getByText("Friend Request Sent")).toBeVisible();

    // Accept the friend request on user1's profile
    await page2.goto("/");
    await page2.waitForURL("/");
    await logInUser(page2, user1, "pwd1111");

    await page2.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page2.getByRole("link", { name: "View Profile" }).click();
    await page2.waitForURL("/profile/user1");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    await page2.getByRole("button", { name: "Friend Requests" }).click();
    await page2.getByRole("button", { name: "Accept" }).click();

    // Check that user1's friend count has increased back to 2
    await page2.goto("/");
    await page2.waitForURL("/");
    await logInUser(page2, user1, "pwd1111");
    await page2.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page2.getByRole("link", { name: "View Profile" }).click();
    await page2.waitForURL("/profile/user1");
    await page2.waitForTimeout(1000); // Wait 1 second for content to render
    const friendsButtonOnF = page2.getByRole("button", { name: "Friends" });
    await expect(friendsButtonOnF).toContainText("2");

    // Check that user0's friend count has increased back to 3
    await page1.goto("/");
    await page1.waitForURL("/");
    await logInUser(page1, user0, "pwd0000");
    await page1.getByRole("link", { name: "View Profile" }).waitFor({ state: "visible" });
    await page1.getByRole("link", { name: "View Profile" }).click();
    await page1.waitForURL("/profile/user0");
    await page1.waitForTimeout(1000); // Wait 1 second for content to render
    const friendsButtonOnG = page1.getByRole("button", { name: "Friends" });
    await expect(friendsButtonOnG).toContainText("3");
  });
});
