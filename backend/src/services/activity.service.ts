import { prisma } from "../config/database.js";

export const getProjectActivities = async (
  projectId: string,
  since?: string
) => {
  const createdAtFilter = since
    ? {
        gt: new Date(since),
      }
    : undefined;

  return prisma.activityLog.findMany({
    where: {
      projectId,
      ...(createdAtFilter
        ? { createdAt: createdAtFilter }
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
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 20,
  });
};

export const getGlobalActivities = async (
  since?: string
) => {
  const createdAtFilter = since
    ? {
        gt: new Date(since),
      }
    : undefined;

  return prisma.activityLog.findMany({
    where: {
      ...(createdAtFilter
        ? { createdAt: createdAtFilter }
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
};

export const markActivitySeen = async (
  userId: string,
  seenAt: Date = new Date()
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      lastActivitySeenAt: seenAt,
    },

    select: {
      id: true,
      lastActivitySeenAt: true,
    },
  });
};