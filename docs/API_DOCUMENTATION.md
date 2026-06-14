# Realtime Chat Backend API Documentation

Base URL:

```text
http://localhost:5001
```

Common authenticated header:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Common error response:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Health

### Health Check

| Field | Value |
| --- | --- |
| API name | Health Check |
| Method | GET |
| Endpoint | `/api/v1/health` |
| Auth required | No |

Headers: none

Path params: none

Query params: none

Request body: none

Curl:

```bash
curl -X GET "http://localhost:5001/api/v1/health"
```

Success response:

```json
{
  "success": true,
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-06-14T00:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Auth

### Register

| Field | Value |
| --- | --- |
| API name | Register User |
| Method | POST |
| Endpoint | `/api/v1/auth/register` |
| Auth required | No |

Headers:

```http
Content-Type: application/json
```

Path params: none

Query params: none

Request body:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "StrongPass@123"
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Example User","email":"user@example.com","password":"StrongPass@123"}'
```

Success response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Example User",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "lastLoginAt": null
    },
    "tokens": {
      "accessToken": "ACCESS_TOKEN",
      "refreshToken": "REFRESH_TOKEN"
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Email is already registered"
}
```

### Login

| Field | Value |
| --- | --- |
| API name | Login User |
| Method | POST |
| Endpoint | `/api/v1/auth/login` |
| Auth required | No |

Headers:

```http
Content-Type: application/json
```

Path params: none

Query params: none

Request body:

```json
{
  "email": "user@example.com",
  "password": "StrongPass@123"
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass@123"}'
```

Success response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Example User",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "lastLoginAt": "2026-06-14T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "ACCESS_TOKEN",
      "refreshToken": "REFRESH_TOKEN"
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Refresh Token

| Field | Value |
| --- | --- |
| API name | Refresh Token |
| Method | POST |
| Endpoint | `/api/v1/auth/refresh-token` |
| Auth required | No |

Headers:

```http
Content-Type: application/json
```

Path params: none

Query params: none

Request body:

```json
{
  "refreshToken": "REFRESH_TOKEN"
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```

Success response:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "_id": "USER_ID",
      "email": "user@example.com"
    },
    "tokens": {
      "accessToken": "ACCESS_TOKEN",
      "refreshToken": "REFRESH_TOKEN"
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

### Logout

| Field | Value |
| --- | --- |
| API name | Logout |
| Method | POST |
| Endpoint | `/api/v1/auth/logout` |
| Auth required | No |

Headers:

```http
Content-Type: application/json
```

Path params: none

Query params: none

Request body:

```json
{
  "refreshToken": "REFRESH_TOKEN"
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```

Success response:

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Me

| Field | Value |
| --- | --- |
| API name | Get Current User |
| Method | GET |
| Endpoint | `/api/v1/auth/me` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params: none

Query params: none

Request body: none

Curl:

```bash
curl -X GET "http://localhost:5001/api/v1/auth/me" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Example User",
      "email": "user@example.com",
      "role": "user",
      "isActive": true
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Authentication token is required"
}
```

## Conversations

### Create Direct Conversation

| Field | Value |
| --- | --- |
| API name | Create Direct Conversation |
| Method | POST |
| Endpoint | `/api/v1/conversations/direct` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params: none

Query params: none

Request body:

```json
{
  "participantId": "USER_ID"
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/conversations/direct" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantId":"USER_ID"}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "CONVERSATION_ID",
      "type": "direct",
      "participants": [],
      "admins": [],
      "lastMessage": null,
      "isActive": true
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Direct conversation requires two distinct participants"
}
```

### Create Group Conversation

| Field | Value |
| --- | --- |
| API name | Create Group Conversation |
| Method | POST |
| Endpoint | `/api/v1/conversations/group` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params: none

Query params: none

Request body:

```json
{
  "name": "Project Team",
  "participantIds": ["USER_ID", "USER_ID"]
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/conversations/group" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Project Team","participantIds":["USER_ID","USER_ID"]}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "CONVERSATION_ID",
      "type": "group",
      "name": "Project Team",
      "participants": [],
      "admins": [],
      "isActive": true
    }
  }
}
```

### List Conversations

| Field | Value |
| --- | --- |
| API name | List Conversations |
| Method | GET |
| Endpoint | `/api/v1/conversations` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params: none

Query params: none

Request body: none

Curl:

```bash
curl -X GET "http://localhost:5001/api/v1/conversations" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "conversations": []
  }
}
```

### Get Conversation

| Field | Value |
| --- | --- |
| API name | Get Conversation |
| Method | GET |
| Endpoint | `/api/v1/conversations/:conversationId` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
conversationId = CONVERSATION_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X GET "http://localhost:5001/api/v1/conversations/CONVERSATION_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "CONVERSATION_ID",
      "type": "direct",
      "participants": []
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Conversation not found"
}
```

