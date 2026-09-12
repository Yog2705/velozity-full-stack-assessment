# Velozity Global Solutions – Full Stack Developer Assessment

A full-stack project and task management application built for the Velozity Global Solutions technical assessment.

The application provides role-based project/task management, real-time activity updates, notifications, dashboards, overdue-task automation, and secure JWT authentication.

---

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Socket.IO Client

### Backend
- Node.js
- Express 5
- TypeScript
- Socket.IO
- Zod
- JWT
- bcryptjs
- node-cron

### Database
- PostgreSQL
- Prisma ORM

---

## Core Features

- JWT authentication with access and refresh tokens
- Refresh token stored in an HttpOnly cookie
- Role-based access control
- Admin, Project Manager, and Developer roles
- Project and client management
- Task creation and management
- Task assignment
- Task status and priority management
- Due dates and overdue-task detection
- Real-time activity feed using WebSockets
- Real-time notifications
- Notification read/unread management
- Role-specific dashboards
- Task filtering by status, priority, overdue state, and due-date range
- Scheduled overdue-task processing
- Database-backed activity logs
- Seed data for demonstration and testing
- Admin user management

---

# Role-Based Access Control

| Feature | Admin | Project Manager | Developer |
|---|---|---|---|
| View all projects | Yes | Own projects | No project management data |
| Create projects | Yes | Yes | No |
| Update projects | Yes | Own projects | No |
| Delete projects | Yes | Own projects | No |
| View clients | Yes | Yes | No |
| Create clients | Yes | Yes | No |
| Create tasks | Yes | Own projects | No |
| View tasks | Yes | Own project tasks | Assigned tasks only |
| Update tasks | Yes | Own project tasks | Assigned tasks only |
| Change task status | Yes | Yes | Yes |
| Assign developers | Yes | Yes | No |
| Delete tasks | Yes | Own project tasks | No |
| View global activity | Yes | No | No |
| View relevant activity | Yes | Own projects | Assigned tasks |
| Manage users | Yes | No | No |
| Receive notifications | Yes | Yes | Yes |

Developer authorization is enforced server-side. Access is not determined only by frontend visibility.

---

# Authentication & Security

The application uses short-lived JWT access tokens and refresh tokens.

### Access Token
- Sent using the Authorization Bearer header.
- Used to access protected API endpoints.
- Contains the authenticated user's ID and role.
- Short-lived to reduce security exposure.

### Refresh Token
- Stored in an HttpOnly cookie.
- Never stored in browser localStorage or sessionStorage.
- Refresh tokens are hashed before being stored in PostgreSQL.
- Tokens can be revoked during logout.
- Expiration is checked server-side.

Protected API routes use authentication middleware and role middleware.

Example:

