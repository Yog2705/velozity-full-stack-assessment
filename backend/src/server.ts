import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import clientRoutes from "./routes/client.routes.js";
import userRoutes from "./routes/user.routes.js";

import { initializeSocket } from "./sockets/socket.js";
import { startOverdueTaskJob } from "./jobs/overdueTasks.job.js";

const app = express();
const httpServer = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Velozity backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", activityRoutes);
app.use("/api/clients", clientRoutes);

/*
 * Admin-only user management
 */
app.use("/api/users", userRoutes);

initializeSocket(httpServer);

startOverdueTaskJob();

httpServer.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});