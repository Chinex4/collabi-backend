const http = require("http");
const mongoose = require("mongoose");
const supertest = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../../src/app");
const setupSocket = require("../../src/sockets");
const { generateAccessToken } = require("../../src/utils/token");

const Category = require("../../src/models/Category");
const Conversation = require("../../src/models/Conversation");
const Message = require("../../src/models/Message");
const Notification = require("../../src/models/Notification");
const Project = require("../../src/models/Project");
const ProjectMember = require("../../src/models/ProjectMember");
const User = require("../../src/models/User");

const ensureTestEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-access-secret";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
  process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  process.env.CLIENT_URL = process.env.CLIENT_URL || "http://127.0.0.1";
};

const createHarness = async () => {
  ensureTestEnv();
  const mongoPort = 30000 + Math.floor(Math.random() * 20000);

  const mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: "127.0.0.1",
      port: mongoPort,
      portGeneration: false,
      launchTimeout: 30000
    }
  });
  await mongoose.connect(mongoServer.getUri(), { autoIndex: true });

  const server = http.createServer(app);
  const io = setupSocket(server);
  app.set("io", io);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    request: supertest(server),
    server,
    io,
    baseUrl,
    async clearDatabase() {
      await Promise.all([
        Conversation.deleteMany({}),
        Message.deleteMany({}),
        Notification.deleteMany({}),
        ProjectMember.deleteMany({}),
        Project.deleteMany({}),
        Category.deleteMany({}),
        User.deleteMany({})
      ]);
    },
    async close() {
      io.close();

      if (server.listening) {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }

      await mongoose.disconnect();
      await mongoServer.stop({ force: true });
    }
  };
};

const createUser = async (overrides = {}) => {
  const suffix = new mongoose.Types.ObjectId().toString().slice(-6);
  return User.create({
    fullName: overrides.fullName || `Test User ${suffix}`,
    email: overrides.email || `user-${suffix}@example.com`,
    password: overrides.password || "Password123!",
    role: overrides.role,
    isEmailVerified: overrides.isEmailVerified ?? true,
    ...overrides
  });
};

const getAuthHeader = (user) => `Bearer ${generateAccessToken({ userId: String(user._id) })}`;

const createCategory = async (overrides = {}) =>
  Category.create({
    name: overrides.name || `Category ${new mongoose.Types.ObjectId().toString().slice(-6)}`,
    ...overrides
  });

const createProject = async ({ owner, category, ...overrides }) =>
  Project.create({
    title: overrides.title || "Realtime collaboration",
    description: overrides.description || "Socket-driven collaboration project",
    category: category._id,
    owner: owner._id,
    maxTeamSize: overrides.maxTeamSize || 5,
    currentTeamSize: overrides.currentTeamSize || 1,
    ...overrides
  });

const addProjectMember = async ({ project, user, addedBy, roleName }) =>
  ProjectMember.create({
    project: project._id,
    user: user._id,
    addedBy: addedBy?._id,
    roleName: roleName || "member"
  });

module.exports = {
  createHarness,
  createUser,
  createCategory,
  createProject,
  addProjectMember,
  getAuthHeader,
  models: {
    Conversation,
    Message,
    Notification,
    ProjectMember
  }
};
