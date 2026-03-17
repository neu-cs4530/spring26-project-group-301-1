it("Should default opponentType to minimax in chooseAutomatedMove when undefined", () => {
  const state = makeState({ opponentType: undefined });
  const move = chooseAutomatedMove(state);
  // Should return a valid move (not null) since board is empty and minimax is default
  expect(move).not.toBeNull();
  if (move === null) throw new Error("expected chooseAutomatedMove to return a move");
  expect(move.type).toBe("move");
  expect(Array.isArray(move.coord)).toBe(true);
});

it("Should return null in chooseAutomatedMove when opponentType is human", () => {
  const state = makeState({ opponentType: "human" });
  const move = chooseAutomatedMove(state);
  expect(move).toBeNull();
});

it("Should return a random move in chooseAutomatedMove when opponentType is random", () => {
  vi.spyOn(Math, "random").mockReturnValue(0);
  const state = makeState({ opponentType: "random" });
  const move = chooseAutomatedMove(state);
  expect(move).not.toBeNull();
  if (move === null) throw new Error("expected chooseAutomatedMove to return a move");
  expect(move.type).toBe("move");
  expect(Array.isArray(move.coord)).toBe(true);
  vi.restoreAllMocks();
});

it("Should return a minimax move in chooseAutomatedMove when opponentType is minimax", () => {
  const state = makeState({ opponentType: "minimax" });
  const move = chooseAutomatedMove(state);
  expect(move).not.toBeNull();
  if (move === null) throw new Error("expected chooseAutomatedMove to return a move");
  expect(move.type).toBe("move");
  expect(Array.isArray(move.coord)).toBe(true);
});
import { type TicTacToeView } from "@gamenite/shared";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  automatedTicTacToeLogic,
  chooseAutomatedMove,
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
      forfeited: false,
    });
  });
});

