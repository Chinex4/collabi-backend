const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("../config/db");
const Category = require("../models/Category");
const Conversation = require("../models/Conversation");
const Department = require("../models/Department");
const Faculty = require("../models/Faculty");
const Interest = require("../models/Interest");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const PlatformSetting = require("../models/PlatformSetting");
const Project = require("../models/Project");
const ProjectApplication = require("../models/ProjectApplication");
const ProjectInvitation = require("../models/ProjectInvitation");
const ProjectMember = require("../models/ProjectMember");
const Skill = require("../models/Skill");
const StudentProfile = require("../models/StudentProfile");
const Task = require("../models/Task");
const User = require("../models/User");

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    Skill.deleteMany({}),
    Interest.deleteMany({}),
    Category.deleteMany({}),
    Department.deleteMany({}),
    Faculty.deleteMany({}),
    Project.deleteMany({}),
    ProjectApplication.deleteMany({}),
    ProjectInvitation.deleteMany({}),
    ProjectMember.deleteMany({}),
    Task.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    PlatformSetting.deleteMany({}),
  ]);

  const [
    engineering,
    science,
    managementSciences,
    socialSciences,
    arts,
    education,
    healthSciences,
    agriculture,
  ] = await Faculty.create([
    { name: "Faculty of Engineering", description: "Engineering programmes" },
    { name: "Faculty of Science", description: "Science programmes" },
    {
      name: "Faculty of Management Sciences",
      description: "Management and business programmes",
    },
    {
      name: "Faculty of Social Sciences",
      description: "Social science programmes",
    },
    { name: "Faculty of Arts", description: "Arts and humanities programmes" },
    {
      name: "Faculty of Education",
      description: "Teacher education and academic training programmes",
    },
    {
      name: "Faculty of Health Sciences",
      description: "Health and medical related programmes",
    },
    {
      name: "Faculty of Agriculture",
      description: "Agriculture and related programmes",
    },
  ]);

  const [
    computerScience,
    softwareEngineering,
    electricalEngineering,
    mechanicalEngineering,
    civilEngineering,
    informationTechnology,
    mathematics,
    physics,
    chemistry,
    microbiology,
    biochemistry,
    accounting,
    businessAdministration,
    economics,
    massCommunication,
    politicalScience,
    englishLanguage,
    educationalManagement,
    publicHealth,
    nursing,
    cropScience,
    animalScience,
  ] = await Department.create([
    { name: "Computer Science", faculty: science._id },
    { name: "Software Engineering", faculty: engineering._id },
    { name: "Electrical Engineering", faculty: engineering._id },
    { name: "Mechanical Engineering", faculty: engineering._id },
    { name: "Civil Engineering", faculty: engineering._id },
    { name: "Information Technology", faculty: science._id },
    { name: "Mathematics", faculty: science._id },
    { name: "Physics", faculty: science._id },
    { name: "Chemistry", faculty: science._id },
    { name: "Microbiology", faculty: science._id },
    { name: "Biochemistry", faculty: science._id },
    { name: "Accounting", faculty: managementSciences._id },
    { name: "Business Administration", faculty: managementSciences._id },
    { name: "Economics", faculty: socialSciences._id },
    { name: "Mass Communication", faculty: socialSciences._id },
    { name: "Political Science", faculty: socialSciences._id },
    { name: "English Language", faculty: arts._id },
    { name: "Educational Management", faculty: education._id },
    { name: "Public Health", faculty: healthSciences._id },
    { name: "Nursing", faculty: healthSciences._id },
    { name: "Crop Science", faculty: agriculture._id },
    { name: "Animal Science", faculty: agriculture._id },
  ]);

  const [
    webDev,
    mobileDev,
    uiux,
    aiMl,
    projectManagement,
    backendDevelopment,
    frontendDevelopment,
    dataAnalysis,
    dataScience,
    cloudComputing,
    cybersecurity,
    devops,
    graphicsDesign,
    productDesign,
    technicalWriting,
    digitalMarketing,
    embeddedSystems,
    robotics,
    blockchain,
    databaseManagement,
  ] = await Skill.create([
    { name: "Web Development" },
    { name: "Mobile Development" },
    { name: "UI/UX Design" },
    { name: "AI/ML" },
    { name: "Project Management" },
    { name: "Backend Development" },
    { name: "Frontend Development" },
    { name: "Data Analysis" },
    { name: "Data Science" },
    { name: "Cloud Computing" },
    { name: "Cybersecurity" },
    { name: "DevOps" },
    { name: "Graphics Design" },
    { name: "Product Design" },
    { name: "Technical Writing" },
    { name: "Digital Marketing" },
    { name: "Embedded Systems" },
    { name: "Robotics" },
    { name: "Blockchain Development" },
    { name: "Database Management" },
  ]);

  const [
    fintechInterest,
    healthTechInterest,
    edTechInterest,
    agriTechInterest,
    climateTechInterest,
    civicTechInterest,
    eCommerceInterest,
    roboticsInterest,
    gamingInterest,
    creatorEconomyInterest,
    logisticsInterest,
    socialImpactInterest,
  ] = await Interest.create([
    { name: "FinTech" },
    { name: "HealthTech" },
    { name: "EdTech" },
    { name: "AgriTech" },
    { name: "ClimateTech" },
    { name: "CivicTech" },
    { name: "E-Commerce" },
    { name: "Robotics" },
    { name: "Gaming" },
    { name: "Creator Economy" },
    { name: "Logistics" },
    { name: "Social Impact" },
  ]);

  const [
    aiCategory,
    webCategory,
    iotCategory,
    mobileCategory,
    fintechCategory,
    healthCategory,
    educationCategory,
    designCategory,
    cybersecurityCategory,
    blockchainCategory,
    dataCategory,
    roboticsCategory,
  ] = await Category.create([
    { name: "Artificial Intelligence" },
    { name: "Web Platform" },
    { name: "Internet of Things" },
    { name: "Mobile Application" },
    { name: "Financial Technology" },
    { name: "Health Innovation" },
    { name: "Education Technology" },
    { name: "Design and User Experience" },
    { name: "Cybersecurity" },
    { name: "Blockchain" },
    { name: "Data and Analytics" },
    { name: "Robotics and Automation" },
  ]);

  const [admin, ada, tunde, grace] = await User.create([
    {
      fullName: "Platform Admin",
      email: "admin@studentcollab.com",
      password: "Admin@12345",
      role: "admin",
      faculty: engineering._id,
      department: softwareEngineering._id,
      level: 500,
      isEmailVerified: true,
    },
    {
      fullName: "Ada Lovelace",
      email: "ada@studentcollab.com",
      password: "Password@123",
      faculty: science._id,
      department: computerScience._id,
      level: 400,
      isEmailVerified: true,
    },
    {
      fullName: "Tunde Bako",
      email: "tunde@studentcollab.com",
      password: "Password@123",
      faculty: engineering._id,
      department: softwareEngineering._id,
      level: 400,
      isEmailVerified: true,
    },
    {
      fullName: "Grace Okafor",
      email: "grace@studentcollab.com",
      password: "Password@123",
      faculty: engineering._id,
      department: electricalEngineering._id,
      level: 500,
      isEmailVerified: true,
    },
  ]);

  await StudentProfile.create([
    {
      user: ada._id,
      faculty: science._id,
      department: computerScience._id,
      level: 400,
      bio: "Backend-focused student interested in AI-powered university systems.",
      skills: [
        { skill: webDev._id, level: "advanced" },
        { skill: aiMl._id, level: "intermediate" },
      ],
      interests: [edTechInterest._id, healthTechInterest._id],
      availability: "available",
      preferredRoles: ["backend developer", "researcher"],
      portfolioLinks: {
        github: "https://github.com/ada-student",
        linkedin: "https://linkedin.com/in/ada-student",
      },
    },
    {
      user: tunde._id,
      faculty: engineering._id,
      department: softwareEngineering._id,
      level: 400,
      bio: "Full-stack student who enjoys building collaboration products.",
      skills: [
        { skill: webDev._id, level: "advanced" },
        { skill: projectManagement._id, level: "intermediate" },
      ],
      interests: [fintechInterest._id, edTechInterest._id],
      availability: "available",
      preferredRoles: ["team lead", "frontend developer"],
    },
    {
      user: grace._id,
      faculty: engineering._id,
      department: electricalEngineering._id,
      level: 500,
      bio: "Embedded systems student working on IoT and sensing projects.",
      skills: [
        { skill: mobileDev._id, level: "intermediate" },
        { skill: uiux._id, level: "beginner" },
      ],
      interests: [healthTechInterest._id],
      availability: "busy",
      preferredRoles: ["embedded engineer", "tester"],
    },
  ]);

  const [attendanceProject, smartFarmProject] = await Project.create([
    {
      title: "AI Attendance Monitoring System",
      description:
        "A face recognition based attendance platform for lecture halls.",
      category: aiCategory._id,
      owner: ada._id,
      department: computerScience._id,
      faculty: science._id,
      requiredSkills: [aiMl._id, webDev._id],
      optionalSkills: [projectManagement._id],
      maxTeamSize: 4,
      currentTeamSize: 2,
      deadline: new Date("2026-07-01"),
      tags: ["ai", "attendance", "education"],
    },
    {
      title: "Smart Farm Monitoring Dashboard",
      description:
        "An IoT dashboard for tracking soil moisture and crop conditions.",
      category: iotCategory._id,
      owner: grace._id,
      department: electricalEngineering._id,
      faculty: engineering._id,
      requiredSkills: [mobileDev._id, uiux._id],
      optionalSkills: [webDev._id],
      maxTeamSize: 5,
      currentTeamSize: 2,
      deadline: new Date("2026-08-15"),
      tags: ["iot", "agriculture", "dashboard"],
    },
  ]);

  await ProjectMember.create([
    {
      project: attendanceProject._id,
      user: ada._id,
      roleName: "owner",
      addedBy: ada._id,
    },
    {
      project: attendanceProject._id,
      user: tunde._id,
      roleName: "frontend developer",
      addedBy: ada._id,
    },
    {
      project: smartFarmProject._id,
      user: grace._id,
      roleName: "owner",
      addedBy: grace._id,
    },
  ]);

  const [attendanceConversation, farmConversation] = await Conversation.create([
    {
      type: "project",
      project: attendanceProject._id,
      createdBy: ada._id,
      participants: [ada._id, tunde._id],
    },
    {
      type: "project",
      project: smartFarmProject._id,
      createdBy: grace._id,
      participants: [grace._id],
    },
  ]);

  const [task1, task2] = await Task.create([
    {
      title: "Design attendance API",
      description: "Create the REST API for attendance submission and reports.",
      project: attendanceProject._id,
      createdBy: ada._id,
      assignedTo: [ada._id, tunde._id],
      status: "in_progress",
      priority: "high",
      dueDate: new Date("2026-04-15"),
      progress: 45,
      activityLog: [
        { action: "task_created", actor: ada._id, note: "Initial task seeded" },
      ],
    },
    {
      title: "Set up soil sensor data flow",
      description: "Integrate sample IoT payloads into the dashboard backend.",
      project: smartFarmProject._id,
      createdBy: grace._id,
      assignedTo: [grace._id],
      status: "todo",
      priority: "medium",
      dueDate: new Date("2026-05-01"),
      activityLog: [
        {
          action: "task_created",
          actor: grace._id,
          note: "Initial task seeded",
        },
      ],
    },
  ]);

  const [message1] = await Message.create([
    {
      conversation: attendanceConversation._id,
      project: attendanceProject._id,
      sender: ada._id,
      content:
        "Let us split the attendance module into recognition and reporting.",
      deliveredTo: [{ user: ada._id }, { user: tunde._id }],
      readBy: [{ user: ada._id }],
    },
  ]);

  await Conversation.findByIdAndUpdate(attendanceConversation._id, {
    lastMessage: message1._id,
  });

  await Notification.create([
    {
      recipient: tunde._id,
      sender: ada._id,
      type: "task_assigned",
      title: "Task assigned",
      message: "You have been assigned to Design attendance API.",
      data: { taskId: task1._id, projectId: attendanceProject._id },
    },
    {
      recipient: ada._id,
      sender: tunde._id,
      type: "project_message",
      title: "Project chat update",
      message: "Tunde sent a project message.",
      data: {
        conversationId: attendanceConversation._id,
        projectId: attendanceProject._id,
      },
    },
  ]);

  await ProjectApplication.create({
    project: smartFarmProject._id,
    applicant: tunde._id,
    message: "I can help with the monitoring dashboard frontend.",
  });

  await ProjectInvitation.create({
    project: attendanceProject._id,
    invitedUser: grace._id,
    invitedBy: ada._id,
    message:
      "Your embedded systems experience would help with the camera hardware setup.",
    proposedRole: "hardware integration",
  });

  await PlatformSetting.create([
    {
      key: "maintenance_mode",
      value: false,
      description: "Controls whether the platform is in maintenance mode",
      isPublic: true,
    },
    {
      key: "support_email",
      value: "support@studentcollab.com",
      description: "Support contact email",
      isPublic: true,
    },
  ]);

  console.log("Database seeded successfully");
  console.log("Admin email: admin@studentcollab.com");
  console.log("Admin password: Admin@12345");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seeder failed:", error);
  process.exit(1);
});
