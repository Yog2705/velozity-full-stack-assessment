# Velozity Global Solutions – Full Stack Developer Assessment

A full-stack project and task management application built for the Velozity Global Solutions technical assessment.

## Tech Stack

- React 19 + TypeScript + Vite
- Node.js + Express 5 + TypeScript
- PostgreSQL + Prisma ORM
- Socket.IO for real-time communication
- JWT + HttpOnly refresh cookies
- Zod for server-side validation
- bcryptjs for password hashing
- node-cron for overdue-task automation

## Features

- Role-based access control
- Admin, Project Manager and Developer roles
- JWT access and refresh authentication
- HttpOnly refresh-token cookies
- Project and client management
- Task creation and assignment
- Task status and priority management
- Due dates and overdue detection
- Real-time WebSocket activity feed
- Real-time notifications
- Role-specific dashboards
- Task filtering
- Missed activity recovery
- Admin user management
- PostgreSQL activity logs
- Seed data

## Role-Based Access Control

| Feature | Admin | Project Manager | Developer |
|---|---|---|---|
| View all projects | Yes | Own projects | No |
| Create projects | Yes | Yes | No |
| Update/delete projects | Yes | Own projects | No |
| Create tasks | Yes | Own projects | No |
| View tasks | All | Own project tasks | Assigned tasks only |
| Update task status | Yes | Yes | Yes |
| Assign developers | Yes | Yes | No |
| Global activity | Yes | No | No |
| Manage users | Yes | No | No |

Authorization is enforced server-side through both route middleware and service-level ownership checks. Developers cannot access another developer's tasks by modifying frontend routes or request parameters.

## Authentication & Security

The application uses short-lived JWT access tokens and refresh tokens.

Access tokens:
- Are sent using the Authorization Bearer header.
- Contain the authenticated user's ID and role.
- Are short-lived.

Refresh tokens:
- Are stored in an HttpOnly cookie.
- Are never stored in localStorage or sessionStorage.
- Are hashed before being stored in PostgreSQL.
- Can be revoked during logout.

Protected routes use authentication and role middleware. Services additionally verify project ownership and task assignment.

All relevant API input is validated server-side using Zod. Strict validation schemas reject unexpected fields.

## Architecture