```text
authenticate
    ↓
authorizeRoles(...)
    ↓
validation
    ↓
controller
    ↓
service-level authorization
    ↓
database
Service-level authorization provides an additional security layer so changing frontend routes or request parameters cannot bypass ownership restrictions.

#Architecture

Request
  ↓
Route
  ↓
Authentication / Authorization Middleware
  ↓
Validation Middleware
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL

#Backend Structure

backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── generated/
│   ├── jobs/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   ├── validators/
│   └── server.ts
│
└── package.json

#Database Design

The application uses PostgreSQL with Prisma.

Main entities:

User
Client
Project
Task
ActivityLog
Notification
RefreshToken

Relationships
User
 ├── creates → Project
 ├── assigned → Task
 ├── creates → ActivityLog
 ├── receives → Notification
 └── owns → RefreshToken

Client
 └── has → Projects

Project
 ├── belongs to → Client
 ├── created by → User
 ├── contains → Tasks
 └── contains → ActivityLogs

Task
 ├── belongs to → Project
 ├── assigned to → Developer
 ├── has → ActivityLogs
 └── has → Notifications

Foreign keys and cascading behavior are defined in the Prisma schema.

Database Indexing

Indexes were added for fields frequently used for authorization, filtering, sorting, and activity retrieval.

Important indexes include:

User
role
lastActivitySeenAt
Project
clientId
createdById
Task
projectId
assignedDeveloperId
status
priority
dueDate
isOverdue
ActivityLog
(projectId, createdAt)
(taskId, createdAt)
(userId, createdAt)
createdAt
Notification
(userId, isRead)
(userId, createdAt)
RefreshToken
userId
expiresAt
unique tokenHash

These indexes support common queries such as retrieving a user's assigned tasks, filtering tasks, retrieving recent project activity, and fetching unread notifications.

Real-Time Architecture

Socket.IO is used for real-time communication.

The application does not use polling or Server-Sent Events for real-time updates.

Activity Flow
User updates task
       ↓
Task service updates PostgreSQL
       ↓
ActivityLog created
       ↓
Socket.IO event emitted
       ↓
Connected authorized clients receive update
       ↓
Frontend updates without page refresh
Access Scope
Admin receives global activity.
Project Managers receive activity for their own projects.
Developers receive activity related to their assigned tasks.

Project rooms are used for project-specific activity.

A private user room is used for developer-specific activity and notifications.

When clients reconnect, recent activity is retrieved from the database so activity is not dependent only on an active WebSocket connection.

Notifications

Notifications are stored in PostgreSQL and delivered through Socket.IO.

Examples include:

Developer task assignment
Task becoming overdue
Project Manager notification when an owned task moves to IN_REVIEW

The notification UI provides:

Unread badge
Notification dropdown
Mark individual notification as read
Mark all notifications as read
Real-time unread-count updates

No polling is used.

Overdue Task Automation

The backend uses node-cron for scheduled overdue-task processing.

The scheduled job checks for tasks where:

dueDate < current time
status != DONE
isOverdue = false

When a matching task is found:

isOverdue is updated.
An overdue notification is created for the assigned developer.
The notification is delivered through Socket.IO when the developer is online.
Dashboards
Admin Dashboard

Provides:

Total projects
Total tasks
Task status counts
Overdue tasks
Online developer count
Global activity
Project Manager Dashboard

Provides:

Own project summary
Task counts
Tasks grouped by priority
Upcoming tasks
Activity for owned projects
Developer Dashboard

Provides:

Assigned tasks
Task status information
Priority
Due dates
Relevant activity
Task Filtering

Tasks can be filtered using query parameters.

Supported filters include:

status
priority
overdue
dueDateFrom
dueDateTo

Example:

GET /api/tasks?status=IN_PROGRESS

Example:

GET /api/tasks?priority=HIGH&overdue=true

Example:

GET /api/tasks?dueDateFrom=2026-09-01&dueDateTo=2026-09-30

Filtering is processed server-side.

Validation & Error Handling

Zod is used for request validation.

Validation is performed before controller logic for relevant create/update endpoints.

Examples of validated fields include:

Names
Email addresses
Passwords
UUIDs
Task status
Task priority
Due dates
Project information

Unexpected request fields are rejected by strict validation schemas.

The API returns structured JSON responses:

{
  "success": false,
  "message": "Error message"
}
Seed Data

The project includes seed data for demonstration.

The seed contains:

1 Admin
2 Project Managers
4 Developers
3 Projects
15 Tasks
At least 2 overdue tasks
Pre-existing activity logs
Demo Credentials
Admin
Email: seed.admin@velozity.com
Password: password123

Project Manager 1
Email: seed.pm@velozity.com
Password: password123

Project Manager 2
Email: seed.pm2@velozity.com
Password: password123

Developer 1
Email: seed.dev1@velozity.com
Password: password123

Developer 2
Email: seed.dev2@velozity.com
Password: password123

Developer 3
Email: seed.dev3@velozity.com
Password: password123

Developer 4
Email: seed.dev4@velozity.com
Password: password123

These credentials are intended for assessment/demo purposes only.

Environment Variables

Create:

backend/.env

Example:

DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE"

JWT_ACCESS_SECRET="replace-with-a-long-random-access-secret"

JWT_REFRESH_SECRET="replace-with-a-long-random-refresh-secret"

PORT=5000

FRONTEND_URL="http://localhost:5173"

Do not commit real secrets or production credentials to GitHub.

Local Setup
Prerequisites
Node.js
PostgreSQL
npm
Backend
cd backend
npm install

Configure .env with the required variables.

Generate Prisma client:

npx prisma generate

Apply the database schema/migrations as required by the local Prisma setup.

Seed the database:

npm run db:seed

Start the backend in development mode:

npm run dev

The backend runs on:

http://localhost:5000

Health check:

GET /api/health

Frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend runs on:

http://localhost:5173
Production Build
Backend
cd backend
npm run build
npm start
Frontend
cd frontend
npm run build

The generated frontend build can be deployed to Vercel or another static hosting provider.

Available Scripts
Backend
npm run dev
npm run build
npm start
npm run db:seed
Frontend
npm run dev
npm run build
npm run lint
npm run preview
API Overview
Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
Users

Admin-only:

GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
Clients
GET  /api/clients
POST /api/clients
Projects
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PATCH  /api/projects/:id
DELETE /api/projects/:id
Tasks
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
Notifications
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
Dashboard
GET /api/dashboard
Activity
GET   /api/projects/:projectId/activity
GET   /api/activity
PATCH /api/activity/seen
Architecture Decisions
Why PostgreSQL?

The application has strongly related entities such as users, projects, tasks, clients, notifications, and activity logs. PostgreSQL provides relational constraints, foreign keys, transactions, and indexing suitable for this workload.

Why Prisma?

Prisma provides typed database access for TypeScript while keeping the relational schema explicit and maintainable.

Why Socket.IO?

The assessment requires real-time updates without polling. Socket.IO provides persistent WebSocket-based communication, rooms, reconnection support, and event-driven updates.

Why node-cron?

Overdue task detection is a scheduled backend operation rather than a user-triggered operation. node-cron provides a simple scheduled execution mechanism without introducing an additional queue infrastructure requirement.

Why HttpOnly refresh cookies?

Refresh tokens are sensitive credentials. Storing them in an HttpOnly cookie prevents JavaScript from directly reading the token and reduces exposure to client-side token theft.

Known Limitations
The scheduled overdue job runs in the backend process and is therefore intended for a single active worker/process deployment. A distributed production deployment would benefit from a dedicated job queue or distributed scheduler.
Socket.IO presence represents currently connected application sessions rather than guaranteed physical user availability.
Refresh tokens are persisted and revocable, but token rotation could be further enhanced with refresh-token-family tracking for stronger replay detection.
Production deployment requires environment-specific CORS, cookie, database, and WebSocket configuration.
150–250 Word Technical Explanation

This application implements a role-based project and task management system using React, TypeScript, Node.js, Express, PostgreSQL, Prisma, and Socket.IO. Authentication uses short-lived JWT access tokens together with refresh tokens stored in HttpOnly cookies. Refresh tokens are hashed before database storage and can be revoked during logout.

Authorization is implemented at both route and service levels. Middleware restricts endpoints by role, while services additionally verify project ownership and task assignment. This prevents Developers from accessing other developers' tasks even if they manipulate frontend routes or request parameters.

PostgreSQL was selected because the application contains strongly related entities including users, projects, clients, tasks, activities, notifications, and refresh tokens. Prisma provides typed access and explicit relational modeling. Indexes were added to frequently filtered and joined fields such as project ownership, task assignment, task status, due dates, notification state, and activity timestamps.

Socket.IO provides real-time task activity, notifications, and presence without polling. Activity is persisted in PostgreSQL so recently missed events can be retrieved after reconnection. A node-cron scheduled job detects overdue tasks and creates developer notifications. Zod validates incoming request data, while structured API errors provide consistent client responses.

Project Status

The project implements the major assessment requirements including:

Role-based authorization
Secure authentication
Project and task management
PostgreSQL relational persistence
Seed data
Real-time WebSocket updates
Notifications
Dashboards
Task filtering
Overdue automation
Admin user management