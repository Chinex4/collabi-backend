const express = require("express");

const Category = require("../models/Category");
const Department = require("../models/Department");
const Faculty = require("../models/Faculty");
const Interest = require("../models/Interest");
const Skill = require("../models/Skill");
const adminRoutes = require("./adminRoutes");
const authRoutes = require("./authRoutes");
const buildLookupRouter = require("./buildLookupRouter");
const chatRoutes = require("./chatRoutes");
const fileRoutes = require("./fileRoutes");
const notificationRoutes = require("./notificationRoutes");
const profileRoutes = require("./profileRoutes");
const projectRoutes = require("./projectRoutes");
const reportRoutes = require("./reportRoutes");
const taskRoutes = require("./taskRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/profiles", profileRoutes);
router.use("/skills", buildLookupRouter(Skill, { label: "Skills", singleLabel: "Skill" }));
router.use("/interests", buildLookupRouter(Interest, { label: "Interests", singleLabel: "Interest" }));
router.use("/categories", buildLookupRouter(Category, { label: "Categories", singleLabel: "Category" }));
router.use(
  "/departments",
  buildLookupRouter(Department, { label: "Departments", singleLabel: "Department", populate: "faculty" })
);
router.use("/faculties", buildLookupRouter(Faculty, { label: "Faculties", singleLabel: "Faculty" }));
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/chat", chatRoutes);
router.use("/notifications", notificationRoutes);
router.use("/files", fileRoutes);
router.use("/reports", reportRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
