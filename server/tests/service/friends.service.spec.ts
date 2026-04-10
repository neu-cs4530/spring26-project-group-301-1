import { describe, it, expect, beforeEach } from "vitest";
import {
  sendFriendRequest,
  resolveRequest,
  getFriends,
  getPendingRequests,
  getFriendStatus,
  areFriends,
  removeFriend,
} from "../../src/services/friends.service.ts";
import { createUser } from "../../src/services/user.service.ts";
import { FriendRepo, FriendRequestRepo, UserRepo, AuthRepo } from "../../src/repository.ts";

beforeEach(async () => {
  await FriendRepo.clear();
  await FriendRequestRepo.clear();
  await UserRepo.clear();
  await AuthRepo.clear();

  await createUser("user1", "pwd1111", new Date());
  await createUser("user2", "pwd2222", new Date());
  await createUser("user3", "pwd3333", new Date());
});

describe("sendFriendRequest", () => {
  it("creates a pending request", async () => {
    await sendFriendRequest("user1", "user2");
    const requests = await getPendingRequests("user2");
    expect(requests).toHaveLength(1);
    expect(requests[0].from.username).toBe("user1");
    expect(requests[0].status).toBe("pending");
  });

  it("throws if sender and recipient are the same user", async () => {
    await expect(sendFriendRequest("user1", "user1")).rejects.toThrow(
      "Cannot add yourself as a friend",
    );
  });

  it("throws if a pending request already exists in the same direction", async () => {
    await sendFriendRequest("user1", "user2");
    await expect(sendFriendRequest("user1", "user2")).rejects.toThrow(
      "Friend Request Already Pending",
    );
  });

  it("throws if a pending request already exists in the reverse direction", async () => {
    await sendFriendRequest("user1", "user2");
    await expect(sendFriendRequest("user2", "user1")).rejects.toThrow(
      "Friend Request Already Pending",
    );
  });

  it("throws if users are already friends", async () => {
    await sendFriendRequest("user1", "user2");
    const requests = await getPendingRequests("user2");
    await resolveRequest(requests[0].requestId, "user2", "accept");
    await expect(sendFriendRequest("user1", "user2")).rejects.toThrow("Already friends");
  });
});

// ─── resolveRequest ───────────────────────────────────────────────────────────

describe("resolveRequest", () => {
  it("accepting a request makes the two users friends", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    expect(await areFriends("user1", "user2")).toBe(true);
  });

  it("declining a request does not make the two users friends", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "decline");
    expect(await areFriends("user1", "user2")).toBe(false);
  });

  it("throws if the caller is not the recipient", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await expect(resolveRequest(req.requestId, "user1", "accept")).rejects.toThrow(
      "Not authorised",
    );
  });

  it("throws if the request does not exist", async () => {
    await expect(resolveRequest("nonexistent-id", "user2", "accept")).rejects.toThrow(
      "Request not found",
    );
  });

  it("throws if the request is no longer pending", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    await expect(resolveRequest(req.requestId, "user2", "decline")).rejects.toThrow(
      "Request is no longer pending",
    );
  });
});

describe("getFriends", () => {
  it("returns an empty list if the user has no friends", async () => {
    expect(await getFriends("user1")).toHaveLength(0);
  });

  it("returns friends after a request is accepted", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");

    const user1Friends = await getFriends("user1");
    expect(user1Friends).toHaveLength(1);
    expect(user1Friends[0].user.username).toBe("user2");

    const user2Friends = await getFriends("user2");
    expect(user2Friends).toHaveLength(1);
    expect(user2Friends[0].user.username).toBe("user1");
  });

  it("does not return a user whose request was declined", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "decline");
    expect(await getFriends("user1")).toHaveLength(0);
  });

  it("returns an empty list for a user with no friends when other friendships exist", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    expect(await getFriends("user3")).toHaveLength(0);
  });

  it("skips records with missing usernames", async () => {
    await FriendRepo.set("malformed:key", {
      usernameA: "",
      usernameB: "user1",
      friendsSince: new Date().toISOString(),
    });
    expect(await getFriends("user1")).toHaveLength(0);
  });

  it("does not return a user after the friendship was deleted", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    await removeFriend("user1", "user2");
    expect(await getFriends("user1")).toHaveLength(0);

    await sendFriendRequest("user1", "user2");
    const [req1] = await getPendingRequests("user2");
    await resolveRequest(req1.requestId, "user2", "accept");
    await removeFriend("user2", "user1");
    expect(await getFriends("user1")).toHaveLength(0);
  });
});

describe("getPendingRequests", () => {
  it("returns only requests addressed to the given user", async () => {
    await sendFriendRequest("user1", "user2");
    await sendFriendRequest("user3", "user2");

    const user2Requests = await getPendingRequests("user2");
    expect(user2Requests).toHaveLength(2);

    const user1Requests = await getPendingRequests("user1");
    expect(user1Requests).toHaveLength(0);
  });

  it("does not return resolved requests", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    expect(await getPendingRequests("user2")).toHaveLength(0);
  });
});

describe("areFriends", () => {
  it("returns false for strangers", async () => {
    expect(await areFriends("user1", "user2")).toBe(false);
  });

  it("returns true regardless of argument order", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    expect(await areFriends("user1", "user2")).toBe(true);
    expect(await areFriends("user2", "user1")).toBe(true);
  });
});

describe("removeFriend", () => {
  it("removes an existing friendship", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");

    await removeFriend("user1", "user2");
    expect(await areFriends("user1", "user2")).toBe(false);
  });

  it("throws if the users are not friends", async () => {
    await expect(removeFriend("user1", "user2")).rejects.toThrow("Not friends");
  });
});

describe("getFriendStatus", () => {
  it("returns 'not-friends' for strangers", async () => {
    expect(await getFriendStatus("user1", "user2")).toBe("not-friends");
  });

  it("returns 'request-sent' for pending outgoing requests", async () => {
    await sendFriendRequest("user1", "user2");
    expect(await getFriendStatus("user1", "user2")).toBe("request-sent");
  });

  it("returns 'request-received' for pending incoming requests", async () => {
    await sendFriendRequest("user1", "user2");
    expect(await getFriendStatus("user2", "user1")).toBe("request-received");
  });

  it("returns 'friends' for accepted requests", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    expect(await getFriendStatus("user1", "user2")).toBe("friends");
    expect(await getFriendStatus("user2", "user1")).toBe("friends");
  });

  it("returns 'not-friends' and skips resolved requests for unrelated pairs", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    expect(await getFriendStatus("user3", "user1")).toBe("not-friends");
  });

  it("returns 'not-friends' when no pending request matches the queried pair", async () => {
    await sendFriendRequest("user1", "user2");
    expect(await getFriendStatus("user1", "user3")).toBe("not-friends");
  });

  it("returns 'friends' for accepted requests, ignoring pending requests", async () => {
    await sendFriendRequest("user1", "user2");
    const [req] = await getPendingRequests("user2");
    await resolveRequest(req.requestId, "user2", "accept");
    await sendFriendRequest("user3", "user2");
    expect(await getFriendStatus("user1", "user2")).toBe("friends");
    expect(await getFriendStatus("user2", "user1")).toBe("friends");
  });
});
