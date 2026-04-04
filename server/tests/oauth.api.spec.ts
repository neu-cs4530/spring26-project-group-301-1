import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";
import { resetEverythingToDefaults } from "../src/initRepository.ts";
import { updateUser } from "../src/services/user.service.ts";
import { type SafeUserInfo } from "@gamenite/shared";

vi.mock("../src/services/oauth.service.ts", async () => {
  const actual = await vi.importActual<typeof import("../src/services/oauth.service.ts")>(
    "../src/services/oauth.service.ts",
  );
  return {
    ...actual,
    exchangeCode: vi.fn(),
    getLogin: vi.fn(),
  };
});

import * as oauthService from "../src/services/oauth.service.ts";

let response: Response;

const auth0 = { username: "user0", password: "pwd0000" };
const authBad = { username: "user0", password: "wrongpassword" };

afterAll(async () => {
  await resetEverythingToDefaults();
});

describe("POST /api/oauth/:platform/verify", () => {
  describe("unsupported platforms", () => {
    it("returns 400 for twitter (no OAuth support)", async () => {
      response = await supertest(app)
        .post("/api/oauth/twitter/verify")
        .send({ auth: auth0, payload: { link: "https://twitter.com/user0" } });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Unsupported platform for authentication" });
    });

    it("returns 400 for instagram (no OAuth support)", async () => {
      response = await supertest(app)
        .post("/api/oauth/instagram/verify")
        .send({ auth: auth0, payload: { link: "https://instagram.com/user0" } });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Unsupported platform for authentication" });
    });
  });

  describe("request validation", () => {
    it("returns 400 for a missing payload", async () => {
      response = await supertest(app).post("/api/oauth/twitch/verify").send({ auth: auth0 });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Poorly-formed request" });
    });

    it("returns 400 when link is missing from payload", async () => {
      response = await supertest(app)
        .post("/api/oauth/twitch/verify")
        .send({ auth: auth0, payload: {} });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Poorly-formed request" });
    });

    it("returns 400 when auth credentials are missing", async () => {
      response = await supertest(app)
        .post("/api/oauth/twitch/verify")
        .send({ payload: { link: "https://twitch.tv/user0" } });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Poorly-formed request" });
    });
  });

  describe("authentication", () => {
    it("returns 400 for invalid credentials", async () => {
      response = await supertest(app)
        .post("/api/oauth/twitch/verify")
        .send({ auth: authBad, payload: { link: "https://twitch.tv/user0" } });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Invalid user request" });
    });
  });

  describe("successful flow", () => {
    it("returns a Twitch OAuth URL for a valid twitch request", async () => {
      response = await supertest(app)
        .post("/api/oauth/twitch/verify")
        .send({ auth: auth0, payload: { link: "https://twitch.tv/user0" } });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("url");
      expect(response.body.url).toMatch(/^https:\/\/id\.twitch\.tv\/oauth2\/authorize/);
    });

    it("returns a YouTube OAuth URL for a valid youtube request", async () => {
      response = await supertest(app)
        .post("/api/oauth/youtube/verify")
        .send({ auth: auth0, payload: { link: "https://youtube.com/@user0" } });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("url");
      expect(response.body.url).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
    });

    it("encodes username and link in the state parameter", async () => {
      const link = "https://twitch.tv/user0";
      response = await supertest(app)
        .post("/api/oauth/twitch/verify")
        .send({ auth: auth0, payload: { link } });
      expect(response.status).toBe(200);
      expect("body" in response && "url" in response.body).toBe(true);
      const url = new URL(response.body.url as string);
      const stateParam = url.searchParams.get("state")!;
      const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString());
      expect(decoded).toMatchObject({ username: "user0", link, type: "twitch" });
    });
  });
});

