import { prisma } from "../config/database.js";
import { emitUserNotification } from "../sockets/socket.js";

export const createNotification = async (
  userId: string,
  message: string,
  taskId?: string
) => {
  const notification =
    await prisma.notification.create({
      data: {
        userId,
        message,
        taskId: taskId ?? null,
      },

      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

  emitUserNotification(
    userId,
    notification
  );

  return notification;
};

export const getUserNotifications =
  async (userId: string) => {
    return prisma.notification.findMany({
      where: {
        userId,
      },

      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  };

export const markNotificationAsRead =
  async (
    notificationId: string,
    userId: string
  ) => {
    const notification =
      await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      throw new Error(
        "Notification not found"
      );
    }

    return prisma.notification.update({
      where: {
        id: notificationId,
      },

      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  };

export const markAllNotificationsAsRead =
  async (userId: string) => {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },

      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
    };
  };