## Messages

### List Messages

| Field | Value |
| --- | --- |
| API name | List Conversation Messages |
| Method | GET |
| Endpoint | `/api/v1/conversations/:conversationId/messages` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
conversationId = CONVERSATION_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X GET "http://localhost:5001/api/v1/conversations/CONVERSATION_ID/messages" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "messages": []
  }
}
```

### Create Message

| Field | Value |
| --- | --- |
| API name | Create Message |
| Method | POST |
| Endpoint | `/api/v1/conversations/:conversationId/messages` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params:

```text
conversationId = CONVERSATION_ID
```

Query params: none

Request body:

```json
{
  "content": "Hello world",
  "type": "text"
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/conversations/CONVERSATION_ID/messages" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello world","type":"text"}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "MESSAGE_ID",
      "conversationId": "CONVERSATION_ID",
      "content": "Hello world",
      "type": "text",
      "status": "sent",
      "isDeleted": false
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "You are not a participant of this conversation"
}
```

## Read Receipts

### Mark Message Read

| Field | Value |
| --- | --- |
| API name | Mark Message As Read |
| Method | POST |
| Endpoint | `/api/v1/messages/:messageId/read` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
messageId = MESSAGE_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/messages/MESSAGE_ID/read" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "MESSAGE_ID",
      "status": "read",
      "readBy": []
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Sender cannot mark own message as read"
}
```

### Mark Conversation Read

| Field | Value |
| --- | --- |
| API name | Mark Conversation As Read |
| Method | POST |
| Endpoint | `/api/v1/conversations/:conversationId/read` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
conversationId = CONVERSATION_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/conversations/CONVERSATION_ID/read" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

## Message Edit/Delete

### Edit Message

| Field | Value |
| --- | --- |
| API name | Edit Message |
| Method | PATCH |
| Endpoint | `/api/v1/messages/:messageId` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params:

```text
messageId = MESSAGE_ID
```

Query params: none

Request body:

```json
{
  "content": "Updated message"
}
```

Curl:

```bash
curl -X PATCH "http://localhost:5001/api/v1/messages/MESSAGE_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated message"}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "MESSAGE_ID",
      "content": "Updated message",
      "editedAt": "2026-06-14T00:00:00.000Z"
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Only the sender can modify this message"
}
```

### Delete Message

| Field | Value |
| --- | --- |
| API name | Soft Delete Message |
| Method | DELETE |
| Endpoint | `/api/v1/messages/:messageId` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
messageId = MESSAGE_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X DELETE "http://localhost:5001/api/v1/messages/MESSAGE_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "MESSAGE_ID",
      "content": "This message was deleted",
      "isDeleted": true
    }
  }
}
```

## Message Search

### Global Message Search

| Field | Value |
| --- | --- |
| API name | Global Message Search |
| Method | GET |
| Endpoint | `/api/v1/messages/search` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params: none

Query params:

```text
q = search text
page = 1
limit = 20
```

Request body: none

Curl:

```bash
curl -X GET "http://localhost:5001/api/v1/messages/search?q=hello&page=1&limit=20" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

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

### Conversation Message Search