describe("GET /api/oauth/:platform/callback", () => {
  const twitchLink = "https://twitch.tv/user0";
  const twitchLogin = "user0";

  function buildState(username: string, link: string, type: string): string {
    return Buffer.from(JSON.stringify({ username, link, type })).toString("base64");
  }

  beforeEach(() => {
    vi.mocked(oauthService.exchangeCode).mockResolvedValue("mock-access-token");
    vi.mocked(oauthService.getLogin).mockResolvedValue(twitchLogin);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("error query parameter", () => {
    it("redirects to client with oauth_error when error param is present", async () => {
      response = await supertest(app)
        .get("/api/oauth/twitch/callback")
        .query({ error: "access_denied" });
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain("oauth_error=");
      expect(response.headers.location).toContain("access_denied");
    });
  });

  describe("missing query parameters", () => {
    it("returns 400 when code is missing", async () => {
      const state = buildState("user0", twitchLink, "twitch");
      response = await supertest(app).get("/api/oauth/twitch/callback").query({ state });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Invalid callback request" });
    });

    it("returns 400 when state is missing", async () => {
      response = await supertest(app).get("/api/oauth/twitch/callback").query({ code: "somecode" });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Invalid callback request" });
    });

    it("returns 400 when both code and state are missing", async () => {
      response = await supertest(app).get("/api/oauth/twitch/callback");
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Invalid callback request" });
    });
  });

  describe("invalid state parameter", () => {
    it("returns 400 for a state that is valid base64 but missing required fields", async () => {
      const badState = Buffer.from(JSON.stringify({ foo: "bar" })).toString("base64");
      response = await supertest(app)
        .get("/api/oauth/twitch/callback")
        .query({ code: "somecode", state: badState });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "Invalid state parameter" });
    });
  });

  describe("user not found", () => {
    it("returns 400 when the username in state does not exist", async () => {
      const state = buildState("nonexistentuser", twitchLink, "twitch");
      response = await supertest(app)
        .get("/api/oauth/twitch/callback")
        .query({ code: "somecode", state });
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({ error: "User not found" });
    });
  });

  describe("account mismatch", () => {
    it("redirects with oauth_error when OAuth login does not match linked profile", async () => {
      vi.mocked(oauthService.getLogin).mockResolvedValue("differentuser");
      const state = buildState("user0", twitchLink, "twitch");
      response = await supertest(app)
        .get("/api/oauth/twitch/callback")
        .query({ code: "somecode", state });
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain("oauth_error=");
      expect(decodeURIComponent(response.headers.location)).toContain(
        "Account does not match linked profile",
      );
    });

    it("redirects with oauth_error for youtube when login does not match", async () => {
      vi.mocked(oauthService.getLogin).mockResolvedValue("@different_channel");
      const link = "https://youtube.com/@user0channel";
      const state = buildState("user0", link, "youtube");
      response = await supertest(app)
        .get("/api/oauth/youtube/callback")
        .query({ code: "somecode", state });
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain("oauth_error=");
    });
  });

  describe("successful verification", () => {
    beforeEach(async () => {
      // Add a twitch profile link to user0 so it can be marked verified
      await updateUser("user0", {
        profileLink: twitchLink,
        profileLinkType: "twitch",
        profileLinkReqType: "add",
      });
    });

    afterEach(async () => {
      // Remove the profile link after each test to keep state clean
      await updateUser("user0", {
        profileLink: twitchLink,
        profileLinkType: "twitch",
        profileLinkReqType: "delete",
      });
    });

    it("redirects with oauth_success when account matches", async () => {
      const state = buildState("user0", twitchLink, "twitch");
      response = await supertest(app)
        .get("/api/oauth/twitch/callback")
        .query({ code: "somecode", state });
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain("oauth_success=");
      expect(decodeURIComponent(response.headers.location)).toContain("Account verified");
    });

    it("marks the profile link as verified in the database", async () => {
      const state = buildState("user0", twitchLink, "twitch");
      await supertest(app).get("/api/oauth/twitch/callback").query({ code: "somecode", state });

      const userResponse = await supertest(app).get("/api/user/user0");
      expect(userResponse.status).toBe(200);
      const user: SafeUserInfo = userResponse.body;
      expect(user === undefined).toBe(false);
      const links = user.profileLinks;
      const twitchProfile = links.find(
        (p: { type: string; link: string; verified: boolean }) => p.type === "twitch",
      );
      expect(twitchProfile).toBeDefined();
      expect(twitchProfile!.verified).toBe(true);
    });
  });
});
