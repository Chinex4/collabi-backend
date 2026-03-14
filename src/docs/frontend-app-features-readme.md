# Frontend App Features README

This document describes the full product surface of the Student Project Collaboration Platform from a frontend point of view.

Use it as:

- a briefing document for frontend engineers
- prompt context for AI app generation
- a checklist for pages, flows, and components

## 1. Product Summary

This platform helps university students:

- discover project ideas
- create and manage projects
- form teams through applications and invitations
- collaborate through tasks and realtime chat
- manage profiles, skills, and interests
- receive in-app notifications
- report abusive users, projects, or messages

There are two roles:

- `student`
- `admin`

The app is primarily a student collaboration product with a secondary admin moderation and analytics dashboard.

## 2. Core User Types

## Student

Students should be able to:

- register and verify email with OTP
- log in and manage account settings
- build a profile with academic and collaboration data
- browse and search projects
- create their own project
- apply to projects owned by others
- invite other students into their own project
- manage project team membership and roles
- create and manage tasks
- chat privately and within projects
- receive notifications in realtime
- bookmark projects
- report harmful content or behavior

## Admin

Admins should be able to:

- log in through a separate admin flow
- view platform-wide dashboard metrics
- moderate users, projects, and reports
- view audit logs
- manage platform settings
- send announcements to users

## 3. Main Product Areas

The frontend should be designed around these modules:

1. Authentication and account lifecycle
2. User search and profile discovery
3. Project discovery and project details
4. Project creation and editing
5. Collaboration workflows: applications, invitations, team management
6. Task management
7. Chat and realtime collaboration
8. Notifications
9. File upload and attachment flows
10. Reporting and moderation
11. Admin console

## 4. Authentication Features

The frontend should support:

- student registration
- login
- admin login
- refresh token session continuation
- forgot password with OTP
- reset password with OTP
- verify email with OTP
- resend verification OTP
- logout
- change password
- deactivate account
- soft delete account
- fetch current authenticated user

Important UX notes:

- access token is returned in JSON
- refresh token is stored as an HTTP-only cookie
- OTP-based flows are code-entry flows, not magic links

Recommended frontend screens:

- register
- login
- admin login
- verify email OTP
- forgot password
- reset password
- change password
- account settings

## 5. Profile Features

Each student can maintain a richer profile than a basic auth account.

Profile fields include:

- bio
- faculty
- department
- level
- skills
- interests
- availability
- preferred roles
- portfolio links
- visibility settings

The app should support:

- viewing own profile
- editing own profile
- searching public profiles
- viewing another student’s public profile

Useful frontend experiences:

- discover teammates by skill or department
- profile cards in project pages
- public profile pages
- editable settings form with chips/tags for skills and interests

## 6. Lookup Data Features

The backend exposes lookup resources for:

- skills
- interests
- categories
- departments
- faculties

Frontend use cases:

- registration forms
- profile forms
- project creation forms
- filters and search panels

Admin users can create, edit, and delete these lookup values, so the frontend should treat them as dynamic rather than hardcoded.

## 7. Project Discovery Features

Projects are the center of the app.

Each project can include:

- title
- description
- category
- department
- faculty
- required skills
- optional skills
- team size limit
- deadline
- visibility
- tags
- attachments
- owner
- team members
- status

Supported project states:

- `open`
- `in_progress`
- `completed`
- `cancelled`
- `closed`

Supported visibility values:

- `public`
- `private`
- `department_only`

The frontend should support:

- listing all discoverable projects
- filtering and searching projects
- sorting and paginating results
- viewing project details
- creating a project
- editing a project
- deleting a project
- changing project status
- bookmarking and unbookmarking projects
- viewing projects created by the current user
- viewing bookmarked projects
- viewing project team members

Recommended frontend screens:

- project feed/discovery page
- project detail page
- create project page
- edit project page
- my projects page
- saved projects page

## 8. Collaboration Workflow Features

