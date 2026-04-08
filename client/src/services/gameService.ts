import type { ErrorMsg, GameInfo, GameKey, UserAuth } from "@gamenite/shared";
import { api, exceptionToErrorMsg } from "./api.ts";
import type { APIResponse } from "../util/types.ts";

const GAME_API_URL = `/api/game`;

/**
 * Sends a POST request to create a game
 */
export const createGame = async (
  auth: UserAuth,
  gameKey: GameKey,
  filtered: boolean,
  isPrivate: boolean,
): APIResponse<GameInfo> => {
  try {
    const res = await api.post<GameInfo | ErrorMsg>(`${GAME_API_URL}/create`, {
      auth,
      payload: { gameKey, isPrivate, filtered },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a GET request to get a game
 */
export const getGameById = async (gameId: string, auth: UserAuth): APIResponse<GameInfo> => {
  try {
    const res = await api.get<GameInfo | ErrorMsg>(`${GAME_API_URL}/${gameId}`, {
      params: auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a POST request for all games visible to the authenticated user
 */
export const gameList = async (auth: UserAuth): Promise<GameInfo[] | ErrorMsg> => {
  try {
    const res = await api.post<GameInfo[] | ErrorMsg>(`${GAME_API_URL}/list`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const gameListForUser = async (
  auth: UserAuth,
  username: string,
): Promise<GameInfo[] | ErrorMsg> => {
  try {
    const res = await api.post<GameInfo[] | ErrorMsg>(`${GAME_API_URL}/list/${username}`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
