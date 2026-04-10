import { describe, it, expect, beforeEach } from "vitest";
import {
  createDirectMessage,
  getDirectMessageInfo,
  getDirectMessagesForUser,
  getOtherDirectMessageUser,
  addMessageToDirectMessage,
  markDirectMessageRead,
  markDmReadForBothIfExists,
} from "../../src/services/dm.service.ts";
import { createUser } from "../../src/services/user.service.ts";
import {
  sendFriendRequest,
  resolveRequest,
  getPendingRequests,
  removeFriend,
} from "../../src/services/friends.service.ts";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import {
  DirectMessageRepo,
  UserRepo,
  AuthRepo,
  FriendRepo,
  FriendRequestRepo,
  MessageRepo,
} from "../../src/repository.ts";

async function makeFriends(userA: string, userB: string): Promise<void> {
  await sendFriendRequest(userA, userB);
  const [req] = await getPendingRequests(userB);
  await resolveRequest(req.requestId, userB, "accept");
}

beforeEach(async () => {
  await DirectMessageRepo.clear();
  await UserRepo.clear();
  await AuthRepo.clear();
  await FriendRepo.clear();
  await FriendRequestRepo.clear();
  await MessageRepo.clear();

  await createUser("user1", "pwd1111", new Date());
  await createUser("user2", "pwd2222", new Date());
  await createUser("user3", "pwd3333", new Date());
});

// ─── createDirectMessage ──────────────────────────────────────────────────────

describe("createDirectMessage", () => {
  it("creates a new DM between friends and returns a dmId", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    expect(dmId).toBe("user1:user2");
  });

  it("returns the same dmId regardless of argument order", async () => {
    await makeFriends("user1", "user2");
    const dmId1 = await createDirectMessage("user1", "user2");
    const dmId2 = await createDirectMessage("user2", "user1");
    expect(dmId1).toBe(dmId2);
  });

  it("is idempotent – calling twice does not create a duplicate", async () => {
    await makeFriends("user1", "user2");
    const first = await createDirectMessage("user1", "user2");
    const second = await createDirectMessage("user1", "user2");
    expect(first).toBe(second);
  });

  it("throws if userA and userB are the same user", async () => {
    await expect(createDirectMessage("user1", "user1")).rejects.toThrow(
      "Cannot create DM with yourself",
    );
  });

  it("throws if the two users are not friends", async () => {
    await expect(createDirectMessage("user1", "user2")).rejects.toThrow(
      "Can only create DMs between friends",
    );
  });
});

// ─── getDirectMessageInfo ─────────────────────────────────────────────────────

describe("getDirectMessageInfo", () => {
  it("throws if the DM does not exist", async () => {
    await expect(getDirectMessageInfo("nonexistent:dmid", "user1")).rejects.toThrow(
      "Direct message not found",
    );
  });

  it("returns the dmId in the result", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.dmId).toBe(dmId);
  });

  it("returns correct otherUser when loggedInUser is userA", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.otherUser.username).toBe("user2");
  });

  it("returns correct otherUser when loggedInUser is userB", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const info = await getDirectMessageInfo(dmId, "user2");
    expect(info.otherUser.username).toBe("user1");
  });

  it("returns empty messages for a new DM", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.messages).toHaveLength(0);
  });

  it("returns unreadCount 0 for a new DM with no messages", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.unreadCount).toBe(0);
  });

  it("counts all messages from the other user as unread when lastReadAt is not set", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const user2 = await getUserByUsername("user2");
    const msgId = await MessageRepo.add({
      text: "hello",
      createdAt: new Date().toISOString(),
      createdBy: user2!.userId,
    });
    await addMessageToDirectMessage(dmId, msgId);
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.unreadCount).toBe(1);
  });

  it("does not count the logged-in user's own messages as unread", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const user1 = await getUserByUsername("user1");
    const msgId = await MessageRepo.add({
      text: "my own message",
      createdAt: new Date().toISOString(),
      createdBy: user1!.userId,
    });
    await addMessageToDirectMessage(dmId, msgId);
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.unreadCount).toBe(0);
  });

  it("returns unreadCount 0 after marking the DM as read", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const user2 = await getUserByUsername("user2");
    const msgId = await MessageRepo.add({
      text: "hello",
      createdAt: new Date().toISOString(),
      createdBy: user2!.userId,
    });
    await addMessageToDirectMessage(dmId, msgId);
    await markDirectMessageRead(dmId, "user1");
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.unreadCount).toBe(0);
  });
});

// ─── getDirectMessagesForUser ─────────────────────────────────────────────────

