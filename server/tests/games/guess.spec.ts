import { describe, expect, it } from "vitest";
import { guessLogic } from "../../src/games/guess.ts";

describe(`Guessing game's start() logic`, () => {
  it("Should always start a game with the provided number of players", () => {
    expect(guessLogic.start(2)).toStrictEqual({
      secret: expect.anything(),
      guesses: [null, null],
      forfeits: [false, false],
    });
    expect(guessLogic.start(4)).toStrictEqual({
      secret: expect.anything(),
      guesses: [null, null, null, null],
      forfeits: [false, false, false, false],
    });
  });
});

describe(`Guessing game's update() logic`, () => {
  it("Should reject a poorly-typed move", () => {
    expect(
      guessLogic.update(
        { secret: expect.anything(), guesses: [null, null, null], forfeits: [false, false, false] },
        null,
        0,
      ),
    ).toBeNull();
    expect(
      guessLogic.update(
        { secret: expect.anything(), guesses: [null, null, null], forfeits: [false, false, false] },
        { type: "move" },
        0,
      ),
    ).toBeNull();
  });
  it("Should reject moves that are out of range 1 to 100", () => {
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, null], forfeits: [false, false, false] },
        { type: "move", guess: 0 },
        0,
      ),
    ).toBeNull();
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, null], forfeits: [false, false, false] },
        { type: "move", guess: 101 },
        0,
      ),
    ).toBeNull();
  });
  it("Forbids guessing twice", () => {
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, 22], forfeits: [false, false, false] },
        { type: "move", guess: 10 },
        2,
      ),
    ).toBeNull();
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, 22], forfeits: [false, false, false] },
        { type: "move", guess: 22 },
        2,
      ),
    ).toBeNull();
  });
  it("Should accept in-range moves and update the correct player", () => {
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, null], forfeits: [false, false, false] },
        { type: "move", guess: 10 },
        0,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [10, null, null],
      forfeits: [false, false, false],
    });
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, 90], forfeits: [false, false, false] },
        { type: "move", guess: 20 },
        1,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [null, 20, 90],
      forfeits: [false, false, false],
    });
    expect(
      guessLogic.update(
        { secret: 44, guesses: [99, 98, null], forfeits: [false, false, false] },
        { type: "move", guess: 20 },
        2,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [99, 98, 20],
      forfeits: [false, false, false],
    });
  });
  it("Should allow for a forfeit mid-game from any player", () => {
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, 5, null], forfeits: [false, false, false] },
        { type: "forfeit" },
        0,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [null, 5, null],
      forfeits: [true, false, false],
    });
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, 22], forfeits: [false, false, false] },
        { type: "forfeit" },
        1,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [null, null, 22],
      forfeits: [false, true, false],
    });
    expect(
      guessLogic.update(
        { secret: 44, guesses: [11, null, null], forfeits: [false, false, false] },
        { type: "forfeit" },
        2,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [11, null, null],
      forfeits: [false, false, true],
    });
  });
  it("Should allow for a forfeit from a second player", () => {
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, null, null], forfeits: [true, false, false] },
        { type: "forfeit" },
        2,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [null, null, null],
      forfeits: [true, false, true],
    });
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, 11, null], forfeits: [true, false, false] },
        { type: "forfeit" },
        2,
      ),
    ).toStrictEqual({
      secret: 44,
      guesses: [null, 11, null],
      forfeits: [true, false, true],
    });
  });
  it("Should not allow a player to forfeit after guessing", () => {
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, 11, null], forfeits: [true, false, false] },
        { type: "forfeit" },
        1,
      ),
    ).toBeNull();
  });
  it("Should not allow a player to guess after forfeiting", () => {
    expect(
      guessLogic.update(
        { secret: 44, guesses: [null, 11, null], forfeits: [true, false, false] },
        { type: "move", guess: 16 },
        0,
      ),
    ).toBeNull();
  });
});

