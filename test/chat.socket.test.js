const assert = require("node:assert/strict");
const { after, afterEach, before, beforeEach, describe, it } = require("node:test");
const { io: createClient } = require("socket.io-client");

const chatService = require("../src/services/chatService");
const {
  addProjectMember,
  createCategory,
  createHarness,
  createProject,
  createUser,
  getAuthHeader,
  models
} = require("./helpers/chatTestHarness");
const { connectSocket, disconnectSockets, waitForEvent } = require("./helpers/socketTestUtils");

const getSocketToken = (user) => getAuthHeader(user).replace("Bearer ", "");

describe("Chat Socket.IO flows", () => {
  let harness;
  let openSockets = [];

  const connectUserSocket = async (user) => {
    const socket = await connectSocket({
      baseUrl: harness.baseUrl,
      token: getSocketToken(user)
    });

    openSockets.push(socket);
    return socket;
  };

  before(async () => {
    harness = await createHarness();
  });

  beforeEach(async () => {
    await harness.clearDatabase();
  });

  afterEach(async () => {
    await disconnectSockets(...openSockets);
    openSockets = [];
  });

  after(async () => {
    await harness.close();
  });

  it("rejects socket connections without an authentication token", async () => {
    const socket = createClient(harness.baseUrl, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false
    });

    openSockets.push(socket);

    const error = await waitForEvent(socket, "connect_error");

    assert.equal(error.message, "Authentication token is required");
  });

  it("delivers private messages to both the sender and recipient rooms", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });
    const aliceSocket = await connectUserSocket(alice);
    const bobSocket = await connectUserSocket(bob);

    const senderEchoPromise = waitForEvent(
      aliceSocket,
      "private_message",
      (payload) => payload.message.content === "Hello over sockets"
    );
    const recipientDeliveryPromise = waitForEvent(
      bobSocket,
      "private_message",
      (payload) => payload.message.content === "Hello over sockets"
    );

    aliceSocket.emit("private_message", {
      recipientId: String(bob._id),
      content: "Hello over sockets"
    });

    const [senderEcho, recipientDelivery] = await Promise.all([
      senderEchoPromise,
      recipientDeliveryPromise
    ]);

    assert.equal(senderEcho.message.content, "Hello over sockets");
    assert.equal(recipientDelivery.message.content, "Hello over sockets");
    assert.equal(senderEcho.conversation._id, recipientDelivery.conversation._id);
    assert.equal(await models.Notification.countDocuments({ recipient: bob._id }), 1);
  });

  it("joins project rooms for members, rejects outsiders, and broadcasts project messages", async () => {
    const owner = await createUser({ fullName: "Project Owner" });
    const teammate = await createUser({ fullName: "Teammate" });
    const outsider = await createUser({ fullName: "Outsider" });
    const category = await createCategory({ name: "Distributed Systems" });
    const project = await createProject({ owner, category });

    await addProjectMember({ project, user: owner, addedBy: owner, roleName: "owner" });
    await addProjectMember({ project, user: teammate, addedBy: owner });

    const ownerSocket = await connectUserSocket(owner);
    const teammateSocket = await connectUserSocket(teammate);
    const outsiderSocket = await connectUserSocket(outsider);

    const ownerJoinPromise = waitForEvent(ownerSocket, "joined_project_room", null, 10000);
    ownerSocket.emit("join_project_room", { projectId: String(project._id) });
    const ownerJoin = await ownerJoinPromise;

    const teammateJoinPromise = waitForEvent(teammateSocket, "joined_project_room", null, 10000);
    teammateSocket.emit("join_project_room", { projectId: String(project._id) });
    const teammateJoin = await teammateJoinPromise;

    const outsiderErrorPromise = waitForEvent(outsiderSocket, "socket_error", null, 10000);
    outsiderSocket.emit("join_project_room", { projectId: String(project._id) });
    const outsiderError = await outsiderErrorPromise;

    assert.equal(ownerJoin.projectId, String(project._id));
    assert.equal(teammateJoin.projectId, String(project._id));
    assert.equal(outsiderError.message, "Only project members can access this resource");

    const ownerMessagePromise = waitForEvent(
      ownerSocket,
      "project_message",
      (payload) => payload.message.content === "Project room update"
    );
    const teammateMessagePromise = waitForEvent(
      teammateSocket,
      "project_message",
      (payload) => payload.message.content === "Project room update"
    );

    ownerSocket.emit("project_message", {
      projectId: String(project._id),
      content: "Project room update",
      mentions: [String(teammate._id)]
    });

    const [ownerMessage, teammateMessage] = await Promise.all([
      ownerMessagePromise,
      teammateMessagePromise
    ]);

    assert.equal(ownerMessage.message.content, "Project room update");
    assert.equal(teammateMessage.message.project, String(project._id));
    assert.equal(await models.Notification.countDocuments({ recipient: teammate._id }), 1);
  });

  it("forwards typing indicators to private chat recipients", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });
    const aliceSocket = await connectUserSocket(alice);
    const bobSocket = await connectUserSocket(bob);

    const typingStartPromise = waitForEvent(
      bobSocket,
      "typing_start",
      ({ recipientId, userId, conversationId }) =>
        recipientId === String(bob._id) &&
        userId === String(alice._id) &&
        conversationId === "private-conversation"
    );
    const typingStopPromise = waitForEvent(
      bobSocket,
      "typing_stop",
      ({ recipientId, userId, conversationId }) =>
        recipientId === String(bob._id) &&
        userId === String(alice._id) &&
        conversationId === "private-conversation"
    );

    aliceSocket.emit("typing_start", {
      recipientId: String(bob._id),
      conversationId: "private-conversation"
    });
    aliceSocket.emit("typing_stop", {
      recipientId: String(bob._id),
      conversationId: "private-conversation"
    });

    await Promise.all([typingStartPromise, typingStopPromise]);
  });

  it("marks messages as read and emits a receipt update to the reader", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });
    const bobSocket = await connectUserSocket(bob);

    const { conversation, message } = await chatService.sendPrivateMessage({
      userId: alice._id,
      recipientId: bob._id,
      content: "Please mark this as read",
      attachments: [],
      io: null
    });

    const readEventPromise = waitForEvent(
      bobSocket,
      "messages_read",
      ({ conversationId, messageIds }) =>
        conversationId === String(conversation._id) &&
        messageIds.includes(String(message._id))
    );

    bobSocket.emit("mark_as_read", {
      conversationId: String(conversation._id),
      messageIds: [String(message._id)]
    });

    await readEventPromise;

    const updatedMessage = await models.Message.findById(message._id);
    const readByBob = updatedMessage.readBy.find((entry) => String(entry.user) === String(bob._id));

    assert.ok(readByBob);
  });

  it("broadcasts message edits and deletions to conversation participants", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });
    const aliceSocket = await connectUserSocket(alice);
    const bobSocket = await connectUserSocket(bob);

    const { message } = await chatService.sendPrivateMessage({
      userId: alice._id,
      recipientId: bob._id,
      content: "Original socket message",
      attachments: [],
      io: null
    });

    const aliceEditPromise = waitForEvent(
      aliceSocket,
      "message_edited",
      (payload) => String(payload._id) === String(message._id) && payload.content === "Edited by socket"
    );
    const bobEditPromise = waitForEvent(
      bobSocket,
      "message_edited",
      (payload) => String(payload._id) === String(message._id) && payload.content === "Edited by socket"
    );

    aliceSocket.emit("message_edited", {
      messageId: String(message._id),
      content: "Edited by socket"
    });

    await Promise.all([aliceEditPromise, bobEditPromise]);

    const aliceDeletePromise = waitForEvent(
      aliceSocket,
      "message_deleted",
      (payload) => String(payload._id) === String(message._id) && payload.isDeleted === true
    );
    const bobDeletePromise = waitForEvent(
      bobSocket,
      "message_deleted",
      (payload) => String(payload._id) === String(message._id) && payload.isDeleted === true
    );

    aliceSocket.emit("message_deleted", {
      messageId: String(message._id)
    });

    await Promise.all([aliceDeletePromise, bobDeletePromise]);

    const deletedMessage = await models.Message.findById(message._id);

    assert.equal(deletedMessage.isDeleted, true);
    assert.equal(deletedMessage.content, "[message deleted]");
  });
});