describe("getDirectMessagesForUser", () => {
  it("returns an empty array when the user has no DMs", async () => {
    const result = await getDirectMessagesForUser("user1");
    expect(result).toHaveLength(0);
  });

  it("returns a DM the user is involved in", async () => {
    await makeFriends("user1", "user2");
    await createDirectMessage("user1", "user2");
    const result = await getDirectMessagesForUser("user1");
    expect(result).toHaveLength(1);
  });

  it("returns the same DM from both participants' perspectives", async () => {
    await makeFriends("user1", "user2");
    await createDirectMessage("user1", "user2");
    const user1DMs = await getDirectMessagesForUser("user1");
    const user2DMs = await getDirectMessagesForUser("user2");
    expect(user1DMs).toHaveLength(1);
    expect(user2DMs).toHaveLength(1);
  });

  it("returns all DMs when a user has multiple friends", async () => {
    await makeFriends("user1", "user2");
    await makeFriends("user1", "user3");
    await createDirectMessage("user1", "user2");
    await createDirectMessage("user1", "user3");
    const result = await getDirectMessagesForUser("user1");
    expect(result).toHaveLength(2);
  });

  it("does not return DMs where the users are no longer friends", async () => {
    await makeFriends("user1", "user2");
    await createDirectMessage("user1", "user2");
    await removeFriend("user1", "user2");
    const result = await getDirectMessagesForUser("user1");
    expect(result).toHaveLength(0);
  });
});

// ─── getOtherDirectMessageUser ────────────────────────────────────────────────

describe("getOtherDirectMessageUser", () => {
  it("returns user2 when queried by user1", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const other = await getOtherDirectMessageUser(dmId, "user1");
    expect(other).toBe("user2");
  });

  it("returns user1 when queried by user2", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const other = await getOtherDirectMessageUser(dmId, "user2");
    expect(other).toBe("user1");
  });
});

// ─── addMessageToDirectMessage ────────────────────────────────────────────────

describe("addMessageToDirectMessage", () => {
  it("appends a message to the DM's messages array", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const user1 = await getUserByUsername("user1");
    const msgId = await MessageRepo.add({
      text: "hello",
      createdAt: new Date().toISOString(),
      createdBy: user1!.userId,
    });
    await addMessageToDirectMessage(dmId, msgId);
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.messages).toHaveLength(1);
    expect(info.messages[0].text).toBe("hello");
  });

  it("appends multiple messages in insertion order", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const user1 = await getUserByUsername("user1");
    for (const text of ["first", "second", "third"]) {
      const msgId = await MessageRepo.add({
        text,
        createdAt: new Date().toISOString(),
        createdBy: user1!.userId,
      });
      await addMessageToDirectMessage(dmId, msgId);
    }
    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.messages).toHaveLength(3);
    expect(info.messages[0].text).toBe("first");
    expect(info.messages[2].text).toBe("third");
  });
});

// ─── markDirectMessageRead ────────────────────────────────────────────────────

describe("markDirectMessageRead", () => {
  it("marks messages sent before the read time as read and later ones as unread", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const user2 = await getUserByUsername("user2");

    const oldMsgId = await MessageRepo.add({
      text: "old message",
      createdAt: new Date(Date.now() - 10_000).toISOString(),
      createdBy: user2!.userId,
    });
    await addMessageToDirectMessage(dmId, oldMsgId);

    await markDirectMessageRead(dmId, "user1");

    const newMsgId = await MessageRepo.add({
      text: "new message",
      createdAt: new Date(Date.now() + 10_000).toISOString(),
      createdBy: user2!.userId,
    });
    await addMessageToDirectMessage(dmId, newMsgId);

    const info = await getDirectMessageInfo(dmId, "user1");
    expect(info.unreadCount).toBe(1);
  });
});

// ─── markDmReadForBothIfExists ────────────────────────────────────────────────

describe("markDmReadForBothIfExists", () => {
  it("does nothing and does not throw if no DM exists between the two users", async () => {
    await expect(markDmReadForBothIfExists("user1", "user2")).resolves.toBeUndefined();
  });

  it("marks the DM as read for both users if it exists", async () => {
    await makeFriends("user1", "user2");
    const dmId = await createDirectMessage("user1", "user2");
    const user1 = await getUserByUsername("user1");
    const user2 = await getUserByUsername("user2");

    const msgFromUser2 = await MessageRepo.add({
      text: "from user2",
      createdAt: new Date().toISOString(),
      createdBy: user2!.userId,
    });
    const msgFromUser1 = await MessageRepo.add({
      text: "from user1",
      createdAt: new Date().toISOString(),
      createdBy: user1!.userId,
    });
    await addMessageToDirectMessage(dmId, msgFromUser2);
    await addMessageToDirectMessage(dmId, msgFromUser1);

    await markDmReadForBothIfExists("user1", "user2");

    const infoUser1 = await getDirectMessageInfo(dmId, "user1");
    const infoUser2 = await getDirectMessageInfo(dmId, "user2");
    expect(infoUser1.unreadCount).toBe(0);
    expect(infoUser2.unreadCount).toBe(0);
  });
});
