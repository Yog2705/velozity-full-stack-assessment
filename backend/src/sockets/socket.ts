import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/database.js";

let io: Server;

const onlineUsers = new Map<string, number>();

/*
 * =========================
 * PRESENCE
 * =========================
 */

const emitOnlineCount = () => {
  if (!io) {
    return;
  }

  io.emit("presence:update", {
    onlineCount: onlineUsers.size,
  });
};

const addOnlineUser = (userId: string) => {
  const count = onlineUsers.get(userId) ?? 0;

  onlineUsers.set(userId, count + 1);

  emitOnlineCount();
};

const removeOnlineUser = (userId: string) => {
  const count = onlineUsers.get(userId) ?? 0;

  if (count <= 1) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, count - 1);
  }

  emitOnlineCount();
};

/*
 * =========================
 * PROJECT ACCESS
 * =========================
 */

const canAccessProject = async (
  projectId: string,
  userId: string,
  role: string
) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    return false;
  }

  /*
   * Admin can access every project.
   */
  if (role === "ADMIN") {
    return true;
  }

  /*
   * PM can access only projects they created.
   */
  if (role === "PROJECT_MANAGER") {
    return project.createdById === userId;
  }

  /*
   * Developer can only access a project
   * if they have a task assigned to them.
   */
  if (role === "DEVELOPER") {
    const assignedTask =
      await prisma.task.findFirst({
        where: {
          projectId,
          assignedDeveloperId: userId,
        },
      });

    return Boolean(assignedTask);
  }

  return false;
};

/*
 * =========================
 * DEVELOPER ACTIVITY FILTER
 * =========================
 */

const getDeveloperActivityFilter = (
  userId: string
) => {
  return {
    task: {
      assignedDeveloperId: userId,
    },
  };
};

/*
 * =========================
 * INITIALIZE SOCKET
 * =========================
 */

