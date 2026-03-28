import "./GamePanel.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameInfo } from "@gamenite/shared";
import { gameNames } from "../util/consts.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";
import GameDispatch from "../games/GameDispatch.tsx";
import useSocketsForGame from "../hooks/useSocketsForGame.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_WARNING_MS = 60 * 1000; // warn 1 minute before forfeit

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

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
  const displayTitle = gameNames[type].replace(" vs Automated Opponent", "");
  const isAutomatedTicTacToe = type === "automatedTicTacToe";
  const { user, socket } = useLoginContext();
  const auth = useAuth();
  const timeSince = useTimeSince();

  const { view, players, viewers, userPlayerIndex, hasWatched, joinGame, startGame } =
    useSocketsForGame(gameId, initialPlayers);
  const [aiThinking, setAiThinking] = useState(false);

  const displayedPlayerCount = isAutomatedTicTacToe ? Math.max(players.length, 2) : players.length;

  // Inactivity forfeit state
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(60);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActivePlayer = userPlayerIndex >= 0 && !!view;

  const clearAllTimers = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    inactivityTimer.current = null;
    warningTimer.current = null;
    countdownInterval.current = null;
  };

  const forfeitGame = useCallback(() => {
    socket.emit("gameMakeMove", { auth, payload: { gameId, move: { type: "forfeit" } } });
  }, [socket, auth, gameId]);

  const resetInactivityTimer = useCallback(() => {
    clearAllTimers();

    // schedule the warning
    warningTimer.current = setTimeout(() => {
      setShowInactivityWarning(true);
      setInactivitySecondsLeft(INACTIVITY_WARNING_MS / 1000);

      countdownInterval.current = setInterval(() => {
        setInactivitySecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS);

    // schedule the forfeit
    inactivityTimer.current = setTimeout(() => {
      clearAllTimers();
      forfeitGame();
    }, INACTIVITY_TIMEOUT_MS);
  }, [forfeitGame]);

  // Start/stop inactivity tracking based on whether the user is an active player
  useEffect(() => {
    if (!isActivePlayer) {
      clearAllTimers();
      return;
    }

    resetInactivityTimer();
    const handleActivity = () => {
      setShowInactivityWarning(false);
      resetInactivityTimer();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      clearAllTimers();
      setShowInactivityWarning(false);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [isActivePlayer, resetInactivityTimer]);

  // AI thinking event
  useEffect(() => {
    const handleThinkingEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ gameId?: string; thinking?: boolean }>;
      const isTargetGame = !customEvent.detail?.gameId || customEvent.detail.gameId === gameId;
      if (!isTargetGame) return;
      setAiThinking(Boolean(customEvent.detail?.thinking));
    };

    window.addEventListener("automated-opponent-thinking", handleThinkingEvent);
    return () => {
      window.removeEventListener("automated-opponent-thinking", handleThinkingEvent);
    };
  }, [gameId]);

  const playerMarker = (index: number) => {
    if (type !== "tictactoe" && type !== "automatedTicTacToe") return "";
    return index === 0 ? " (O)" : " (X)";
  };

  const currentTurnPlayerIndex = (() => {
    if (!view) return null;

    if (view.type === "tictactoe" || view.type === "automatedTicTacToe") {
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

  const renderAutomatedOpponentCard = (isTurn = false) => (
    <div
      className={
        isTurn
          ? "gameRoster__playerCard gameRoster__playerCard--activeTurn"
          : "gameRoster__playerCard"
      }
      role="listitem"
      key="automated-opponent"
    >
      <div className="gameRoster__itemName">Automated Opponent</div>
      <div className="gameRoster__itemRole">Player 2{playerMarker(1)}</div>
    </div>
  );

  return hasWatched ? (
    <>
      {showInactivityWarning && inactivitySecondsLeft > 1 && (
        <div className="gamePanel__inactivityWarning" role="alert">
          <span>
            You've been inactive. You will forfeit in <strong>{inactivitySecondsLeft}s</strong>{" "}
            unless you interact with the page.
          </span>
          <button
            className="primary narrow"
            onClick={() => {
              setShowInactivityWarning(false);
              resetInactivityTimer();
            }}
          >
            I'm still here
          </button>
        </div>
      )}
      <div className="gamePanel">
        <div className="gameRoster">
          <div className="gameRoster__header">
            <div>
              <div className="gameRoster__titleRow">
                <h2 className="gameRoster__title">{displayTitle}</h2>
                <span className="gameRoster__titleTime">{timeSince(createdAt)}</span>
              </div>
              <div className="gameRoster__meta">
                <span>Players: {displayedPlayerCount}</span>
                <span>Viewers: {viewers}</span>
              </div>
            </div>
            {userPlayerIndex < 0 && !view && (
              <button className="primary narrow gameRoster__action" onClick={joinGame}>
                Join Game
              </button>
            )}
            {userPlayerIndex >= 0 && !view && players.length >= minPlayers && (
              <button className="primary narrow gameRoster__action" onClick={startGame}>
                Start Game
              </button>
            )}
            {userPlayerIndex >= 0 && view && (
              <button
                className="gameRoster__action gameRoster__action--forfeit"
                onClick={forfeitGame}
              >
                Forfeit Game
              </button>
            )}
          </div>
          {isAutomatedTicTacToe && players.length === 1 ? (
            <div className="gameRoster__duel" role="list">
              {renderPlayerCard(players[0], 0, aiThinking ? false : currentTurnPlayerIndex === 0)}
              <div className="gameRoster__versus">vs</div>
              {renderAutomatedOpponentCard(currentTurnPlayerIndex === 1 || aiThinking)}
            </div>
          ) : players.length === 2 ? (
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
    </>
  ) : (
    <div></div>
  );
}
