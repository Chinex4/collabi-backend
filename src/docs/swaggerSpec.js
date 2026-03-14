const localPort = process.env.PORT || 5001;

const bearerAuth = [{ bearerAuth: [] }];

const objectIdSchema = {
  type: "string",
  example: "67cf9b5ea7f1e1d4130d91b2"
};

const dateTimeSchema = {
  type: "string",
  format: "date-time",
  example: "2026-03-14T12:30:00.000Z"
};

const successResponse = ({ description, dataSchema, metaSchema, messageExample }) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: messageExample || description },
          data: dataSchema || { nullable: true },
          meta: metaSchema || { nullable: true }
        }
      }
    }
  }
});

const errorResponse = (description, statusCodeExample) => ({
  description,
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ErrorResponse"
      },
      examples: {
        default: {
          value: {
            success: false,
            message: description,
            errors: statusCodeExample ? [{ code: statusCodeExample }] : []
          }
        }
      }
    }
  }
});

const idPathParam = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: objectIdSchema
});

const pageQueryParam = {
  name: "page",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1, default: 1 }
};

const limitQueryParam = {
  name: "limit",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1, maximum: 100, default: 10 }
};

const searchQueryParam = {
  name: "search",
  in: "query",
  required: false,
  schema: { type: "string" }
};

const paginationMetaSchema = {
  type: "object",
  properties: {
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 10 },
    total: { type: "integer", example: 42 },
    pages: { type: "integer", example: 5 }
  }
};

const paginatedDataSchema = (ref) => ({
  type: "array",
  items: { $ref: ref }
});

const createLookupPaths = ({ path, tag, schemaRef, hasFaculty = false }) => ({
  [path]: {
    get: {
      tags: [tag],
      summary: `List ${tag.toLowerCase()}`,
      parameters: [pageQueryParam, limitQueryParam, searchQueryParam],
      responses: {
        200: successResponse({
          description: `${tag} fetched successfully`,
          dataSchema: paginatedDataSchema(schemaRef),
          metaSchema: paginationMetaSchema
        })
      }
    },
    post: {
      tags: [tag],
      summary: `Create ${tag.slice(0, -1).toLowerCase()}`,
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string", example: `${tag.slice(0, -1)} name` },
                description: { type: "string", example: `Description for ${tag.toLowerCase()}` },
                ...(hasFaculty ? { faculty: objectIdSchema } : {})
              }
            }
          }
        }
      },
      responses: {
        201: successResponse({
          description: `${tag.slice(0, -1)} created successfully`,
          dataSchema: { $ref: schemaRef }
        }),
        401: errorResponse("Unauthorized"),
        403: errorResponse("Forbidden")
      }
    }
  },
  [`${path}/{id}`]: {
    get: {
      tags: [tag],
      summary: `Get ${tag.slice(0, -1).toLowerCase()} by id`,
      parameters: [idPathParam("id", `${tag.slice(0, -1)} id`)],
      responses: {
        200: successResponse({
          description: `${tag.slice(0, -1)} fetched successfully`,
          dataSchema: { $ref: schemaRef }
        }),
        404: errorResponse("Resource not found")
      }
    },
    patch: {
      tags: [tag],
      summary: `Update ${tag.slice(0, -1).toLowerCase()}`,
      security: bearerAuth,
      parameters: [idPathParam("id", `${tag.slice(0, -1)} id`)],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                isActive: { type: "boolean" },
                ...(hasFaculty ? { faculty: objectIdSchema } : {})
              }
            }
          }
        }
      },
      responses: {
        200: successResponse({
          description: `${tag.slice(0, -1)} updated successfully`,
          dataSchema: { $ref: schemaRef }
        }),
        401: errorResponse("Unauthorized"),
        403: errorResponse("Forbidden")
      }
    },
    delete: {
      tags: [tag],
      summary: `Delete ${tag.slice(0, -1).toLowerCase()}`,
      security: bearerAuth,
      parameters: [idPathParam("id", `${tag.slice(0, -1)} id`)],
      responses: {
        200: successResponse({
          description: `${tag.slice(0, -1)} deleted successfully`,
          dataSchema: { $ref: schemaRef }
        }),
        401: errorResponse("Unauthorized"),
        403: errorResponse("Forbidden")
      }
    }
  }
});