```text
Request
   ↓
Route
   ↓
Authentication / Role Middleware
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
The backend follows a controller/service architecture so authorization and business rules are not dependent on the frontend.

Database Design

The application uses PostgreSQL with Prisma.

Main entities:

User
Client
Project
Task
ActivityLog
Notification
RefreshToken

Relationships include:

User → Projects
User → assigned Tasks
User → ActivityLogs
User → Notifications
User → RefreshTokens
Client → Projects
Project → Tasks
Project → ActivityLogs
Task → ActivityLogs
Task → Notifications

Frequently queried fields are indexed, including:

Project ownership
Task assignment
Task status
Task priority
Due date
Overdue state
Activity timestamps
Notification read state
Real-Time Architecture

Socket.IO is used for WebSocket-based communication. The application does not use polling or Server-Sent Events.

Task update flow:

Task updated
     ↓
PostgreSQL updated
     ↓
ActivityLog created
     ↓
Socket.IO event emitted
     ↓
Authorized clients receive update
     ↓
UI updates without refresh

Activity visibility is role-filtered:

Admin → global activity
Project Manager → activity for owned projects
Developer → activity related to assigned tasks

Project rooms and private user rooms are used to restrict event visibility.

Activity is persisted in PostgreSQL so recent missed events can be retrieved after reconnection.

Notifications

Notifications are stored in PostgreSQL and delivered through Socket.IO.

Notifications include:

Task assignment to a Developer
Overdue task notification
Project Manager notification when an owned task moves to In Review

The UI supports:

Unread badge
Notification dropdown
Mark individual notification as read
Mark all notifications as read
Real-time unread count updates

No polling is used.

Overdue Task Automation

The backend uses node-cron to periodically find tasks where:

dueDate < current time
status != DONE
isOverdue = false

Matching tasks are marked as overdue and a notification is created for the assigned Developer.

node-cron was selected because overdue detection is a simple scheduled backend operation and does not require additional queue infrastructure.

Task Filtering

Tasks can be filtered server-side using:

status
priority
overdue
dueDateFrom
dueDateTo

Examples:

GET /api/tasks?status=IN_PROGRESS
GET /api/tasks?priority=HIGH&overdue=true
GET /api/tasks?dueDateFrom=2026-09-01&dueDateTo=2026-09-30
Seed Data

The seed script creates:

1 Admin
2 Project Managers
4 Developers
3 Projects
15 Tasks
At least 2 overdue tasks
Pre-existing activity logs
Demo Credentials
Role	Email	Password
Admin	seed.admin@velozity.com	password123
Project Manager 1	seed.pm@velozity.com	password123
Project Manager 2	seed.pm2@velozity.com	password123
Developer 1	seed.dev1@velozity.com	password123
Developer 2	seed.dev2@velozity.com	password123
Developer 3	seed.dev3@velozity.com	password123
Developer 4	seed.dev4@velozity.com	password123

These credentials are intended for assessment/demo purposes only.

Environment Variables

Create backend/.env:

DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
JWT_ACCESS_SECRET="replace-with-a-long-random-access-secret"
JWT_REFRESH_SECRET="replace-with-a-long-random-refresh-secret"
PORT=5000
FRONTEND_URL="http://localhost:5173"

Never commit real secrets to GitHub.

Local Setup
Backend
cd backend
npm install
npx prisma generate
npm run db:seed
npm run dev

Backend:

http://localhost:5000

Health check:

GET /api/health
Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173
Production Build

Backend:

cd backend
npm run build
npm start

Frontend:

cd frontend
npm run build

The frontend is configured for deployment on Vercel.

API Overview
Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
Users

Admin only:

GET /api/users
GET /api/users/:id
POST /api/users
PATCH /api/users/:id
DELETE /api/users/:id
Projects
GET /api/projects
GET /api/projects/:id
POST /api/projects
PATCH /api/projects/:id
DELETE /api/projects/:id
Tasks
GET /api/tasks
GET /api/tasks/:id
POST /api/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id
Notifications
GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
Dashboard
GET /api/dashboard
Activity
GET /api/projects/:projectId/activity
GET /api/activity
PATCH /api/activity/seen
Architecture Decisions
PostgreSQL

PostgreSQL was selected because the application contains strongly related entities requiring foreign keys, relational constraints, transactions and indexes.

Prisma

Prisma provides typed database access for TypeScript while keeping the relational schema explicit and maintainable.

Socket.IO

Socket.IO provides persistent WebSocket communication, rooms, reconnection support and event-driven updates required for the real-time functionality.

node-cron

node-cron is sufficient for scheduled overdue-task processing without introducing additional queue infrastructure.

HttpOnly Refresh Cookies

Refresh tokens are sensitive credentials, so they are stored in HttpOnly cookies instead of browser storage. They are also hashed before database storage.

Known Limitations
The overdue scheduler runs inside the backend process and is intended for a single active worker/process deployment.
A distributed production deployment would benefit from a dedicated job queue or distributed scheduler.
Socket presence represents connected application sessions rather than guaranteed physical user availability.
Refresh-token rotation could be further enhanced with token-family tracking for stronger replay detection.
Production deployment requires environment-specific CORS, cookie, database and WebSocket configuration.
Technical Explanation

This application implements a role-based project and task management system using React, TypeScript, Node.js, Express, PostgreSQL, Prisma and Socket.IO. Authentication uses short-lived JWT access tokens together with refresh tokens stored in HttpOnly cookies. Refresh tokens are hashed before database storage and can be revoked during logout.

Authorization is implemented at both route and service levels. Middleware restricts endpoints by role, while services additionally verify project ownership and task assignment. This prevents Developers from accessing other Developers' tasks even if they manipulate frontend routes or request parameters.

PostgreSQL was selected because the application contains strongly related entities including users, projects, clients, tasks, activities, notifications and refresh tokens. Prisma provides typed access and explicit relational modeling.

Socket.IO provides real-time task activity, notifications and presence without polling. Activity is persisted in PostgreSQL so recently missed events can be retrieved after reconnection. A node-cron job detects overdue tasks and creates notifications. Zod validates incoming request data while structured API errors provide consistent client responses.