The app supports two ways to build teams:

- students apply to projects
- project owners invite students

## Applications

Students can:

- apply to a project
- withdraw their own application
- view their own applications

Project owners can:

- view applications for their project
- accept an application
- reject an application

Statuses:

- `pending`
- `accepted`
- `rejected`
- `withdrawn`

## Invitations

Project owners can:

- invite students
- view sent invitations
- cancel pending invitations

Students can:

- view received invitations
- accept invitation
- decline invitation

Statuses:

- `pending`
- `accepted`
- `declined`
- `cancelled`

## Team membership management

Project members and owners can interact with team data.

Supported features:

- list project members
- assign member role names
- remove member from team
- leave team

Membership statuses:

- `active`
- `left`
- `removed`

Important frontend implication:

- once an application is accepted or invitation is accepted, the user becomes part of the project team and should gain access to project chat and project tasks

## 9. Task Management Features

Tasks belong to projects and support collaborative execution.

Task fields include:

- title
- description
- assigned members
- priority
- status
- due date
- progress
- attachments

Task statuses:

- `todo`
- `in_progress`
- `done`

Task priorities:

- `low`
- `medium`
- `high`

Supported frontend features:

- create task
- view all tasks for a project
- view tasks assigned to current user
- update task
- delete task
- add task comments
- edit task comments
- delete task comments

Recommended screens:

- project task board
- my assigned tasks
- task details drawer or modal
- task activity/comments panel

Recommended UI patterns:

- kanban board or grouped list by status
- progress bars
- assignee avatars
- due date and priority badges

## 10. Chat and Realtime Collaboration Features

The app includes two chat modes:

- private one-to-one messaging
- project group chat

Core capabilities:

- conversation list
- create or fetch private conversation
- fetch conversation messages
- fetch project chat messages
- send private message
- send project message
- mark messages as read
- edit message
- delete message
- upload attachments
- typing indicators
- presence updates
- read receipts
- realtime delivery

Realtime behaviors implemented on the backend:

- authenticated socket connection
- automatic user room join
- join/leave project room
- private message delivery
- project room broadcast
- typing start/stop
- mark as read events
- message edited events
- message deleted events
- online/offline presence

Frontend should treat chat as a first-class module with:

- inbox sidebar
- private chat thread
- project chat thread
- attachment upload support
- message actions
- typing state
- unread badges

Important frontend constraint:

- project chat requires joining the project socket room before realtime messages will arrive

## 11. Notification Features

The app supports in-app notifications and realtime notification delivery.

Notification sources include:

- project application updates
- invitation updates
- team updates
- task updates
- private messages
- project mentions
- admin announcements
- report updates

Supported frontend features:

- notifications list
- unread count badge
- mark one notification as read
- mark all notifications as read
- delete notification
- realtime notification pop-in or toast

Recommended UI:

- top-nav notification bell
- notification center drawer/page
- unread badge on header

## 12. File Upload Features

The backend supports file uploads through a shared upload endpoint.

Possible upload contexts:

- `profile`
- `project`
- `task`
- `chat`
- `general`

Frontend use cases:

- profile photo upload
- project attachment upload
- task attachment upload
- chat attachment upload

Recommended frontend flow:

1. upload file first
2. receive uploaded file resource
3. attach returned file id to project, task, or chat payload

## 13. Reporting and Safety Features

Students can report:

- users
- projects
- messages

Report fields include:

- target type
- target id
- reason
- optional description

Report statuses:

- `pending`
- `reviewed`
- `resolved`
- `dismissed`

Frontend features:

- report action in user/project/message menus
- report submission modal
- my reports page
- report status display

## 14. Admin Console Features

Admins have a much broader control surface.

## Dashboard and analytics

Admins can view:

- dashboard summary
- analytics data
- audit logs

Potential dashboard metrics:

- total users
- active users
- total projects
- open projects
- completed projects
- team formation activity

## User moderation

Admins can:

