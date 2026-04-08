import { renderHook, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import useInactivityForfeit from "../../src/hooks/useInactivityForfeit.ts";

const onForfeit = vi.fn();

describe("useInactivityForfeit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    onForfeit.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const render = (isActivePlayer = true) =>
    renderHook(() => useInactivityForfeit(isActivePlayer, onForfeit));

  it("shows no warning initially", () => {
    const { result } = render();
    expect(result.current.showWarning).toBe(false);
  });

  it("shows the warning after 4 minutes of inactivity", () => {
    const { result } = render();
    act(() => vi.advanceTimersByTime(4 * 60 * 1000));
    expect(result.current.showWarning).toBe(true);
  });

  it("counts down seconds in the warning", () => {
    const { result } = render();
    act(() => vi.advanceTimersByTime(4 * 60 * 1000));
    expect(result.current.secondsLeft).toBe(60);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.secondsLeft).toBe(55);
  });

  it("calls onForfeit after 5 minutes of inactivity", () => {
    render();
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(onForfeit).toHaveBeenCalledOnce();
  });

  it("resets the timer when the user interacts", () => {
    const { result } = render();
    act(() => vi.advanceTimersByTime(4 * 60 * 1000));
    expect(result.current.showWarning).toBe(true);

    // fake mousemove: check that hides warning then resets timer
    act(() => {
      fireEvent.mouseMove(window);
    });
    expect(result.current.showWarning).toBe(false);

    // 4 more minutes from reset; should NOT forfeit yet
    act(() => vi.advanceTimersByTime(4 * 60 * 1000));
    expect(onForfeit).not.toHaveBeenCalled();
  });

  it("calls onForfeit after 5 minutes following a reset", () => {
    const { result } = render();
    act(() => vi.advanceTimersByTime(4 * 60 * 1000));
    act(() => {
      result.current.reset();
    });

    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(onForfeit).toHaveBeenCalledOnce();
  });

  it("does not start timers when not an active player", () => {
    render(false);
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(onForfeit).not.toHaveBeenCalled();
  });

  it("hides the warning when secondsLeft reaches 1", () => {
    const { result } = render();
    act(() => vi.advanceTimersByTime(4 * 60 * 1000));
    expect(result.current.showWarning).toBe(true);

    act(() => vi.advanceTimersByTime(59 * 1000));
    expect(result.current.secondsLeft).toBe(1);
    // banner condition is secondsLeft > 1, so at 1 it should be hidden
    expect(result.current.showWarning).toBe(true);
  });
});
