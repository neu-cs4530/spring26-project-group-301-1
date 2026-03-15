import { type TicTacToeView } from "@gamenite/shared";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  automatedTicTacToeLogic,
  type AutomatedTicTacToeState,
} from "../../src/games/automatedTicTacToe.ts";

function makeState(overrides: Partial<AutomatedTicTacToeState> = {}): AutomatedTicTacToeState {
  return {
    board: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    nextPlayer: 0,
    opponentType: "minimax",
    autoPlayer: 1,
    forfeited: overrides.forfeited ?? false,
    ...overrides,
  };
}

function countMarks(board: AutomatedTicTacToeState["board"], mark: "O" | "X") {
  return board.flat().filter((cell) => cell === mark).length;
}

function coordInWinningEntry(
  entry: [[number, number], [number, number], [number, number]],
  coord: [number, number],
) {
  for (let i = 0; i < entry.length; i += 1) {
    if (entry[i][0] === coord[0] && entry[i][1] === coord[1]) return true;
  }
  return false;
}

describe(`Automated Tic Tac Toe's start() logic`, () => {
  it("Should always start with an empty board, human player first, and minimax enabled", () => {
    expect(automatedTicTacToeLogic.start(1)).toStrictEqual({
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      nextPlayer: 0,
      opponentType: "minimax",
      autoPlayer: 1,
    });
  });
});

describe(`Automated Tic Tac Toe's update() logic`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should reject poorly-typed move", () => {
    expect(automatedTicTacToeLogic.update(makeState(), { posn: 5 }, 0)).toStrictEqual(null);

    expect(automatedTicTacToeLogic.update(makeState(), null, 0)).toStrictEqual(null);

    expect(automatedTicTacToeLogic.update(makeState(), { posn: 5, x: 10 }, 0)).toStrictEqual(null);
  });

  it("Should reject a move from the automated player", () => {
    expect(automatedTicTacToeLogic.update(makeState(), [0, 0], 1)).toStrictEqual(null);
  });

  it("Should reject a move from the human when it is not their turn", () => {
    expect(
      automatedTicTacToeLogic.update(
        makeState({
          nextPlayer: 1,
        }),
        [0, 0],
        0,
      ),
    ).toStrictEqual(null);
  });

  it("Should reject a move which attempts to overwrite an existing move", () => {
    expect(
      automatedTicTacToeLogic.update(
        makeState({
          board: [
            ["O", null, null],
            [null, null, null],
            [null, null, null],
          ],
        }),
        [0, 0],
        0,
      ),
    ).toStrictEqual(null);
  });

  it("Should reject a move if the game is already over", () => {
    expect(
      automatedTicTacToeLogic.update(
        makeState({
          board: [
            ["O", "O", "O"],
            [null, "X", null],
            [null, null, "X"],
          ],
        }),
        [1, 0],
        0,
      ),
    ).toStrictEqual(null);
  });

  it("Should accept a valid human move and then apply one automated move", () => {
    const result = automatedTicTacToeLogic.update(makeState(), [0, 0], 0);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("expected update to return a state");
    }

    expect(result.board[0][0]).toStrictEqual("O");
    expect(countMarks(result.board, "O")).toStrictEqual(1);
    expect(countMarks(result.board, "X")).toStrictEqual(1);
    expect(result.nextPlayer).toStrictEqual(0);
  });

  it("Should not apply an automated move when opponentType is human", () => {
    const result = automatedTicTacToeLogic.update(
      makeState({
        opponentType: "human",
      }),
      [1, 1],
      0,
    );

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("expected update to return a state");
    }

    expect(result).toStrictEqual({
      board: [
        [null, null, null],
        [null, "O", null],
        [null, null, null],
      ],
      nextPlayer: 1,
      opponentType: "human",
      autoPlayer: 1,
    });
  });

  it("Should use a legal random move when random mode is enabled", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);

    const result = automatedTicTacToeLogic.update(
      makeState({
        opponentType: "random",
      }),
      [0, 0],
      0,
    );

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("expected update to return a state");
    }

    expect(result.board[0][0]).toStrictEqual("O");
    expect(result.board[2][2]).toStrictEqual("X");
  });

  it("Should use minimax to take a winning move when available", () => {
    const result = automatedTicTacToeLogic.update(
      makeState({
        board: [
          ["O", null, null],
          ["X", "X", null],
          [null, "O", null],
        ],
      }),
      [0, 1],
      0,
    );

    expect(result).toStrictEqual({
      board: [
        ["O", "O", null],
        ["X", "X", "X"],
        [null, "O", null],
      ],
      nextPlayer: 0,
      opponentType: "minimax",
      autoPlayer: 1,
    });
  });

  it("Should default autoPlayer to the automated player index when autoPlayer is undefined", () => {
    const result = automatedTicTacToeLogic.update(
      makeState({
        autoPlayer: undefined,
        opponentType: "minimax",
        board: [
          ["O", null, null],
          ["X", "X", null],
          [null, "O", null],
        ],
      }),
      [0, 1],
      0,
    );

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("expected update to return a state");
    }

    expect(result.board).toStrictEqual([
      ["O", "O", null],
      ["X", "X", "X"],
      [null, "O", null],
    ]);
    expect(result.nextPlayer).toStrictEqual(0);
  });
});