describe(`Automated Tic Tac Toe's update() logic`, () => {
  it("Should return null if move.coord is missing in update", () => {
    const state = makeState();
    // move without coord
    const result = automatedTicTacToeLogic.update(state, { type: "move" }, 0);
    expect(result).toBeNull();
  });
  it("Should return null if no moves are available in chooseAutomatedMove", () => {
    // Create a board with no available moves
    const fullBoard = [
      ["O", "X", "O"],
      ["X", "O", "X"],
      ["X", "O", "X"],
    ];
    const state = makeState({ board: fullBoard as TicTacToeView["board"] });
    // Directly call chooseAutomatedMove
    expect(chooseAutomatedMove(state)).toBeNull();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should reject poorly-typed move", () => {
    expect(automatedTicTacToeLogic.update(makeState(), { posn: 5 }, 0)).toStrictEqual(null);

    expect(automatedTicTacToeLogic.update(makeState(), null, 0)).toStrictEqual(null);

    expect(automatedTicTacToeLogic.update(makeState(), { posn: 5, x: 10 }, 0)).toStrictEqual(null);
  });
  it("Should handle forfeit move and mark game as forfeited", () => {
    const result = automatedTicTacToeLogic.update(makeState(), { type: "forfeit" }, 0);
    expect(result).not.toBeNull();
    if (result === null) throw new Error("expected update to return a state");
    expect(result.forfeited).toBe(true);
    // Should not change board or nextPlayer
    expect(result.board).toStrictEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
    expect(result.nextPlayer).toBe(0);
    // Should not allow further moves after forfeit
    expect(
      automatedTicTacToeLogic.update(result, { type: "move", coord: [0, 0] }, 0),
    ).toStrictEqual(null);
  });

  it("Should reject a move from the automated player", () => {
    expect(automatedTicTacToeLogic.update(makeState(), [0, 0], 1)).toStrictEqual(null);
    expect(
      automatedTicTacToeLogic.update(makeState(), { type: "move", coord: [0, 0] }, 1),
    ).toStrictEqual(null);
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
    expect(
      automatedTicTacToeLogic.update(
        makeState({
          nextPlayer: 1,
        }),
        { type: "move", coord: [0, 0] },
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
    expect(
      automatedTicTacToeLogic.update(
        makeState({
          board: [
            ["O", null, null],
            [null, null, null],
            [null, null, null],
          ],
        }),
        { type: "move", coord: [0, 0] },
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
    expect(
      automatedTicTacToeLogic.update(
        makeState({
          board: [
            ["O", "O", "O"],
            [null, "X", null],
            [null, null, "X"],
          ],
        }),
        { type: "move", coord: [1, 0] },
        0,
      ),
    ).toStrictEqual(null);
  });

  it("Should accept a valid human move and then apply one automated move", () => {
    const result = automatedTicTacToeLogic.update(makeState(), { type: "move", coord: [0, 0] }, 0);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("expected update to return a state");
    }

    expect(result.board[0][0]).toStrictEqual("O");
    expect(countMarks(result.board, "O")).toStrictEqual(1);
    expect(countMarks(result.board, "X")).toStrictEqual(1);
    expect(result.nextPlayer).toStrictEqual(0);
  });

  it("Should default opponentType to minimax if undefined", () => {
    const state = makeState({ opponentType: undefined });
    const result = automatedTicTacToeLogic.update(state, { type: "move", coord: [0, 0] }, 0);
    expect(result).not.toBeNull();
    if (result === null) throw new Error("expected update to return a state");
    expect(result.opponentType).toBe("minimax");
  });

  it("Should default autoPlayer to 1 if undefined in AI move", () => {
    const state = makeState({ autoPlayer: undefined });
    const result = automatedTicTacToeLogic.update(state, { type: "move", coord: [0, 0] }, 0);
    expect(result).not.toBeNull();
    if (result === null) throw new Error("expected update to return a state");
    expect(result.autoPlayer ?? 1).toBe(1);
    expect(countMarks(result.board, "X")).toBeGreaterThan(0);
  });

  it("Should handle aiMove.coord undefined in chooseAutomatedMove", () => {
    // Simulate a board with only one move left, so AI move coord is always defined
    const state = makeState({
      board: [
        ["O", "X", "O"],
        ["X", "O", "X"],
        ["X", "O", null],
      ],
      opponentType: "minimax",
    });
    const result = automatedTicTacToeLogic.update(state, { type: "move", coord: [2, 2] }, 0);
    expect(result).not.toBeNull();
    if (result === null) throw new Error("expected update to return a state");
    expect(result.board.flat().filter((cell) => cell === "X").length).toBeGreaterThan(0);
  });

  it("Should not apply an automated move when opponentType is human", () => {
    const result = automatedTicTacToeLogic.update(
      makeState({
        opponentType: "human",
      }),
      { type: "move", coord: [1, 1] },
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
      forfeited: false,
    });
  });

  it("Should use a legal random move when random mode is enabled", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);

    const result = automatedTicTacToeLogic.update(
      makeState({
        opponentType: "random",
      }),
      { type: "move", coord: [0, 0] },
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
      { type: "move", coord: [0, 1] },
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
      forfeited: false,
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
      { type: "move", coord: [0, 1] },
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
      forfeited: false,
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
      forfeited: false,
    });
  });

  it("Should default forfeited to false when undefined in viewAs", () => {
    const state = makeState({ forfeited: undefined });
    const view = automatedTicTacToeLogic.viewAs(state, 0);
    expect(view.forfeited).toBe(false);
  });

  it("Should return forfeited as true when set in viewAs", () => {
    const state = makeState({ forfeited: true });
    const view = automatedTicTacToeLogic.viewAs(state, 0);
    expect(view.forfeited).toBe(true);
  });

  it("Should return forfeited as false when set in viewAs", () => {
    const state = makeState({ forfeited: false });
    const view = automatedTicTacToeLogic.viewAs(state, 0);
    expect(view.forfeited).toBe(false);
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
      forfeited: false,
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
    expect(testView.forfeited).toStrictEqual(false);
    expect(testView.nextPlayer).toStrictEqual(0);
    expect(testView.forfeited).toStrictEqual(false);

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
    expect(testView.forfeited).toStrictEqual(false);

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
        { type: "move", coord: [1, 1] },
        0,
      ),
    ).toBe(" moved at (1, 1)");
  });

  it("Should describe a forfeit move", () => {
    const prevState = makeState();
    const newState = makeState({ forfeited: true });
    const payload = { type: "forfeit" };
    expect(automatedTicTacToeLogic.describeMove(prevState, newState, payload, 0)).toBe(
      " forfeited the game",
    );
  });

  it("Should handle move.coord when it is undefined", () => {
    // coord undefined
    const prevState = makeState();
    const newState = makeState();
    const payload = { type: "move" };
    expect(automatedTicTacToeLogic.describeMove(prevState, newState, payload, 0)).toContain(
      " moved at (-1, -1)",
    );

    // coord valid
    const payloadValid = { type: "move", coord: [2, 0] };
    expect(automatedTicTacToeLogic.describeMove(prevState, newState, payloadValid, 0)).toContain(
      " moved at (2, 0)",
    );
  });

  it("Should handle aiMove undefined and aiMsg branch in describeMove", () => {
    // aiMove undefined
    const prevState = makeState({
      board: [
        ["O", "X", "O"],
        ["X", "O", "X"],
        ["X", "O", null],
      ],
    });
    const newState = makeState({
      board: [
        ["O", "X", "O"],
        ["X", "O", "X"],
        ["X", "O", "X"],
      ],
    });
    const payload = { type: "move", coord: [2, 2] };
    expect(automatedTicTacToeLogic.describeMove(prevState, newState, payload, 0)).toContain(
      " moved at (2, 2)",
    );
    // aiMsg branch: aiMove defined, winner is aiSymbol
    const prevState2 = makeState({
      board: [
        ["X", "X", null],
        ["O", null, null],
        [null, "O", null],
      ],
    });
    const newState2 = makeState({
      board: [
        ["X", "X", "X"],
        ["O", "O", null],
        [null, "O", null],
      ],
    });
    const payload2 = { type: "move", coord: [1, 1] };
    expect(automatedTicTacToeLogic.describeMove(prevState2, newState2, payload2, 0)).toContain(
      " automated opponent moved at (0, 2) and won the game",
    );
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
        { type: "move", coord: [0, 0] },
        0,
      ),
    ).toBe(" moved at (0, 0)|| automated opponent moved at (1, 1)");
  });

  it("Should handle aiMove.coord undefined in describeMove", () => {
    // Simulate AI move with coord undefined
    const prevState = makeState({
      board: [
        ["O", "X", "O"],
        ["X", "O", "X"],
        ["X", "O", null],
      ],
    });
    const newState = makeState({
      board: [
        ["O", "X", "O"],
        ["X", "O", "X"],
        ["X", "O", "X"],
      ],
    });
    const payload = { type: "move", coord: [2, 2] };
    expect(automatedTicTacToeLogic.describeMove(prevState, newState, payload, 0)).toContain(
      " moved at (2, 2)",
    );
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
        { type: "move", coord: [0, 2] },
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
        { type: "move", coord: [2, 2] },
        0,
      ),
    ).toBe(" moved at (2, 2) and ended the game in a draw");
  });

  it("Should describe separate human and AI move messages during a normal automated turn", () => {
    const result = automatedTicTacToeLogic.update(makeState(), { type: "move", coord: [0, 0] }, 0);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("expected update to return a state");
    }

    expect(
      automatedTicTacToeLogic.describeMove(makeState(), result, { type: "move", coord: [0, 0] }, 0),
    ).toContain("||");
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
        { type: "move", coord: [1, 1] },
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
        { type: "move", coord: [2, 1] },
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
        { type: "move", coord: [0, 0] },
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

describe("Automated Tic Tac Toe's getWinner() logic", () => {
  const players = ["Player O", "Player X"];

  it("Should return Player X when X wins", () => {
    const state = makeState({
      board: [
        ["X", "X", "X"],
        ["O", null, "O"],
        [null, null, null],
      ],
    });
    expect(automatedTicTacToeLogic.getWinner(state, players)).toBe("Player X");
  });

  it("Should return Player O when O wins", () => {
    const state = makeState({
      board: [
        ["O", "O", "O"],
        ["X", null, "X"],
        [null, null, null],
      ],
    });
    expect(automatedTicTacToeLogic.getWinner(state, players)).toBe("Player O");
  });

  it("Should return forfeiting player when forfeited", () => {
    const state = makeState({
      forfeited: true,
      nextPlayer: 0,
    });
    expect(automatedTicTacToeLogic.getWinner(state, players)).toBe("Player O");
    const state2 = makeState({
      forfeited: true,
      nextPlayer: 1,
    });
    expect(automatedTicTacToeLogic.getWinner(state2, players)).toBe("Player X");
  });

  it("Should return null when there is no winner", () => {
    const state = makeState({
      board: [
        ["O", "X", "O"],
        ["X", "O", "X"],
        ["X", "O", "X"],
      ],
    });
    expect(automatedTicTacToeLogic.getWinner(state, players)).toBe(null);
  });
});