export const initializeSocket = (
  httpServer: HttpServer
) => {
  io = new Server(httpServer, {
    cors: {
      origin:
        process.env.FRONTEND_URL ||
        "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  /*
   * =========================
   * SOCKET AUTHENTICATION
   * =========================
   */

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const user =
        verifyAccessToken(token);

      socket.data.user = user;

      next();
    } catch {
      next(
        new Error(
          "Invalid or expired access token"
        )
      );
    }
  });

  /*
   * =========================
   * CONNECTION
   * =========================
   */

  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log(
      `Socket connected: ${socket.id} (${user.userId})`
    );

    /*
     * Every user gets a private room.
     *
     * Used for:
     * - notifications
     * - developer-specific activity
     */
    socket.join(`user:${user.userId}`);

    /*
     * =========================
     * PRESENCE
     * =========================
     */

    addOnlineUser(user.userId);

    socket.emit("presence:update", {
      onlineCount: onlineUsers.size,
    });

    /*
     * =========================
     * ADMIN GLOBAL ACTIVITY
     * =========================
     */

    if (user.role === "ADMIN") {
      socket.join("activity:global");
    }

    /*
     * =========================
     * ADMIN MISSED GLOBAL ACTIVITY
     * =========================
     *
     * Admin can request the latest
     * global activity after reconnecting.
     */

    socket.on(
      "activity:missed-global",
      async ({
        since,
      }: {
        since?: string;
      } = {}) => {
        try {
          if (user.role !== "ADMIN") {
            socket.emit("activity:error", {
              message:
                "Only Admin can access global activity.",
            });

            return;
          }

          const createdAtFilter = since
            ? {
                gt: new Date(since),
              }
            : undefined;

          const activities =
            await prisma.activityLog.findMany({
              where: {
                ...(createdAtFilter
                  ? {
                      createdAt:
                        createdAtFilter,
                    }
                  : {}),
              },

              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },

                task: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    assignedDeveloperId: true,
                  },
                },

                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 20,
            });

          /*
           * Return oldest → newest.
           */
          activities.reverse();

          socket.emit(
            "activity:missed-global",
            activities
          );
        } catch (error) {
          console.error(
            "MISSED GLOBAL ACTIVITY ERROR:",
            error
          );

          socket.emit("activity:error", {
            message:
              "Unable to load missed global activity.",
          });
        }
      }
    );

    /*
     * =========================
     * JOIN PROJECT
     * =========================
     */

    socket.on(
      "join-project",
      async (projectId: string) => {
        try {
          if (!projectId) {
            return;
          }

          const allowed =
            await canAccessProject(
              projectId,
              user.userId,
              user.role
            );

          if (!allowed) {
            socket.emit(
              "activity:error",
              {
                message:
                  "You do not have access to this project.",
              }
            );

            return;
          }

          /*
           * Developers do NOT join project rooms.
           *
           * Their activity is sent through
           * their private user room instead.
           */
          if (user.role === "DEVELOPER") {
            console.log(
              `Developer ${user.userId} authorized for project ${projectId} without joining project room`
            );

            return;
          }

          /*
           * Only Admin and PM use project rooms.
           */
          socket.join(
            `project:${projectId}`
          );

          console.log(
            `Socket ${socket.id} joined project:${projectId}`
          );
        } catch (error) {
          console.error(
            "JOIN PROJECT ERROR:",
            error
          );

          socket.emit(
            "activity:error",
            {
              message:
                "Unable to join project.",
            }
          );
        }
      }
    );

    /*
     * =========================
     * LEAVE PROJECT
     * =========================
     */

    socket.on(
      "leave-project",
      (projectId: string) => {
        if (!projectId) {
          return;
        }

        if (user.role === "DEVELOPER") {
          return;
        }

        socket.leave(
          `project:${projectId}`
        );
      }
    );

    /*
     * =========================
     * MISSED PROJECT ACTIVITY
     * =========================
     */

    socket.on(
      "activity:missed",
      async ({
        projectId,
        since,
      }: {
        projectId: string;
        since?: string;
      }) => {
        try {
          if (!projectId) {
            return;
          }

          const allowed =
            await canAccessProject(
              projectId,
              user.userId,
              user.role
            );

          if (!allowed) {
            socket.emit(
              "activity:error",
              {
                message:
                  "You do not have access to this project.",
              }
            );

            return;
          }

          const where: Record<
            string,
            unknown
          > = {
            projectId,
          };

          if (since) {
            const sinceDate =
              new Date(since);

            if (
              !Number.isNaN(
                sinceDate.getTime()
              )
            ) {
              where.createdAt = {
                gt: sinceDate,
              };
            }
          }

          /*
           * Developers receive only activities
           * belonging to tasks assigned to them.
           */
          if (user.role === "DEVELOPER") {
            where.task =
              getDeveloperActivityFilter(
                user.userId
              ).task;
          }

          const activities =
            await prisma.activityLog.findMany({
              where,

              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },

                task: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    assignedDeveloperId: true,
                  },
                },

                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 20,
            });

          /*
           * Return oldest → newest.
           */
          activities.reverse();

          socket.emit(
            "activity:missed",
            activities
          );
        } catch (error) {
          console.error(
            "MISSED ACTIVITY ERROR:",
            error
          );

          socket.emit(
            "activity:error",
            {
              message:
                "Unable to load missed activity.",
            }
          );
        }
      }
    );

    /*
     * =========================
     * DISCONNECT
     * =========================
     */

    socket.on("disconnect", () => {
      removeOnlineUser(user.userId);

      console.log(
        `Socket disconnected: ${socket.id}`
      );
    });
  });

  return io;
};

/*
 * =========================
 * EMIT PROJECT ACTIVITY
 * =========================
 *
 * Admin:
 *   receives all activity globally.
 *
 * PM:
 *   receives activity from their project.
 *
 * Developer:
 *   receives ONLY activity belonging
 *   to their assigned tasks.
 */

export const emitProjectActivity = async (
  projectId: string,
  activity: any
) => {
  if (!io) {
    return;
  }

  /*
   * =========================
   * ADMIN
   * =========================
   */

  io.to("activity:global").emit(
    "project:activity",
    activity
  );

  /*
   * =========================
   * PROJECT MANAGER
   * =========================
   *
   * Only authorized PMs are in this room
   * because join-project validates ownership.
   */

  io.to(`project:${projectId}`).emit(
    "project:activity",
    activity
  );

  /*
   * =========================
   * DEVELOPER
   * =========================
   *
   * Find the developer assigned to the
   * task that generated this activity.
   */

  if (!activity.taskId) {
    return;
  }

  const task =
    await prisma.task.findUnique({
      where: {
        id: activity.taskId,
      },

      select: {
        assignedDeveloperId: true,
      },
    });

  if (
    !task?.assignedDeveloperId
  ) {
    return;
  }

  /*
   * Send ONLY to that developer's
   * private room.
   */

  io.to(
    `user:${task.assignedDeveloperId}`
  ).emit(
    "project:activity",
    activity
  );
};

/*
 * =========================
 * ONLINE USER COUNT
 * =========================
 */

export const getOnlineUserCount = () => {
  return onlineUsers.size;
};

/*
 * =========================
 * USER NOTIFICATIONS
 * =========================
 */

export const emitUserNotification = (
  userId: string,
  notification: unknown
) => {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(
    "notification:new",
    notification
  );
};