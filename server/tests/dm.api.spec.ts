import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import * as dmService from "../src/services/dm.service.ts";
import * as authService from "../src/services/auth.service.ts";
import { type UserWithId } from "../src/types.ts";
import { type DirectMessageInfo, type SafeUserInfo } from "@gamenite/shared";

vi.mock("../src/services/dm.service.ts", () => ({
  getDirectMessagesForUser: vi.fn(),
  createDirectMessage: vi.fn(),
  getDirectMessageInfo: vi.fn(),
  markDirectMessageRead: vi.fn(),
}));

vi.mock("../src/services/auth.service.ts", () => ({
  checkAuth: vi.fn(),
}));

const mockOtherUser: SafeUserInfo = {
  username: "user2",
  display: "User Two",
  createdAt: new Date("2026-01-01"),
  hideUsername: false,
  profileLinks: [],
  privateProfile: false,
};

const mockCaller: UserWithId = { username: "user1", userId: "user1" };
const validAuth = { username: "user1", password: "pwd1111" };

const mockDmInfo: DirectMessageInfo = {
  dmId: "user1:user2",
  otherUser: mockOtherUser,
  messages: [],
  unreadCount: 0,
  createdAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/dms/:username", () => {
  it("returns the DM list for the given username", async () => {
    vi.mocked(dmService.getDirectMessagesForUser).mockResolvedValue([mockDmInfo]);

    const { status, body } = await request(app).get("/api/dms/user1");

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
  });

  it("returns an empty list when the user has no DMs", async () => {
    vi.mocked(dmService.getDirectMessagesForUser).mockResolvedValue([]);

    const { status, body } = await request(app).get("/api/dms/user1");

    expect(status).toBe(200);
    expect(body).toStrictEqual([]);
  });
});

describe("POST /api/dms/:username", () => {
  it("creates or retrieves a DM and returns DM info", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(dmService.createDirectMessage).mockResolvedValue("user1:user2");
    vi.mocked(dmService.getDirectMessageInfo).mockResolvedValue(mockDmInfo);

    const { status, body } = await request(app).post("/api/dms/user2").send({ auth: validAuth });

    expect(status).toBe(200);
    expect(body).toMatchObject({ dmId: "user1:user2", unreadCount: 0 });
  });

  it("returns 400 when the body is malformed", async () => {
    const { status, body } = await request(app).post("/api/dms/user2").send({});

    expect(status).toBe(400);
    expect(body.error).toBe("Poorly-formed request");
  });

  it("returns 403 when auth is invalid", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const { status } = await request(app).post("/api/dms/user2").send({ auth: validAuth });

    expect(status).toBe(403);
  });

  it("returns 400 when createDirectMessage throws (e.g. not friends, self-DM)", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(dmService.createDirectMessage).mockRejectedValue(
      new Error("Can only create DMs between friends"),
    );

    const { status, body } = await request(app).post("/api/dms/user2").send({ auth: validAuth });

    expect(status).toBe(400);
    expect(body.error).toBe("Unable to obtain direct message");
  });
});

describe("POST /api/dms/:dmId/read", () => {
  it("marks a DM as read and returns null", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(mockCaller);
    vi.mocked(dmService.markDirectMessageRead).mockResolvedValue(undefined);

    const { status, body } = await request(app)
      .post("/api/dms/user1:user2/read")
      .send({ auth: validAuth });

    expect(status).toBe(200);
    expect(body).toStrictEqual({});
  });

  it("returns 400 when the body is malformed", async () => {
    const { status, body } = await request(app).post("/api/dms/user1:user2/read").send({});

    expect(status).toBe(400);
    expect(body.error).toBe("Poorly-formed request");
  });

  it("returns 403 when auth is invalid", async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const { status } = await request(app)
      .post("/api/dms/user1:user2/read")
      .send({ auth: validAuth });

    expect(status).toBe(403);
  });
});
