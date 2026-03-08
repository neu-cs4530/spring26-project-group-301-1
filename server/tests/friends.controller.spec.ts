import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";

let response: Response;

const auth0 = { username: "user0", password: "pwd0000" };
const auth1 = { username: "user1", password: "pwd1111" };
const authBad = { username: "user0", password: "wrongpassword" };

// ─── POST /api/friends/request ────────────────────────────────────────────────

describe("POST /api/friends/request", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app).post("/api/friends/request").send({
      auth: auth0,
      payload: {},
    });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: authBad,
        payload: { toUsername: "user1" },
      });
    expect(response.status).toBe(403);
  });

  it("should successfully send a friend request", async () => {
    response = await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user1" },
      });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ message: "Friend request sent" });
  });

  it("should return 409 if a pending request already exists", async () => {
    await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user1" },
      });
    response = await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user1" },
      });
    expect(response.status).toBe(409);
  });

  it("should return 409 if trying to friend yourself", async () => {
    response = await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user0" },
      });
    expect(response.status).toBe(409);
  });
});

// ─── POST /api/friends/request/:requestId/resolve ────────────────────────────

describe("POST /api/friends/request/:requestId/resolve", () => {
  it("should return 403 with bad auth", async () => {
    await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user1" },
      });
    const requests = await supertest(app)
      .post("/api/friends/user1/requests")
      .send({ auth: auth1, payload: {} });
    const requestId = requests.body[0].requestId;

    response = await supertest(app)
      .post(`/api/friends/request/${requestId}/resolve`)
      .send({ auth: authBad, payload: { requestId, action: "accept" } });
    expect(response.status).toBe(403);
  });

  it("should successfully accept a friend request", async () => {
    await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user1" },
      });
    const requests = await supertest(app).post("/api/friends/user1/requests").send({ auth: auth1 });
    const requestId = requests.body[0].requestId;

    response = await supertest(app)
      .post(`/api/friends/request/${requestId}/resolve`)
      .send({ auth: auth1, payload: { requestId, action: "accept" } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ message: "Request accepted" });
  });

  it("should successfully decline a friend request", async () => {
    await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user1" },
      });
    const requests = await supertest(app)
      .post("/api/friends/user1/requests")
      .send({ auth: auth1, payload: {} });
    const requestId = requests.body[0].requestId;

    response = await supertest(app)
      .post(`/api/friends/request/${requestId}/resolve`)
      .send({ auth: auth1, payload: { requestId, action: "decline" } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ message: "Request declined" });
  });
});

describe("GET /api/friends/:username", () => {
  it("should return an empty list for a user with no friends", async () => {
    response = await supertest(app).get("/api/friends/user0");
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([]);
  });

  it("should return friends after a request is accepted", async () => {
    await supertest(app)
      .post("/api/friends/request")
      .send({
        auth: auth0,
        payload: { toUsername: "user1" },
      });
    const requests = await supertest(app)
      .post("/api/friends/user1/requests")
      .send({ auth: auth1, payload: {} });
    const requestId = requests.body[0].requestId;
    await supertest(app)
      .post(`/api/friends/request/${requestId}/resolve`)
      .send({ auth: auth1, payload: { requestId, action: "accept" } });

    response = await supertest(app).get("/api/friends/user0");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([{ user: { username: "user1" } }]);
  });
});
