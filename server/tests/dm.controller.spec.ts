import { describe, expect, it, beforeEach, afterAll, afterEach, vi } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";
import { resetEverythingToDefaults } from "../src/initRepository.ts";
import { DirectMessageRepo } from "../src/repository.ts";
import type { GameServer, GameServerSocket } from "../src/types.ts";
import { logSocketError } from "../src/controllers/socket.controller.ts";
import {
  socketDirectMessageInbox,
  socketDirectMessageNew,
  socketDirectMessageDeleteMessage,
} from "../src/controllers/dm.controller.ts";

vi.mock("../src/controllers/socket.controller.ts", () => ({
  logSocketError: vi.fn(),
}));

let response: Response;

const auth0 = { username: "user0", password: "pwd0000" };
const auth1 = { username: "user1", password: "pwd1111" };
const authBad = { username: "user0", password: "wrongpassword" };

// Default friend relationships (from initRepository):
//   user0 <-> user1, user0 <-> user2, user0 <-> user3, user1 <-> user2
//   user1 and user3 are NOT friends; user2 and user3 are NOT friends

const MockGameServer = vi.fn(
  class {
    to = vi.fn(() => this);
    emit = vi.fn();
  },
);

const MockGameServerSocket = vi.fn(
  class {
    id = "test-socket";
    join = vi.fn();
    emit = vi.fn();
    to = vi.fn(() => this);
  },
);

const mockIo = new MockGameServer() as unknown as GameServer;
const mockSocket = new MockGameServerSocket() as unknown as GameServerSocket;

beforeEach(async () => {
  await DirectMessageRepo.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await resetEverythingToDefaults();
});

// ─── REST endpoint tests ──────────────────────────────────────────────────────

describe("GET /api/dms/:username", () => {
  it("should return an empty list when the user has no DMs", async () => {
    response = await supertest(app).get("/api/dms/user0");
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([]);
  });

  it("should return the DM after one is created", async () => {
    await supertest(app).post("/api/dms/user1").send({ auth: auth0 });

    response = await supertest(app).get("/api/dms/user0");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      otherUser: { username: "user1" },
      messages: [],
      unreadCount: 0,
    });
  });

  it("should return multiple DMs when multiple conversations exist", async () => {
    await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    await supertest(app).post("/api/dms/user2").send({ auth: auth0 });

    response = await supertest(app).get("/api/dms/user0");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe("POST /api/dms/:username", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app).post("/api/dms/user1").send({});
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad credentials", async () => {
    response = await supertest(app).post("/api/dms/user1").send({ auth: authBad });
    expect(response.status).toBe(403);
  });

  it("should return 400 when trying to DM yourself", async () => {
    response = await supertest(app).post("/api/dms/user0").send({ auth: auth0 });
    expect(response.status).toBe(400);
  });

  it("should return 400 when trying to DM a non-friend", async () => {
    response = await supertest(app).post("/api/dms/user3").send({ auth: auth1 });
    expect(response.status).toBe(400);
  });

  it("should successfully create a DM between friends and return DM info", async () => {
    response = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      otherUser: { username: "user1" },
      messages: [],
      unreadCount: 0,
    });
    expect(response.body.dmId).toBeDefined();
  });

  it("should return the same DM on repeated calls (idempotent)", async () => {
    const first = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    const second = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.dmId).toBe(second.body.dmId);
  });

  it("should return the same DM regardless of which user initiates", async () => {
    const fromUser0 = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    const fromUser1 = await supertest(app).post("/api/dms/user0").send({ auth: auth1 });

    expect(fromUser0.status).toBe(200);
    expect(fromUser1.status).toBe(200);
    expect(fromUser0.body.dmId).toBe(fromUser1.body.dmId);
  });
});

describe("POST /api/dms/:dmId/read", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app).post("/api/dms/some-dm-id/read").send({});
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad credentials", async () => {
    response = await supertest(app).post("/api/dms/some-dm-id/read").send({ auth: authBad });
    expect(response.status).toBe(403);
  });

  it("should successfully mark a DM as read and return null", async () => {
    const dmResponse = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    const { dmId } = dmResponse.body;

    response = await supertest(app).post(`/api/dms/${dmId}/read`).send({ auth: auth0 });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({});
  });

  it("should set unread count to 0 after marking as read", async () => {
    const dmResponse = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    const { dmId } = dmResponse.body;

    await supertest(app).post(`/api/dms/${dmId}/read`).send({ auth: auth0 });

    const dms = await supertest(app).get("/api/dms/user0");
    const dm = (dms.body as { dmId: string; unreadCount: number }[]).find((d) => d.dmId === dmId);
    expect(dm?.unreadCount).toBe(0);
  });
});

