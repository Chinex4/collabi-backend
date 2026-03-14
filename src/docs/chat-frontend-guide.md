# Chat Frontend Integration Guide

This guide explains how to integrate the current chat backend from a frontend application.

It covers:

- REST endpoints for conversations, messages, uploads, and notifications
- Socket.IO connection and event handling
- Recommended frontend flow for private chat and project chat
- Common response shapes and error handling

## 1. Base URLs

REST API base:

```txt
https://collabi-backend.onrender.com/api
```

Socket.IO base:

```txt
https://collabi-backend.onrender.com
```

The socket server runs on the same origin as Express, but without the `/api` prefix.

## 2. Authentication

Both REST chat endpoints and Socket.IO require an authenticated user.

Use the JWT access token returned from:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/login`

### REST auth header

```http
Authorization: Bearer <accessToken>
```

### Socket auth

```js
import { io } from "socket.io-client";

const socket = io("https://collabi-backend.onrender.com", {
  auth: {
    token: accessToken
  }
});
```

If no token is provided, connection fails with:

```js
connect_error.message === "Authentication token is required"
```

## 3. Standard REST Response Shape

Successful responses:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {},
  "meta": null
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

Paginated endpoints return:

```json
{
  "success": true,
  "message": "Fetched successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

## 4. Main Data Shapes

### Conversation

```json
{
  "_id": "conversationId",
  "type": "private",
  "participants": [],
  "project": null,
  "createdBy": "userId",
  "lastMessage": {},
  "createdAt": "2026-03-14T12:30:00.000Z",
  "updatedAt": "2026-03-14T12:30:00.000Z"
}
```

### Message

```json
{
  "_id": "messageId",
  "conversation": "conversationId",
  "project": "projectId",
  "sender": {},
  "content": "Hello",
  "type": "text",
  "attachments": [],
  "mentions": [],
  "deliveredTo": [],
  "readBy": [],
  "isEdited": false,
  "isDeleted": false,
  "deletedAt": null,
  "createdAt": "2026-03-14T12:30:00.000Z",
  "updatedAt": "2026-03-14T12:30:00.000Z"
}
```

## 5. REST Endpoints To Use

## 5.1 List conversations

`GET /api/chat/conversations`

Query params:

- `page`
- `limit`

Use this for the chat sidebar or inbox list.

## 5.2 Create or fetch a private conversation

`POST /api/chat/conversations/private`

Body:

```json
{
  "participantId": "targetUserId"
}
```

Use this before opening a direct message thread if you do not already have a conversation id.

Important:

- This endpoint creates the conversation if it does not exist
- If it already exists, it returns the existing conversation

## 5.3 Get private conversation messages

`GET /api/chat/conversations/:conversationId/messages`

Query params:

- `page`
- `limit`
- `search`

Use this when opening a private chat thread.

## 5.4 Get project chat messages

`GET /api/chat/projects/:projectId/messages`

Query params:

- `page`
- `limit`

Important:

- Only project members can access this endpoint
- The backend ensures the project conversation exists

## 5.5 Send private message

`POST /api/chat/messages/private`

Body:

```json
{
  "recipientId": "targetUserId",
  "content": "Hello, can we discuss the task?",
  "attachments": []
}
```

Response:

```json
{
  "success": true,
  "message": "Private message sent successfully",
  "data": {
    "conversation": {},
    "message": {}
  }
}
```

## 5.6 Send project message

`POST /api/chat/messages/project`

Body:

```json
{
  "projectId": "projectId",
  "content": "Please review the latest update",
  "attachments": [],
  "mentions": ["userId1", "userId2"]
}
```

Important:

- Only active project members can send project messages
- Mentioned users receive notifications

## 5.7 Mark messages as read

`PATCH /api/chat/conversations/:conversationId/read`

Body:

```json
{
  "messageIds": ["messageId1", "messageId2"]
}
```

Notes:

- `messageIds` is optional
- If omitted, the backend marks unread messages in that conversation as read

## 5.8 Edit message

`PATCH /api/chat/messages/:messageId`

Body:

```json
{
  "content": "Updated message content"
}
```

Important:

- Only the sender can edit a message

## 5.9 Delete message

`DELETE /api/chat/messages/:messageId`

Important:

- Only the sender can delete a message
- The backend soft deletes the message
- Deleted messages come back with:

```json
{
  "isDeleted": true,
  "content": "[message deleted]"
}
```

## 5.10 Upload file for chat attachments

`POST /api/files/upload`

Content type:

```txt
multipart/form-data
```

Fields:

- `file`
- `contextType`
- `contextId`
- `label`

Recommended for chat attachments:

```txt
contextType=chat
```

Example frontend flow:

1. Upload file
2. Get returned file resource id
3. Send message with that id in `attachments`

## 5.11 Notifications

Useful REST endpoints:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/mark-all-read`
- `DELETE /api/notifications/:id`

These are useful for chat badges, unread counters, and mention/message notifications.

## 6. Socket.IO Event Contract

## 6.1 Connection lifecycle

The backend automatically does the following when a user connects:

- authenticates the token
- joins the user to a private room named `user:<userId>`
- emits `presence_update` globally with online status

This means private message delivery does not require a manual room join.

## 6.2 Client events to emit

### `join_project_room`

Use when the user opens a project chat screen.

Payload:

```json
{
  "projectId": "projectId"
}
```

Success response from server:

```json
{
  "projectId": "projectId"
}
```

Event received:

```txt
joined_project_room
```

Failure event:

```txt
socket_error
```

Likely error:

```json
{
  "message": "Only project members can access this resource"
}
```

### `leave_project_room`

Use when the user leaves the project chat screen.

Payload:

```json
{
  "projectId": "projectId"
}
```

Server emits:

```txt
left_project_room
```

### `private_message`

Payload:

```json
{
  "recipientId": "targetUserId",
  "content": "Hello there",
  "attachments": []
}
```

Server emits `private_message` to:

- the recipient room
- the sender socket

Payload returned:

```json
{
  "conversation": {},
  "message": {}
}
```

### `project_message`

Payload:

```json
{
  "projectId": "projectId",
  "content": "Team update",
  "attachments": [],
  "mentions": ["userId"]
}
```

Important:

- The receiving clients must already have joined `project:<projectId>` through `join_project_room`
- If the frontend does not join the room, it will not receive project chat broadcasts in realtime

Server emits:

```txt
project_message
```

Payload:

```json
{
  "conversation": {},
  "message": {}
}
```

### `typing_start`

Private chat payload:

```json
{
  "recipientId": "targetUserId",
  "conversationId": "conversationId"
}
```

Project chat payload:

```json
{
  "projectId": "projectId"
}
```

Server broadcasts:

```txt
typing_start
```

Private chat event payload:

```json
{
  "recipientId": "targetUserId",
  "userId": "senderUserId",
  "conversationId": "conversationId"
}
```

Project chat event payload:

```json
{
  "projectId": "projectId",
  "userId": "senderUserId"
}
```

### `typing_stop`

Same payload contract as `typing_start`.

Server broadcasts:

```txt
typing_stop
```

### `mark_as_read`

Payload:

```json
{
  "conversationId": "conversationId",
  "messageIds": ["messageId1", "messageId2"]
}
```

Server emits back to the current user room:

```txt
messages_read
```

Payload:

```json
{
  "conversationId": "conversationId",
  "messageIds": ["messageId1", "messageId2"]
}
```

Use this to update local read state without waiting for a REST refetch.

### `message_edited`

Payload:

```json
{
  "messageId": "messageId",
  "content": "Edited text"
}
```

Server emits:

```txt
message_edited
```

Payload:

```json
{
  "_id": "messageId",
  "content": "Edited text",
  "isEdited": true
}
```

### `message_deleted`

Payload:

```json
{
  "messageId": "messageId"
}
```

Server emits:

```txt
message_deleted
```

Payload:

```json
{
  "_id": "messageId",
  "content": "[message deleted]",
  "isDeleted": true
}
```

### `presence_update`

Client can emit:

```json
{
  "status": "online"
}
```

Server also emits presence automatically on connect and disconnect.

Payload:

```json
{
  "userId": "userId",
  "status": "online"
}
```

On disconnect:

```json
{
  "userId": "userId",
  "status": "offline",
  "lastSeen": "2026-03-14T12:30:00.000Z"
}
```

## 6.3 Other server events relevant to chat

### `notification:new`

The backend emits this when a user receives:

- a private message notification
- a project mention notification
- other app notifications

Recommended frontend behavior:

- show toast if relevant
- increment unread badge
- optionally refresh notifications list or insert the new notification into local state

### `socket_error`

The backend emits this for socket-level failures such as:

- invalid project membership
- invalid message edit/delete attempt
- validation or service errors

Payload:

```json
{
  "message": "Only project members can access this resource"
}
```

Always listen for this event and surface it in the UI.

## 7. Recommended Frontend Flow

## 7.1 App startup

1. Login or restore session
2. Save access token
3. Open one global socket connection per authenticated user
4. Listen for:
   - `private_message`
   - `project_message`
   - `typing_start`
   - `typing_stop`
   - `messages_read`
   - `message_edited`
   - `message_deleted`
   - `presence_update`
   - `notification:new`
   - `socket_error`

## 7.2 Inbox screen

1. Call `GET /api/chat/conversations`
2. Render conversations ordered by `updatedAt`
3. Optionally call `GET /api/notifications/unread-count`

## 7.3 Opening a private conversation

1. If conversation id is unknown, call `POST /api/chat/conversations/private`
2. Call `GET /api/chat/conversations/:conversationId/messages`
3. Start listening for `private_message`
4. When visible, emit `mark_as_read`

## 7.4 Sending a private message

1. Optional: upload files via `POST /api/files/upload`
2. Emit `private_message`
3. On returned `private_message` event, append or reconcile the message in local state

You can also use the REST endpoint `POST /api/chat/messages/private` if you want a non-socket fallback.

## 7.5 Opening a project chat

1. Call `GET /api/chat/projects/:projectId/messages`
2. Emit `join_project_room`
3. Wait for `joined_project_room`
4. Start listening for `project_message`
5. On screen exit, emit `leave_project_room`

## 7.6 Sending a project message

1. Ensure the room has been joined
2. Optional: upload files first
3. Emit `project_message`
4. Reconcile the returned `project_message` payload into local state

## 7.7 Editing and deleting messages

If the current user is the sender:

- emit `message_edited`
- emit `message_deleted`

Then update local state from the returned broadcast event.

Do not assume success before the socket event arrives.

## 7.8 Typing indicators

For private chat:

- emit `typing_start` when typing begins
- emit `typing_stop` after debounce or when input clears

For project chat:

- same flow, but pass `projectId`

Recommended debounce:

- send `typing_start` once at the beginning
- send `typing_stop` 1 to 2 seconds after the last keystroke

## 8. Suggested Frontend State Model

A practical shape:

```ts
type ChatState = {
  conversations: Conversation[];
  messagesByConversationId: Record<string, Message[]>;
  activeConversationId?: string;
  activeProjectId?: string;
  typingUsersByConversation: Record<string, string[]>;
  typingUsersByProject: Record<string, string[]>;
  onlineUsers: Record<string, { status: "online" | "offline"; lastSeen?: string }>;
  unreadNotificationCount: number;
};
```

## 9. Realtime Reconciliation Rules

Use these rules to keep state stable:

- Deduplicate messages by `_id`
- Replace messages on `message_edited`
- Replace messages on `message_deleted`
- Update conversation `lastMessage` whenever a new message arrives
- Move active conversation/project to the top of the sidebar when a new message comes in
- For read state, update `readBy` or local message read status after `messages_read`

## 10. Important Backend Constraints

- Private messaging does not require joining a room manually
- Project messaging requires joining the project room first
- Only project members can access project chat
- Only the sender can edit or delete a message
- Deleted messages are soft deleted, not removed from history
- Attachments are sent as uploaded file ids, not raw files
- Mention notifications are generated only for project chat mentions

## 11. Minimal Example

```js
const socket = io("https://collabi-backend.onrender.com", {
  auth: { token: accessToken }
});

socket.on("private_message", ({ conversation, message }) => {
  addMessage(conversation._id, message);
});

socket.on("project_message", ({ conversation, message }) => {
  addMessage(conversation._id, message);
});

socket.on("message_edited", (message) => {
  replaceMessage(message);
});

socket.on("message_deleted", (message) => {
  replaceMessage(message);
});

socket.on("socket_error", ({ message }) => {
  showError(message);
});

function openProjectChat(projectId) {
  socket.emit("join_project_room", { projectId });
}

function sendPrivateMessage(recipientId, content, attachments = []) {
  socket.emit("private_message", { recipientId, content, attachments });
}
```

## 12. Recommended Delivery Order For Frontend

Build in this order:

1. Login and token persistence
2. Global socket connection
3. Conversations list
4. Private conversation screen
5. Private realtime send/receive
6. Project chat screen and room join/leave
7. Typing indicators
8. Read receipts
9. Edit/delete
10. File attachments
11. Notifications badge and panel

## 13. References

- Postman collection: `src/docs/postman.collection.json`
- OpenAPI source: `src/docs/swaggerSpec.js`
- Socket server: `src/sockets/index.js`
- Chat routes: `src/routes/chatRoutes.js`