| Field | Value |
| --- | --- |
| API name | Conversation Message Search |
| Method | GET |
| Endpoint | `/api/v1/conversations/:conversationId/messages/search` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
conversationId = CONVERSATION_ID
```

Query params:

```text
q = search text
page = 1
limit = 20
```

Request body: none

Curl:

```bash
curl -X GET "http://localhost:5001/api/v1/conversations/CONVERSATION_ID/messages/search?q=hello&page=1&limit=20" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

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

## Groups

### Create Group

| Field | Value |
| --- | --- |
| API name | Create Group |
| Method | POST |
| Endpoint | `/api/v1/groups` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params: none

Query params: none

Request body:

```json
{
  "name": "Product Team",
  "participantIds": ["USER_ID", "USER_ID"]
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/groups" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Product Team","participantIds":["USER_ID","USER_ID"]}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "GROUP_ID",
      "type": "group",
      "name": "Product Team",
      "participants": [],
      "admins": []
    }
  }
}
```

### Update Group

| Field | Value |
| --- | --- |
| API name | Update Group |
| Method | PATCH |
| Endpoint | `/api/v1/groups/:groupId` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params:

```text
groupId = GROUP_ID
```

Query params: none

Request body:

```json
{
  "name": "Updated Product Team"
}
```

Curl:

```bash
curl -X PATCH "http://localhost:5001/api/v1/groups/GROUP_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Product Team"}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "GROUP_ID",
      "name": "Updated Product Team"
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Only group admins can perform this action"
}
```

### Add Members

| Field | Value |
| --- | --- |
| API name | Add Group Members |
| Method | POST |
| Endpoint | `/api/v1/groups/:groupId/members` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params:

```text
groupId = GROUP_ID
```

Query params: none

Request body:

```json
{
  "memberIds": ["USER_ID"]
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/groups/GROUP_ID/members" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"memberIds":["USER_ID"]}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "GROUP_ID",
      "participants": []
    }
  }
}
```

### Remove Member

| Field | Value |
| --- | --- |
| API name | Remove Group Member |
| Method | DELETE |
| Endpoint | `/api/v1/groups/:groupId/members/:userId` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
groupId = GROUP_ID
userId = USER_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X DELETE "http://localhost:5001/api/v1/groups/GROUP_ID/members/USER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "GROUP_ID",
      "participants": []
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Group creator cannot be removed"
}
```

### Promote Admin

| Field | Value |
| --- | --- |
| API name | Promote Group Admin |
| Method | POST |
| Endpoint | `/api/v1/groups/:groupId/admins` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Path params:

```text
groupId = GROUP_ID
```

Query params: none

Request body:

```json
{
  "userId": "USER_ID"
}
```

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/groups/GROUP_ID/admins" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "GROUP_ID",
      "admins": []
    }
  }
}
```

### Remove Admin

| Field | Value |
| --- | --- |
| API name | Remove Group Admin |
| Method | DELETE |
| Endpoint | `/api/v1/groups/:groupId/admins/:userId` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
groupId = GROUP_ID
userId = USER_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X DELETE "http://localhost:5001/api/v1/groups/GROUP_ID/admins/USER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "GROUP_ID",
      "admins": []
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Group must have at least one admin"
}
```

### Leave Group

| Field | Value |
| --- | --- |
| API name | Leave Group |
| Method | POST |
| Endpoint | `/api/v1/groups/:groupId/leave` |
| Auth required | Yes |

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Path params:

```text
groupId = GROUP_ID
```

Query params: none

Request body: none

Curl:

```bash
curl -X POST "http://localhost:5001/api/v1/groups/GROUP_ID/leave" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Success response:

```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "GROUP_ID",
      "participants": [],
      "admins": []
    }
  }
}
```

## Socket.IO Documentation

Connection URL:

```text
http://localhost:5001
```

