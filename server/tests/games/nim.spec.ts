import { describe, expect, it } from "vitest";
import { nimLogic } from "../../src/games/nim.ts";

describe(`Nim's start() logic`, () => {
  it("Should always start a 2 player game with player 0, and should set START_NIM_OBJECTS to 21", () => {
    expect(nimLogic.start(2)).toStrictEqual({ remaining: 21, nextPlayer: 0, forfeits: false });
  });
});

describe(`Nim's update() logic`, () => {
  it("Should reject a poorly-typed move", () => {
    expect(nimLogic.update({ remaining: 4, nextPlayer: 0, forfeits: false }, null, 0)).toBeNull();
    expect(
      nimLogic.update({ remaining: 4, nextPlayer: 0, forfeits: false }, { type: "move" }, 0),
    ).toBeNull();
  });
  it("Should reject moves that are out of the range 1 to 3", () => {
    expect(
      nimLogic.update(
        { remaining: 4, nextPlayer: 0, forfeits: false },
        { type: "move", count: 0 },
        0,
      ),
    ).toBeNull();
    expect(
      nimLogic.update(
        { remaining: 4, nextPlayer: 0, forfeits: false },
        { type: "move", count: 4 },
        0,
      ),
    ).toBeNull();
  });
  it("Should reject moves that take more pieces than are still remaining", () => {
    expect(
      nimLogic.update(
        { remaining: 2, nextPlayer: 0, forfeits: false },
        { type: "move", count: 3 },
        0,
      ),
    ).toBeNull();
    expect(
      nimLogic.update(
        { remaining: 1, nextPlayer: 0, forfeits: false },
        { type: "move", count: 2 },
        0,
      ),
    ).toBeNull();
    expect(
      nimLogic.update(
        { remaining: 0, nextPlayer: 0, forfeits: false },
        { type: "move", count: 1 },
        0,
      ),
    ).toBeNull();
  });
  it("Should reject the wrong player moving", () => {
    expect(
      nimLogic.update(
        { remaining: 4, nextPlayer: 1, forfeits: false },
        { type: "move", count: 2 },
        0,
      ),
    ).toBeNull();
  });
  it("Should allow all the remaining pieces to be taken", () => {
    expect(
      nimLogic.update(
        { remaining: 3, nextPlayer: 0, forfeits: false },
        { type: "move", count: 3 },
        0,
      ),
    ).toStrictEqual({
      remaining: 0,
      nextPlayer: 1,
      forfeits: false,
    });
    expect(
      nimLogic.update(
        { remaining: 2, nextPlayer: 0, forfeits: false },
        { type: "move", count: 2 },
        0,
      ),
    ).toStrictEqual({
      remaining: 0,
      nextPlayer: 1,
      forfeits: false,
    });
    expect(
      nimLogic.update(
        { remaining: 1, nextPlayer: 0, forfeits: false },
        { type: "move", count: 1 },
        0,
      ),
    ).toStrictEqual({
      remaining: 0,
      nextPlayer: 1,
      forfeits: false,
    });
  });
  it("Should allow fewer than all the remaining pieces to be taken", () => {
    expect(
      nimLogic.update(
        { remaining: 15, nextPlayer: 1, forfeits: false },
        { type: "move", count: 3 },
        1,
      ),
    ).toStrictEqual({
      remaining: 12,
      nextPlayer: 0,
      forfeits: false,
    });
  });
  it("Should allow a player to forfeit mid-game", () => {
    expect(
      nimLogic.update({ remaining: 15, nextPlayer: 1, forfeits: false }, { type: "forfeit" }, 1),
    ).toStrictEqual({
      remaining: 15,
      nextPlayer: 0,
      forfeits: true,
    });
  });
  it("Should not allow a forfeit after another forfeit", () => {
    expect(
      nimLogic.update({ remaining: 15, nextPlayer: 1, forfeits: true }, { type: "forfeit" }, 1),
    ).toBeNull();
  });
  it("Should not allow a forfeit after there are no tokens left", () => {
    expect(
      nimLogic.update({ remaining: 0, nextPlayer: 1, forfeits: false }, { type: "forfeit" }, 1),
    ).toBeNull();
  });
  it("Should not allow a move after the game has been forfeited", () => {
    expect(
      nimLogic.update(
        { remaining: 15, nextPlayer: 1, forfeits: true },
        { type: "move", count: 3 },
        1,
      ),
    ).toBeNull();
  });
});