// ─── Socket handler tests ─────────────────────────────────────────────────────

describe("socketDirectMessageInbox", () => {
  it("should call logSocketError on bad auth", async () => {
    await socketDirectMessageInbox(mockSocket, mockIo)({ auth: authBad, payload: null });
    expect(logSocketError).toHaveBeenCalledOnce();
  });

  it("should join the inbox room for the authenticated user", async () => {
    await socketDirectMessageInbox(mockSocket, mockIo)({ auth: auth0, payload: null });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.join).toHaveBeenCalledExactlyOnceWith("inbox:user0");
  });
});

describe("socketDirectMessageNew", () => {
  it("should call logSocketError on bad auth", async () => {
    await socketDirectMessageNew(
      mockSocket,
      mockIo,
    )({
      auth: authBad,
      payload: { dmId: "user0:user1", text: "hello" },
    });
    expect(logSocketError).toHaveBeenCalledOnce();
  });

  it("should emit directMessageNew to both inboxes and directMessageNotify on success", async () => {
    const { body: dmBody } = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    const dmId: string = dmBody.dmId as string;

    await socketDirectMessageNew(
      mockSocket,
      mockIo,
    )({
      auth: auth0,
      payload: { dmId, text: "hello" },
    });

    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockIo.to).toHaveBeenCalledWith("inbox:user0");
    expect(mockIo.to).toHaveBeenCalledWith("inbox:user1");
    expect(mockIo.emit).toHaveBeenCalledWith("directMessageNew", expect.objectContaining({ dmId }));
    expect(mockIo.emit).toHaveBeenCalledWith(
      "directMessageNotify",
      expect.objectContaining({ dmId }),
    );
  });

  it("should call logSocketError when users are not friends", async () => {
    // user1 and user3 are not friends — inject a fake DM record between them
    await DirectMessageRepo.set("user1:user3", {
      userA: "user1",
      userB: "user3",
      messages: [],
      lastReadAt: {},
      createdAt: new Date().toISOString(),
    });

    await socketDirectMessageNew(
      mockSocket,
      mockIo,
    )({
      auth: auth1,
      payload: { dmId: "user1:user3", text: "hi" },
    });

    expect(logSocketError).toHaveBeenCalledOnce();
  });
});

describe("socketDirectMessageDeleteMessage", () => {
  it("should call logSocketError on bad auth", async () => {
    await socketDirectMessageDeleteMessage(
      mockSocket,
      mockIo,
    )({
      auth: authBad,
      payload: { dmId: "user0:user1", messageId: "fake-id" },
    });
    expect(logSocketError).toHaveBeenCalledOnce();
  });

  it("should emit directMessageDeleted to both inboxes on success", async () => {
    // Create DM and send a message so we have a real messageId
    const { body: dmBody } = await supertest(app).post("/api/dms/user1").send({ auth: auth0 });
    const dmId: string = dmBody.dmId as string;

    await socketDirectMessageNew(
      mockSocket,
      mockIo,
    )({
      auth: auth0,
      payload: { dmId, text: "to be deleted" },
    });

    // Retrieve the stored messageId directly from the repo
    const dmRecord = await DirectMessageRepo.get(dmId);
    const messageId: string = dmRecord.messages[0];

    vi.clearAllMocks();

    await socketDirectMessageDeleteMessage(
      mockSocket,
      mockIo,
    )({
      auth: auth0,
      payload: { dmId, messageId },
    });

    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockIo.to).toHaveBeenCalledWith("inbox:user0");
    expect(mockIo.to).toHaveBeenCalledWith("inbox:user1");
    expect(mockIo.emit).toHaveBeenCalledWith(
      "directMessageDeleted",
      expect.objectContaining({ dmId, messageId }),
    );
  });
});
