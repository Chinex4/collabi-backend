# Student Project Collaboration Platform Backend

A production-style Node.js backend for a final year project that helps students discover project ideas, form teams, manage tasks, chat in real time, and collaborate effectively.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- Multer + Cloudinary
- Nodemailer
- express-validator
- Helmet, CORS, Morgan, express-rate-limit

## Main Features

- Student and admin authentication
- Rich student profiles with skills, interests, links, and visibility controls
- Project creation, discovery, bookmarking, and team management
- Applications and invitations for project collaboration
- Task assignment and progress tracking
- Real-time private and project chat with presence, typing, read receipts, and attachments
- In-app notifications with socket delivery
- Moderation reports, audit logs, analytics, and platform settings

## Project Structure

```text
src/
  app.js
  server.js
  config/
  constants/
  controllers/
  docs/
  middlewares/
  models/
  routes/
  seeders/
  services/
  sockets/
  templates/
  utils/
  validators/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and update values:

```bash
cp .env.example .env
```

3. Start MongoDB locally or point `MONGO_URI` to your MongoDB deployment.

4. Run the development server:

```bash
npm run dev
```

5. Seed the database:

```bash
npm run seed
```

## Example Admin Credentials

- Email: `admin@studentcollab.com`
- Password: `Admin@12345`

These are also created by the seeder and can be changed in [src/seeders/seed.js](/Users/chinex/Apps/collabi-backend/src/seeders/seed.js).

## API Base URL

`http://localhost:5000/api`

## Swagger Docs

After starting the server, open:

`http://localhost:5000/api/docs`

## Core API Areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/profiles/me`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:id/applications`
- `POST /api/projects/:id/invitations`
- `GET /api/tasks/my-assigned`
- `GET /api/chat/conversations`
- `GET /api/notifications`
- `POST /api/reports`
- `GET /api/admin/dashboard`

Import [src/docs/postman.collection.json](/Users/chinex/Apps/collabi-backend/src/docs/postman.collection.json) into Postman for ready-made requests.

## Socket.IO

The Socket.IO server runs on the same port as Express. Authenticate using the JWT access token:

```js
const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_ACCESS_TOKEN"
  }
});
```

Implemented events include:

- `join_project_room`
- `leave_project_room`
- `private_message`
- `project_message`
- `typing_start`
- `typing_stop`
- `mark_as_read`
- `message_edited`
- `message_deleted`
- `presence_update`

## Frontend Integration Notes

- Access tokens are returned in JSON and refresh tokens are set as HTTP-only cookies.
- Pagination metadata follows `page`, `limit`, `total`, `pages`.
- All successful responses follow a consistent JSON envelope.
- Cloudinary uploads are abstracted through `/api/files/upload`.

## Important Environment Variables

- `PORT`
- `NODE_ENV`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `CLIENT_URL`
- `EMAIL_*`
- `CLOUDINARY_*`

## Notes

- The code is structured to be understandable for a university project while still reflecting production patterns.
- Some optional workflows like background jobs are kept synchronous to avoid unnecessary complexity.
