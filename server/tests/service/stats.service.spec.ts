import { describe, it, expect, beforeEach } from "vitest";
import {
  recordGameResult,
  getUserStats,
  getLeaderboard,
} from "../../src/services/stats.service.ts";
import { UserStatsRepo, UserRepo, AuthRepo } from "../../src/repository.ts";
import { createUser } from "../../src/services/user.service.ts";

beforeEach(async () => {
  await UserStatsRepo.clear();
  await UserRepo.clear();
  await AuthRepo.clear();

  await createUser("user1", "pwd1111", new Date());
  await createUser("user2", "pwd2222", new Date());
  await createUser("user3", "pwd3333", new Date());
});

describe("recordGameResult", () => {
  it("creates a new stats record on first game result", async () => {
    await recordGameResult("user1", "nim", "win");
    const stats = await getUserStats("user1");
    expect(stats).toHaveLength(1);
    expect(stats[0].wins).toBe(1);
    expect(stats[0].losses).toBe(0);
    expect(stats[0].gamesPlayed).toBe(1);
  });

  it("ensures increments wins correctly", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user1", "nim", "win");
    const [stat] = await getUserStats("user1");
    expect(stat.wins).toBe(2);
    expect(stat.gamesPlayed).toBe(2);
  });

  it("ensures increments losses correctly", async () => {
    await recordGameResult("user1", "nim", "loss");
    const [stat] = await getUserStats("user1");
    expect(stat.losses).toBe(1);
    expect(stat.wins).toBe(0);
  });

  it("ensures increments draws correctly", async () => {
    await recordGameResult("user1", "nim", "draw");
    const [stat] = await getUserStats("user1");
    expect(stat.draws).toBe(1);
  });

  it("ensures results in different game types don't impact each other's game leaderboard", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user1", "guess", "loss");
    const stats = await getUserStats("user1");
    expect(stats).toHaveLength(2);
    expect(stats.find((s) => s.gameType === "nim")?.wins).toBe(1);
    expect(stats.find((s) => s.gameType === "guess")?.losses).toBe(1);
  });

  it("ensures different users results are tracked separately", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user2", "nim", "loss");
    const aliceStats = await getUserStats("user1");
    const bobStats = await getUserStats("user2");
    expect(aliceStats[0].wins).toBe(1);
    expect(bobStats[0].losses).toBe(1);
  });
});

describe("getUserStats", () => {
  it("returns empty list for a user with no games", async () => {
    expect(await getUserStats("user1")).toHaveLength(0);
  });

  it("does not return stats for other users than the user requested", async () => {
    await recordGameResult("user2", "nim", "win");
    expect(await getUserStats("user1")).toHaveLength(0);
  });

  it("returns all game types for a user", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user1", "guess", "win");
    expect(await getUserStats("user1")).toHaveLength(2);
  });
});

describe("getLeaderboard", () => {
  it("returns an empty leaderboard when there are no stats", async () => {
    const result = await getLeaderboard();
    expect(result.entries).toHaveLength(0);
    expect(result.gameType).toBeUndefined();
  });

  it("ranks players by wins descending", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user2", "nim", "win");

    const result = await getLeaderboard();
    expect(result.entries[0].user.username).toBe("user1");
    expect(result.entries[1].user.username).toBe("user2");
  });

  it("filters by game type correctly", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user2", "guess", "win");

    const nimBoard = await getLeaderboard({ gameType: "nim" });
    expect(nimBoard.entries).toHaveLength(1);
    expect(nimBoard.entries[0].user.username).toBe("user1");
    expect(nimBoard.gameType).toBe("nim");
  });

  it("groups wins across game types when no filter", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user1", "guess", "win");
    await recordGameResult("user2", "nim", "win");

    const result = await getLeaderboard();
    expect(result.entries[0].user.username).toBe("user1");
    expect(result.entries[0].wins).toBe(2);
  });

  it("verify the limit option properly returns list of length limit", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user2", "nim", "win");
    await recordGameResult("user3", "nim", "win");

    const result = await getLeaderboard({ entryLimit: 2 });
    expect(result.entries).toHaveLength(2);
  });

  it("calculates winRate correctly", async () => {
    await recordGameResult("user1", "nim", "win");
    await recordGameResult("user1", "nim", "loss");

    const result = await getLeaderboard();
    expect(result.entries[0].winRate).toBe(0.5);
  });

  it("returns winRate of 0 for a user with no winning games", async () => {
    await recordGameResult("user1", "nim", "loss");
    const result = await getLeaderboard();
    expect(result.entries[0].winRate).toBe(0);
  });
});
