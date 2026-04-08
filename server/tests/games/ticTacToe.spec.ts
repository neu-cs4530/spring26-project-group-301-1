import { describe, expect, it } from "vitest";
import { ticTacToeLogic } from "../../src/games/ticTacToe.ts";
import { type TicTacToeView } from "@gamenite/shared";

describe(`Tic Tac Toe's start() logic`, () => {
  it("Should always start a 2 player game with player 1, and should return an empty board", () => {
    expect(ticTacToeLogic.start(2)).toStrictEqual({
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      nextPlayer: 1,
      forfeited: false,
    });
  });
});

describe(`Tic Tac Toe's update() logic`, () => {
  it("Should reject poorly-typed move", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { posn: 5 },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        null,
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["X", null, null],
            [null, "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", x: 10 },
        1,
      ),
    ).toStrictEqual(null);
  });

  it("Should reject difficulty selection moves", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", difficulty: "minimax" },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, "X"],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", difficulty: "random" },
        1,
      ),
    ).toStrictEqual(null);
  });

  it("Should reject a move with out-of-bounds coordinates", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [11, 2] },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["X", null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [1, 8] },
        0,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [-4, 2] },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, "X", null],
            [null, "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [0, -5] },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [-1, -4] },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [11, 21] },
        1,
      ),
    ).toStrictEqual(null);
  });

  it("Should accept a valid starting move and place the correct symbol for entry", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [0, 0] },
        1,
      ),
    ).toStrictEqual({
      board: [
        ["X", null, null],
        [null, null, null],
        [null, null, null],
      ],
      nextPlayer: 0,
      forfeited: false,
    });
  });

  it("Should accept a valid second move", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["X", null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [0, 1] },
        0,
      ),
    ).toStrictEqual({
      board: [
        ["X", "O", null],
        [null, null, null],
        [null, null, null],
      ],
      nextPlayer: 1,
      forfeited: false,
    });
  });

  it("Should reject a move which attempts to overwrite an existing move", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, "X", null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [0, 1] },
        0,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, "X", null],
            ["O", null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [1, 0] },
        1,
      ),
    ).toStrictEqual(null);
  });

  it("Should reject a move from the wrong player", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, "X", null],
            ["O", null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [1, 1] },
        0,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            [null, "X", null],
            ["O", "X", null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [1, 2] },
        1,
      ),
    ).toStrictEqual(null);
  });

  it("Should reject a move if the board is full", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", "O"],
            ["O", "X", "O"],
            ["X", "O", "X"],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [1, 2] },
        0,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", "O"],
            ["O", "X", "O"],
            ["X", "O", "X"],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [0, 0] },
        1,
      ),
    ).toStrictEqual(null);
  });

  it("Should reject a move if the game is over", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", null],
            [null, "X", null],
            [null, "X", "O"],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [1, 0] },
        0,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", "X"],
            [null, "O", null],
            [null, "X", "O"],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [2, 0] },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", null],
            [null, "X", null],
            [null, "X", "O"],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [1, 0] },
        1,
      ),
    ).toStrictEqual(null);

    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", "X"],
            [null, "O", null],
            [null, "X", "O"],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [2, 0] },
        0,
      ),
    ).toStrictEqual(null);
  });

  it("Should accept a forfeit mid-game", () => {
    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", "X"],
            [null, "O", null],
            [null, "X", null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "forfeit" },
        1,
      ),
    ).toStrictEqual({
      board: [
        ["O", "X", "X"],
        [null, "O", null],
        [null, "X", null],
      ],
      nextPlayer: 0,
      forfeited: true,
    });
  });

  it("Should reject a forfeit after the game is over", () => {
    // over by win
    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", "X"],
            [null, "O", null],
            [null, "X", "O"],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "forfeit" },
        0,
      ),
    ).toBeNull();
    // over by forfeit
    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", null, "X"],
            [null, "O", null],
            [null, "X", null],
          ],
          nextPlayer: 0,
          forfeited: true,
        },
        { type: "forfeit" },
        0,
      ),
    ).toBeNull();
    // by draw
    expect(
      ticTacToeLogic.update(
        {
          board: [
            ["O", "X", "X"],
            ["X", "O", "O"],
            ["O", "X", "X"],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "forfeit" },
        0,
      ),
    ).toBeNull();
  });
});

