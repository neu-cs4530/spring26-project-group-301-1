import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";
import { randomUUID } from "crypto";
import { getUserByUsername } from "../src/services/auth.service.ts";
import { joinGame } from "../src/services/game.service.ts";

let response: Response;

const auth3 = { username: "user3", password: "pwd3333" };
const authBad = { username: "user3", password: "user3" };

describe("POST /api/game/create", () => {
  it("should return 400 on ill-formed payload or invalid game key", async () => {
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 9,
    });
    expect(response.status).toBe(400);

    response = await supertest(app)
      .post(`/api/game/create`)
      .send({ auth: auth3, payload: "gameThatDoesNotExist" });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post(`/api/game/create`)
      .send({ auth: authBad, payload: { gameKey: "nim", isPrivate: false } });
    expect(response.status).toBe(403);
  });

  it("should succeed when asked to create a game of nim", async () => {
    response = await supertest(app)
      .post(`/api/game/create`)
      .send({
        auth: auth3,
        payload: { gameKey: "nim", isPrivate: false },
      });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      gameId: expect.anything(),
      chat: expect.anything(),
      type: "nim",
      status: "waiting",
      createdBy: {
        username: "user3",
        display: "Frau Drei",
        createdAt: expect.anything(),
        hideUsername: false,
        privateProfile: false,
      },
      createdAt: expect.anything(),
      minPlayers: 2,
      players: [
        {
          username: "user3",
          display: "Frau Drei",
          createdAt: expect.anything(),
          hideUsername: false,
          privateProfile: false,
        },
      ],
      chatFiltered: true,
      isPrivate: false,
    });
  });
});

describe("GET /api/game/:id", () => {
  it("should 404 given a nonexistent id", async () => {
    response = await supertest(app).get(
      `/api/game/${randomUUID().toString()}?username=user3&password=pwd3333`,
    );
    expect(response.status).toBe(404);
  });

  it("should succeed if a created game is requested", async () => {
    response = await supertest(app)
      .post(`/api/game/create`)
      .send({
        auth: auth3,
        payload: { gameKey: "nim", isPrivate: false },
      });
    expect(response.status).toBe(200);
    const gameInfo = response.body;

    response = await supertest(app).get(
      `/api/game/${gameInfo.gameId}?username=user3&password=pwd3333`,
    );
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(gameInfo);
  });

  it("enforces private game visibility rules", async () => {
    // user1 and user2 are friends; user3 is not friends with user1
    const createResp = await supertest(app)
      .post(`/api/game/create`)
      .send({
        auth: { username: "user1", password: "pwd1111" },
        payload: { gameKey: "guess", isPrivate: true },
      });
    expect(createResp.status).toBe(200);

    const gameId = createResp.body.gameId;

    // friend can see
    response = await supertest(app).get(`/api/game/${gameId}?username=user2&password=pwd2222`);
    expect(response.status).toBe(200);

    // non-friend cannot see
    response = await supertest(app).get(`/api/game/${gameId}?username=user3&password=pwd3333`);
    expect(response.status).toBe(404);
  });

  it("enforces private game join rules", async () => {
    const createResp = await supertest(app)
      .post(`/api/game/create`)
      .send({
        auth: { username: "user1", password: "pwd1111" },
        payload: { gameKey: "nim", isPrivate: true },
      });
    expect(createResp.status).toBe(200);

    const gameId: string = createResp.body.gameId;

    const user0 = await getUserByUsername("user0");
    const user3 = await getUserByUsername("user3");

    expect(user0).not.toBeNull();
    expect(user3).not.toBeNull();

    // non-friend (user3) cannot join
    await expect(joinGame(gameId, { userId: user3!.userId, username: "user3" })).rejects.toThrow(
      "not authorized to join private game",
    );

    // friend (user0) can join private game created by user1
    await expect(
      joinGame(gameId, { userId: user0!.userId, username: "user0" }),
    ).resolves.toHaveProperty("gameId");
  });
});

describe("POST /api/game/list", () => {
  it("should return created games in reverse chronological order", async () => {
    response = await supertest(app).post(`/api/game/list`).send({ auth: auth3 });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([
      {
        type: "nim",
        status: "waiting",
        players: [{ username: "user1" }],
      },
      {
        type: "guess",
        status: "active",
        players: [
          { username: "user1" },
          { username: "user0" },
          { username: "user3" },
          { username: "user2" },
        ],
      },
      {
        type: "nim",
        status: "done",
        createdAt: new Date("2025-04-21").toISOString(),
        players: [{ username: "user2" }, { username: "user3" }],
      },
    ]);
  });
});
