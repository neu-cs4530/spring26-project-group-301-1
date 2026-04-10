## Playspace

Playspace is a social gaming platform where users can play games, build a
gaming community, and compete with others. Beyond gameplay, users can send
friend requests, invite friends to private games, and message other players
directly. Profiles are customizable with game history, win/loss records, and
UI preferences. A global leaderboard fosters competition and encourages
players to keep improving their rank. Automated opponents let players practice
at any time without waiting for others to be available. A built-in LLM-based
chat filter keeps the environment safe and welcoming.

## Getting Started

1. Please include the following environment variables in file called
   `server/.env`

```
ANTHROPIC_API_KEY=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
MONGO_DB_NAME=GameNiteProd
MONGO_STR=mongodb+srv://kulkarnianushka_db_user:VjwY0j50cbmy2HXS@db-cs4530-spring26-301.ypj1du5.mongodb.net/
NODE_VERSION=24.13.1
TWITCH_CLIENT_ID=v86hpzxaydluxx3d3f7zmqy4z4l373
TWITCH_CLIENT_SECRET=7vckzuk8kmi78dqaxlezf5qh4ubkar
YOUTUBE_CLIENT_ID=286752764664-3engo6qmobj7rruteii6d5n2nbuh42gr.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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
```

2. Run `npm install` in the root directory to install all dependencies for the
   `client`, `server`, and `shared` folders.

### Working on the application

While you're working on the application, it's useful to run it in "development
mode" locally. Development mode watches files for changes and updates the
application when changes happen.

To run gamenite locally in development mode, do one of the following:

1. Run `npm run dev` in the top-level directory
2. Open two terminal windows
   - In the first, navigate to the `server` directory and run `npm run dev`
   - In the second, navigate to the `client` directory and also run
     `npm run dev`

The second terminal window, the one in the `client` directory, shows a URL
that you should go to to preview the application, probably
<http://localhost:4530/>. You can use the default username/password
combinations user0/pwd0000, user1/pwd1111, user2/pwd2222, and user3/pwd3333 to
log in.

### Checking the application

Checks can be run on every part of the application at once by running the
following commands from the repository root:

- `npm run check` - Checks all three projects with TypeScript
- `npm run lint` - Checks all three projects with ESLint
- `npm run test` - Runs Vitest tests on all three projects and end-to-end
  Playwright tests

### Building the application

If you want to deploy the application or build it in production mode, running
`npm run build -w=client` in the root of the repository will create the
production build of the client. Then, the server can be started in production
mode by running `npm start -w=server` and accessed by going to
<http://localhost:8000/>.

## Codebase Folder Structure

- `client`: Contains the frontend application code, responsible for the user
  interface and interacting with the backend. This directory includes all
  React components and related assets.
- `server`: Contains the backend application code, handling the logic, APIs,
  and database interactions. It serves requests from the client and processes
  data accordingly.
- `shared`: Contains all shared type definitions that are used by both the
  client and server. This helps maintain consistency and reduces duplication
  of code between the two folders.

## API Routes

The server provides the following REST endpoints: requests are routed to these
endpoints in `server/src/app.ts`.

#### `/api/game`

| Endpoint          | Method | Description                           |
| ----------------- | ------ | ------------------------------------- |
| `/create`         | POST   | Create new game                       |
| `/list`           | POST   | List all games                        |
| `/list/:username` | POST   | List all games by username            |
| `/:id`            | GET    | Get information about a specific game |

#### `/api/thread`

| Endpoint       | Method | Description                        |
| -------------- | ------ | ---------------------------------- |
| `/create`      | POST   | Create new forum post              |
| `/list`        | GET    | List all forum posts               |
| `/:id`         | GET    | Get information about a forum post |
| `/:id/comment` | POST   | Add a comment to a forum post      |

#### `/api/user`

| Endpoint     | Method | Description                           |
| ------------ | ------ | ------------------------------------- |
| `/list`      | POST   | Get details of a list of users        |
| `/login`     | POST   | Validate username/password entry      |
| `/signup`    | POST   | Create a new user                     |
| `/:username` | POST   | Update user's displayname or password |
| `/:username` | GET    | Get information about a user          |

#### `/api/stats`

| Endpoint       | Method | Description                   |
| -------------- | ------ | ----------------------------- |
| `/leaderboard` | GET    | Get the leaderboard           |
| `/:username`   | GET    | Get stats for a specific user |

#### `/api/friends`

| Endpoint                      | Method | Description                       |
| ----------------------------- | ------ | --------------------------------- |
| `/:username/requests`         | POST   | Get friend requests for a user    |
| `/:username`                  | GET    | Get friends for a user            |
| `/request`                    | POST   | Send a friend request             |
| `/request/:requestId/resolve` | POST   | Resolve a friend request          |
| `/:username/status`           | POST   | Get friendship status with a user |
| `/remove`                     | POST   | Remove a friend                   |

#### `api/oauth`

| Endpoint              | Method | Description                                                                                                   |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `/:platform/verify`   | POST   | Start the OAuth process for the social media platform verification                                            |
| `/:platform/callback` | GET    | Endpoint for external OAuth API for the given platform to send access code to, completes verification process |