describe(`Tic Tac Toe's isDone() logic`, () => {
  it("Game should not be over if board is empty", () => {
    expect(
      ticTacToeLogic.isDone({
        board: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(false);
  });

  it("Game should not be over after the first move", () => {
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", null, null],
          [null, null, null],
          [null, null, null],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(false);
  });

  it("Should properly detect that a full board with no wins is still over", () => {
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", "X"],
          ["O", "X", "X"],
          ["O", "X", "O"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);
  });

  it("Should properly detect a full board with a win as over", () => {
    // Note that this is only relevant for player 1, who goes first. It is
    // not possible for player 0 to win with a full board, as they go second.

    // LtoR diagonal (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", "O"],
          ["X", "X", "O"],
          ["X", "O", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // RtoL diagonal (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["O", "O", "X"],
          ["X", "X", "O"],
          ["X", "O", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // row 1 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          [null, "O", null],
          ["X", "X", "X"],
          [null, null, "O"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // row 2 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          [null, "O", null],
          [null, "O", null],
          ["X", "X", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // column 0 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // column 1 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["O", "X", "O"],
          [null, "X", null],
          [null, "X", null],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // column 2 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", "X"],
          ["O", null, "X"],
          [null, "O", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);
  });

  it("Should detect all valid wins when the board is not full", () => {
    // LtoR diagonal (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", null],
          [null, "X", null],
          [null, "O", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // LtoR diagonal (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["O", "X", "X"],
          [null, "O", null],
          [null, "X", "O"],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(true);

    // RtoL diagonal (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          [null, "O", "X"],
          [null, "X", "O"],
          ["X", "O", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // RtoL diagonal (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "X", "O"],
          [null, "O", null],
          ["O", null, "X"],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(true);

    // row 0 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "X", "X"],
          ["O", "O", null],
          [null, null, null],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // row 0 victory (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["O", "O", "O"],
          [null, "X", null],
          [null, "X", "X"],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(true);

    // row 1 victory (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "X", null],
          ["O", "O", "O"],
          [null, null, "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // row 1 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          [null, "O", null],
          ["X", "X", "X"],
          [null, null, "O"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // row 2 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          [null, "O", null],
          [null, "O", null],
          ["X", "X", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // row 2 victory (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", null, "X"],
          [null, "X", null],
          ["O", "O", "O"],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(true);

    // column 0 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // column 0 victory (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["O", null, "X"],
          ["O", "X", null],
          ["O", null, "X"],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(true);

    // column 1 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["O", "X", "O"],
          [null, "X", null],
          [null, "X", null],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // column 1 victory (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", "X"],
          [null, "O", null],
          [null, "O", "X"],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(true);

    // column 2 victory (X)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "O", "X"],
          ["O", null, "X"],
          [null, "O", "X"],
        ],
        nextPlayer: 0,
        forfeited: false,
      }),
    ).toBe(true);

    // column 2 victory (O)
    expect(
      ticTacToeLogic.isDone({
        board: [
          ["X", "X", "O"],
          [null, null, "O"],
          [null, "X", "O"],
        ],
        nextPlayer: 1,
        forfeited: false,
      }),
    ).toBe(true);
  });
});

describe(`Tic Tac Toe's viewAs() logic`, () => {
  function coordInWinningEntry(
    entry: [[number, number], [number, number], [number, number]],
    coord: [number, number],
  ) {
    for (let i = 0; i < entry.length; i += 1) {
      if (entry[i][0] === coord[0] && entry[i][1] === coord[1]) return true;
    }
    return false;
  }

  it("Should return the same view regardless of who is viewing", () => {
    expect(
      ticTacToeLogic.viewAs(
        {
          board: [
            ["X", "O", null],
            ["O", null, "O"],
            ["X", "X", null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        0,
      ),
    ).toStrictEqual({
      board: [
        ["X", "O", null],
        ["O", null, "O"],
        ["X", "X", null],
      ],
      nextPlayer: 1,
      winningEntry: null,
      forfeited: false,
      opponentTypeSelected: true,
    });

    expect(
      ticTacToeLogic.viewAs(
        {
          board: [
            ["X", "O", null],
            ["O", null, "O"],
            ["X", "X", null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        1,
      ),
    ).toStrictEqual({
      board: [
        ["X", "O", null],
        ["O", null, "O"],
        ["X", "X", null],
      ],
      nextPlayer: 1,
      winningEntry: null,
      forfeited: false,
      opponentTypeSelected: true,
    });
  });

  it("Should not return a winning entry when the game is not over", () => {
    expect(
      ticTacToeLogic.viewAs(
        {
          board: [
            ["X", "O", null],
            ["O", null, "O"],
            ["X", "X", null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        0,
      ),
    ).toStrictEqual({
      board: [
        ["X", "O", null],
        ["O", null, "O"],
        ["X", "X", null],
      ],
      nextPlayer: 1,
      winningEntry: null,
      forfeited: false,
      opponentTypeSelected: true,
    });
  });

  it("Should return a valid winning entry for player 1 when the game is over", () => {
    const testView: TicTacToeView = ticTacToeLogic.viewAs(
      {
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 0,
        forfeited: false,
      },
      0,
    );

    expect(testView.board).toStrictEqual([
      ["X", "O", null],
      ["X", null, "O"],
      ["X", null, null],
    ]);
    expect(testView.nextPlayer).toStrictEqual(0);

    const winEntryCorrect: boolean =
      testView.winningEntry !== null &&
      coordInWinningEntry(testView.winningEntry, [0, 0]) &&
      coordInWinningEntry(testView.winningEntry, [1, 0]) &&
      coordInWinningEntry(testView.winningEntry, [2, 0]);

    expect(winEntryCorrect).toStrictEqual(true);
  });

  it("Should return a valid winning diagonal entry for player 0 when the game is over", () => {
    const testView: TicTacToeView = ticTacToeLogic.viewAs(
      {
        board: [
          ["X", "X", "O"],
          ["X", "O", "X"],
          ["O", "X", null],
        ],
        nextPlayer: 1,
        forfeited: false,
      },
      1,
    );

    expect(testView.board).toStrictEqual([
      ["X", "X", "O"],
      ["X", "O", "X"],
      ["O", "X", null],
    ]);
    expect(testView.nextPlayer).toStrictEqual(1);

    const winEntryCorrect: boolean =
      testView.winningEntry !== null &&
      coordInWinningEntry(testView.winningEntry, [0, 2]) &&
      coordInWinningEntry(testView.winningEntry, [1, 1]) &&
      coordInWinningEntry(testView.winningEntry, [2, 0]);

    expect(winEntryCorrect).toStrictEqual(true);
  });

  it("Should return a valid winning row entry for player 0 when the game is over", () => {
    const testView: TicTacToeView = ticTacToeLogic.viewAs(
      {
        board: [
          ["X", "X", "O"],
          ["O", "O", "O"],
          ["X", "X", null],
        ],
        nextPlayer: 1,
        forfeited: false,
      },
      1,
    );

    expect(testView.board).toStrictEqual([
      ["X", "X", "O"],
      ["O", "O", "O"],
      ["X", "X", null],
    ]);
    expect(testView.nextPlayer).toStrictEqual(1);

    const winEntryCorrect: boolean =
      testView.winningEntry !== null &&
      coordInWinningEntry(testView.winningEntry, [1, 0]) &&
      coordInWinningEntry(testView.winningEntry, [1, 1]) &&
      coordInWinningEntry(testView.winningEntry, [1, 2]);

    expect(winEntryCorrect).toStrictEqual(true);
  });

  it("Should return a valid winning row entry for player 1 when the game is over", () => {
    const testView: TicTacToeView = ticTacToeLogic.viewAs(
      {
        board: [
          ["X", "X", "X"],
          ["O", "O", null],
          [null, null, "O"],
        ],
        nextPlayer: 0,
        forfeited: false,
      },
      1,
    );

    expect(testView.board).toStrictEqual([
      ["X", "X", "X"],
      ["O", "O", null],
      [null, null, "O"],
    ]);
    expect(testView.nextPlayer).toStrictEqual(0);

    const winEntryCorrect: boolean =
      testView.winningEntry !== null &&
      coordInWinningEntry(testView.winningEntry, [0, 0]) &&
      coordInWinningEntry(testView.winningEntry, [0, 1]) &&
      coordInWinningEntry(testView.winningEntry, [0, 2]);

    expect(winEntryCorrect).toStrictEqual(true);
  });

  it("Should return a valid winning entry when multiple exists for player 1", () => {
    const testView: TicTacToeView = ticTacToeLogic.viewAs(
      {
        board: [
          ["X", "O", "X"],
          ["X", "X", "O"],
          ["X", "O", "O"],
        ],
        nextPlayer: 1,
        forfeited: false,
      },
      1,
    );

    expect(testView.board).toStrictEqual([
      ["X", "O", "X"],
      ["X", "X", "O"],
      ["X", "O", "O"],
    ]);
    expect(testView.nextPlayer).toStrictEqual(1);

    const winEntryOneInReturn: boolean =
      testView.winningEntry !== null &&
      coordInWinningEntry(testView.winningEntry, [0, 0]) &&
      coordInWinningEntry(testView.winningEntry, [1, 0]) &&
      coordInWinningEntry(testView.winningEntry, [2, 0]);
    const winEntryTwoInReturn: boolean =
      testView.winningEntry !== null &&
      coordInWinningEntry(testView.winningEntry, [0, 2]) &&
      coordInWinningEntry(testView.winningEntry, [1, 1]) &&
      coordInWinningEntry(testView.winningEntry, [2, 0]);

    expect(winEntryOneInReturn || winEntryTwoInReturn).toStrictEqual(true);
  });
});

describe(`Tic Tac Toe's describeMove() logic`, () => {
  it("Should describe a normal move in the middle of the game", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        {
          board: [
            ["X", null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [0, 0] },
        1,
      ),
    ).toBe(" moved at (0, 0)");
  });

  it("Should describe a move at a non-origin position", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["X", null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        {
          board: [
            ["X", "O", null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [0, 1] },
        0,
      ),
    ).toBe(" moved at (0, 1)");
  });

  it("Should describe a difficulty selection move as invalid", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["X", "X", null],
            ["O", "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        {
          board: [
            ["X", "X", "X"],
            ["O", "O", null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", difficulty: "minimax" },
        1,
      ),
    ).toBe(" made an illegal move");
  });

  it("Should describe a winning row move", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["X", "X", null],
            ["O", "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        {
          board: [
            ["X", "X", "X"],
            ["O", "O", null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [0, 2] },
        1,
      ),
    ).toBe(" moved at (0, 2) and won the game");
  });

  it("Should describe a winning column move", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["X", "O", null],
            ["X", "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        {
          board: [
            ["X", "O", null],
            ["X", "O", null],
            ["X", null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [2, 0] },
        1,
      ),
    ).toBe(" moved at (2, 0) and won the game");
  });

  it("Should describe a winning diagonal move", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["O", "X", "X"],
            ["X", "O", null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        {
          board: [
            ["O", "X", "X"],
            ["X", "O", null],
            [null, null, "O"],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move", coord: [2, 2] },
        0,
      ),
    ).toBe(" moved at (2, 2) and won the game");
  });

  it('Should say "ended the game in a draw" on the last move of a draw (full board, no winner)', () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["X", "O", "X"],
            ["X", "O", "O"],
            ["O", "X", null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        {
          board: [
            ["X", "O", "X"],
            ["X", "O", "O"],
            ["O", "X", "X"],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        { type: "move", coord: [2, 2] },
        1,
      ),
    ).toBe(" moved at (2, 2) and ended the game in a draw");
  });

  it("Should describe a forfeit", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["O", "X", "X"],
            ["X", "O", null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        {
          board: [
            ["O", "X", "X"],
            ["X", "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "forfeit" },
        0,
      ),
    ).toBe(" forfeited the game");
  });

  it("Should describe an invalid move", () => {
    expect(
      ticTacToeLogic.describeMove(
        {
          board: [
            ["O", "X", "X"],
            ["X", "O", null],
            [null, null, null],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        {
          board: [
            ["O", "X", "X"],
            ["X", "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        { type: "move" },
        0,
      ),
    ).toBe(" made an invalid move");
  });
});

describe(`Tic Tac Toe's tagView() logic`, () => {
  it("Should appropriately tag view", () => {
    expect(
      ticTacToeLogic.tagView({
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 1,
        winningEntry: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        forfeited: false,
        opponentTypeSelected: true,
      }),
    ).toStrictEqual({
      type: "tictactoe",
      view: {
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 1,
        winningEntry: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        forfeited: false,
        opponentTypeSelected: true,
      },
    });
  });
});

describe(`Tic Tac Toe's getWinner() logic`, () => {
  it("Should return the correct winner when player 1 wins", () => {
    expect(
      ticTacToeLogic.getWinner(
        {
          board: [
            ["X", "O", null],
            ["X", null, "O"],
            ["X", null, null],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        ["player0", "player1"],
      ),
    ).toBe("player1");
  });

  it("Should return the correct winner when player 0 wins", () => {
    expect(
      ticTacToeLogic.getWinner(
        {
          board: [
            ["O", "O", "O"],
            ["X", "X", null],
            [null, null, "X"],
          ],
          nextPlayer: 1,
          forfeited: false,
        },
        ["player0", "player1"],
      ),
    ).toBe("player0");
  });

  it("Should return null when there is no winner", () => {
    expect(
      ticTacToeLogic.getWinner(
        {
          board: [
            ["X", "O", "X"],
            ["X", "O", "O"],
            ["O", "X", "X"],
          ],
          nextPlayer: 0,
          forfeited: false,
        },
        ["player0", "player1"],
      ),
    ).toBe(null);
  });

  it("Should return correct winner when there are forfeits", () => {
    expect(
      ticTacToeLogic.getWinner(
        {
          board: [
            ["X", "O", "X"],
            ["X", "O", "O"],
            ["O", "X", "X"],
          ],
          nextPlayer: 1,
          forfeited: true,
        },
        ["player0", "player1"],
      ),
    ).toBe("player1");
    expect(
      ticTacToeLogic.getWinner(
        {
          board: [
            ["X", "O", "X"],
            ["X", "O", "O"],
            ["O", "X", "X"],
          ],
          nextPlayer: 0,
          forfeited: true,
        },
        ["player0", "player1"],
      ),
    ).toBe("player0");
  });
});
