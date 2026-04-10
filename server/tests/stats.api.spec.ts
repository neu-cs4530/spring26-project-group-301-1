import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import * as statsService from "../src/services/stats.service.ts";
import { type LeaderboardPayload } from "@gamenite/shared";
import { type UserStatsRecord } from "../src/models.ts";

vi.mock("../src/services/stats.service.ts", () => ({
  getLeaderboard: vi.fn(),
  getUserStats: vi.fn(),
}));

const emptyLeaderboard: LeaderboardPayload = {
  gameType: undefined,
  entries: [],
  generatedAt: new Date("2025-01-01"),
};

const MOCK_STATS: UserStatsRecord[] = [
  {
    username: "user1",
    gameType: "nim",
    wins: 2,
    losses: 1,
    draws: 0,
    gamesPlayed: 3,
    lastPlayedAt: "2025-01-01T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/stats/leaderboard", () => {
  it("returns the leaderboard with default params", async () => {
    vi.mocked(statsService.getLeaderboard).mockResolvedValue(emptyLeaderboard);

    const { status } = await request(app).get("/api/stats/leaderboard");

    expect(status).toBe(200);
    expect(statsService.getLeaderboard).toHaveBeenCalledWith({
      gameType: undefined,
      entryLimit: undefined,
    });
  });

  it("passes gameType query param to the service", async () => {
    const leaderboard: LeaderboardPayload = { ...emptyLeaderboard, gameType: "nim" };
    vi.mocked(statsService.getLeaderboard).mockResolvedValue(leaderboard);

    const { status } = await request(app).get("/api/stats/leaderboard?gameType=nim");

    expect(status).toBe(200);
    expect(statsService.getLeaderboard).toHaveBeenCalledWith({
      gameType: "nim",
      entryLimit: undefined,
    });
  });

  it("passes limit query param to the service", async () => {
    vi.mocked(statsService.getLeaderboard).mockResolvedValue(emptyLeaderboard);

    const { status } = await request(app).get("/api/stats/leaderboard?limit=5");

    expect(status).toBe(200);
    expect(statsService.getLeaderboard).toHaveBeenCalledWith({
      gameType: undefined,
      entryLimit: 5,
    });
  });

  it("returns 400 for an invalid gameType", async () => {
    const { status } = await request(app).get("/api/stats/leaderboard?gameType=notAGame");

    expect(status).toBe(400);
  });

  it("returns 400 for a limit below 1", async () => {
    const { status } = await request(app).get("/api/stats/leaderboard?limit=0");

    expect(status).toBe(400);
  });

  it("returns 400 for a limit above 100", async () => {
    const { status } = await request(app).get("/api/stats/leaderboard?limit=101");

    expect(status).toBe(400);
  });
});

describe("GET /api/stats/:username", () => {
  it("returns stats for the given username", async () => {
    vi.mocked(statsService.getUserStats).mockResolvedValue(MOCK_STATS);

    const { status } = await request(app).get("/api/stats/user1");

    expect(status).toBe(200);
    expect(statsService.getUserStats).toHaveBeenCalledWith("user1");
  });

  it("returns an empty list for a user with no stats", async () => {
    vi.mocked(statsService.getUserStats).mockResolvedValue([]);

    const { status, body } = await request(app).get("/api/stats/user1");

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });
});