- list users
- view a user
- inspect user activity
- suspend user
- unsuspend user
- verify user
- reset user password
- delete user

## Project moderation

Admins can:

- list all projects
- view a project
- delete a project
- change project status

## Report moderation

Admins can:

- list reports
- view report detail
- resolve report
- dismiss report
- take moderation action

Moderation actions include:

- suspend user
- remove project
- remove message

## Platform operations

Admins can:

- list platform settings
- create or update a setting
- delete a setting
- send announcements to all users

Recommended admin screens:

- admin dashboard
- user management
- project moderation
- reports moderation
- audit logs
- settings
- announcement composer

## 15. Suggested Frontend Navigation

For students:

- Home / Project Discovery
- Search Profiles
- My Projects
- Saved Projects
- Invitations
- Applications
- Tasks
- Chat
- Notifications
- Profile
- Settings

For admins:

- Dashboard
- Analytics
- Users
- Projects
- Reports
- Audit Logs
- Settings
- Announcements

## 16. Suggested Key Screens

Minimum student MVP screens:

1. Landing page
2. Register
3. Login
4. OTP verification
5. Project discovery
6. Project details
7. Create/edit project
8. My projects
9. Invitations
10. Applications
11. Task board
12. Chat inbox
13. Private chat
14. Project chat
15. Notifications
16. Public profile
17. My profile/settings

Minimum admin MVP screens:

1. Admin login
2. Dashboard
3. Users list/detail
4. Projects moderation list/detail
5. Reports moderation list/detail
6. Audit logs
7. Settings
8. Announcements

## 17. Reusable Frontend Components

Useful component types:

- auth forms
- OTP input
- profile card
- skill and interest tag chips
- project card
- project filter sidebar
- status badge
- member avatar stack
- application card
- invitation card
- task card
- task column/board
- conversation list item
- message bubble
- typing indicator
- notification item
- moderation action modal
- report modal

## 18. State and Data Considerations

The frontend should handle:

- JWT access token state
- auth refresh flow
- paginated lists
- optimistic or semi-optimistic UI for chat
- socket connection lifecycle
- unread counters
- role-based navigation and route protection
- server validation errors

Recommended state domains:

- auth
- profile
- lookup data
- projects
- collaboration
- tasks
- chat
- notifications
- admin

## 19. Prompt-Ready App Summary

Use the text below directly as a starting point for an AI frontend prompt.

```txt
Build a modern responsive frontend for a Student Project Collaboration Platform. The app has two roles: student and admin.

Student features:
- register, login, verify email with OTP, forgot/reset password with OTP, logout, change password, deactivate account
- create and manage a public academic/collaboration profile with faculty, department, level, bio, skills, interests, availability, preferred roles, and portfolio links
- browse, search, filter, bookmark, create, edit, and manage projects
- view project details, team members, required skills, attachments, deadlines, visibility, and status
- apply to projects, withdraw applications, receive invitations, accept/decline invitations
- manage own project team by inviting students, assigning roles, removing members, and changing project status
- manage project tasks with statuses, priorities, due dates, comments, progress, and attachments
- use realtime private chat and project group chat with typing indicators, read receipts, presence, message editing/deleting, file attachments, and notifications
- receive and manage notifications
- report users, projects, or messages

Admin features:
- separate admin login
- dashboard and analytics
- moderate users, projects, and reports
- suspend/unsuspend/verify/delete users
- change project status or remove projects
- resolve/dismiss reports and take moderation actions
- view audit logs
- manage platform settings
- send platform-wide announcements

Design the frontend as a full product with student navigation, admin navigation, protected routes, responsive layouts, empty states, loading states, and reusable UI components. Include a chat inbox, project chat rooms, task management views, notification center, and moderation dashboard.
```

## 20. References

- API reference: `src/docs/swaggerSpec.js`
- Postman collection: `src/docs/postman.collection.json`
- Chat frontend guide: `src/docs/chat-frontend-guide.md`