describe(`Guessing game's isDone() logic`, () => {
  it("Should only claim to be done if everyone has guessed", () => {
    expect(
      guessLogic.isDone({
        secret: 44,
        guesses: [null, null, null],
        forfeits: [false, false, false],
      }),
    ).toBe(false);
    expect(
      guessLogic.isDone({ secret: 44, guesses: [null, 10, null], forfeits: [false, false, false] }),
    ).toBe(false);
    expect(
      guessLogic.isDone({ secret: 44, guesses: [30, null, null], forfeits: [false, false, false] }),
    ).toBe(false);
    expect(
      guessLogic.isDone({ secret: 44, guesses: [null, 99, 4], forfeits: [false, false, false] }),
    ).toBe(false);
    expect(
      guessLogic.isDone({ secret: 44, guesses: [3, 99, 4], forfeits: [false, false, false] }),
    ).toBe(true);
  });
  it("Should be done if all players have guessed or forfeited", () => {
    expect(
      guessLogic.isDone({
        secret: 44,
        guesses: [11, null, 2],
        forfeits: [false, true, false],
      }),
    ).toBe(true);
    expect(
      guessLogic.isDone({
        secret: 44,
        guesses: [11, null, null],
        forfeits: [false, true, true],
      }),
    ).toBe(true);
    expect(
      guessLogic.isDone({
        secret: 44,
        guesses: [null, 89, null],
        forfeits: [true, false, true],
      }),
    ).toBe(true);
  });
  it("Should not be over if not all players have either guessed or forfeited", () => {
    expect(
      guessLogic.isDone({
        secret: 44,
        guesses: [11, null, null, null],
        forfeits: [false, true, true, false],
      }),
    ).toBe(false);
  });
  it("Should be over if all players have forfeited", () => {
    expect(
      guessLogic.isDone({
        secret: 44,
        guesses: [null, null, null],
        forfeits: [true, true, true],
      }),
    ).toBe(true);
  });
});

describe(`Guessing game's viewAs() logic`, () => {
  it("Should include only who has guessed for anonymous viewers, unless finished", () => {
    expect(
      guessLogic.viewAs(
        { secret: 44, guesses: [null, null, 33], forfeits: [false, false, false] },
        -1,
      ),
    ).toStrictEqual({
      finished: false,
      guesses: [false, false, true],
      forfeits: [false, false, false],
    });
    expect(
      guessLogic.viewAs({ secret: 44, guesses: [1, 2, 33], forfeits: [false, false, false] }, -1),
    ).toStrictEqual({
      finished: true,
      secret: 44,
      guesses: [1, 2, 33],
      forfeits: [false, false, false],
    });
  });
  it("Should include the current player guess, if any, unless finished", () => {
    expect(
      guessLogic.viewAs({ secret: 44, guesses: [7, null, 33], forfeits: [false, false, false] }, 1),
    ).toStrictEqual({
      finished: false,
      guesses: [true, false, true],
      forfeits: [false, false, false],
    });
    expect(
      guessLogic.viewAs(
        { secret: 44, guesses: [null, null, 33], forfeits: [false, false, false] },
        2,
      ),
    ).toStrictEqual({
      finished: false,
      guesses: [false, false, true],
      myGuess: 33,
      forfeits: [false, false, false],
    });
    expect(
      guessLogic.viewAs({ secret: 44, guesses: [7, 6, 33], forfeits: [false, false, false] }, 0),
    ).toStrictEqual({
      finished: true,
      secret: 44,
      guesses: [7, 6, 33],
      forfeits: [false, false, false],
    });
  });
});

describe(`Guessing game's tagView() logic`, () => {
  it("Should appropriately tag the view", () => {
    expect(
      guessLogic.tagView({
        finished: true,
        secret: 12,
        guesses: [1, 2, 3],
        forfeits: [false, false, false],
      }),
    ).toStrictEqual({
      type: "guess",
      view: { finished: true, secret: 12, guesses: [1, 2, 3], forfeits: [false, false, false] },
    });
  });
});

describe(`Guessing game's describeMove() logic`, () => {
  it("Should return ' made a guess' for a mid-game regular guess", () => {
    expect(
      guessLogic.describeMove(
        { secret: 44, guesses: [null, null], forfeits: [false, false] },
        { secret: 44, guesses: [10, null], forfeits: [false, false] },
        { type: "move", guess: 10 },
        0,
      ),
    ).toBe(" made a guess");
  });
  it("Should return ' forfeited' for a mid-game forfeit", () => {
    expect(
      guessLogic.describeMove(
        { secret: 44, guesses: [null, null], forfeits: [false, false] },
        { secret: 44, guesses: [null, null], forfeits: [true, false] },
        { type: "forfeit" },
        1,
      ),
    ).toBe(" forfeited");
  });
  it("Should reveal the guess and secret when the last guess completes the game", () => {
    expect(
      guessLogic.describeMove(
        { secret: 44, guesses: [10, null], forfeits: [false, false] },
        { secret: 44, guesses: [10, 30], forfeits: [false, false] },
        { type: "move", guess: 30 },
        0,
      ),
    ).toBe(" guessed 30 — the secret was 44!");
  });
  it("Should hit the allMoved branch when the last forfeit completes the game", () => {
    expect(
      guessLogic.describeMove(
        { secret: 44, guesses: [10, null], forfeits: [false, false] },
        { secret: 44, guesses: [10, null], forfeits: [false, true] },
        { type: "forfeit" },
        1,
      ),
    ).toBe(" forfeited — the secret was 44!");
  });
});
