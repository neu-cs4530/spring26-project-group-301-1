import { expect, type Page } from "@playwright/test";

/**
 * Creates a new user using the given page, for the given username and password.
 * @param page the page to create the user for
 * @param username the username to use
 * @param password the password to use
 */
export async function createNewUser(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Create New Account" }).click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: "Sign Up" }).click();
  await page.waitForURL("/");
}

/**
 * Log a user in with a username and password, and wait for successful
 * post-login redirect to the home page
 *
 * @param page
 * @param username
 * @param password
 */
export async function logInUser(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  // { exact: true } is necessary here to avoid capturing the "Show Password" checkbox and "Confirm Password" button
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/");
}

/**
 * Set up a test of two users joining and starting a 2+ player game
 *
 * @param page1 - A Page where we will attempt to create a *new* user. That user will initiate the game.
 * @param page2 - A Page where the preexisting user2 will log in
 * @param gameId - The game id shared by the frontend and backend
 * @param gameStartsAutomatically - true if the game has a maximum of two players
 * @param doAssess - `true` adds extra expectations
 * @param privateGame - `true` creates a private game, false does not
 * @returns
 */
export async function createAndLoadGame(
  page1: Page,
  page2: Page,
  gameId: string,
  gameStartsAutomatically: boolean,
  doAssess: boolean,
  privateGame: boolean = false,
  credentials?: {
    username1: string;
    display1: string;
    password1: string;
    username2: string;
    display2: string;
    password2: string;
  },
) {
  let username1: string;
  let display1: string;
  let username2: string;
  let password2: string;

  if (credentials) {
    username1 = credentials.username1;
    display1 = credentials.display1;
    username2 = credentials.username2;
    password2 = credentials.password2;
    await logInUser(page1, credentials.username1, credentials.password1);
  } else {
    // Create a random new user and username to give this test unique identity
    username1 = "user" + Math.floor(Math.random() * 2_000_000);
    display1 = username1;
    const password1 = "pwd_for_" + username1;
    username2 = "user2";
    password2 = "pwd2222";

    await createNewUser(page1, username1, password1);
  }

  // User 1 creates a new game
  await page1.getByRole("button", { name: "Create New Game" }).click();
  await page1.waitForURL("/game/new");
  await page1.waitForSelector('select[aria-label="Game selection"]');
  await page1.getByLabel("Game selection").selectOption(gameId);

  if (privateGame) {
    await page1.getByLabel("privateGameCheck").click();
  }
  await page1.getByRole("button", { name: "Create Game" }).click();

  // Causes Playwright to auto-wait for for game to be enabled
  await page1.getByPlaceholder("Send a message to chat").click();

  if (doAssess) {
    // Check Player 1 appears in the roster
    await expect(page1.locator(".gameRoster__itemRole", { hasText: "Player 1" })).toBeVisible();

    // This is the only expectation that insists the game cannot start with one player
    await expect(page1.getByRole("button", { name: "Start Game" })).not.toBeVisible();
  }

  // Log in user2
  await logInUser(page2, username2, password2);

  // The always-on expectation here gives the page a chance to load.
  const byCreator = page2.locator("#gameList [role='listitem']").filter({ hasText: display1 });
  const gameListItem = privateGame ? byCreator.filter({ hasText: "Private" }) : byCreator;

  await expect(gameListItem).not.toHaveCount(0);

  if (doAssess) {
    // Check that at least one link exists in the listitem for the created game
    const linkCount = await gameListItem.first().getByRole("link").count();
    expect(linkCount).toBeGreaterThan(0);
  }

  await gameListItem.first().getByRole("link").first().click();

  if (doAssess) {
    await expect(page1.getByText("waiting for game to begin")).toBeVisible();
    await expect(page2.getByText("waiting for game to begin")).toBeVisible();
  }

  await page2.getByRole("button", { name: "Join Game" }).click();

  if (doAssess) {
    await expect(page1.getByText("Player 1")).toBeVisible();
    await expect(page2.getByText("Player 2")).toBeVisible();

    // React's strict mode causes chat to be joined twice
    // https://react.dev/reference/react/StrictMode
    // To avoid flakiness, we merely require the entered-chat message to appear >= 1 time
    expect(await page1.getByText("Sénior Dos entered chat").count()).toBeGreaterThanOrEqual(1);
  }

  if (gameStartsAutomatically) {
    if (doAssess) {
      await expect(page1.getByRole("button", { name: "Start Game" })).not.toBeVisible();
      await expect(page2.getByRole("button", { name: "Start Game" })).not.toBeVisible();
    }
  } else {
    if (doAssess) {
      await expect(page1.getByRole("button", { name: "Start Game" })).toBeVisible();
      await expect(page2.getByRole("button", { name: "Start Game" })).toBeVisible();
    }

    await page1.getByRole("button", { name: "Start Game" }).click();
  }

  if (doAssess) {
    await expect(page1.getByText("waiting for game to begin")).not.toBeVisible();
    await expect(page2.getByText("waiting for game to begin")).not.toBeVisible();
  }

  return username1;
}
