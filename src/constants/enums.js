const USER_ROLES = {
  STUDENT: "student",
  ADMIN: "admin"
};

const PROJECT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  CLOSED: "closed"
};

const PROJECT_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
  DEPARTMENT_ONLY: "department_only"
};

const APPLICATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn"
};

const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  CANCELLED: "cancelled"
};

const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  LEFT: "left",
  REMOVED: "removed"
};

const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done"
};

const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};

const MESSAGE_TYPE = {
  TEXT: "text",
  FILE: "file",
  IMAGE: "image",
  SYSTEM: "system"
};

const CONVERSATION_TYPE = {
  PRIVATE: "private",
  PROJECT: "project"
};

const NOTIFICATION_TYPE = {
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_DECISION: "application_decision",
  INVITATION_RECEIVED: "invitation_received",
  INVITATION_DECISION: "invitation_decision",
  TEAM_UPDATE: "team_update",
  TASK_ASSIGNED: "task_assigned",
  TASK_UPDATED: "task_updated",
  PRIVATE_MESSAGE: "private_message",
  PROJECT_MESSAGE: "project_message",
  PROJECT_DEADLINE: "project_deadline",
  ADMIN_ANNOUNCEMENT: "admin_announcement",
  REPORT_UPDATE: "report_update"
};

const REPORT_STATUS = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  RESOLVED: "resolved",
  DISMISSED: "dismissed"
};

const REPORT_TARGET_TYPE = {
  USER: "user",
  PROJECT: "project",
  MESSAGE: "message"
};

module.exports = {
  USER_ROLES,
  PROJECT_STATUS,
  PROJECT_VISIBILITY,
  APPLICATION_STATUS,
  INVITATION_STATUS,
  MEMBERSHIP_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  MESSAGE_TYPE,
  CONVERSATION_TYPE,
  NOTIFICATION_TYPE,
  REPORT_STATUS,
  REPORT_TARGET_TYPE
};
