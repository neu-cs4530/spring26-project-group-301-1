import "./GamePanel.css";
import type { GameInfo } from "@gamenite/shared";
import { gameNames } from "../util/consts.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";
import GameDispatch from "../games/GameDispatch.tsx";
import useSocketsForGame from "../hooks/useSocketsForGame.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";

/**
 * A game panel allows viewing the status and players of a live game
 */
export default function GamePanel({
  gameId,
  type,
  players: initialPlayers,
  createdAt,
  minPlayers,
}: GameInfo) {
  const { user, socket } = useLoginContext();
  const auth = useAuth();
  const timeSince = useTimeSince();

  const { view, players, viewers, userPlayerIndex, hasWatched, joinGame, startGame } =
    useSocketsForGame(gameId, initialPlayers);

  const playerMarker = (index: number) => {
    if (type !== "tictactoe") return "";
    return index === 0 ? " (O)" : " (X)";
  };

  const forfeitGame = () => {
    socket.emit("gameMakeMove", { auth, payload: { gameId, move: { type: "forfeit" } } });
  };

  const currentTurnPlayerIndex = (() => {
    if (!view) return null;

    if (view.type === "tictactoe") {
      const tttView = view.view;
      const boardFull = tttView.board.every((row) => row.every((entry) => entry !== null));
      if (tttView.winningEntry || tttView.forfeited || boardFull) return null;
      return tttView.nextPlayer;
    }

    if (view.type === "nim") {
      const nimView = view.view;
      if (nimView.forfeited || nimView.remaining <= 0) return null;
      return nimView.nextPlayer;
    }

    return null;
  })();

  const renderPlayerCard = (player: (typeof players)[number], index: number, isTurn = false) => (
    <div
      className={
        isTurn
          ? "gameRoster__playerCard gameRoster__playerCard--activeTurn"
          : "gameRoster__playerCard"
      }
      role="listitem"
      key={player.username}
    >
      <div className="gameRoster__itemName">
        {player.username === user.username ? "You" : <UserLink user={player} />}
      </div>
      <div className="gameRoster__itemRole">
        Player {index + 1}
        {playerMarker(index)}
      </div>
    </div>
  );

  return hasWatched ? (
    <div className="gamePanel">
      <div className="gameRoster">
        <div className="gameRoster__header">
          <div>
            <div className="gameRoster__titleRow">
              <h2 className="gameRoster__title">{gameNames[type]}</h2>
              <span className="gameRoster__titleTime">{timeSince(createdAt)}</span>
            </div>
            <div className="gameRoster__meta">
              <span>Players: {players.length}</span>
              <span>Viewers: {viewers}</span>
            </div>
          </div>
          {
            // If the game hasn't started and user hasn't joined, they can join
            userPlayerIndex < 0 && !view && (
              <button className="primary narrow gameRoster__action" onClick={joinGame}>
                Join Game
              </button>
            )
          }
          {
            // If the game hasn't started and the user has joined, they can start the game if a minimum number of players are present
            userPlayerIndex >= 0 && !view && players.length >= minPlayers && (
              <button className="primary narrow gameRoster__action" onClick={startGame}>
                Start Game
              </button>
            )
          }
          {
            // If the game is active and user is a player, they can forfeit from the header
            userPlayerIndex >= 0 && view && (
              <button
                className="gameRoster__action gameRoster__action--forfeit"
                onClick={forfeitGame}
              >
                Forfeit Game
              </button>
            )
          }
        </div>
        {players.length === 2 ? (
          <div className="gameRoster__duel" role="list">
            {renderPlayerCard(players[0], 0, currentTurnPlayerIndex === 0)}
            <div className="gameRoster__versus">vs</div>
            {renderPlayerCard(players[1], 1, currentTurnPlayerIndex === 1)}
          </div>
        ) : (
          <div className="gameRoster__list" role="list">
            {players.map((player, index) =>
              renderPlayerCard(player, index, currentTurnPlayerIndex === index),
            )}
          </div>
        )}
      </div>
      {view ? (
        <div className="gameFrame">
          <GameDispatch
            gameId={gameId}
            userPlayerIndex={userPlayerIndex}
            players={players}
            view={view}
          />
        </div>
      ) : (
        <div className="gameFrame gameFrame--waiting">
          <div className="gameFrame__waitingText">Waiting for game to begin</div>
        </div>
      )}
    </div>
  ) : (
    <div></div>
  );
}
