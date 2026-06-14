# realtime-chat-backend-nodejs

Recruiter-grade backend scaffold for a realtime chat system. Phase 1 establishes the production-oriented foundation only: Express, environment configuration, MongoDB, Redis, Winston logging, validation plumbing, centralized errors, health checks, and Docker support.

Authentication and Socket.IO presence foundation are available. Chat messages, conversations, groups, read receipts, and typing indicators are intentionally not implemented yet.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Redis
- JWT-ready dependencies
- Socket.IO-ready dependencies
- Winston
- Docker and Docker Compose
- ESLint and Prettier

## Folder Structure

```text
.
├── src
│   ├── app.js
│   ├── server.js
│   ├── config
│   │   ├── database.js
│   │   ├── env.js
│   │   └── redis.js
│   ├── controllers
│   │   └── health.controller.js
│   ├── middlewares
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── routes
│   │   ├── health.routes.js
│   │   └── index.js
│   ├── services
│   ├── utils
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   └── logger.js
│   └── validators
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Getting Started

Create a local environment file:

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Run with Docker:

```bash
docker compose up --build
```

## Health Check

```http
GET /api/v1/health
```

Example response:

```json
{
  "success": true,
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-06-14T00:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Scripts

- `npm start` - start the production server
- `npm run dev` - start the development server with Nodemon
- `npm run lint` - run ESLint
- `npm run lint:fix` - fix ESLint issues
- `npm run format` - format files with Prettier
- `npm run format:check` - check formatting

## Socket.IO Realtime Foundation

Socket.IO is attached to the existing HTTP server and uses the same CORS configuration as Express.

Clients must authenticate with a valid JWT access token:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  auth: {
    token: 'jwt-access-token',
  },
});
```

The token must be sent in:

```text
socket.handshake.auth.token
```

Connections are rejected when the token is missing, invalid, expired, or belongs to an inactive user.

### Socket Events

- `connection` - authenticated socket connection
- `disconnect` - socket disconnect cleanup
- `user:online` - emitted when a user transitions online
- `user:offline` - emitted when a user has no remaining active sockets
- `presence:get` - fetch online/offline status for user IDs

### Presence Flow

Redis keys:

```text
presence:user:{userId} -> online
user:sockets:{userId} -> Set of socket IDs
```

On connect:

- Add `socket.id` to `user:sockets:{userId}`
- Set `presence:user:{userId}` to `online`
- Emit `user:online` when the first socket for that user connects

On disconnect:

- Remove `socket.id` from `user:sockets:{userId}`
- If no sockets remain, delete `presence:user:{userId}`
- Emit `user:offline`

Get presence:

```js
socket.emit(
  'presence:get',
  {
    userIds: ['id1', 'id2'],
  },
  (response) => {
    console.log(response);
  }
);
```

Response:

```json
{
  "success": true,
  "data": {
    "id1": "online",
    "id2": "offline"
  }
}
```

## Conversations And Messages

All conversation and message APIs require:

```http
Authorization: Bearer jwt-access-token
```

### Conversation APIs

Create or return an existing direct conversation:

```http
POST /api/v1/conversations/direct
Content-Type: application/json

{
  "participantId": "USER_ID"
}
```

Create a group conversation:

```http
POST /api/v1/conversations/group
Content-Type: application/json

{
  "name": "Project Team",
  "participantIds": ["USER_ID_2", "USER_ID_3"]
}
```

List conversations:

```http
GET /api/v1/conversations
```

Get one conversation:

```http
GET /api/v1/conversations/CONVERSATION_ID
```

### Message APIs

List conversation messages:

```http
GET /api/v1/conversations/CONVERSATION_ID/messages
```

Create a message:

```http
POST /api/v1/conversations/CONVERSATION_ID/messages
Content-Type: application/json

{
  "content": "Hello from REST",
  "type": "text"
}
```

Only participants can fetch or create messages.

### Messaging Socket Events

- `conversation:join` - join `conversation:{conversationId}` after participant validation
- `conversation:leave` - leave a conversation room
- `message:send` - persist a message, then emit it to the room
- `message:new` - emitted to `conversation:{conversationId}` after MongoDB save
- `message:delivered` - emitted when online participants can be marked delivered

Join a conversation:

```js
socket.emit(
  'conversation:join',
  {
    conversationId: 'CONVERSATION_ID',
  },
  console.log
);
```

Send a realtime message:

```js
socket.emit(
  'message:send',
  {
    conversationId: 'CONVERSATION_ID',
    content: 'Hello from Socket.IO',
    type: 'text',
  },
  console.log
);

socket.on('message:new', console.log);
socket.on('message:delivered', console.log);
```

## Current Scope

Included:

- Production-grade Express app setup
- MVC-friendly folder structure
- Service layer directories
- Environment validation with Joi
- MongoDB and Redis connection modules
- Winston logger
- Centralized 404 and error handling
- Request validation middleware
- Health-check endpoint
- Dockerfile and Docker Compose
- ESLint and Prettier setup
- JWT authentication APIs
- Socket.IO JWT authentication
- Redis-backed user presence
- Direct and group conversations
- MongoDB message persistence
- Basic realtime message delivery

Not included yet:

- Read receipts
- Typing indicators
- File uploads
- Message edit
- Message delete
- Advanced group admin management
- Push notifications
