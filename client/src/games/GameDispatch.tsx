import type { SafeUserInfo, TaggedGameView } from "@gamenite/shared";
import NimGame from "./NimGame.tsx";
import GuessGame from "./GuessGame.tsx";
import TicTacToeGame from "./TicTacToeGame.tsx";
import { type JSX } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";

interface GameDispatchProps {
  userPlayerIndex: number;
  players: SafeUserInfo[];
  gameId: string;
  view: TaggedGameView;
}

export default function GameDispatch({
  userPlayerIndex,
  gameId,
  players,
  view,
}: GameDispatchProps): JSX.Element {
  const { socket, user } = useLoginContext();
  const auth = useAuth();

  function makeMove(move: unknown) {
    socket.emit("gameMakeMove", { auth, payload: { gameId, move } });
  }

  // Determine background style
  const backgroundStyle: React.CSSProperties = {};
  if (user.customBackground) {
    if (user.customBackground.startsWith("#") || user.customBackground.startsWith("rgb")) {
      backgroundStyle.background = user.customBackground;
    } else if (user.customBackground.startsWith("/")) {
      // Local preset image path
      backgroundStyle.backgroundImage = `url('${user.customBackground}')`;
      backgroundStyle.backgroundSize = "cover";
      backgroundStyle.backgroundPosition = "center";
    } else {
      // Fallback: treat as color
      backgroundStyle.background = user.customBackground;
    }
  }

  /**
   * Helper function to get the right game component based on the type.
   * @returns component for the game specified by the view
   */
  function getGame() {
    let gameComponent: JSX.Element | null = null;
    switch (view.type) {
      case "nim":
        gameComponent = <NimGame {...{ ...childProps, view: view.view }} />;
        break;
      case "guess":
        gameComponent = <GuessGame {...{ ...childProps, view: view.view }} />;
        break;
      case "tictactoe":
        gameComponent = <TicTacToeGame {...{ ...childProps, view: view.view }} />;
    }
    return gameComponent;
  }

  const childProps = { userPlayerIndex, players, makeMove };
  return (
    <div className="content">
      {getGame()}
      {userPlayerIndex === -1 ? (
        <></>
      ) : (
        <button className="primary narrow" onClick={() => makeMove({ type: "forfeit" })}>
          Forfeit Game
        </button>
      )}
    </div>
  );
}
