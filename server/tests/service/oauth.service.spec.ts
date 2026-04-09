import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTwitchAuthUrl,
  getYoutubeAuthUrl,
  exchangeTwitchCode,
  exchangeYoutubeCode,
  getTwitchLogin,
  getYoutubeLogin,
  getLogin,
  exchangeCode,
  initOAuthFlow,
} from "../../src/services/oauth.service.ts";

function mockResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: () => body } as unknown as Response;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getTwitchAuthUrl", () => {
  it("returns a URL pointing to Twitch's OAuth endpoint", () => {
    const url = getTwitchAuthUrl("user1", "https://twitch.tv/user1", "twitch");
    expect(url).toMatch(/^https:\/\/id\.twitch\.tv\/oauth2\/authorize\?/);
  });

  it("encodes state containing username, link, and type", () => {
    const username = "user1";
    const link = "https://twitch.tv/user1";
    const type = "twitch";
    const url = getTwitchAuthUrl(username, link, type);
    const stateParam = new URL(url).searchParams.get("state")!;
    const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString());
    expect(decoded).toEqual({ username, link, type });
  });

  it("includes response_type=code and the user:read:email scope", () => {
    const url = getTwitchAuthUrl("user1", "https://twitch.tv/user1", "twitch");
    expect(url).toContain("response_type=code");
    expect(url).toContain("user%3Aread%3Aemail");
  });
});

describe("getYoutubeAuthUrl", () => {
  it("returns a URL pointing to Google's OAuth endpoint", () => {
    const url = getYoutubeAuthUrl("user1", "https://youtube.com/@user1", "youtube");
    expect(url).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
  });

  it("encodes state containing username, link, and type", () => {
    const username = "user1";
    const link = "https://youtube.com/@user1";
    const type = "youtube";
    const url = getYoutubeAuthUrl(username, link, type);
    const stateParam = new URL(url).searchParams.get("state")!;
    const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString());
    expect(decoded).toEqual({ username, link, type });
  });

  it("includes the YouTube readonly scope", () => {
    const url = getYoutubeAuthUrl("user1", "https://youtube.com/@user1", "youtube");
    expect(url).toContain("youtube.readonly");
  });
});

describe("exchangeTwitchCode", () => {
  it("returns the access token on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        // must disable lint due to naming convention required by API
        mockResponse({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: "tok123",
        }),
      ),
    );
    const token = await exchangeTwitchCode("auth-code");
    expect(token).toBe("tok123");
  });

  it("throws if the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({}, false, 400)));
    await expect(exchangeTwitchCode("bad-code")).rejects.toThrow(
      "Twitch token exchange failed: 400",
    );
  });
});

describe("exchangeYoutubeCode", () => {
  it("returns the access token on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        // must disable lint due to naming convention required by API
        mockResponse({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: "yt-tok",
        }),
      ),
    );
    const token = await exchangeYoutubeCode("auth-code");
    expect(token).toBe("yt-tok");
  });

  it("throws if the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({}, false, 401)));
    await expect(exchangeYoutubeCode("bad-code")).rejects.toThrow(
      "Youtube token exchange failed: 401",
    );
  });
});

describe("getTwitchLogin", () => {
  it("returns the lowercase login name on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ data: [{ login: "StreamerGuy" }] })),
    );
    const login = await getTwitchLogin("valid-token");
    expect(login).toBe("streamerguy");
  });

  it("throws if the Twitch API returns a non-ok status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({}, false, 401)));
    await expect(getTwitchLogin("bad-token")).rejects.toThrow("Twitch users API failed: 401");
  });

  it("throws if no user is returned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ data: [] })));
    await expect(getTwitchLogin("valid-token")).rejects.toThrow("No Twitch user returned");
  });
});

describe("getYoutubeLogin", () => {
  it("returns the lowercase custom URL on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(mockResponse({ items: [{ snippet: { customUrl: "@MyChannel" } }] })),
    );
    const login = await getYoutubeLogin("valid-token");
    expect(login).toBe("@mychannel");
  });

  it("throws if the YouTube API returns a non-ok status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({}, false, 403)));
    await expect(getYoutubeLogin("bad-token")).rejects.toThrow("Youtube users API failed: 403");
  });

  it("throws if no items are returned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ items: [] })));
    await expect(getYoutubeLogin("valid-token")).rejects.toThrow("No Youtube user returned");
  });
});

describe("getLogin", () => {
  it("delegates to getTwitchLogin for the twitch platform", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ data: [{ login: "twitchuser" }] })),
    );
    const login = await getLogin("token", "twitch");
    expect(login).toBe("twitchuser");
  });

  it("delegates to getYoutubeLogin for the youtube platform", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ items: [{ snippet: { customUrl: "@ytuser" } }] })),
    );
    const login = await getLogin("token", "youtube");
    expect(login).toBe("@ytuser");
  });
});

describe("exchangeCode", () => {
  it("delegates to exchangeTwitchCode for the twitch platform", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        // must disable lint due to naming convention required by API
        mockResponse({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: "tw-tok",
        }),
      ),
    );
    const token = await exchangeCode("code", "twitch");
    expect(token).toBe("tw-tok");
  });

  it("delegates to exchangeYoutubeCode for the youtube platform", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        // must disable lint due to naming convention required by API
        mockResponse({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: "yt-tok",
        }),
      ),
    );
    const token = await exchangeCode("code", "youtube");
    expect(token).toBe("yt-tok");
  });
});

describe("initOAuthFlow", () => {
  it("returns a Twitch OAuth URL for the twitch platform", () => {
    const result = initOAuthFlow("twitch", "user1", "https://twitch.tv/user1");
    expect(result).toHaveProperty("url");
    expect((result as { url: string }).url).toMatch(/^https:\/\/id\.twitch\.tv\//);
  });

  it("returns a YouTube OAuth URL for the youtube platform", () => {
    const result = initOAuthFlow("youtube", "user1", "https://youtube.com/@user1");
    expect(result).toHaveProperty("url");
    expect((result as { url: string }).url).toMatch(/^https:\/\/accounts\.google\.com\//);
  });

  it("returns an error for an unsupported platform", () => {
    const result = initOAuthFlow("instagram" as never, "user1", "https://instagram.com/user1");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe("Unsupported platform");
  });
});
