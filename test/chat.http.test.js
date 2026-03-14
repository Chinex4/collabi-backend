const assert = require("node:assert/strict");
const { after, before, beforeEach, describe, it } = require("node:test");

const {
  addProjectMember,
  createCategory,
  createHarness,
  createProject,
  createUser,
  getAuthHeader,
  models
} = require("./helpers/chatTestHarness");

describe("Chat HTTP endpoints", () => {
  let harness;

  before(async () => {
    harness = await createHarness();
  });

  beforeEach(async () => {
    await harness.clearDatabase();
  });

  after(async () => {
    await harness.close();
  });

  it("creates and reuses a private conversation", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });

    const firstResponse = await harness.request
      .post("/api/chat/conversations/private")
      .set("Authorization", getAuthHeader(alice))
      .send({ participantId: String(bob._id) })
      .expect(200);

    const secondResponse = await harness.request
      .post("/api/chat/conversations/private")
      .set("Authorization", getAuthHeader(alice))
      .send({ participantId: String(bob._id) })
      .expect(200);

    assert.equal(firstResponse.body.success, true);
    assert.equal(firstResponse.body.data._id, secondResponse.body.data._id);
    assert.equal(await models.Conversation.countDocuments(), 1);
  });

  it("sends a private message and exposes it through conversation endpoints", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });

    const messageResponse = await harness.request
      .post("/api/chat/messages/private")
      .set("Authorization", getAuthHeader(alice))
      .send({
        recipientId: String(bob._id),
        content: "Hello Bob"
      })
      .expect(201);

    const conversationId = messageResponse.body.data.conversation._id;
    const messageId = messageResponse.body.data.message._id;

    assert.equal(messageResponse.body.data.message.content, "Hello Bob");
    assert.equal(await models.Notification.countDocuments({ recipient: bob._id }), 1);

    const conversationsResponse = await harness.request
      .get("/api/chat/conversations")
      .set("Authorization", getAuthHeader(alice))
      .expect(200);

    assert.equal(conversationsResponse.body.data.length, 1);
    assert.equal(conversationsResponse.body.data[0]._id, conversationId);

    const messagesResponse = await harness.request
      .get(`/api/chat/conversations/${conversationId}/messages`)
      .set("Authorization", getAuthHeader(bob))
      .expect(200);

    assert.equal(messagesResponse.body.data.length, 1);
    assert.equal(messagesResponse.body.data[0]._id, messageId);
    assert.equal(messagesResponse.body.data[0].content, "Hello Bob");
  });

  it("marks private messages as read for the authenticated participant", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });

    const sendResponse = await harness.request
      .post("/api/chat/messages/private")
      .set("Authorization", getAuthHeader(alice))
      .send({
        recipientId: String(bob._id),
        content: "Please confirm"
      })
      .expect(201);

    const conversationId = sendResponse.body.data.conversation._id;
    const messageId = sendResponse.body.data.message._id;

    await harness.request
      .patch(`/api/chat/conversations/${conversationId}/read`)
      .set("Authorization", getAuthHeader(bob))
      .send({ messageIds: [messageId] })
      .expect(200);

    const message = await models.Message.findById(messageId);
    const readByBob = message.readBy.find((entry) => String(entry.user) === String(bob._id));

    assert.ok(readByBob);
  });

  it("edits and deletes a message while blocking non-senders from editing", async () => {
    const alice = await createUser({ fullName: "Alice Sender" });
    const bob = await createUser({ fullName: "Bob Receiver" });

    const sendResponse = await harness.request
      .post("/api/chat/messages/private")
      .set("Authorization", getAuthHeader(alice))
      .send({
        recipientId: String(bob._id),
        content: "Original message"
      })
      .expect(201);

    const messageId = sendResponse.body.data.message._id;

    await harness.request
      .patch(`/api/chat/messages/${messageId}`)
      .set("Authorization", getAuthHeader(bob))
      .send({ content: "Trying to hijack the message" })
      .expect(403);

    const editResponse = await harness.request
      .patch(`/api/chat/messages/${messageId}`)
      .set("Authorization", getAuthHeader(alice))
      .send({ content: "Edited message" })
      .expect(200);

    assert.equal(editResponse.body.data.content, "Edited message");
    assert.equal(editResponse.body.data.isEdited, true);

    const deleteResponse = await harness.request
      .delete(`/api/chat/messages/${messageId}`)
      .set("Authorization", getAuthHeader(alice))
      .expect(200);

    assert.equal(deleteResponse.body.data.isDeleted, true);
    assert.equal(deleteResponse.body.data.content, "[message deleted]");
  });

  it("sends project messages for members and denies non-members from fetching the project chat", async () => {
    const owner = await createUser({ fullName: "Project Owner" });
    const teammate = await createUser({ fullName: "Teammate" });
    const outsider = await createUser({ fullName: "Outsider" });
    const category = await createCategory({ name: "Realtime Systems" });
    const project = await createProject({ owner, category });

    await addProjectMember({ project, user: owner, addedBy: owner, roleName: "owner" });
    await addProjectMember({ project, user: teammate, addedBy: owner });

    const sendResponse = await harness.request
      .post("/api/chat/messages/project")
      .set("Authorization", getAuthHeader(owner))
      .send({
        projectId: String(project._id),
        content: "Please review the websocket flow",
        mentions: [String(teammate._id)]
      })
      .expect(201);

    assert.equal(sendResponse.body.data.message.project, String(project._id));
    assert.equal(await models.Notification.countDocuments({ recipient: teammate._id }), 1);

    const projectMessagesResponse = await harness.request
      .get(`/api/chat/projects/${project._id}/messages`)
      .set("Authorization", getAuthHeader(teammate))
      .expect(200);

    assert.equal(projectMessagesResponse.body.data.length, 1);
    assert.equal(projectMessagesResponse.body.data[0].content, "Please review the websocket flow");

    const forbiddenResponse = await harness.request
      .get(`/api/chat/projects/${project._id}/messages`)
      .set("Authorization", getAuthHeader(outsider))
      .expect(403);

    assert.equal(forbiddenResponse.body.success, false);
  });
});
