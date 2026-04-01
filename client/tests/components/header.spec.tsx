import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import Header from "../../src/components/Header.tsx";
import { LoginContext } from "../../src/contexts/LoginContext.ts";
import type { GameSocket } from "../../src/util/types.ts";

const mockedReset = vi.fn();

describe("Header component", () => {
  beforeEach(() => {
    mockedReset.mockReset();
  });

  function renderHeader() {
    render(
      <MemoryRouter>
        <LoginContext.Provider
          value={{
            user: {
              username: "username123",
              display: "displayname",
              createdAt: new Date("01-02-2025"),
              hideUsername: false,
              privateProfile: false,
            },
            pass: "pwd",
            socket: {} as GameSocket,
            reset: mockedReset,
          }}
        >
          <Header />
        </LoginContext.Provider>
      </MemoryRouter>,
    );
  }

  it("pressing Log Out causes a state reset and links to login", () => {
    renderHeader();

    const logoutLink = screen.getByRole("link", { name: /log out/i });
    fireEvent.click(logoutLink);

    // reset should be called
    expect(mockedReset).toHaveBeenCalledTimes(1);

    // check link destination
    expect(logoutLink.getAttribute("href")).toBe("/login");
  });

  it("View Profile links to the current user profile", () => {
    renderHeader();

    const profileLink = screen.getByRole("link", { name: /view profile/i });

    expect(profileLink.getAttribute("href")).toBe("/profile/username123");
  });
});