describe(`Nim's isDone() logic`, () => {
  it("Should say that a game with no objects left is done", () => {
    expect(nimLogic.isDone({ remaining: 0, nextPlayer: 0, forfeits: false })).toBe(true);
    expect(nimLogic.isDone({ remaining: 15, nextPlayer: 0, forfeits: false })).toBe(false);
  });
  it("Should say that a forfeited game is done", () => {
    expect(nimLogic.isDone({ remaining: 12, nextPlayer: 0, forfeits: true })).toBe(true);
  });
});

describe(`Nim's viewAs() logic`, () => {
  it("Should view games the same way regardless of who is viewing", () => {
    expect(nimLogic.viewAs({ remaining: 3, nextPlayer: 0, forfeits: false }, -1)).toStrictEqual({
      remaining: 3,
      nextPlayer: 0,
      forfeits: false,
    });
    expect(nimLogic.viewAs({ remaining: 3, nextPlayer: 0, forfeits: false }, 0)).toStrictEqual({
      remaining: 3,
      nextPlayer: 0,
      forfeits: false,
    });
    expect(nimLogic.viewAs({ remaining: 3, nextPlayer: 0, forfeits: false }, 1)).toStrictEqual({
      remaining: 3,
      nextPlayer: 0,
      forfeits: false,
    });
  });
});

describe(`Nim's tagView() logic`, () => {
  it("Should appropriately tag the view", () => {
    expect(nimLogic.tagView({ remaining: 3, nextPlayer: 0, forfeits: false })).toStrictEqual({
      type: "nim",
      view: { remaining: 3, nextPlayer: 0, forfeits: false },
    });
  });
});

describe(`Nim's describeMove() logic`, () => {
  const prevState = { remaining: 10, nextPlayer: 0, forfeits: false };

  it("Should describe a forfeit move", () => {
    expect(nimLogic.describeMove(prevState, prevState, { type: "forfeit" }, 0)).toBe(
      " forfeited the game",
    );
  });

  it("Should describe a move with no count as invalid", () => {
    expect(nimLogic.describeMove(prevState, prevState, { type: "move" }, 0)).toBe(" invalid move");
  });

  it("Should describe taking tokens when the game ends (remaining === 0)", () => {
    const newState = { remaining: 0, nextPlayer: 1, forfeits: false };
    expect(nimLogic.describeMove(prevState, newState, { type: "move", count: 1 }, 0)).toBe(
      " took one token and lost the game",
    );
  });

  it("Should describe taking one token without ending the game", () => {
    const newState = { remaining: 9, nextPlayer: 1, forfeits: false };
    expect(nimLogic.describeMove(prevState, newState, { type: "move", count: 1 }, 0)).toBe(
      " took one token, leaving 9",
    );
  });

  it("Should describe taking two tokens without ending the game", () => {
    const newState = { remaining: 8, nextPlayer: 1, forfeits: false };
    expect(nimLogic.describeMove(prevState, newState, { type: "move", count: 2 }, 0)).toBe(
      " took two tokens, leaving 8",
    );
  });

  it("Should describe taking three tokens without ending the game", () => {
    const newState = { remaining: 7, nextPlayer: 1, forfeits: false };
    expect(nimLogic.describeMove(prevState, newState, { type: "move", count: 3 }, 0)).toBe(
      " took three tokens, leaving 7",
    );
  });
});
