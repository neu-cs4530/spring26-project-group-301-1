import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import * as friendsService from "../src/services/friends.service.ts";
import * as authService from "../src/services/auth.service.ts";
import { type UserWithId } from "../src/types.ts";
import { type FriendInfo, type FriendRequestInfo, type SafeUserInfo } from "@gamenite/shared";

vi.mock("../src/services/friends.service.ts", () => ({
  getFriends: vi.fn(),
  getPendingRequests: vi.fn(),
  sendFriendRequest: vi.fn(),
  resolveRequest: vi.fn(),
  removeFriend: vi.fn(),
  getFriendStatus: vi.fn(),
}));

vi.mock("../src/services/auth.service.ts", () => ({
  checkAuth: vi.fn(),
}));

const mockUser: SafeUserInfo = {
  username: "user1",
  display: "User One",
  createdAt: new Date("2026-01-01"),
  hideUsername: false,
  profileLinks: [],
  privateProfile: false,
};

const mockUser2: SafeUserInfo = {
  username: "user2",
  display: "User Two",
  createdAt: new Date("2026-01-01"),
  hideUsername: false,
  profileLinks: [],
  privateProfile: false,
};

const mockCaller: UserWithId = { username: "user1", userId: "user1" };
const validAuth = { username: "user1", password: "pwd1111" };

const mockFriend: FriendInfo = {
  user: mockUser2,
  friendsSince: new Date("2025-01-01"),
};

const mockRequest: FriendRequestInfo = {
  requestId: "r1",
  from: mockUser,
  to: mockUser2,
  status: "pending",
  createdAt: new Date("2025-01-01"),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/friends/:username", () => {
  it("returns the friends list for the given username", async () => {
    vi.mocked(friendsService.getFriends).mockResolvedValue([mockFriend]);

    const { status, body } = await request(app).get("/api/friends/user1");

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
  });
});

describe("POST /api/friends/:username/requests", () => {
  it("returns pending requests for an authenticated user", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.getPendingRequests).mockResolvedValue([mockRequest]);

    const { status, body } = await request(app)
      .post("/api/friends/user1/requests")
      .send({ auth: validAuth });

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
  });

  it("returns 400 when the auth body is missing", async () => {
    const { status, body } = await request(app).post("/api/friends/user1/requests").send({});

    expect(status).toBe(400);
    expect(body.error).toBe("Poorly-formed request");
  });

  it("returns 403 when the caller is a different user", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue({ username: "user2", userId: "user2" });

    const { status } = await request(app)
      .post("/api/friends/user1/requests")
      .send({ auth: validAuth });

    expect(status).toBe(403);
  });

  it("returns 403 when auth is invalid", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const { status } = await request(app)
      .post("/api/friends/user1/requests")
      .send({ auth: validAuth });

    expect(status).toBe(403);
  });
});

describe("POST /api/friends/request", () => {
  it("sends a friend request and returns 200", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.sendFriendRequest).mockResolvedValue(undefined);

    const { status, body } = await request(app)
      .post("/api/friends/request")
      .send({ auth: validAuth, payload: { toUsername: "user2" } });

    expect(status).toBe(200);
    expect(body.message).toBe("Friend request sent");
  });

  it("returns 400 when the body is malformed", async () => {
    const { status } = await request(app).post("/api/friends/request").send({});

    expect(status).toBe(400);
  });

  it("returns 403 when auth is invalid", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const { status } = await request(app)
      .post("/api/friends/request")
      .send({ auth: validAuth, payload: { toUsername: "user2" } });

    expect(status).toBe(403);
  });

  it("returns 409 when sendFriendRequest throws", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.sendFriendRequest).mockRejectedValue(new Error("Already friends"));

    const { status, body } = await request(app)
      .post("/api/friends/request")
      .send({ auth: validAuth, payload: { toUsername: "user2" } });

    expect(status).toBe(409);
    expect(body.error).toBe("Failed to send friend request");
  });
});

describe("POST /api/friends/request/:requestId/resolve", () => {
  it("accepts a request and returns the confirmation message", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.resolveRequest).mockResolvedValue(undefined);

    const { status, body } = await request(app)
      .post("/api/friends/request/req-1/resolve")
      .send({ auth: validAuth, payload: { action: "accept" } });

    expect(status).toBe(200);
    expect(body.message).toBe("Request accepted");
  });

  it("declines a request and returns the confirmation message", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.resolveRequest).mockResolvedValue(undefined);

    const { body } = await request(app)
      .post("/api/friends/request/req-1/resolve")
      .send({ auth: validAuth, payload: { action: "decline" } });

    expect(body.message).toBe("Request declined");
  });

  it("returns 400 when the body is malformed", async () => {
    const { status } = await request(app).post("/api/friends/request/req-1/resolve").send({});

    expect(status).toBe(400);
  });

  it("returns 403 when auth is invalid", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const { status } = await request(app)
      .post("/api/friends/request/req-1/resolve")
      .send({ auth: validAuth, payload: { action: "accept" } });

    expect(status).toBe(403);
  });

  it("returns 400 when resolveRequest throws", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.resolveRequest).mockRejectedValue(new Error("Not authorised"));

    const { status, body } = await request(app)
      .post("/api/friends/request/req-1/resolve")
      .send({ auth: validAuth, payload: { action: "accept" } });

    expect(status).toBe(400);
    expect(body.error).toBe("Failed to resolve friend request");
  });
});

describe("POST /api/friends/remove", () => {
  it("removes a friend and returns 200", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.removeFriend).mockResolvedValue(undefined);

    const { status, body } = await request(app)
      .post("/api/friends/remove")
      .send({ auth: validAuth, payload: { friendUsername: "user2" } });

    expect(status).toBe(200);
    expect(body.message).toBe("Friend removed");
  });

  it("returns 400 when the body is malformed", async () => {
    const { status } = await request(app).post("/api/friends/remove").send({});

    expect(status).toBe(400);
  });

  it("returns 403 when auth is invalid", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const { status } = await request(app)
      .post("/api/friends/remove")
      .send({ auth: validAuth, payload: { friendUsername: "user2" } });

    expect(status).toBe(403);
  });

  it("returns 400 when removeFriend throws", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.removeFriend).mockRejectedValue(new Error("Not friends"));

    const { status, body } = await request(app)
      .post("/api/friends/remove")
      .send({ auth: validAuth, payload: { friendUsername: "user2" } });

    expect(status).toBe(400);
    expect(body.error).toBe("Failed to remove friend");
  });
});

describe("POST /api/friends/:username/status", () => {
  it("returns the friendship status", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(friendsService.getFriendStatus).mockResolvedValue("friends");

    const { status, body } = await request(app)
      .post("/api/friends/user2/status")
      .send({ auth: validAuth });

    expect(status).toBe(200);
    expect(body.status).toBe("friends");
  });

  it("returns 400 when the body is malformed", async () => {
    const { status } = await request(app).post("/api/friends/user2/status").send({});

    expect(status).toBe(400);
  });

  it("returns 403 when auth is invalid", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const { status } = await request(app)
      .post("/api/friends/user2/status")
      .send({ auth: validAuth });

    expect(status).toBe(403);
  });
});
