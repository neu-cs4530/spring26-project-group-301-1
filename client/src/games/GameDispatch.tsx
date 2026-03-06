import type { SafeUserInfo, TaggedGameView } from "@gamenite/shared";
import NimGame from "./NimGame.tsx";
import GuessGame from "./GuessGame.tsx";
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
  const { socket } = useLoginContext();
  const auth = useAuth();

  function makeMove(move: unknown) {
    socket.emit("gameMakeMove", { auth, payload: { gameId, move } });
  }

  /**
   * Helper function to get the right game component based on the type.
   * @returns component for the game specified by the view
   */
  function getGame() {
    switch (view.type) {
      case "nim":
        return <NimGame {...{ ...childProps, view: view.view }} />;
      case "guess":
        return <GuessGame {...{ ...childProps, view: view.view }} />;
    }
  }

  const childProps = { userPlayerIndex, players, makeMove };
  return (
    <div className="content">
      <button className="primary narrow" onClick={() => makeMove({ type: "forfeit" })}>
        Forfeit Game
      </button>
      {getGame()}
    </div>
  );
}
