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

## Read Receipts

Read receipt APIs require:

```http
Authorization: Bearer jwt-access-token
```

Mark one message as read:

```http
POST /api/v1/messages/MESSAGE_ID/read
```

Response:

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "MESSAGE_ID",
      "status": "read",
      "readBy": ["USER_ID"]
    }
  }
}
```

Mark a conversation as read:

```http
POST /api/v1/conversations/CONVERSATION_ID/read
```

Response:

```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

Socket read receipt events:

- `message:delivered` - mark one message delivered for the socket user
- `message:read` - mark one message read for the socket user
- `conversation:read` - mark unread messages in a conversation read for the socket user
- `message:read:update` - emitted to the conversation room after read updates

Mark delivered:

```js
socket.emit('message:delivered', { messageId: 'MESSAGE_ID' }, console.log);
```

Mark one message read:

```js
socket.emit('message:read', { messageId: 'MESSAGE_ID' }, console.log);
socket.on('message:read:update', console.log);
```

Mark a conversation read:

```js
socket.emit('conversation:read', { conversationId: 'CONVERSATION_ID' }, console.log);
```

## Typing Indicators

Typing indicators are Socket.IO-only and are not persisted in MongoDB. The sender must be an authenticated participant of the conversation. Events are emitted to other sockets in `conversation:{conversationId}`, not back to the sender.

Start typing:

```js
socket.emit(
  'typing:start',
  {
    conversationId: 'CONVERSATION_ID',
  },
  console.log
);
```

Stop typing:

```js
socket.emit(
  'typing:stop',
  {
    conversationId: 'CONVERSATION_ID',
  },
  console.log
);
```

Listen for typing events:

```js
socket.on('typing:start', ({ conversationId, userId }) => {
  console.log(`${userId} is typing in ${conversationId}`);
});

socket.on('typing:stop', ({ conversationId, userId }) => {
  console.log(`${userId} stopped typing in ${conversationId}`);
});
```

Redis stores short-lived typing state:

```text
typing:{conversationId}:{userId} = true
TTL 5 seconds
```

## Socket.IO Horizontal Scaling

Socket.IO uses the Redis adapter for cross-instance room broadcasts. The app creates dedicated Redis pub/sub clients with `redisClient.duplicate()` so presence and normal Redis commands keep using the existing Redis client.

Run multiple API containers locally:

```bash
docker compose up --scale api=2
```

When scaling with Docker Compose, the API service cannot use a fixed `container_name`. It has been omitted so Compose can create multiple API containers.

Host port mapping also needs care: only one container can bind a host port such as `5001:5000`. For local scaling, either remove/comment the API `ports` mapping and access instances through an external load balancer, or run separate Compose overrides with different host ports.

The Redis adapter is required at startup. If its pub/sub clients cannot connect, the API startup fails clearly instead of silently running without cross-instance Socket.IO delivery.

This project does not include Kubernetes, Nginx/load balancing, cloud deployment, CI/CD, queues, or push notifications.

## Message Edit And Delete

Message edit and delete APIs require:

```http
Authorization: Bearer jwt-access-token
```

Edit a message:

```http
PATCH /api/v1/messages/MESSAGE_ID
Content-Type: application/json

{
  "content": "Updated message"
}
```

Only the sender can edit their own non-deleted text messages. The server updates `editedAt`.

Soft delete a message:

```http
DELETE /api/v1/messages/MESSAGE_ID
```

Only the sender can delete their own message. The server sets `isDeleted = true` and replaces content with:

```text
This message was deleted
```

Socket edit:

```js
socket.emit(
  'message:edit',
  {
    messageId: 'MESSAGE_ID',
    content: 'Updated message',
  },
  console.log
);

socket.on('message:updated', console.log);
```

Socket delete:

```js
socket.emit(
  'message:delete',
  {
    messageId: 'MESSAGE_ID',
  },
  console.log
);

socket.on('message:deleted', console.log);
```

## Message Search

Message search APIs require:

```http
Authorization: Bearer jwt-access-token
```

Global search across conversations where the current user is a participant:

```http
GET /api/v1/messages/search?q=hello&page=1&limit=20
```

Conversation-specific search:

```http
GET /api/v1/conversations/CONVERSATION_ID/messages/search?q=hello&page=1&limit=20
```

Search uses a MongoDB text index on `Message.content`, searches only text messages, excludes deleted messages, and returns newest results first.

Response:

```json
{
  "success": true,
  "data": {
    "messages": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

## Group Chat Management

Group management APIs require:

```http
Authorization: Bearer jwt-access-token
```

Create a group:

```http
POST /api/v1/groups
Content-Type: application/json

{
  "name": "Product Team",
  "participantIds": ["USER_ID_2", "USER_ID_3"]
}
```

The creator is automatically added as a participant and admin. Groups require at least three participants including the creator.

Update group name:

```http
PATCH /api/v1/groups/GROUP_ID
Content-Type: application/json

{
  "name": "Updated Product Team"
}
```

Add members:

```http
POST /api/v1/groups/GROUP_ID/members
Content-Type: application/json

{
  "memberIds": ["USER_ID_4"]
}
```

Remove a member:

```http
DELETE /api/v1/groups/GROUP_ID/members/USER_ID
```

Promote an admin:

```http
POST /api/v1/groups/GROUP_ID/admins
Content-Type: application/json

{
  "userId": "USER_ID"
}
```

Remove an admin:

```http
DELETE /api/v1/groups/GROUP_ID/admins/USER_ID
```

Leave a group:

```http
POST /api/v1/groups/GROUP_ID/leave
```

Only group admins can update groups, add/remove members, and add/remove admins. Direct conversations cannot be modified through group routes.

Group socket broadcasts are emitted to `conversation:{groupId}`:

- `group:updated`
- `group:member:added`
- `group:member:removed`
- `group:admin:added`
- `group:admin:removed`
- `group:left`

Listen for updates:

```js
socket.emit('conversation:join', { conversationId: 'GROUP_ID' }, console.log);

socket.on('group:updated', console.log);
socket.on('group:member:added', console.log);
socket.on('group:member:removed', console.log);
socket.on('group:admin:added', console.log);
socket.on('group:admin:removed', console.log);
socket.on('group:left', console.log);
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
- Delivered and read receipts
- Socket.IO typing indicators
- Message edit and soft delete
- Secure MongoDB text message search
- Group chat management
- Socket.IO Redis adapter scaling

Not included yet:

- File uploads
- Delete for me
- Edit history
- Attachments
- Moderation
- Admin delete
- Time limits for edit or delete
- Group avatar upload
- Invite links
- Mute group
- Pin messages
- Reactions
- Threads
- Push notifications
- Elasticsearch
- Redis search
- Typo-tolerant search
- Attachment search
- Search highlights
- Kubernetes deployment
- Nginx load balancer
- AWS deployment
- CI/CD
- Message queue