#### `/api/dms`

| Endpoint       | Method |Description                                                               |
| -------------- | ------ | ------------------------------------------------------------------------ |
| `/:username`   | POST   | Either creates a new or obtains an existing direct message for a user    |
| `/:dmId/read`  | POST   | Marks a direct message as read for a user                                |
| `/:username`   | GET    | Gets the direct messages for that user                                   |

### Websockets

The Socket.io API for event-driven communication between clients and the
server is detailed in `shared/src/socket.types.ts`.

## Data Architecture

This web application stores information about users, forum posts, and games.
The structure of the data can be described by this diagram:

```mermaid
erDiagram
    Auth {
        string username "unique key"
        userId userId "unique"
        string password ""
    }

    User {
        userId userId "generated key"
        username username "unique"
        string display ""
        string customBackground "optional"
        boolean hideUsername ""
        boolean privateProfile ""
        SocialProfileLink[] profileLinks "optional"
        Date createdAt ""
    }
    User ||--|| Auth: "User.username"
    Auth ||--|| User: "Auth.userId"

    Thread {
        threadId threadId "generated key"
        string title ""
        string text ""
        boolean filtered ""
        Date createdAt ""
        userId createdBy ""
        commentId[] comments ""
    }
    Thread ||--|| User: "Thread.createdBy"
    Thread ||--o{ Comment: "Thread.comments"

    Comment {
        commentId commentId "generated key"
        string text ""
        userId createdBy ""
        Date createdAt ""
        Date editedAt "optional"
    }
    Comment ||--|| User: "Comment.createdBy"

    Game {
        gameId gameId "generated key"
        GameKey type ""
        string status "waiting/active/done"
        boolean chatFiltered ""
        boolean isPrivate ""
        int minPlayers ""
        chatId chat ""
        userId[] players ""
        Date createdAt ""
        userId createdBy ""
    }
    Game ||--|| Chat: "Game.chat"
    Game ||--|| User: "Game.createdBy"
    Game ||--o{ User: "Game.players"

    Chat {
        chatId chatId "generated key"
        messageId[] messages ""
        Date createdAt ""
    }
    Chat ||--o{ Message: "Chat.messages"

    Message {
        messageId messageId "generated key"
        string text ""
        boolean deleted ""
        Date deletedAt "optional"
        Date createdAt ""
    }
    Message ||--|| User: "Message.createdBy"

    DirectMessage {
        dmId dmId "generated key"
        string usernameA ""
        string usernameB ""
        RecordId[] messages ""
        Date lastReadAt ""
        Date createdAt ""
    }
    DirectMessage ||--|| User : "usernameA"
    DirectMessage ||--|| User : "usernameB"
    DirectMessage ||--o{ Message : "DirectMessage.messages"

    FriendRequest {
        requestId requestId "generated key"
        userId from ""
        userId to ""
        string status "pending/accepted/declined"
        Date createdAt ""
        Date resolvedAt "optional"
    }
    FriendRequest ||--|| User: "FriendRequest.from"
    FriendRequest ||--|| User: "FriendRequest.to"
    FriendRecord {
        string usernameA ""
        string usernameB ""
        string friendsSince ""
    }
    FriendRecord ||--|| User : "usernameA"
    FriendRecord ||--|| User : "usernameB"
    UserStats {
        userId userId "foreign key"
        GameKey gameType "optional"
        int wins ""
        int losses ""
        int draws ""
        int gamesPlayed ""
        float winRate ""
    }
    UserStats ||--|| User: "UserStats.userId"
```

## Games

To create a new game `example`, you need to take the following steps:

- In a new file `shared/src/games/example.types.ts`, define the game's state:
  what gets stored on the server as an `ExampleState`, what gets sent to
  players as an `ExampleView`, and what players send as moves as an
  `ExampleMove`.
- In the existing file `shared/src/game.types.ts`:
  - The `ExampleView` needs to be imported from
    `shared/src/games/example.types.ts`.
  - Everything in `shared/src/games/example.ts` file needs be _exported_ (so
    it can be used in other files that import `game.types.ts`).
  - The GameKey `example` needs to be added to `zGameKey` and
    `{ type: 'example'; view: ExampleView }` needs to be added to
    `TaggedGameView`.
- In a new file `server/src/games/example.ts`, the rules of the game, which
  are evaluated in the backend server, need to be added. This file should
  export `exampleLogic` and `exampleGameService`.
- In the existing file `server/src/services/game.service.ts`, the mapping from
  `example` to `exampleGameService` needs to be added to `gameServices`.
- In a new file `client/src/games/ExampleGame.tsx`, a React component
  `ExampleGame` needs to be defined, which takes
  `GameProps<ExampleView, ExampleMove>` as its props.
- In the existing file `client/src/games/GameDispatch.tsx`, a case statement
  for `'example'` needs to be added.
- In the existing file `client/src/util/consts.ts`, a mapping from `example`
  to the user-facing name for the game needs to be added.
