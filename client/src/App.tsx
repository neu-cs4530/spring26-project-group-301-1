/* eslint no-console: "off" */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login.tsx";
import type { AuthContext } from "./contexts/LoginContext.ts";
import Layout from "./components/Layout.tsx";
import Home from "./pages/Home.tsx";
import ThreadList from "./pages/ThreadList.tsx";
import Profile from "./pages/Profile.tsx";
import { io } from "socket.io-client";
import type { GameSocket } from "./util/types.ts";
import LoggedInRoute from "./components/LoggedInRoute.tsx";
import NewGame from "./pages/NewGame.tsx";
import Game from "./pages/Game.tsx";
import GameList from "./pages/GameList.tsx";
import ThreadPage from "./pages/ThreadPage.tsx";
import { ErrorBoundary } from "react-error-boundary";
import fallback from "./fallback.tsx";
import NewThread from "./pages/NewThread.tsx";
import OAuthResult from "./pages/OAuthResult.tsx";
import TimeContextKeeper from "./components/UpdatingTimeContext.tsx";
import { DmContextProvider } from "./contexts/DmContext.tsx";
import DirectMessageList from "./pages/DirectMessageList.tsx";
import DirectMessage from "./pages/DirectMessage.tsx";
import { Provider } from "./components/ui/provider.tsx";
import Particles from "./components/ui/Particles.tsx";

/** If `true`, all incoming socket messages will be logged */
const DEBUG_SOCKETS = false;

/**
 * Websocket connection for the app. It would be natural to define this in a
 * useEffect hook, but the React docts advise against this.
 * https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application
 * */
let socket: GameSocket | null = null;
if (typeof window !== "undefined") {
  socket = io();
  if (DEBUG_SOCKETS) {
    socket.onAny((tag, payload) => {
      console.log(`from socket got ${tag}(${JSON.stringify(payload)})`);
    });
  }
}

function NoSuchRoute() {
  const { pathname } = useLocation();
  return `No page found for route '${pathname}'`;
}

export default function App() {
  const [auth, setAuth] = useState<AuthContext | null>(null);
  return (
    socket && (
      <>
        {/* <div style={{ width: '1080px', height: '1080px', position: 'relative' }}>
          <Grainient
            color1="#69adec"
            color2="#3ebb85"
            color3="#deda7d"
            timeSpeed={1.1}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div> */}
        <div className="particles-bg">
          <Particles
            particleColors={["#7494eb", "#6af89e", "#fff06b"]}
            particleCount={500}
            particleSpread={10}
            speed={0.075}
            particleBaseSize={300}
            moveParticlesOnHover={false}
            alphaParticles={false}
            disableRotation={false}
            pixelRatio={1}
          />
        </div>
        <Provider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login setAuth={(auth) => setAuth(auth)} />} />
              <Route path="/oauth" element={<OAuthResult />} />
              <Route
                element={
                  <LoggedInRoute auth={auth} socket={socket}>
                    <DmContextProvider>
                      <TimeContextKeeper updateFrequency={20 * 1000}>
                        <ErrorBoundary fallbackRender={fallback}>
                          <Layout />
                        </ErrorBoundary>
                      </TimeContextKeeper>
                    </DmContextProvider>
                  </LoggedInRoute>
                }
              >
                <Route path="/" element={<Home />} />
                <Route path="/forum" element={<ThreadList />} />
                <Route path="/forum/post/new" element={<NewThread />} />
                <Route path="/forum/post/:threadId" element={<ThreadPage />} />
                <Route path="/games" element={<GameList />} />
                <Route path="/game/new" element={<NewGame />} />
                <Route path="/game/:gameId" element={<Game />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/messages" element={<DirectMessageList />}>
                  <Route path=":dmId" element={<DirectMessage />} />
                </Route>
                <Route path="/*" element={<NoSuchRoute />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </Provider>
      </>
    )
  );
}