describe(`Automated Tic Tac Toe's isDone() logic`, () => {
  it("Game should not be over if board is empty", () => {
    expect(automatedTicTacToeLogic.isDone(makeState())).toBe(false);
  });

  it("Game should not be over after the first human move", () => {
    expect(
      automatedTicTacToeLogic.isDone(
        makeState({
          board: [
            ["O", null, null],
            [null, null, null],
            [null, null, null],
          ],
        }),
      ),
    ).toBe(false);
  });

  it("Should properly detect that a full board with no wins is over", () => {
    expect(
      automatedTicTacToeLogic.isDone(
        makeState({
          board: [
            ["X", "O", "X"],
            ["O", "X", "X"],
            ["O", "X", "O"],
          ],
        }),
      ),
    ).toBe(true);
  });

  it("Should properly detect a winning board as over", () => {
    expect(
      automatedTicTacToeLogic.isDone(
        makeState({
          board: [
            ["X", "X", "X"],
            ["O", "O", null],
            [null, null, null],
          ],
        }),
      ),
    ).toBe(true);

    expect(
      automatedTicTacToeLogic.isDone(
        makeState({
          board: [
            ["O", "X", "X"],
            [null, "O", null],
            [null, "X", "O"],
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe(`Automated Tic Tac Toe's viewAs() logic`, () => {
  it("Should return the same view regardless of who is viewing", () => {
    expect(
      automatedTicTacToeLogic.viewAs(
        makeState({
          board: [
            ["X", "O", null],
            ["O", null, "O"],
            ["X", "X", null],
          ],
          nextPlayer: 0,
        }),
        0,
      ),
    ).toStrictEqual({
      board: [
        ["X", "O", null],
        ["O", null, "O"],
        ["X", "X", null],
      ],
      nextPlayer: 0,
      winningEntry: null,
    });

    expect(
      automatedTicTacToeLogic.viewAs(
        makeState({
          board: [
            ["X", "O", null],
            ["O", null, "O"],
            ["X", "X", null],
          ],
          nextPlayer: 0,
        }),
        1,
      ),
    ).toStrictEqual({
      board: [
        ["X", "O", null],
        ["O", null, "O"],
        ["X", "X", null],
      ],
      nextPlayer: 0,
      winningEntry: null,
    });
  });

  it("Should not return a winning entry when the game is not over", () => {
    expect(
      automatedTicTacToeLogic.viewAs(
        makeState({
          board: [
            ["X", "O", null],
            ["O", null, "O"],
            ["X", "X", null],
          ],
          nextPlayer: 0,
        }),
        0,
      ),
    ).toStrictEqual({
      board: [
        ["X", "O", null],
        ["O", null, "O"],
        ["X", "X", null],
      ],
      nextPlayer: 0,
      winningEntry: null,
    });
  });

  it("Should return a valid winning entry when the game is over", () => {
    const testView: TicTacToeView = automatedTicTacToeLogic.viewAs(
      makeState({
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 0,
      }),
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

  it("Should return a valid winning diagonal entry when the game is over", () => {
    const testView: TicTacToeView = automatedTicTacToeLogic.viewAs(
      makeState({
        board: [
          ["X", "X", "O"],
          ["X", "O", "X"],
          ["O", "X", null],
        ],
        nextPlayer: 1,
      }),
      0,
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
});

describe(`Automated Tic Tac Toe's describeMove() logic`, () => {
  it("Should describe a normal human move in human-opponent mode", () => {
    expect(
      automatedTicTacToeLogic.describeMove(
        makeState({
          opponentType: "human",
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
        }),
        makeState({
          opponentType: "human",
          board: [
            [null, null, null],
            [null, "O", null],
            [null, null, null],
          ],
          nextPlayer: 1,
        }),
        [1, 1],
        0,
      ),
    ).toBe(" moved at (1, 1)");
  });

  it("Should describe a human winning move when the human wins before any AI move", () => {
    expect(
      automatedTicTacToeLogic.describeMove(
        makeState({
          opponentType: "human",
          board: [
            ["O", "O", null],
            [null, "X", null],
            [null, null, "X"],
          ],
          nextPlayer: 0,
        }),
        makeState({
          opponentType: "human",
          board: [
            ["O", "O", "O"],
            [null, "X", null],
            [null, null, "X"],
          ],
          nextPlayer: 1,
        }),
        [0, 2],
        0,
      ),
    ).toBe(" moved at (0, 2) and won the game");
  });

  it("Should describe a human draw move when the human fills the last square before any AI move", () => {
    expect(
      automatedTicTacToeLogic.describeMove(
        makeState({
          opponentType: "human",
          board: [
            ["X", "O", "X"],
            ["X", "O", "O"],
            ["O", "X", null],
          ],
          nextPlayer: 0,
        }),
        makeState({
          opponentType: "human",
          board: [
            ["X", "O", "X"],
            ["X", "O", "O"],
            ["O", "X", "O"],
          ],
          nextPlayer: 1,
        }),
        [2, 2],
        0,
      ),
    ).toBe(" moved at (2, 2) and ended the game in a draw");
  });

  it("Should describe separate human and AI move messages during a normal automated turn", () => {
    const result = automatedTicTacToeLogic.update(makeState(), [0, 0], 0);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("expected update to return a state");
    }

    expect(automatedTicTacToeLogic.describeMove(makeState(), result, [0, 0], 0)).toContain("||");
  });

  it("Should describe an automated winning move", () => {
    expect(
      automatedTicTacToeLogic.describeMove(
        makeState({
          board: [
            ["X", "X", null],
            ["O", null, null],
            [null, "O", null],
          ],
          nextPlayer: 0,
        }),
        makeState({
          board: [
            ["X", "X", "X"],
            ["O", "O", null],
            [null, "O", null],
          ],
          nextPlayer: 0,
        }),
        [1, 1],
        0,
      ),
    ).toBe(" moved at (1, 1)|| automated opponent moved at (0, 2) and won the game");
  });

  it("Should describe an automated draw move", () => {
    expect(
      automatedTicTacToeLogic.describeMove(
        makeState({
          board: [
            ["O", "X", "O"],
            ["O", "X", "X"],
            ["X", null, null],
          ],
          nextPlayer: 0,
        }),
        makeState({
          board: [
            ["O", "X", "O"],
            ["O", "X", "X"],
            ["X", "O", "X"],
          ],
          nextPlayer: 0,
        }),
        [2, 1],
        0,
      ),
    ).toBe(" moved at (2, 1)|| automated opponent moved at (2, 2) and ended the game in a draw");
  });

  it("Should default aiPlayer in describeMove when newState.autoPlayer is undefined", () => {
    expect(
      automatedTicTacToeLogic.describeMove(
        makeState({
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
          ],
          nextPlayer: 0,
          autoPlayer: undefined,
        }),
        makeState({
          board: [
            ["O", null, null],
            [null, "X", null],
            [null, null, null],
          ],
          nextPlayer: 0,
          autoPlayer: undefined,
        }),
        [0, 0],
        0,
      ),
    ).toBe(" moved at (0, 0)|| automated opponent moved at (1, 1)");
  });
});

describe(`Automated Tic Tac Toe's tagView() logic`, () => {
  it("Should appropriately tag view", () => {
    expect(
      automatedTicTacToeLogic.tagView({
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 0,
        winningEntry: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        forfeited: false,
      }),
    ).toStrictEqual({
      type: "automatedTicTacToe",
      view: {
        board: [
          ["X", "O", null],
          ["X", null, "O"],
          ["X", null, null],
        ],
        nextPlayer: 0,
        winningEntry: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        forfeited: false,
      },
    });
  });
});