JWT token usage:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  auth: {
    token: 'ACCESS_TOKEN',
  },
});
```

Alternative query token:

```js
const socket = io('http://localhost:5001', {
  query: {
    token: 'ACCESS_TOKEN',
  },
});
```

### Presence Events

`user:online`

Payload:

```json
{
  "userId": "USER_ID"
}
```

Listen:

```js
socket.on('user:online', console.log);
```

`user:offline`

Payload:

```json
{
  "userId": "USER_ID"
}
```

Listen:

```js
socket.on('user:offline', console.log);
```

`presence:get`

Emit payload:

```json
{
  "userIds": ["USER_ID"]
}
```

Example:

```js
socket.emit('presence:get', { userIds: ['USER_ID'] }, console.log);
```

Response:

```json
{
  "success": true,
  "data": {
    "USER_ID": "online"
  }
}
```

### Conversation Room Events

`conversation:join`

Payload:

```json
{
  "conversationId": "CONVERSATION_ID"
}
```

Example:

```js
socket.emit('conversation:join', { conversationId: 'CONVERSATION_ID' }, console.log);
```

`conversation:leave`

Payload:

```json
{
  "conversationId": "CONVERSATION_ID"
}
```

Example:

```js
socket.emit('conversation:leave', { conversationId: 'CONVERSATION_ID' }, console.log);
```

### Messaging Events

`message:send`

Payload:

```json
{
  "conversationId": "CONVERSATION_ID",
  "content": "Hello from Socket.IO",
  "type": "text"
}
```

Example:

```js
socket.emit(
  'message:send',
  { conversationId: 'CONVERSATION_ID', content: 'Hello from Socket.IO', type: 'text' },
  console.log
);
```

`message:new`

Listen:

```js
socket.on('message:new', ({ conversationId, message }) => {
  console.log(conversationId, message);
});
```

`message:delivered`

Emit payload:

```json
{
  "messageId": "MESSAGE_ID"
}
```

Example:

```js
socket.emit('message:delivered', { messageId: 'MESSAGE_ID' }, console.log);
socket.on('message:delivered', console.log);
```

### Read Receipt Events

`message:read`

Payload:

```json
{
  "messageId": "MESSAGE_ID"
}
```

Example:

```js
socket.emit('message:read', { messageId: 'MESSAGE_ID' }, console.log);
```

`conversation:read`

Payload:

```json
{
  "conversationId": "CONVERSATION_ID"
}
```

Example:

```js
socket.emit('conversation:read', { conversationId: 'CONVERSATION_ID' }, console.log);
```

`message:read:update`

Listen:

```js
socket.on('message:read:update', console.log);
```

### Typing Events

`typing:start`

Payload:

```json
{
  "conversationId": "CONVERSATION_ID"
}
```

Example:

```js
socket.emit('typing:start', { conversationId: 'CONVERSATION_ID' }, console.log);
socket.on('typing:start', console.log);
```

`typing:stop`

Payload:

```json
{
  "conversationId": "CONVERSATION_ID"
}
```

Example:

```js
socket.emit('typing:stop', { conversationId: 'CONVERSATION_ID' }, console.log);
socket.on('typing:stop', console.log);
```

### Message Edit/Delete Events

`message:edit`

Payload:

```json
{
  "messageId": "MESSAGE_ID",
  "content": "Updated message"
}
```

Example:

```js
socket.emit('message:edit', { messageId: 'MESSAGE_ID', content: 'Updated message' }, console.log);
socket.on('message:updated', console.log);
```

`message:delete`

Payload:

```json
{
  "messageId": "MESSAGE_ID"
}
```

Example:

```js
socket.emit('message:delete', { messageId: 'MESSAGE_ID' }, console.log);
socket.on('message:deleted', console.log);
```

### Group Events

Server broadcasts these events to `conversation:{GROUP_ID}` rooms:

```text
group:updated
group:member:added
group:member:removed
group:admin:added
group:admin:removed
group:left
```

Example:

```js
socket.emit('conversation:join', { conversationId: 'GROUP_ID' }, console.log);

socket.on('group:updated', console.log);
socket.on('group:member:added', console.log);
socket.on('group:member:removed', console.log);
socket.on('group:admin:added', console.log);
socket.on('group:admin:removed', console.log);
socket.on('group:left', console.log);
```
