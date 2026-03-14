import { expect, describe, it } from "vitest";
import { zGuessMove, zNimMove } from "./game.types.ts";

describe("zNimMove", () => {
  it("accepts valid inputs", () => {
    expect(zNimMove.safeParse({ type: "move", count: 1 })).toStrictEqual({
      success: true,
      data: { type: "move", count: 1 },
    });
    expect(zNimMove.safeParse({ type: "move", count: 2 })).toStrictEqual({
      success: true,
      data: { type: "move", count: 2 },
    });
    expect(zNimMove.safeParse({ type: "move", count: 3 })).toStrictEqual({
      success: true,
      data: { type: "move", count: 3 },
    });
    expect(zNimMove.safeParse({ type: "forfeit" })).toStrictEqual({
      success: true,
      data: { type: "forfeit" },
    });
  });

  it("rejects invalid inputs", () => {
    expect(zNimMove.safeParse({ type: "move", count: 0 })).toMatchObject({ success: false });
    expect(zNimMove.safeParse({ type: "move", count: 4 })).toMatchObject({ success: false });
    expect(zNimMove.safeParse(null)).toMatchObject({ success: false });
  });
});

describe("zGuessMove", () => {
  it("accepts valid inputs", () => {
    expect(zGuessMove.safeParse({ type: "move", guess: 1 })).toStrictEqual({
      success: true,
      data: { type: "move", guess: 1 },
    });
    expect(zGuessMove.safeParse({ type: "move", guess: 2 })).toStrictEqual({
      success: true,
      data: { type: "move", guess: 2 },
    });
    expect(zGuessMove.safeParse({ type: "move", guess: 17 })).toStrictEqual({
      success: true,
      data: { type: "move", guess: 17 },
    });
    expect(zGuessMove.safeParse({ type: "move", guess: 100 })).toStrictEqual({
      success: true,
      data: { type: "move", guess: 100 },
    });
    expect(zGuessMove.safeParse({ type: "forfeit" })).toStrictEqual({
      success: true,
      data: { type: "forfeit" },
    });
  });

  it("rejects invalid inputs", () => {
    expect(zGuessMove.safeParse({ type: "move", guess: 0 })).toMatchObject({ success: false });
    expect(zGuessMove.safeParse({ type: "move", guess: 101 })).toMatchObject({ success: false });
    expect(zGuessMove.safeParse({ type: "move", guess: -4 })).toMatchObject({ success: false });
    expect(zGuessMove.safeParse(undefined)).toMatchObject({ success: false });
    expect(zGuessMove.safeParse("55")).toMatchObject({ success: false });
  });
});