const buildSwaggerSpec = () => {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Student Project Collaboration Platform API",
      version: "1.0.0",
      description:
        "Complete REST API documentation for the Student Project Collaboration Platform backend built with Express, MongoDB, JWT, and Socket.IO."
    },
    servers: [
      {
        url: `http://localhost:${localPort}`,
        description: "Local development server"
      },
      {
        url: `https://collabi-backend.onrender.com`,
        description: "Production server"
      },
    ],
    tags: [
      { name: "Health", description: "Service health checks" },
      { name: "Auth", description: "Authentication and account lifecycle" },
      { name: "Users", description: "Search users" },
      { name: "Profiles", description: "Student profiles" },
      { name: "Skills", description: "Skill lookup management" },
      { name: "Interests", description: "Interest lookup management" },
      { name: "Categories", description: "Project category management" },
      { name: "Departments", description: "Department lookup management" },
      { name: "Faculties", description: "Faculty lookup management" },
      { name: "Projects", description: "Project discovery and management" },
      { name: "Applications", description: "Project applications" },
      { name: "Invitations", description: "Project invitations" },
      { name: "Members", description: "Project membership management" },
      { name: "Tasks", description: "Task and task comment management" },
      { name: "Chat", description: "Private and project chat endpoints" },
      { name: "Notifications", description: "In-app notifications" },
      { name: "Files", description: "Multer + Cloudinary uploads" },
      { name: "Reports", description: "Student moderation reports" },
      { name: "Admin", description: "Admin dashboard, moderation, analytics, and settings" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                oneOf: [{ type: "string" }, { type: "object", additionalProperties: true }]
              }
            }
          }
        },
        ObjectId: objectIdSchema,
        BasicUser: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            fullName: { type: "string", example: "Ada Lovelace" },
            email: { type: "string", format: "email", example: "ada@studentcollab.com" },
            role: { type: "string", enum: ["student", "admin"], example: "student" },
            level: { type: "integer", example: 400 },
            profileImage: {
              type: "object",
              properties: {
                url: { type: "string", example: "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg" },
                publicId: { type: "string", example: "student-collab/profile/avatar" }
              }
            },
            faculty: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Faculty" }] },
            department: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Department" }] },
            isEmailVerified: { type: "boolean", example: true },
            isActive: { type: "boolean", example: true },
            isSuspended: { type: "boolean", example: false },
            createdAt: dateTimeSchema
          }
        },
        AuthTokens: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/BasicUser" },
            accessToken: { type: "string", example: "eyJhbGciOi..." },
            refreshToken: { type: "string", example: "eyJhbGciOi..." }
          }
        },
        Lookup: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            name: { type: "string", example: "Web Development" },
            slug: { type: "string", example: "web-development" },
            description: { type: "string", example: "Frontend and backend web technologies" },
            isActive: { type: "boolean", example: true },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        Faculty: {
          allOf: [{ $ref: "#/components/schemas/Lookup" }]
        },
        Department: {
          allOf: [
            { $ref: "#/components/schemas/Lookup" },
            {
              type: "object",
              properties: {
                faculty: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Faculty" }] }
              }
            }
          ]
        },
        Skill: {
          allOf: [{ $ref: "#/components/schemas/Lookup" }]
        },
        Interest: {
          allOf: [{ $ref: "#/components/schemas/Lookup" }]
        },
        Category: {
          allOf: [{ $ref: "#/components/schemas/Lookup" }]
        },
        FileResource: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            uploader: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            contextType: { type: "string", enum: ["profile", "project", "task", "chat", "general"] },
            contextId: objectIdSchema,
            originalName: { type: "string", example: "requirements.pdf" },
            folder: { type: "string", example: "student-collab/project" },
            url: { type: "string", example: "https://res.cloudinary.com/demo/raw/upload/v1/file.pdf" },
            publicId: { type: "string", example: "student-collab/project/uuid-file" },
            mimeType: { type: "string", example: "application/pdf" },
            size: { type: "integer", example: 245760 },
            resourceType: { type: "string", example: "raw" },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        StudentProfile: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            user: { $ref: "#/components/schemas/BasicUser" },
            faculty: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Faculty" }] },
            department: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Department" }] },
            level: { type: "integer", example: 400 },
            bio: { type: "string", example: "Backend-focused student interested in AI projects." },
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Skill" }] },
                  level: {
                    type: "string",
                    enum: ["beginner", "intermediate", "advanced", "expert"]
                  }
                }
              }
            },
            interests: {
              type: "array",
              items: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Interest" }] }
            },
            availability: {
              type: "string",
              enum: ["available", "busy", "unavailable"],
              example: "available"
            },
            academicInfo: {
              type: "object",
              properties: {
                matricNumber: { type: "string", example: "CSC/2022/001" },
                cgpa: { type: "number", example: 4.25 }
              }
            },
            portfolioLinks: {
              type: "object",
              properties: {
                github: { type: "string", example: "https://github.com/ada-student" },
                linkedin: { type: "string", example: "https://linkedin.com/in/ada-student" },
                portfolio: { type: "string", example: "https://ada.dev" }
              }
            },
            projectPreferences: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Category" }] }
                },
                preferredCommitment: { type: "string", example: "part-time" },
                projectType: { type: "string", example: "research" }
              }
            },
            preferredRoles: {
              type: "array",
              items: { type: "string" }
            },
            pastProjectExperience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  role: { type: "string" },
                  year: { type: "integer", example: 2025 }
                }
              }
            },
            visibility: {
              type: "string",
              enum: ["public", "private", "department_only"]
            },
            profilePicture: {
              type: "object",
              properties: {
                url: { type: "string" },
                publicId: { type: "string" }
              }
            },
            completedProjectsCount: { type: "integer", example: 2 },
            currentProjectsCount: { type: "integer", example: 1 },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        ProjectAttachment: {
          type: "object",
          properties: {
            file: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/FileResource" }] },
            label: { type: "string", example: "Requirements document" }
          }
        },
        Project: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            title: { type: "string", example: "AI Attendance Monitoring System" },
            description: { type: "string", example: "A face recognition based attendance platform." },
            category: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Category" }] },
            owner: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            department: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Department" }] },
            faculty: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Faculty" }] },
            requiredSkills: {
              type: "array",
              items: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Skill" }] }
            },
            optionalSkills: {
              type: "array",
              items: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Skill" }] }
            },
            maxTeamSize: { type: "integer", example: 4 },
            currentTeamSize: { type: "integer", example: 2 },
            deadline: dateTimeSchema,
            status: {
              type: "string",
              enum: ["open", "in_progress", "completed", "cancelled", "closed"]
            },
            visibility: {
              type: "string",
              enum: ["public", "private", "department_only"]
            },
            tags: { type: "array", items: { type: "string" } },
            attachments: {
              type: "array",
              items: { $ref: "#/components/schemas/ProjectAttachment" }
            },
            recruitmentOpen: { type: "boolean", example: true },
            isDeleted: { type: "boolean", example: false },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        ProjectApplication: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            project: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Project" }] },
            applicant: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            message: { type: "string", example: "I can help with the backend and database design." },
            status: { type: "string", enum: ["pending", "accepted", "rejected", "withdrawn"] },
            reviewedBy: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            reviewedAt: dateTimeSchema,
            reviewNote: { type: "string", example: "Team is already full" },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        ProjectInvitation: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            project: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Project" }] },
            invitedUser: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            invitedBy: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            message: { type: "string", example: "Your IoT experience would be useful on this project." },
            proposedRole: { type: "string", example: "hardware integration" },
            status: { type: "string", enum: ["pending", "accepted", "declined", "cancelled"] },
            respondedAt: dateTimeSchema,
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        ProjectMember: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            project: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Project" }] },
            user: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            roleName: { type: "string", example: "frontend developer" },
            status: { type: "string", enum: ["active", "left", "removed"] },
            joinedAt: dateTimeSchema,
            addedBy: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        Task: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            title: { type: "string", example: "Design attendance API" },
            description: { type: "string", example: "Create REST endpoints for attendance records." },
            project: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Project" }] },
            createdBy: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            assignedTo: {
              type: "array",
              items: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] }
            },
            status: { type: "string", enum: ["todo", "in_progress", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: dateTimeSchema,
            progress: { type: "integer", minimum: 0, maximum: 100, example: 45 },
            attachments: { type: "array", items: { $ref: "#/components/schemas/FileResource" } },
            activityLog: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string", example: "task_created" },
                  actor: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
                  note: { type: "string", example: "Task created" },
                  createdAt: dateTimeSchema
                }
              }
            },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        TaskComment: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            task: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Task" }] },
            user: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            content: { type: "string", example: "I have started working on this task." },
            editedAt: dateTimeSchema,
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        Conversation: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            type: { type: "string", enum: ["private", "project"] },
            participants: {
              type: "array",
              items: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] }
            },
            project: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Project" }] },
            createdBy: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            lastMessage: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Message" }] },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        MessageReceipt: {
          type: "object",
          properties: {
            user: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            at: dateTimeSchema
          }
        },
        Message: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            conversation: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Conversation" }] },
            project: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/Project" }] },
            sender: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            content: { type: "string", example: "Can you review the latest API design?" },
            type: { type: "string", enum: ["text", "file", "image", "system"] },
            attachments: { type: "array", items: { $ref: "#/components/schemas/FileResource" } },
            mentions: { type: "array", items: objectIdSchema },
            deliveredTo: { type: "array", items: { $ref: "#/components/schemas/MessageReceipt" } },
            readBy: { type: "array", items: { $ref: "#/components/schemas/MessageReceipt" } },
            isEdited: { type: "boolean", example: false },
            isDeleted: { type: "boolean", example: false },
            deletedAt: dateTimeSchema,
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        Notification: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            recipient: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            sender: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            type: {
              type: "string",
              enum: [
                "application_submitted",
                "application_decision",
                "invitation_received",
                "invitation_decision",
                "team_update",
                "task_assigned",
                "task_updated",
                "private_message",
                "project_message",
                "project_deadline",
                "admin_announcement",
                "report_update"
              ]
            },
            title: { type: "string", example: "Invitation received" },
            message: { type: "string", example: "You have been invited to join a project." },
            data: { type: "object", additionalProperties: true },
            isRead: { type: "boolean", example: false },
            readAt: dateTimeSchema,
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        Report: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            reporter: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            targetType: { type: "string", enum: ["user", "project", "message"] },
            targetId: objectIdSchema,
            reason: { type: "string", example: "Spam" },
            description: { type: "string", example: "This project description is abusive." },
            status: { type: "string", enum: ["pending", "reviewed", "resolved", "dismissed"] },
            reviewedBy: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            reviewedAt: dateTimeSchema,
            resolutionNote: { type: "string", example: "User warned and content removed" },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        AuditLog: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            actor: { oneOf: [objectIdSchema, { $ref: "#/components/schemas/BasicUser" }] },
            action: { type: "string", example: "suspend_user" },
            targetType: { type: "string", example: "user" },
            targetId: objectIdSchema,
            details: { type: "object", additionalProperties: true },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        PlatformSetting: {
          type: "object",
          properties: {
            _id: objectIdSchema,
            key: { type: "string", example: "maintenance_mode" },
            value: { oneOf: [{ type: "boolean" }, { type: "string" }, { type: "number" }, { type: "object" }] },
            description: { type: "string", example: "Controls whether the platform is in maintenance mode" },
            isPublic: { type: "boolean", example: true },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema
          }
        },
        DashboardAnalytics: {
          type: "object",
          properties: {
            overview: {
              type: "object",
              properties: {
                totalUsers: { type: "integer" },
                totalStudents: { type: "integer" },
                totalAdmins: { type: "integer" },
                activeUsers7Days: { type: "integer" },
                activeUsers30Days: { type: "integer" },
                totalProjects: { type: "integer" },
                openProjects: { type: "integer" },
                completedProjects: { type: "integer" },
                totalTeams: { type: "integer" }
              }
            },
            charts: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { type: "object", additionalProperties: true }
              }
            }
          }
        }
      }
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Service health check",
          responses: {
            200: successResponse({
              description: "API is running",
              dataSchema: {
                type: "object",
                properties: {
                  env: { type: "string", example: "development" }
                }
              }
            })
          }
        }
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new student account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fullName", "email", "password", "level"],
                  properties: {
                    fullName: { type: "string", example: "Ada Lovelace" },
                    email: { type: "string", format: "email", example: "ada@studentcollab.com" },
                    password: { type: "string", example: "Password@123" },
                    faculty: objectIdSchema,
                    department: objectIdSchema,
                    level: { type: "integer", example: 400 }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Registration successful",
              dataSchema: { $ref: "#/components/schemas/AuthTokens" },
              messageExample: "Registration successful"
            }),
            409: errorResponse("Email is already registered")
          }
        }
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login as a student or admin",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Login successful",
              dataSchema: { $ref: "#/components/schemas/AuthTokens" }
            }),
            401: errorResponse("Invalid email or password"),
            403: errorResponse("Email not verified or account suspended")
          }
        }
      },
      "/api/auth/admin/login": {
        post: {
          tags: ["Auth"],
          summary: "Login as admin",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Admin login successful",
              dataSchema: { $ref: "#/components/schemas/AuthTokens" }
            }),
            403: errorResponse("This account cannot access this route")
          }
        }
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    refreshToken: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Token refreshed successfully",
              dataSchema: { $ref: "#/components/schemas/AuthTokens" }
            }),
            401: errorResponse("Invalid refresh token")
          }
        }
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Send OTP for password reset",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "If the email exists, a password reset OTP has been sent"
            })
          }
        }
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password with email and OTP",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "otp", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    otp: { type: "string", example: "123456" },
                    password: { type: "string", example: "NewPassword@123" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Password reset successful",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            }),
            400: errorResponse("Reset OTP is invalid or expired")
          }
        }
      },
      "/api/auth/verify-email": {
        post: {
          tags: ["Auth"],
          summary: "Verify student email with OTP",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "otp"],
                  properties: {
                    email: { type: "string", format: "email" },
                    otp: { type: "string", example: "123456" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Email verified successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            }),
            400: errorResponse("Verification OTP is invalid or expired")
          }
        }
      },
      "/api/auth/resend-verification-otp": {
        post: {
          tags: ["Auth"],
          summary: "Resend verification OTP",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "If the account exists and is not verified, a new verification OTP has been sent"
            })
          }
        }
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout current user",
          security: bearerAuth,
          responses: {
            200: successResponse({ description: "Logged out successfully" }),
            401: errorResponse("Unauthorized")
          }
        }
      },
      "/api/auth/change-password": {
        post: {
          tags: ["Auth"],
          summary: "Change current password",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["currentPassword", "newPassword"],
                  properties: {
                    currentPassword: { type: "string" },
                    newPassword: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Password changed successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            }),
            400: errorResponse("Current password is incorrect")
          }
        }
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current authenticated user",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Authenticated user fetched successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            }),
            401: errorResponse("Unauthorized")
          }
        }
      },
      "/api/auth/deactivate": {
        patch: {
          tags: ["Auth"],
          summary: "Deactivate own account",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Account deactivated successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        }
      },
      "/api/auth/delete-account": {
        delete: {
          tags: ["Auth"],
          summary: "Soft-delete own account",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Account deleted successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        }
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "Search users",
          security: bearerAuth,
          parameters: [
            pageQueryParam,
            limitQueryParam,
            searchQueryParam,
            { name: "role", in: "query", schema: { type: "string", enum: ["student", "admin"] } },
            { name: "department", in: "query", schema: objectIdSchema },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
            { name: "sortBy", in: "query", schema: { type: "string", example: "-createdAt" } }
          ],
          responses: {
            200: successResponse({
              description: "Users fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/BasicUser"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/profiles": {
        get: {
          tags: ["Profiles"],
          summary: "Search student profiles",
          parameters: [
            pageQueryParam,
            limitQueryParam,
            searchQueryParam,
            { name: "department", in: "query", schema: objectIdSchema },
            { name: "faculty", in: "query", schema: objectIdSchema },
            { name: "skill", in: "query", schema: objectIdSchema },
            { name: "interest", in: "query", schema: objectIdSchema },
            {
              name: "availability",
              in: "query",
              schema: { type: "string", enum: ["available", "busy", "unavailable"] }
            }
          ],
          responses: {
            200: successResponse({
              description: "Profiles fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/StudentProfile"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/profiles/me": {
        get: {
          tags: ["Profiles"],
          summary: "Get my profile",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Profile fetched successfully",
              dataSchema: { $ref: "#/components/schemas/StudentProfile" }
            })
          }
        },
        patch: {
          tags: ["Profiles"],
          summary: "Update my profile",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    fullName: { type: "string" },
                    faculty: objectIdSchema,
                    department: objectIdSchema,
                    level: { type: "integer" },
                    bio: { type: "string" },
                    skills: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          skill: objectIdSchema,
                          level: {
                            type: "string",
                            enum: ["beginner", "intermediate", "advanced", "expert"]
                          }
                        }
                      }
                    },
                    interests: { type: "array", items: objectIdSchema },
                    availability: {
                      type: "string",
                      enum: ["available", "busy", "unavailable"]
                    },
                    academicInfo: { type: "object", additionalProperties: true },
                    portfolioLinks: { type: "object", additionalProperties: true },
                    projectPreferences: { type: "object", additionalProperties: true },
                    preferredRoles: { type: "array", items: { type: "string" } },
                    pastProjectExperience: { type: "array", items: { type: "object" } },
                    visibility: {
                      type: "string",
                      enum: ["public", "private", "department_only"]
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Profile updated successfully",
              dataSchema: { $ref: "#/components/schemas/StudentProfile" }
            })
          }
        }
      },
      "/api/profiles/{id}": {
        get: {
          tags: ["Profiles"],
          summary: "Get a public profile by id",
          parameters: [idPathParam("id", "Profile id")],
          responses: {
            200: successResponse({
              description: "Public profile fetched successfully",
              dataSchema: { $ref: "#/components/schemas/StudentProfile" }
            }),
            404: errorResponse("Public profile not found")
          }
        }
      },
      ...createLookupPaths({
        path: "/api/skills",
        tag: "Skills",
        schemaRef: "#/components/schemas/Skill"
      }),
      ...createLookupPaths({
        path: "/api/interests",
        tag: "Interests",
        schemaRef: "#/components/schemas/Interest"
      }),
      ...createLookupPaths({
        path: "/api/categories",
        tag: "Categories",
        schemaRef: "#/components/schemas/Category"
      }),
      ...createLookupPaths({
        path: "/api/departments",
        tag: "Departments",
        schemaRef: "#/components/schemas/Department",
        hasFaculty: true
      }),
      ...createLookupPaths({
        path: "/api/faculties",
        tag: "Faculties",
        schemaRef: "#/components/schemas/Faculty"
      }),
      "/api/projects": {
        get: {
          tags: ["Projects"],
          summary: "List and discover projects",
          parameters: [
            pageQueryParam,
            limitQueryParam,
            searchQueryParam,
            { name: "category", in: "query", schema: objectIdSchema },
            { name: "department", in: "query", schema: objectIdSchema },
            { name: "requiredSkill", in: "query", schema: objectIdSchema },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["open", "in_progress", "completed", "cancelled", "closed"] }
            },
            { name: "visibility", in: "query", schema: { type: "string", enum: ["public", "private", "department_only"] } },
            { name: "recruitmentOpen", in: "query", schema: { type: "boolean" } },
            { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
            { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["recent", "relevance", "deadline"] } },
            { name: "sortBy", in: "query", schema: { type: "string", example: "-createdAt" } }
          ],
          responses: {
            200: successResponse({
              description: "Projects fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Project"),
              metaSchema: paginationMetaSchema
            })
          }
        },
        post: {
          tags: ["Projects"],
          summary: "Create a project",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "description", "category", "maxTeamSize"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category: objectIdSchema,
                    department: objectIdSchema,
                    faculty: objectIdSchema,
                    requiredSkills: { type: "array", items: objectIdSchema },
                    optionalSkills: { type: "array", items: objectIdSchema },
                    maxTeamSize: { type: "integer", minimum: 1, maximum: 20 },
                    deadline: { type: "string", format: "date-time" },
                    visibility: { type: "string", enum: ["public", "private", "department_only"] },
                    tags: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Project created successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            })
          }
        }
      },
      "/api/projects/applications/me": {
        get: {
          tags: ["Applications"],
          summary: "List my project applications",
          security: bearerAuth,
          parameters: [pageQueryParam, limitQueryParam],
          responses: {
            200: successResponse({
              description: "Applications fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/ProjectApplication"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/projects/invitations/received": {
        get: {
          tags: ["Invitations"],
          summary: "List invitations received by current user",
          security: bearerAuth,
          parameters: [
            pageQueryParam,
            limitQueryParam,
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["pending", "accepted", "declined", "cancelled"] }
            }
          ],
          responses: {
            200: successResponse({
              description: "Received invitations fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/ProjectInvitation"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/projects/invitations/{invitationId}/accept": {
        patch: {
          tags: ["Invitations"],
          summary: "Accept a project invitation",
          security: bearerAuth,
          parameters: [idPathParam("invitationId", "Invitation id")],
          responses: {
            200: successResponse({
              description: "Invitation accepted successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectInvitation" }
            })
          }
        }
      },
      "/api/projects/invitations/{invitationId}/decline": {
        patch: {
          tags: ["Invitations"],
          summary: "Decline a project invitation",
          security: bearerAuth,
          parameters: [idPathParam("invitationId", "Invitation id")],
          responses: {
            200: successResponse({
              description: "Invitation declined successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectInvitation" }
            })
          }
        }
      },
      "/api/projects/mine": {
        get: {
          tags: ["Projects"],
          summary: "List projects created by current user",
          security: bearerAuth,
          parameters: [pageQueryParam, limitQueryParam],
          responses: {
            200: successResponse({
              description: "My projects fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Project"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/projects/saved": {
        get: {
          tags: ["Projects"],
          summary: "Get bookmarked projects",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Saved projects fetched successfully",
              dataSchema: {
                type: "array",
                items: { $ref: "#/components/schemas/Project" }
              }
            })
          }
        }
      },
      "/api/projects/{id}": {
        get: {
          tags: ["Projects"],
          summary: "Get a single project",
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project fetched successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            }),
            404: errorResponse("Project not found")
          }
        },
        patch: {
          tags: ["Projects"],
          summary: "Update a project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category: objectIdSchema,
                    department: objectIdSchema,
                    faculty: objectIdSchema,
                    requiredSkills: { type: "array", items: objectIdSchema },
                    optionalSkills: { type: "array", items: objectIdSchema },
                    maxTeamSize: { type: "integer", minimum: 1, maximum: 20 },
                    deadline: { type: "string", format: "date-time" },
                    status: { type: "string", enum: ["open", "in_progress", "completed", "cancelled", "closed"] },
                    visibility: { type: "string", enum: ["public", "private", "department_only"] },
                    tags: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Project updated successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            })
          }
        },
        delete: {
          tags: ["Projects"],
          summary: "Delete a project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project deleted successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            })
          }
        }
      },
      "/api/projects/{id}/status": {
        patch: {
          tags: ["Projects"],
          summary: "Change project status",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: ["open", "in_progress", "completed", "cancelled", "closed"]
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Project status updated successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            })
          }
        }
      },
      "/api/projects/{id}/bookmark": {
        post: {
          tags: ["Projects"],
          summary: "Bookmark a project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project bookmarked successfully",
              dataSchema: { type: "array", items: { $ref: "#/components/schemas/Project" } }
            })
          }
        },
        delete: {
          tags: ["Projects"],
          summary: "Remove a project from bookmarks",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project removed from bookmarks",
              dataSchema: { type: "array", items: { $ref: "#/components/schemas/Project" } }
            })
          }
        }
      },
      "/api/projects/{id}/team": {
        get: {
          tags: ["Projects"],
          summary: "View project team members",
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project members fetched successfully",
              dataSchema: { type: "array", items: { $ref: "#/components/schemas/ProjectMember" } }
            })
          }
        }
      },
      "/api/projects/{id}/applications": {
        post: {
          tags: ["Applications"],
          summary: "Apply to join a project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "I can contribute to the API and database layer." }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Application submitted successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectApplication" }
            })
          }
        },
        get: {
          tags: ["Applications"],
          summary: "List applications for a project owner",
          security: bearerAuth,
          parameters: [
            idPathParam("id", "Project id"),
            pageQueryParam,
            limitQueryParam,
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["pending", "accepted", "rejected", "withdrawn"] }
            }
          ],
          responses: {
            200: successResponse({
              description: "Project applications fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/ProjectApplication"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/projects/{id}/applications/{applicationId}/accept": {
        patch: {
          tags: ["Applications"],
          summary: "Accept a project application",
          security: bearerAuth,
          parameters: [
            idPathParam("id", "Project id"),
            idPathParam("applicationId", "Application id")
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleName: { type: "string", example: "backend developer" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Application accepted successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectApplication" }
            })
          }
        }
      },
      "/api/projects/{id}/applications/{applicationId}/reject": {
        patch: {
          tags: ["Applications"],
          summary: "Reject a project application",
          security: bearerAuth,
          parameters: [
            idPathParam("id", "Project id"),
            idPathParam("applicationId", "Application id")
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reviewNote: { type: "string", example: "We need a different skill set right now." }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Application rejected successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectApplication" }
            })
          }
        }
      },
      "/api/projects/{id}/applications/{applicationId}/withdraw": {
        delete: {
          tags: ["Applications"],
          summary: "Withdraw my project application",
          security: bearerAuth,
          parameters: [
            idPathParam("id", "Project id"),
            idPathParam("applicationId", "Application id")
          ],
          responses: {
            200: successResponse({
              description: "Application withdrawn successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectApplication" }
            })
          }
        }
      },
      "/api/projects/{id}/invitations": {
        post: {
          tags: ["Invitations"],
          summary: "Invite a student to a project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["invitedUser"],
                  properties: {
                    invitedUser: objectIdSchema,
                    message: { type: "string" },
                    proposedRole: { type: "string", example: "frontend developer" }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Invitation sent successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectInvitation" }
            })
          }
        },
        get: {
          tags: ["Invitations"],
          summary: "List sent invitations for a project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id"), pageQueryParam, limitQueryParam],
          responses: {
            200: successResponse({
              description: "Sent invitations fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/ProjectInvitation"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/projects/{id}/invitations/{invitationId}/cancel": {
        delete: {
          tags: ["Invitations"],
          summary: "Cancel a pending invitation",
          security: bearerAuth,
          parameters: [
            idPathParam("id", "Project id"),
            idPathParam("invitationId", "Invitation id")
          ],
          responses: {
            200: successResponse({
              description: "Invitation cancelled successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectInvitation" }
            })
          }
        }
      },
      "/api/projects/{id}/members": {
        get: {
          tags: ["Members"],
          summary: "List project members",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project members fetched successfully",
              dataSchema: { type: "array", items: { $ref: "#/components/schemas/ProjectMember" } }
            })
          }
        }
      },
      "/api/projects/{id}/members/assign-role": {
        patch: {
          tags: ["Members"],
          summary: "Assign a role to a project member",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["memberUserId", "roleName"],
                  properties: {
                    memberUserId: objectIdSchema,
                    roleName: { type: "string", example: "backend developer" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Member role assigned successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectMember" }
            })
          }
        }
      },
      "/api/projects/{id}/members/remove": {
        delete: {
          tags: ["Members"],
          summary: "Remove a member from a project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["memberUserId"],
                  properties: {
                    memberUserId: objectIdSchema
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Member removed successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectMember" }
            })
          }
        }
      },
      "/api/projects/{id}/members/leave": {
        delete: {
          tags: ["Members"],
          summary: "Leave a project team",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "You left the project team successfully",
              dataSchema: { $ref: "#/components/schemas/ProjectMember" }
            })
          }
        }
      },
      "/api/tasks": {
        post: {
          tags: ["Tasks"],
          summary: "Create a task",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "project"],
                  properties: {
                    title: { type: "string" },
                    project: objectIdSchema,
                    description: { type: "string" },
                    assignedTo: { type: "array", items: objectIdSchema },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    status: { type: "string", enum: ["todo", "in_progress", "done"] },
                    dueDate: { type: "string", format: "date-time" },
                    attachments: { type: "array", items: objectIdSchema }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Task created successfully",
              dataSchema: { $ref: "#/components/schemas/Task" }
            })
          }
        }
      },
      "/api/tasks/my-assigned": {
        get: {
          tags: ["Tasks"],
          summary: "List tasks assigned to current user",
          security: bearerAuth,
          parameters: [
            pageQueryParam,
            limitQueryParam,
            { name: "status", in: "query", schema: { type: "string", enum: ["todo", "in_progress", "done"] } }
          ],
          responses: {
            200: successResponse({
              description: "Assigned tasks fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Task"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/tasks/project/{projectId}": {
        get: {
          tags: ["Tasks"],
          summary: "List tasks for a project",
          security: bearerAuth,
          parameters: [
            idPathParam("projectId", "Project id"),
            pageQueryParam,
            limitQueryParam,
            { name: "status", in: "query", schema: { type: "string", enum: ["todo", "in_progress", "done"] } }
          ],
          responses: {
            200: successResponse({
              description: "Project tasks fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Task"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/tasks/{id}": {
        patch: {
          tags: ["Tasks"],
          summary: "Update a task",
          security: bearerAuth,
          parameters: [idPathParam("id", "Task id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    assignedTo: { type: "array", items: objectIdSchema },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    status: { type: "string", enum: ["todo", "in_progress", "done"] },
                    progress: { type: "integer", minimum: 0, maximum: 100 },
                    dueDate: { type: "string", format: "date-time" },
                    attachments: { type: "array", items: objectIdSchema }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Task updated successfully",
              dataSchema: { $ref: "#/components/schemas/Task" }
            })
          }
        },
        delete: {
          tags: ["Tasks"],
          summary: "Delete a task",
          security: bearerAuth,
          parameters: [idPathParam("id", "Task id")],
          responses: {
            200: successResponse({
              description: "Task deleted successfully",
              dataSchema: { $ref: "#/components/schemas/Task" }
            })
          }
        }
      },
      "/api/tasks/{id}/comments": {
        post: {
          tags: ["Tasks"],
          summary: "Add a comment to a task",
          security: bearerAuth,
          parameters: [idPathParam("id", "Task id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content"],
                  properties: {
                    content: { type: "string", example: "I have started working on this task." }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Task comment added successfully",
              dataSchema: { $ref: "#/components/schemas/TaskComment" }
            })
          }
        }
      },
      "/api/tasks/comments/{commentId}": {
        patch: {
          tags: ["Tasks"],
          summary: "Edit a task comment",
          security: bearerAuth,
          parameters: [idPathParam("commentId", "Comment id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content"],
                  properties: {
                    content: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Task comment updated successfully",
              dataSchema: { $ref: "#/components/schemas/TaskComment" }
            })
          }
        },
        delete: {
          tags: ["Tasks"],
          summary: "Delete a task comment",
          security: bearerAuth,
          parameters: [idPathParam("commentId", "Comment id")],
          responses: {
            200: successResponse({
              description: "Task comment deleted successfully",
              dataSchema: { $ref: "#/components/schemas/TaskComment" }
            })
          }
        }
      },
      "/api/chat/conversations": {
        get: {
          tags: ["Chat"],
          summary: "List my conversations",
          security: bearerAuth,
          parameters: [pageQueryParam, limitQueryParam],
          responses: {
            200: successResponse({
              description: "Conversations fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Conversation"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/chat/conversations/private": {
        post: {
          tags: ["Chat"],
          summary: "Create or fetch a private conversation",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["participantId"],
                  properties: {
                    participantId: objectIdSchema
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Private conversation ready",
              dataSchema: { $ref: "#/components/schemas/Conversation" }
            })
          }
        }
      },
      "/api/chat/conversations/{conversationId}/messages": {
        get: {
          tags: ["Chat"],
          summary: "Get messages from a private conversation",
          security: bearerAuth,
          parameters: [idPathParam("conversationId", "Conversation id"), pageQueryParam, limitQueryParam, searchQueryParam],
          responses: {
            200: successResponse({
              description: "Conversation messages fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Message"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/chat/projects/{projectId}/messages": {
        get: {
          tags: ["Chat"],
          summary: "Get project chat messages",
          security: bearerAuth,
          parameters: [idPathParam("projectId", "Project id"), pageQueryParam, limitQueryParam],
          responses: {
            200: successResponse({
              description: "Project chat messages fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Message"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/chat/messages/private": {
        post: {
          tags: ["Chat"],
          summary: "Send a private message",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["recipientId"],
                  properties: {
                    recipientId: objectIdSchema,
                    content: { type: "string", example: "Hello, can we work together on the API?" },
                    attachments: { type: "array", items: objectIdSchema }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Private message sent successfully",
              dataSchema: {
                type: "object",
                properties: {
                  conversation: { $ref: "#/components/schemas/Conversation" },
                  message: { $ref: "#/components/schemas/Message" }
                }
              }
            })
          }
        }
      },
      "/api/chat/messages/project": {
        post: {
          tags: ["Chat"],
          summary: "Send a message to project chat",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["projectId"],
                  properties: {
                    projectId: objectIdSchema,
                    content: { type: "string" },
                    attachments: { type: "array", items: objectIdSchema },
                    mentions: { type: "array", items: objectIdSchema }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Project message sent successfully",
              dataSchema: {
                type: "object",
                properties: {
                  conversation: { $ref: "#/components/schemas/Conversation" },
                  message: { $ref: "#/components/schemas/Message" }
                }
              }
            })
          }
        }
      },
      "/api/chat/conversations/{conversationId}/read": {
        patch: {
          tags: ["Chat"],
          summary: "Mark messages as read",
          security: bearerAuth,
          parameters: [idPathParam("conversationId", "Conversation id")],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messageIds: { type: "array", items: objectIdSchema }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Messages marked as read"
            })
          }
        }
      },
      "/api/chat/messages/{messageId}": {
        patch: {
          tags: ["Chat"],
          summary: "Edit a message",
          security: bearerAuth,
          parameters: [idPathParam("messageId", "Message id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content"],
                  properties: {
                    content: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Message edited successfully",
              dataSchema: { $ref: "#/components/schemas/Message" }
            })
          }
        },
        delete: {
          tags: ["Chat"],
          summary: "Delete a message",
          security: bearerAuth,
          parameters: [idPathParam("messageId", "Message id")],
          responses: {
            200: successResponse({
              description: "Message deleted successfully",
              dataSchema: { $ref: "#/components/schemas/Message" }
            })
          }
        }
      },
      "/api/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "List my notifications",
          security: bearerAuth,
          parameters: [pageQueryParam, limitQueryParam],
          responses: {
            200: successResponse({
              description: "Notifications fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Notification"),
              metaSchema: {
                allOf: [
                  paginationMetaSchema,
                  {
                    type: "object",
                    properties: {
                      unreadCount: { type: "integer", example: 5 }
                    }
                  }
                ]
              }
            })
          }
        }
      },
      "/api/notifications/unread-count": {
        get: {
          tags: ["Notifications"],
          summary: "Get unread notification count",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Unread count fetched successfully",
              dataSchema: {
                type: "object",
                properties: {
                  count: { type: "integer", example: 5 }
                }
              }
            })
          }
        }
      },
      "/api/notifications/{id}/read": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark one notification as read",
          security: bearerAuth,
          parameters: [idPathParam("id", "Notification id")],
          responses: {
            200: successResponse({
              description: "Notification marked as read",
              dataSchema: { $ref: "#/components/schemas/Notification" }
            })
          }
        }
      },
      "/api/notifications/mark-all-read": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark all notifications as read",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "All notifications marked as read"
            })
          }
        }
      },
      "/api/notifications/{id}": {
        delete: {
          tags: ["Notifications"],
          summary: "Delete a notification",
          security: bearerAuth,
          parameters: [idPathParam("id", "Notification id")],
          responses: {
            200: successResponse({
              description: "Notification deleted successfully",
              dataSchema: { $ref: "#/components/schemas/Notification" }
            })
          }
        }
      },
      "/api/files/upload": {
        post: {
          tags: ["Files"],
          summary: "Upload a file",
          description:
            "Uploads a file through Multer and Cloudinary. Use `multipart/form-data` with a `file` field.",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: {
                      type: "string",
                      format: "binary"
                    },
                    contextType: {
                      type: "string",
                      enum: ["profile", "project", "task", "chat", "general"]
                    },
                    contextId: objectIdSchema,
                    label: { type: "string", example: "Project brief" }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "File uploaded successfully",
              dataSchema: { $ref: "#/components/schemas/FileResource" }
            })
          }
        }
      },
      "/api/reports": {
        post: {
          tags: ["Reports"],
          summary: "Submit a moderation report",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["targetType", "targetId", "reason"],
                  properties: {
                    targetType: { type: "string", enum: ["user", "project", "message"] },
                    targetId: objectIdSchema,
                    reason: { type: "string", example: "Abusive content" },
                    description: { type: "string", example: "The message contains harassment." }
                  }
                }
              }
            }
          },
          responses: {
            201: successResponse({
              description: "Report submitted successfully",
              dataSchema: { $ref: "#/components/schemas/Report" }
            })
          }
        },
        get: {
          tags: ["Reports"],
          summary: "List my submitted reports",
          security: bearerAuth,
          parameters: [pageQueryParam, limitQueryParam],
          responses: {
            200: successResponse({
              description: "Reports fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Report"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/admin/dashboard": {
        get: {
          tags: ["Admin"],
          summary: "Get admin dashboard summary",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Admin dashboard fetched successfully",
              dataSchema: { $ref: "#/components/schemas/DashboardAnalytics" }
            }),
            403: errorResponse("Forbidden")
          }
        }
      },
      "/api/admin/analytics": {
        get: {
          tags: ["Admin"],
          summary: "Get admin analytics data",
          security: bearerAuth,
          responses: {
            200: successResponse({
              description: "Analytics fetched successfully",
              dataSchema: { $ref: "#/components/schemas/DashboardAnalytics" }
            })
          }
        }
      },
      "/api/admin/audit-logs": {
        get: {
          tags: ["Admin"],
          summary: "List audit logs",
          security: bearerAuth,
          parameters: [pageQueryParam, limitQueryParam, { name: "action", in: "query", schema: { type: "string" } }],
          responses: {
            200: successResponse({
              description: "Audit logs fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/AuditLog"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List all users",
          security: bearerAuth,
          parameters: [
            pageQueryParam,
            limitQueryParam,
            searchQueryParam,
            { name: "role", in: "query", schema: { type: "string", enum: ["student", "admin"] } },
            { name: "isSuspended", in: "query", schema: { type: "boolean" } },
            { name: "sortBy", in: "query", schema: { type: "string", example: "-createdAt" } }
          ],
          responses: {
            200: successResponse({
              description: "Users fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/BasicUser"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/admin/users/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Get single user",
          security: bearerAuth,
          parameters: [idPathParam("id", "User id")],
          responses: {
            200: successResponse({
              description: "User fetched successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete user",
          security: bearerAuth,
          parameters: [idPathParam("id", "User id")],
          responses: {
            200: successResponse({
              description: "User deleted successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        }
      },
      "/api/admin/users/{id}/activity": {
        get: {
          tags: ["Admin"],
          summary: "Get user activity summary",
          security: bearerAuth,
          parameters: [idPathParam("id", "User id")],
          responses: {
            200: successResponse({
              description: "User activity summary fetched successfully",
              dataSchema: {
                type: "object",
                properties: {
                  profile: { $ref: "#/components/schemas/StudentProfile" },
                  lastSeen: dateTimeSchema,
                  lastLoginAt: dateTimeSchema,
                  isSuspended: { type: "boolean" },
                  isActive: { type: "boolean" }
                }
              }
            })
          }
        }
      },
      "/api/admin/users/{id}/suspend": {
        patch: {
          tags: ["Admin"],
          summary: "Suspend user",
          security: bearerAuth,
          parameters: [idPathParam("id", "User id")],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: { type: "string", example: "Abusive behavior in project chat" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "User suspended successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        }
      },
      "/api/admin/users/{id}/unsuspend": {
        patch: {
          tags: ["Admin"],
          summary: "Unsuspend user",
          security: bearerAuth,
          parameters: [idPathParam("id", "User id")],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "User unsuspended successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        }
      },
      "/api/admin/users/{id}/verify": {
        patch: {
          tags: ["Admin"],
          summary: "Mark a user as verified",
          security: bearerAuth,
          parameters: [idPathParam("id", "User id")],
          responses: {
            200: successResponse({
              description: "User verified successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        }
      },
      "/api/admin/users/{id}/reset-password": {
        patch: {
          tags: ["Admin"],
          summary: "Reset a user's password",
          security: bearerAuth,
          parameters: [idPathParam("id", "User id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["password"],
                  properties: {
                    password: { type: "string", example: "NewPassword@123" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "User password reset successfully",
              dataSchema: { $ref: "#/components/schemas/BasicUser" }
            })
          }
        }
      },
      "/api/admin/projects": {
        get: {
          tags: ["Admin"],
          summary: "List all projects",
          security: bearerAuth,
          parameters: [
            pageQueryParam,
            limitQueryParam,
            searchQueryParam,
            { name: "status", in: "query", schema: { type: "string", enum: ["open", "in_progress", "completed", "cancelled", "closed"] } },
            { name: "category", in: "query", schema: objectIdSchema },
            { name: "sortBy", in: "query", schema: { type: "string" } }
          ],
          responses: {
            200: successResponse({
              description: "Projects fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Project"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/admin/projects/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Get project details",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project fetched successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            })
          }
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete project",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          responses: {
            200: successResponse({
              description: "Project deleted successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            })
          }
        }
      },
      "/api/admin/projects/{id}/status": {
        patch: {
          tags: ["Admin"],
          summary: "Change project status as admin",
          security: bearerAuth,
          parameters: [idPathParam("id", "Project id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: ["open", "in_progress", "completed", "cancelled", "closed"]
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Project status updated successfully",
              dataSchema: { $ref: "#/components/schemas/Project" }
            })
          }
        }
      },
      "/api/admin/reports": {
        get: {
          tags: ["Admin"],
          summary: "List reports",
          security: bearerAuth,
          parameters: [
            pageQueryParam,
            limitQueryParam,
            { name: "status", in: "query", schema: { type: "string", enum: ["pending", "reviewed", "resolved", "dismissed"] } },
            { name: "targetType", in: "query", schema: { type: "string", enum: ["user", "project", "message"] } }
          ],
          responses: {
            200: successResponse({
              description: "Reports fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/Report"),
              metaSchema: paginationMetaSchema
            })
          }
        }
      },
      "/api/admin/reports/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Get report details",
          security: bearerAuth,
          parameters: [idPathParam("id", "Report id")],
          responses: {
            200: successResponse({
              description: "Report fetched successfully",
              dataSchema: { $ref: "#/components/schemas/Report" }
            })
          }
        }
      },
      "/api/admin/reports/{id}/resolve": {
        patch: {
          tags: ["Admin"],
          summary: "Resolve a report",
          security: bearerAuth,
          parameters: [idPathParam("id", "Report id")],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    resolutionNote: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Report resolved successfully",
              dataSchema: { $ref: "#/components/schemas/Report" }
            })
          }
        }
      },
      "/api/admin/reports/{id}/dismiss": {
        patch: {
          tags: ["Admin"],
          summary: "Dismiss a report",
          security: bearerAuth,
          parameters: [idPathParam("id", "Report id")],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    resolutionNote: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Report dismissed successfully",
              dataSchema: { $ref: "#/components/schemas/Report" }
            })
          }
        }
      },
      "/api/admin/reports/{id}/action": {
        patch: {
          tags: ["Admin"],
          summary: "Take moderation action on a report",
          security: bearerAuth,
          parameters: [idPathParam("id", "Report id")],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["action"],
                  properties: {
                    action: {
                      type: "string",
                      enum: ["suspend_user", "remove_project", "remove_message"]
                    },
                    resolutionNote: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Moderation action applied successfully",
              dataSchema: { $ref: "#/components/schemas/Report" }
            })
          }
        }
      },
      "/api/admin/settings": {
        get: {
          tags: ["Admin"],
          summary: "List platform settings",
          security: bearerAuth,
          parameters: [pageQueryParam, limitQueryParam, searchQueryParam],
          responses: {
            200: successResponse({
              description: "Settings fetched successfully",
              dataSchema: paginatedDataSchema("#/components/schemas/PlatformSetting"),
              metaSchema: paginationMetaSchema
            })
          }
        },
        post: {
          tags: ["Admin"],
          summary: "Create or update a platform setting",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["key", "value"],
                  properties: {
                    key: { type: "string", example: "maintenance_mode" },
                    value: {
                      oneOf: [{ type: "boolean" }, { type: "string" }, { type: "number" }, { type: "object" }]
                    },
                    description: { type: "string" },
                    isPublic: { type: "boolean" }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Setting saved successfully",
              dataSchema: { $ref: "#/components/schemas/PlatformSetting" }
            })
          }
        }
      },
      "/api/admin/settings/{id}": {
        delete: {
          tags: ["Admin"],
          summary: "Delete a platform setting",
          security: bearerAuth,
          parameters: [idPathParam("id", "Setting id")],
          responses: {
            200: successResponse({
              description: "Setting deleted successfully",
              dataSchema: { $ref: "#/components/schemas/PlatformSetting" }
            })
          }
        }
      },
      "/api/admin/announcements": {
        post: {
          tags: ["Admin"],
          summary: "Send an announcement notification to all users",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "message"],
                  properties: {
                    title: { type: "string", example: "Platform maintenance" },
                    message: { type: "string", example: "The platform will be unavailable tonight from 11 PM." }
                  }
                }
              }
            }
          },
          responses: {
            200: successResponse({
              description: "Announcement sent successfully",
              dataSchema: {
                type: "object",
                properties: {
                  count: { type: "integer", example: 120 }
                }
              }
            })
          }
        }
      }
    }
  };

  return spec;
};

module.exports = buildSwaggerSpec;
